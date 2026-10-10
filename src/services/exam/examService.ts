/**
 * NEXORA AI — Predictive Exam Day Companion Service
 * Handles revision planning, dynamic schedule adjustments, weak topic identification,
 * and interactive short quizzes with the exact requested failure-recovery flow:
 * [Wrong Answer] -> [Tiny Hint] -> [Simple Answer] -> [Retry]
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExamTopic {
  id: string;
  name: string;
  masteryPercent: number; // 0 - 100
  isWeak: boolean;
  estimatedMinutes: number;
  lastRevised?: string;
}

export interface ExamProfile {
  id: string;
  subject: string;
  examDate: string; // ISO string
  totalSyllabusTopics: number;
  completedTopics: number;
  topics: ExamTopic[];
  dailyStudyMinutes: number;
  targetScorePercent: number;
  currentStreakDays: number;
  mode: 'student' | 'challenge' | 'explain_like_me';
  explanationStyle: 'simple' | 'beginner' | 'technical' | 'exam' | 'practical';
}

export interface QuizQuestion {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  options: string[];
  correctIndex: number;
  tinyHint: string; // Brief clue pointing toward the concept
  simpleExplanation: string; // Crisp, straightforward conceptual explanation
  practicalExample: string;
}

const EXAM_STORAGE_KEY = '@nexora_exam_profiles_v2';
const QUIZ_STATS_KEY = '@nexora_quiz_stats_v2';

export interface QuizStats {
  totalAttempts: number;
  correctFirstTry: number;
  retriedAndSolved: number;
  accuracyRate: number;
  masteredTopics: string[];
}

const DEFAULT_EXAM_PROFILE: ExamProfile = {
  id: 'exam_cs_math',
  subject: 'Computer Science & Discrete Mathematics',
  examDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(), // 14 days away
  totalSyllabusTopics: 12,
  completedTopics: 7,
  dailyStudyMinutes: 90,
  targetScorePercent: 95,
  currentStreakDays: 5,
  mode: 'student',
  explanationStyle: 'simple',
  topics: [
    { id: 'top_1', name: 'Graph Theory & Dijkstra Algorithm', masteryPercent: 85, isWeak: false, estimatedMinutes: 45 },
    { id: 'top_2', name: 'Big-O Asymptotic Complexity', masteryPercent: 90, isWeak: false, estimatedMinutes: 30 },
    { id: 'top_3', name: 'Pythagorean Geometry & Vectors', masteryPercent: 95, isWeak: false, estimatedMinutes: 30 },
    { id: 'top_4', name: 'Dynamic Programming & Memoization', masteryPercent: 42, isWeak: true, estimatedMinutes: 60 },
    { id: 'top_5', name: 'Relational Database Normalization', masteryPercent: 55, isWeak: true, estimatedMinutes: 45 },
    { id: 'top_6', name: 'TCP/IP Handshake & Congestion Control', masteryPercent: 78, isWeak: false, estimatedMinutes: 40 },
  ],
};

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q_pythagoras',
    topicId: 'top_3',
    topicName: 'Pythagorean Geometry',
    question: 'In a right-angled triangle, if leg a = 6 cm and leg b = 8 cm, what is the length of hypotenuse c?',
    options: ['10 cm', '12 cm', '14 cm', '100 cm'],
    correctIndex: 0,
    tinyHint: 'Recall: sum of the squares of 6 and 8. 6² = 36, 8² = 64.',
    simpleExplanation: '36 + 64 = 100. The square root of 100 is 10. This is the 3-4-5 triangle scaled by 2.',
    practicalExample: 'Used in GPS navigation to compute direct line-of-sight distance.',
  },
  {
    id: 'q_big_o',
    topicId: 'top_2',
    topicName: 'Big-O Complexity',
    question: 'What is the average time complexity of searching an element in a balanced Binary Search Tree (BST)?',
    options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
    correctIndex: 1,
    tinyHint: 'Each comparison cuts the search space in half at every step.',
    simpleExplanation: 'Because the tree is balanced, each step eliminates half the remaining nodes, yielding logarithmic O(log n) time.',
    practicalExample: 'Database indexing uses B-Trees which rely on this exact halving principle.',
  },
  {
    id: 'q_dp',
    topicId: 'top_4',
    topicName: 'Dynamic Programming',
    question: 'What is the primary difference between Memoization and Tabulation in Dynamic Programming?',
    options: [
      'Memoization is bottom-up, Tabulation is top-down',
      'Memoization is top-down (recursive), Tabulation is bottom-up (iterative)',
      'Memoization consumes zero memory',
      'Tabulation cannot solve overlapping subproblems',
    ],
    correctIndex: 1,
    tinyHint: 'Think: "Memo" caches function calls from the top down, while "Table" fills array cells from base cases up.',
    simpleExplanation: 'Memoization caches recursion return values top-down. Tabulation builds solutions iteratively in an array from index 0 upward.',
    practicalExample: 'Computing Fibonacci: Tabulation fills fib[0], fib[1], ... iteratively without stack overflow.',
  },
];

export const ExamService = {
  /**
   * Retrieve active exam profile
   */
  async getExamProfile(): Promise<ExamProfile> {
    try {
      const data = await AsyncStorage.getItem(EXAM_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_EXAM_PROFILE;
    } catch {
      return DEFAULT_EXAM_PROFILE;
    }
  },

  /**
   * Save or update exam profile
   */
  async saveExamProfile(profile: ExamProfile): Promise<ExamProfile> {
    await AsyncStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(profile));
    return profile;
  },

  /**
   * Calculate dynamic revision plan based on days remaining and weak topics
   */
  calculateRevisionPlan(profile: ExamProfile): {
    daysRemaining: number;
    recommendedDailyTopics: number;
    highPriorityTopics: ExamTopic[];
    statusMessage: string;
  } {
    const now = new Date();
    const examDate = new Date(profile.examDate);
    const diffMs = examDate.getTime() - now.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)));

    const remainingTopics = profile.topics.filter((t) => t.masteryPercent < 80);
    const highPriorityTopics = profile.topics
      .filter((t) => t.isWeak || t.masteryPercent < 70)
      .sort((a, b) => a.masteryPercent - b.masteryPercent);

    const recommendedDailyTopics = Math.max(1, Math.ceil(remainingTopics.length / daysRemaining));

    let statusMessage = `You have ${daysRemaining} days remaining. Focus today on ${highPriorityTopics.length} weak areas.`;
    if (daysRemaining <= 3) {
      statusMessage = `⚡ Final Revision Window! Priority: Rapid formula recall and mock test questions.`;
    }

    return {
      daysRemaining,
      recommendedDailyTopics,
      highPriorityTopics,
      statusMessage,
    };
  },

  /**
   * Get available quiz questions
   */
  async getQuizQuestions(): Promise<QuizQuestion[]> {
    return DEFAULT_QUESTIONS;
  },

  /**
   * Retrieve user quiz telemetry
   */
  async getQuizStats(): Promise<QuizStats> {
    try {
      const data = await AsyncStorage.getItem(QUIZ_STATS_KEY);
      return data
        ? JSON.parse(data)
        : {
            totalAttempts: 18,
            correctFirstTry: 14,
            retriedAndSolved: 3,
            accuracyRate: 85,
            masteredTopics: ['Pythagorean Geometry', 'Big-O Complexity'],
          };
    } catch {
      return {
        totalAttempts: 0,
        correctFirstTry: 0,
        retriedAndSolved: 0,
        accuracyRate: 0,
        masteredTopics: [],
      };
    }
  },

  /**
   * Record a quiz outcome
   */
  async recordQuizOutcome(isFirstTryCorrect: boolean, isRetrySuccess: boolean): Promise<QuizStats> {
    const stats = await this.getQuizStats();
    const total = stats.totalAttempts + 1;
    const correctFirst = stats.correctFirstTry + (isFirstTryCorrect ? 1 : 0);
    const retried = stats.retriedAndSolved + (isRetrySuccess ? 1 : 0);
    const accuracy = Math.round(((correctFirst + retried) / total) * 100);

    const updated: QuizStats = {
      totalAttempts: total,
      correctFirstTry: correctFirst,
      retriedAndSolved: retried,
      accuracyRate: accuracy,
      masteredTopics: stats.masteredTopics,
    };

    await AsyncStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(updated));
    return updated;
  },
};

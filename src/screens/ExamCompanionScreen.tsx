import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { NexAvatar } from '../components/avatar/NexAvatar';
import {
  ExamService,
  ExamProfile,
  ExamTopic,
  QuizQuestion,
} from '../services/exam/examService';
import type { ScreenNavProp } from '../types/navigation';

interface ExamCompanionScreenProps {
  navigation: ScreenNavProp<'ExamCompanion'>;
}

export const ExamCompanionScreen: React.FC<ExamCompanionScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ExamProfile | null>(null);
  const [revisionPlan, setRevisionPlan] = useState<{
    daysRemaining: number;
    recommendedDailyTopics: number;
    highPriorityTopics: ExamTopic[];
    statusMessage: string;
  } | null>(null);

  // Interactive Quiz State
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [quizAttemptCount, setQuizAttemptCount] = useState(0);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showFullExplanation, setShowFullExplanation] = useState(false);

  useEffect(() => {
    loadExamData();
  }, []);

  const loadExamData = async () => {
    const prof = await ExamService.getExamProfile();
    setProfile(prof);
    const plan = ExamService.calculateRevisionPlan(prof);
    setRevisionPlan(plan);

    const questions = await ExamService.getQuizQuestions();
    setQuizQuestions(questions);
  };

  const resetQuizState = () => {
    setCurrentQuizIndex(0);
    setSelectedOptionIndex(null);
    setQuizAttemptCount(0);
    setIsAnswerCorrect(null);
    setShowHint(false);
    setShowFullExplanation(false);
  };

  const handleSelectOption = async (index: number) => {
    if (isAnswerCorrect === true) return;
    setSelectedOptionIndex(index);
    const currentQ = quizQuestions[currentQuizIndex];
    if (!currentQ) return;

    const isCorrect = index === currentQ.correctIndex;
    const newAttempt = quizAttemptCount + 1;
    setQuizAttemptCount(newAttempt);
    setIsAnswerCorrect(isCorrect);

    if (isCorrect) {
      setShowHint(false);
      setShowFullExplanation(false);
      await ExamService.recordQuizOutcome(newAttempt === 1, newAttempt > 1);
    } else {
      if (newAttempt === 1) {
        setShowHint(true);
      } else {
        setShowHint(false);
        setShowFullExplanation(true);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuizIndex < quizQuestions.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
      setSelectedOptionIndex(null);
      setQuizAttemptCount(0);
      setIsAnswerCorrect(null);
      setShowHint(false);
      setShowFullExplanation(false);
    } else {
      Alert.alert('Quiz Completed', 'You have tested through all active questions!');
      resetQuizState();
    }
  };

  const currentQ = quizQuestions[currentQuizIndex];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.eyebrow}>Academic Intelligence</Text>
            <Text style={styles.title}>Exam Companion</Text>
          </View>
          <NexAvatar
            variant={isAnswerCorrect === true ? 'success' : isAnswerCorrect === false ? 'attention' : 'idle'}
            size="sm"
          />
        </View>

        {/* Countdown & Readiness Card */}
        {profile && revisionPlan && (
          <GlassCard style={styles.countdownCard}>
            <View style={styles.countdownHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.countdownExamName}>{profile.subject}</Text>
                <Text style={styles.countdownDate}>
                  📅 Exam: {new Date(profile.examDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.daysBadge}>
                <Text style={styles.daysNumber}>{revisionPlan.daysRemaining}</Text>
                <Text style={styles.daysLabel}>Days Left</Text>
              </View>
            </View>

            <View style={styles.readinessRow}>
              <View style={styles.readinessItem}>
                <Text style={styles.readinessValue}>{profile.targetScorePercent}%</Text>
                <Text style={styles.readinessLabel}>Target Score</Text>
              </View>
              <View style={styles.readinessItem}>
                <Text style={styles.readinessValue}>{revisionPlan.recommendedDailyTopics} / day</Text>
                <Text style={styles.readinessLabel}>Topics Pace</Text>
              </View>
              <View style={styles.readinessItem}>
                <Text style={styles.readinessValue}>{revisionPlan.highPriorityTopics.length}</Text>
                <Text style={styles.readinessLabel}>Weak Topics</Text>
              </View>
            </View>
            <Text style={{ color: theme.colors.accent.primary, fontSize: 11, marginTop: 8, textAlign: 'center' }}>
              {revisionPlan.statusMessage}
            </Text>
          </GlassCard>
        )}

        {/* Dynamic Revision Schedule */}
        <Text style={styles.sectionTitle}>Dynamic Revision Topics</Text>
        {profile?.topics.map((t) => (
          <GlassCard key={t.id} style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicTitle}>{t.name}</Text>
              <View
                style={[
                  styles.priorityBadge,
                  t.isWeak ? styles.priHigh : styles.priLow,
                ]}
              >
                <Text style={styles.priorityText}>{t.isWeak ? 'NEEDS FOCUS' : 'ON TRACK'}</Text>
              </View>
            </View>
            <Text style={styles.topicSub}>
              Mastery: {t.masteryPercent}% • Est. Time: {t.estimatedMinutes} mins
            </Text>
          </GlassCard>
        ))}

        {/* Failure-Recovery Interactive Quiz */}
        <Text style={styles.sectionTitle}>Interactive Mastery Quiz</Text>
        {currentQ ? (
          <GlassCard style={styles.quizCard}>
            <View style={styles.quizProgressRow}>
              <Text style={styles.quizProgressText}>
                Question {currentQuizIndex + 1} of {quizQuestions.length} ({currentQ.topicName})
              </Text>
              <Text style={styles.quizDiffTag}>ADAPTIVE</Text>
            </View>

            <Text style={styles.questionPrompt}>{currentQ.question}</Text>

            {/* Options */}
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedOptionIndex === i;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.optionItem,
                    isSelected && isAnswerCorrect === true && styles.optionCorrect,
                    isSelected && isAnswerCorrect === false && styles.optionWrong,
                  ]}
                  onPress={() => handleSelectOption(i)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + i)}.</Text>
                  <Text style={styles.optionText}>{opt}</Text>
                  {isSelected && isAnswerCorrect === true && <Text style={styles.statusEmoji}>✨</Text>}
                  {isSelected && isAnswerCorrect === false && <Text style={styles.statusEmoji}>❌</Text>}
                </TouchableOpacity>
              );
            })}

            {/* Stage 1 Failure Recovery: Tiny Hint */}
            {showHint && (
              <View style={styles.hintBox}>
                <Text style={styles.hintHeader}>💡 NEXORA Tiny Hint:</Text>
                <Text style={styles.hintText}>{currentQ.tinyHint}</Text>
                <Text style={styles.retryPrompt}>Give it another try with this hint in mind!</Text>
              </View>
            )}

            {/* Stage 2 Failure Recovery: Simple Explanation & Practical Example */}
            {showFullExplanation && (
              <View style={styles.explanationBox}>
                <Text style={styles.expHeader}>📖 Simple Explanation:</Text>
                <Text style={styles.expText}>{currentQ.simpleExplanation}</Text>
                <Text style={[styles.expHeader, { marginTop: 8 }]}>🔬 Practical Example:</Text>
                <Text style={styles.expText}>{currentQ.practicalExample}</Text>
              </View>
            )}

            {/* Success Celebration */}
            {isAnswerCorrect === true && (
              <View style={styles.successBox}>
                <Text style={styles.successHeader}>🎉 Outstanding! Concept Mastered.</Text>
                <GlassButton
                  title="Next Concept Challenge →"
                  variant="primary"
                  onPress={handleNextQuestion}
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </GlassCard>
        ) : (
          <GlassCard style={styles.quizCard}>
            <Text style={styles.emptyQuizText}>No active questions for this topic.</Text>
          </GlassCard>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  countdownCard: {
    padding: theme.spacing.md,
    backgroundColor: 'rgba(11, 18, 36, 0.7)',
  },
  countdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownExamName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  countdownDate: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 3,
  },
  daysBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  daysNumber: {
    color: theme.colors.accent.primary,
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
  },
  daysLabel: {
    color: theme.colors.text.secondary,
    fontSize: 9,
  },
  readinessRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 12,
    paddingTop: 10,
  },
  readinessItem: {
    alignItems: 'center',
  },
  readinessValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  readinessLabel: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  topicCard: {
    marginTop: 8,
    padding: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  topicSub: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  priHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  priLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  priorityText: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  quizCard: {
    marginTop: 8,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(11, 18, 36, 0.8)',
  },
  quizProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  quizProgressText: {
    color: theme.colors.text.muted,
    fontSize: 11,
  },
  quizDiffTag: {
    color: theme.colors.accent.primary,
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  questionPrompt: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    lineHeight: 22,
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  optionLetter: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    width: 24,
  },
  optionText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    flex: 1,
  },
  statusEmoji: {
    fontSize: 16,
    marginLeft: 8,
  },
  hintBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  hintHeader: {
    color: '#F59E0B',
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
  },
  hintText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 3,
    lineHeight: 18,
  },
  retryPrompt: {
    color: '#F59E0B',
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
  explanationBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  expHeader: {
    color: '#A78BFA',
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
  },
  expText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
    lineHeight: 18,
  },
  successBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
  },
  successHeader: {
    color: '#10B981',
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  emptyQuizText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    padding: 20,
  },
});

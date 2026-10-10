import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp, ScreenRouteProp } from '../types/navigation';

interface StudySessionScreenProps {
  navigation: ScreenNavProp<'StudySession'>;
  route: ScreenRouteProp<'StudySession'>;
}

export const StudySessionScreen: React.FC<StudySessionScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { speakText, isSpeaking, stopSpeaking } = useApp();
  const topic = route.params?.topic || 'Pythagorean Theorem & Geometry';

  // Interactive Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(1);
  const [streakCount, setStreakCount] = useState<number>(3);

  const correctAnswer = 0; // Option index 0: "13"
  const quizOptions = ['13 units', '15 units', '17 units', '169 units'];

  const handleSelectOption = (index: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(index);
    setIsAnswerSubmitted(true);
    if (index === correctAnswer) {
      setQuizScore((prev) => prev + 1);
      setStreakCount((prev) => prev + 1);
    }
  };

  const handleResetQuiz = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
  };

  const handleVoiceExplain = async () => {
    if (isSpeaking) {
      await stopSpeaking();
    } else {
      await speakText(
        'In any right-angled triangle, the area of the square whose side is the hypotenuse is equal to the sum of the areas of the squares whose sides are the two legs. Formula: a squared plus b squared equals c squared.'
      );
    }
  };

  const handleAskNex = () => {
    navigation.navigate('ActiveChat', {
      initialPrompt: `Can you explain ${topic} with a deep breakdown and practical practice problems?`,
    });
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Tutor Session</Text>
            <Text style={styles.headerSub}>Active Study Mode</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={handleVoiceExplain}
          >
            <Text style={styles.iconText}>{isSpeaking ? '⏹' : '🔊'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Tutor Persona Banner */}
          <GlassCard variant="highlight" style={styles.tutorCard}>
            <View style={styles.tutorRow}>
              <Image
                source={require('../../assets/robot/mode_study_card.png')}
                style={styles.tutorAvatar}
                resizeMode="cover"
              />
              <View style={styles.tutorInfo}>
                <StatusBadge label="NEX Tutor" status="listening" />
                <Text style={styles.tutorQuote}>
                  "Let's break this topic down together!"
                </Text>
                <Text style={styles.streakBadge}>🔥 {streakCount} Daily Streak</Text>
              </View>
            </View>
          </GlassCard>

          {/* Subject & Formula Card */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Concept Definition</Text>
            <Text style={styles.sectionTag}>Geometry</Text>
          </View>

          <GlassCard style={styles.formulaCard}>
            <Text style={styles.topicName}>{topic}</Text>
            <Text style={styles.topicDescription}>
              In any right-angled triangle, the square of the hypotenuse is equal to
              the sum of the squares of the two adjacent legs.
            </Text>

            <View style={styles.formulaBox}>
              <Text style={styles.formulaMath}>a² + b² = c²</Text>
              <Text style={styles.formulaLegend}>
                where c is the hypotenuse opposite the 90° angle
              </Text>
            </View>
          </GlassCard>

          {/* Step-by-Step Breakdown */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Step-by-Step Proof</Text>
          </View>

          <GlassCard style={styles.stepCard}>
            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Identify Given Legs</Text>
                <Text style={styles.stepDetail}>
                  Given leg a = 3 cm and leg b = 4 cm. Hypotenuse c is unknown.
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Calculate Squares</Text>
                <Text style={styles.stepDetail}>
                  3² + 4² = 9 + 16 = 25 = c²
                </Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepRow}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Extract Square Root</Text>
                <Text style={styles.stepDetail}>
                  c = √25 = 5 cm. The classic 3-4-5 Pythagorean triple.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Interactive Recall Quiz Card */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Recall Practice</Text>
            <Text style={styles.sectionTag}>Score: {quizScore}</Text>
          </View>

          <GlassCard variant="highlight" style={styles.quizCard}>
            <Text style={styles.quizQuestion}>
              Question: If leg a = 5 and leg b = 12, what is the length of hypotenuse c?
            </Text>

            <View style={styles.optionsList}>
              {quizOptions.map((opt, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = idx === correctAnswer;
                let optStyle = styles.optionItem;
                if (isAnswerSubmitted) {
                  if (isCorrect) optStyle = styles.optionCorrect;
                  else if (isSelected && !isCorrect) optStyle = styles.optionWrong;
                } else if (isSelected) {
                  optStyle = styles.optionSelected;
                }

                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.8}
                    onPress={() => handleSelectOption(idx)}
                    style={[styles.optionBase, optStyle]}
                  >
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                    <Text style={styles.optionText}>{opt}</Text>
                    {isAnswerSubmitted && isCorrect && (
                      <Text style={styles.resultCheck}>✓</Text>
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <Text style={styles.resultCross}>✗</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {isAnswerSubmitted && (
              <View style={styles.feedbackBox}>
                <Text style={styles.feedbackTitle}>
                  {selectedAnswer === correctAnswer
                    ? '🎉 Correct! Superb deduction.'
                    : '💡 Not quite. Let\'s inspect:'}
                </Text>
                <Text style={styles.feedbackExplanation}>
                  5² + 12² = 25 + 144 = 169. √169 = 13.
                </Text>
                <TouchableOpacity
                  onPress={handleResetQuiz}
                  style={styles.retryBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          {/* Bottom Action Prompts */}
          <View style={styles.actionRow}>
            <GlassButton
              title="💬 Ask NEX to Explain More"
              variant="primary"
              onPress={handleAskNex}
              style={{ flex: 1 }}
            />
          </View>
        </ScrollView>
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  tutorCard: {
    marginBottom: theme.spacing.md,
  },
  tutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: theme.spacing.md,
  },
  tutorInfo: {
    flex: 1,
  },
  tutorQuote: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  streakBadge: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    marginTop: 4,
    fontWeight: theme.typography.fontWeight.medium,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: theme.colors.text.muted,
  },
  sectionTag: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  formulaCard: {
    marginBottom: theme.spacing.sm,
  },
  topicName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  topicDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  formulaBox: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  formulaMath: {
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    letterSpacing: 2,
    fontFamily: theme.typography.fontFamily.bold,
  },
  formulaLegend: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  stepCard: {
    marginBottom: theme.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.xs,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  stepDetail: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
  stepDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  quizCard: {
    marginBottom: theme.spacing.md,
  },
  quizQuestion: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  optionsList: {
    gap: 8,
  },
  optionBase: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  optionItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: theme.colors.accent.primary,
  },
  optionCorrect: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
  },
  optionWrong: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    borderColor: '#FF1744',
  },
  optionLetter: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    width: 24,
  },
  optionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    flex: 1,
  },
  resultCheck: {
    fontSize: 16,
    color: '#00E676',
    fontWeight: 'bold',
  },
  resultCross: {
    fontSize: 16,
    color: '#FF1744',
    fontWeight: 'bold',
  },
  feedbackBox: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
  },
  feedbackTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  feedbackExplanation: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  retryText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    textDecorationLine: 'underline',
  },
  actionRow: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
});

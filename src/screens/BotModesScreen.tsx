import React from 'react';
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
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp, BotMode } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface BotModesScreenProps {
  navigation: ScreenNavProp<'BotModes'>;
}

interface ModeCardData {
  mode: BotMode;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  imageSource: any;
}

const MODES: ModeCardData[] = [
  {
    mode: 'study',
    title: 'Study / Tutor Mode',
    tagline: '"Let\'s break this topic down together!"',
    description: 'Explains, teaches, supports learning with formulas and active recall.',
    badge: 'Tutor',
    imageSource: require('../../assets/robot/mode_study_card.png'),
  },
  {
    mode: 'cooking',
    title: 'Cooking Mode',
    tagline: '"Here\'s a simple recipe for you!"',
    description: 'Guides with recipes, cooking steps, and ingredient substitutions.',
    badge: 'Chef',
    imageSource: require('../../assets/robot/mode_cooking_card.png'),
  },
  {
    mode: 'coding',
    title: 'Coding Mode',
    tagline: '"Here\'s the code for your project!"',
    description: 'Helps with code, debug, software architecture & build.',
    badge: 'Engineer',
    imageSource: require('../../assets/robot/mode_coding_card.png'),
  },
  {
    mode: 'travel',
    title: 'Travel Mode',
    tagline: '"Here are the best places for your trip!"',
    description: 'Plans trips, discovers locations & gives travel tips.',
    badge: 'Explorer',
    imageSource: require('../../assets/robot/mode_travel_card.png'),
  },
  {
    mode: 'fitness',
    title: 'Fitness Mode',
    tagline: '"Time for your workout!"',
    description: 'Tracks health, timing, and workout plans.',
    badge: 'Trainer',
    imageSource: require('../../assets/robot/mode_fitness_card.png'),
  },
  {
    mode: 'home',
    title: 'Home Mode',
    tagline: '"All set! Your lights are on."',
    description: 'Controls smart devices, lighting, and ambient routines.',
    badge: 'Automation',
    imageSource: require('../../assets/robot/mode_home_card.png'),
  },
  {
    mode: 'entertainment',
    title: 'Entertainment Mode',
    tagline: '"Here\'s a playlist you might like!"',
    description: 'Music, movies, audio playback, fun & more.',
    badge: 'Media',
    imageSource: require('../../assets/robot/mode_entertainment_card.png'),
  },
  {
    mode: 'assistant',
    title: 'Daily Assistant Mode',
    tagline: '"Your schedule for today is ready!"',
    description: 'Reminders, notes, agenda, and priority productivity.',
    badge: 'Productivity',
    imageSource: require('../../assets/robot/mode_assistant_card.png'),
  },
];

export const BotModesScreen: React.FC<BotModesScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { activeMode, setActiveMode } = useApp();

  const handleSelectMode = (mode: BotMode) => {
    setActiveMode(mode);
    navigation.navigate('ActiveChat', { initialPrompt: `Switched to ${mode.toUpperCase()} Mode.` });
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Bot Modes</Text>
            <Text style={styles.headerSub}>One Bot · Multiple Roles · Always NEX</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          <View style={styles.grid}>
            {MODES.map((item) => {
              const isSelected = activeMode === item.mode;
              return (
                <TouchableOpacity
                  key={item.mode}
                  activeOpacity={0.85}
                  onPress={() => handleSelectMode(item.mode)}
                  style={[styles.cardWrapper, isSelected && styles.selectedWrapper]}
                >
                  <GlassCard
                    variant={isSelected ? 'highlight' : 'default'}
                    style={styles.card}
                  >
                    {/* Mode Image from Reference Sheet */}
                    <View style={styles.imageContainer}>
                      <Image
                        source={item.imageSource}
                        style={styles.modeImage}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.badgeRow}>
                        <StatusBadge
                          label={item.badge}
                          status={isSelected ? 'listening' : 'idle'}
                        />
                        {isSelected && (
                          <Text style={styles.activeTag}>● ACTIVE</Text>
                        )}
                      </View>
                      <Text style={styles.modeTitle}>{item.title}</Text>
                      <Text style={styles.modeTagline}>{item.tagline}</Text>
                      <Text style={styles.modeDesc}>{item.description}</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
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
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  backIcon: {
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  grid: {
    gap: theme.spacing.md,
  },
  cardWrapper: {
    borderRadius: theme.borderRadius.md,
  },
  selectedWrapper: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.md + 2,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(5, 8, 20, 0.8)',
    overflow: 'hidden',
  },
  modeImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    padding: theme.spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  activeTag: {
    fontSize: 10,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.5,
  },
  modeTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  modeTagline: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.xs,
  },
  modeDesc: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    lineHeight: 16,
  },
});

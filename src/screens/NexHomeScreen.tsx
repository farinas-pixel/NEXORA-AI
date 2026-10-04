import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SuggestionPills } from '../components/common/SuggestionPills';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface NexHomeScreenProps {
  navigation: ScreenNavProp<'Home'>;
}

export const NexHomeScreen: React.FC<NexHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, avatarState, activeTab, setActiveTab } = useApp();

  const handleSelectPrompt = (prompt: string) => {
    navigation.navigate('ActiveChat', { initialPrompt: prompt });
  };

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Chat') {
      navigation.navigate('ActiveChat');
    }
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Text style={styles.iconText}>☰</Text>
          </TouchableOpacity>

          <View style={styles.centerBadge}>
            <StatusBadge label="NEX Online" status="success" />
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LiveVoice')}
          >
            <Text style={styles.iconText}>🎙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Greeting from Reference Screen 17 */}
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>Good Morning {user?.name || 'Partner'}</Text>
            <Text style={styles.greetingSub}>
              How can I accompany you today?
            </Text>
          </View>

          {/* Central Animated Floating NEX Avatar Stage */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('LiveVoice')}
            style={styles.avatarStage}
          >
            <NexAvatar variant={avatarState} size="hero" />
            <View style={styles.tapPrompt}>
              <Text style={styles.tapPromptText}>Tap to start voice companion</Text>
            </View>
          </TouchableOpacity>

          {/* Daily Summary Glass Card */}
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.cardTitle}>Today's Companion Brief</Text>
            <Text style={styles.cardBody}>
              All local memory banks are synced. You have 3 priority objectives
              and 1 learning session queued for review.
            </Text>
          </GlassCard>

          {/* Quick Action Suggestion Prompts from Reference */}
          <View style={styles.promptSection}>
            <Text style={styles.sectionHeader}>Quick Actions</Text>
            <SuggestionPills onSelect={handleSelectPrompt} />
          </View>
        </ScrollView>

        {/* Floating Voice Hub Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('LiveVoice')}
          style={[styles.floatingMicBtn, { bottom: insets.bottom + 70 }]}
          accessibilityLabel="Start voice conversation"
        >
          <Text style={styles.floatingMicIcon}>🎤</Text>
        </TouchableOpacity>

        {/* Reference Bottom Navigation Bar */}
        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
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
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: theme.colors.glass.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  centerBadge: {
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 90,
  },
  greetingSection: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  greetingSub: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xxs,
  },
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
  },
  tapPrompt: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
  },
  tapPromptText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  summaryCard: {
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBody: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * 1.4,
  },
  promptSection: {
    marginTop: theme.spacing.xs,
  },
  sectionHeader: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  floatingMicBtn: {
    position: 'absolute',
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 99,
  },
  floatingMicIcon: {
    fontSize: 24,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { SuggestionPills } from '../components/common/SuggestionPills';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import { ReminderService, ReminderItem } from '../services/reminders/reminderService';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface NexHomeScreenProps {
  navigation: ScreenNavProp<'Home'>;
}

export const NexHomeScreen: React.FC<NexHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    avatarState,
    robotReaction,
    visualEnvironment,
    preferences,
    isOnline,
    t,
  } = useApp();

  const [missedReminders, setMissedReminders] = useState<ReminderItem[]>([]);
  const [greetingPhaseKey, setGreetingPhaseKey] = useState<
    'greeting_morning' | 'greeting_focus' | 'greeting_evening' | 'greeting_reflection' | 'greeting_rest'
  >('greeting_morning');

  useEffect(() => {
    loadHomeData();
    calculateGreeting();
  }, []);

  const calculateGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setGreetingPhaseKey('greeting_morning');
    else if (hour >= 11 && hour < 17) setGreetingPhaseKey('greeting_focus');
    else if (hour >= 17 && hour < 20) setGreetingPhaseKey('greeting_evening');
    else if (hour >= 20 && hour < 22) setGreetingPhaseKey('greeting_reflection');
    else setGreetingPhaseKey('greeting_rest');
  };

  const loadHomeData = async () => {
    try {
      const missed = await ReminderService.getMissedReminders();
      setMissedReminders(missed);
    } catch (e) {
      console.warn('Failed loading home data:', e);
    }
  };

  const handleRescheduleMissed = async (id: string) => {
    const in30Min = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await ReminderService.rescheduleReminder(id, in30Min);
    const updatedMissed = await ReminderService.getMissedReminders();
    setMissedReminders(updatedMissed);
    Alert.alert('Rescheduled', 'Missed reminder postponed by 30 minutes.');
  };

  const handleAvatarTap = () => {
    navigation.navigate('LiveVoice');
  };

  const handleSelectPrompt = (prompt: string) => {
    navigation.navigate('ActiveChat', { initialPrompt: prompt });
  };

  const handleTabPress = (tab: TabName) => {
    if (tab === 'Home') {
      // already on home
    } else if (tab === 'Plan' || tab === 'MyDay') {
      navigation.navigate('MyDay');
    } else if (tab === 'Chat') {
      navigation.navigate('ActiveChat');
    } else if (tab === 'Friends') {
      navigation.navigate('FriendsChat');
    } else if (tab === 'Profile' || tab === 'MyLife') {
      navigation.navigate('MyLife');
    }
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.xs }]}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AgentsHub')}
          >
            <Text style={styles.iconText}>🤖</Text>
          </TouchableOpacity>

          <View style={styles.centerBadge}>
            <StatusBadge
              label={!isOnline ? t('status_offline') : preferences.soloMode ? t('status_solo') : t('status_living')}
              status={!isOnline ? 'idle' : preferences.soloMode ? 'idle' : 'success'}
            />
          </View>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.iconText}>👤</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('LiveVoice')}
            >
              <Text style={styles.iconText}>🎙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Missed Reminder Alert Banner */}
          {missedReminders.length > 0 && (
            <GlassCard style={styles.missedCard}>
              <View style={styles.missedHeader}>
                <Text style={styles.missedIcon}>⏰</Text>
                <View style={styles.missedInfo}>
                  <Text style={styles.missedTitle}>{t('missed_reminder_title')}</Text>
                  <Text style={styles.missedSubtitle}>
                    {t('missed_reminder_scheduled_for', {
                      title: missedReminders[0].title,
                      time: new Date(missedReminders[0].dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.missedActions}>
                <TouchableOpacity
                  style={styles.rescheduleBtn}
                  onPress={() => handleRescheduleMissed(missedReminders[0].id)}
                >
                  <Text style={styles.rescheduleBtnText}>{t('action_reschedule_30m')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewPlanBtn}
                  onPress={() => navigation.navigate('MyDay')}
                >
                  <Text style={styles.viewPlanBtnText}>{t('action_view_my_day')}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          )}

          {/* Contextual Environment Pill */}
          <View style={styles.envPillRow}>
            <View style={[styles.envPill, { borderColor: `${visualEnvironment.accentColor}66` }]}>
              <Text style={[styles.envPillText, { color: visualEnvironment.accentColor }]}>
                {t('env_context_label', {
                  context: visualEnvironment.context.toUpperCase(),
                  desc: visualEnvironment.backdropDescription,
                })}
              </Text>
            </View>
          </View>

          {/* Dynamic Day Phase Greeting */}
          <TouchableOpacity
            style={styles.greetingSection}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.greeting}>
              {t(greetingPhaseKey)}, {user?.name || t('greeting_partner')}
            </Text>
            <Text style={styles.greetingSub}>
              {t('greeting_brain_active')}
            </Text>
          </TouchableOpacity>

          {/* Living 3D Animated NEX Avatar Stage */}
          <View style={styles.avatarStage}>
            <NexAvatar
              variant={robotReaction !== 'idle' ? robotReaction : avatarState}
              size="hero"
              glowColorOverride={visualEnvironment.glowColor}
              onPress={handleAvatarTap}
              showReactionBadge={true}
            />
            <TouchableOpacity
              style={styles.tapPrompt}
              onPress={() => navigation.navigate('LiveVoice')}
            >
              <Text style={styles.tapPromptText}>{t('tap_voice_dialog')}</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Quick Access Grid */}
          <Text style={styles.sectionHeader}>{t('section_core_suites')}</Text>
          <View style={styles.suitesGrid}>
            <TouchableOpacity
              style={styles.suiteCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyDay')}
            >
              <Text style={styles.suiteIcon}>📅</Text>
              <Text style={styles.suiteTitle}>{t('suite_my_day_title')}</Text>
              <Text style={styles.suiteSub}>{t('suite_my_day_sub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suiteCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MyLife')}
            >
              <Text style={styles.suiteIcon}>🌟</Text>
              <Text style={styles.suiteTitle}>{t('suite_my_life_title')}</Text>
              <Text style={styles.suiteSub}>{t('suite_my_life_sub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suiteCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ExamCompanion')}
            >
              <Text style={styles.suiteIcon}>🎓</Text>
              <Text style={styles.suiteTitle}>{t('suite_exam_title')}</Text>
              <Text style={styles.suiteSub}>{t('suite_exam_sub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suiteCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('NewsIntelligence')}
            >
              <Text style={styles.suiteIcon}>📡</Text>
              <Text style={styles.suiteTitle}>{t('suite_news_title')}</Text>
              <Text style={styles.suiteSub}>{t('suite_news_sub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suiteCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('FriendsChat')}
            >
              <Text style={styles.suiteIcon}>👥</Text>
              <Text style={styles.suiteTitle}>{t('suite_friends_title')}</Text>
              <Text style={styles.suiteSub}>{t('suite_friends_sub')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.suiteCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('HomeIntelligence')}
            >
              <Text style={styles.suiteIcon}>⚡</Text>
              <Text style={styles.suiteTitle}>{t('suite_home_title')}</Text>
              <Text style={styles.suiteSub}>{t('suite_home_sub')}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Action Suggestion Prompts */}
          <View style={styles.promptSection}>
            <Text style={styles.sectionHeader}>{t('section_instant_actions')}</Text>
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

        {/* Bottom Navigation Dock */}
        <BottomNavBar activeTab="Home" onTabPress={handleTabPress} />
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
    paddingBottom: theme.spacing.xs,
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
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 90,
  },
  missedCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: 8,
  },
  missedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missedIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  missedInfo: {
    flex: 1,
  },
  missedTitle: {
    color: '#EF4444',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  missedSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  missedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  rescheduleBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  rescheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  viewPlanBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  viewPlanBtnText: {
    color: theme.colors.text.secondary,
    fontSize: 10,
  },
  envPillRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  envPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  envPillText: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.5,
  },
  greetingSection: {
    marginTop: theme.spacing.sm,
    alignItems: 'center',
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  greetingSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  avatarStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.md,
  },
  tapPrompt: {
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
  },
  tapPromptText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
  sectionHeader: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  suitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suiteCard: {
    flexBasis: '48.5%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: 12,
  },
  suiteIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  suiteTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  suiteSub: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  promptSection: {
    marginTop: theme.spacing.md,
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

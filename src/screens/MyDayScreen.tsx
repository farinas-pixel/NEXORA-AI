import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { ReminderService, ReminderItem } from '../services/reminders/reminderService';
import { StorageService, TaskItem } from '../services/storage';
import { supabaseDataService } from '../services/backend/supabaseDataService';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import type { ScreenNavProp } from '../types/navigation';

interface MyDayScreenProps {
  navigation: ScreenNavProp<'MyDay'>;
}

type DayPhase = 'morning' | 'work' | 'home' | 'reflection' | 'night';

interface PhaseConfig {
  id: DayPhase;
  label: string;
  timeRange: string;
  icon: string;
  description: string;
}

const DAY_PHASES: PhaseConfig[] = [
  { id: 'morning', label: 'Morning', timeRange: '05:00 - 11:00', icon: '🌅', description: 'Mindset alignment, syllabus preview & hydration' },
  { id: 'work', label: 'Work & Focus', timeRange: '11:00 - 17:00', icon: '⚡', description: 'Deep technical work, logic sprints & lab goals' },
  { id: 'home', label: 'Evening', timeRange: '17:00 - 20:00', icon: '🏡', description: 'Recharge, fitness routine & evening unwinding' },
  { id: 'reflection', label: 'Reflection', timeRange: '20:00 - 22:00', icon: '🌙', description: 'Cognitive review, daily wins & journal logging' },
  { id: 'night', label: 'Night', timeRange: '22:00 - 05:00', icon: '🌌', description: 'Restoration, solo mode airgap & sleep hygiene' },
];

export const MyDayScreen: React.FC<MyDayScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [currentPhase, setCurrentPhase] = useState<DayPhase>('morning');
  const [selectedPhase, setSelectedPhase] = useState<DayPhase>('morning');
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [missedReminders, setMissedReminders] = useState<ReminderItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('18:00');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  // Focus Timer State
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    determineCurrentPhase();
    loadDayData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      determineCurrentPhase();
      loadDayData();
    }, [])
  );

  useEffect(() => {
    if (isFocusRunning) {
      timerRef.current = setInterval(() => {
        setFocusSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsFocusRunning(false);
            Alert.alert('Focus Session Complete!', 'Great work! Take a 5-minute break.');
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFocusRunning]);

  const determineCurrentPhase = () => {
    const hour = new Date().getHours();
    let phase: DayPhase = 'morning';
    if (hour >= 5 && hour < 11) phase = 'morning';
    else if (hour >= 11 && hour < 17) phase = 'work';
    else if (hour >= 17 && hour < 20) phase = 'home';
    else if (hour >= 20 && hour < 22) phase = 'reflection';
    else phase = 'night';

    setCurrentPhase(phase);
    setSelectedPhase(phase);
  };

  const loadDayData = async () => {
    try {
      const allReminders = await ReminderService.getReminders();
      const missed = await ReminderService.getMissedReminders();

      // Load both user-scoped tasks and legacy tasks, merging them seamlessly
      const [userTasks, legacyTasks] = await Promise.all([
        supabaseDataService.fetchTasks().catch(() => []),
        StorageService.getTasks().catch(() => []),
      ]);

      const mergedTasks = [...userTasks];
      for (const leg of legacyTasks) {
        const exists = mergedTasks.some(
          (t) =>
            t.id === leg.id ||
            (t.title.trim().toLowerCase() === leg.title.trim().toLowerCase() &&
              t.category === leg.category)
        );
        if (!exists) {
          mergedTasks.push(leg);
        }
      }

      setReminders(allReminders);
      setMissedReminders(missed);
      setTasks(mergedTasks);
    } catch (e) {
      console.warn('Failed loading day data:', e);
    }
  };

  const handleToggleTask = async (id: string) => {
    // Toggle in both user-scoped and legacy storage safely
    await supabaseDataService.toggleTask(id).catch(() => null);
    await StorageService.toggleTask(id).catch(() => null);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleToggleReminder = async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    try {
      if (reminder.status === 'completed') {
        const inFuture = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const updated = await ReminderService.rescheduleReminder(id, inFuture);
        setReminders(updated);
      } else {
        const updated = await ReminderService.completeReminder(id);
        setReminders(updated);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update reminder');
    }
  };

  const handleRescheduleMissed = async (id: string) => {
    try {
      const in30Min = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const updated = await ReminderService.rescheduleReminder(id, in30Min);
      setReminders(updated);
      const missed = await ReminderService.getMissedReminders();
      setMissedReminders(missed);
      Alert.alert('Rescheduled', 'Reminder moved forward by 30 minutes.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reschedule reminder');
    }
  };

  const handleDismissMissed = async (id: string) => {
    try {
      const updated = await ReminderService.completeReminder(id);
      setReminders(updated);
      const missed = await ReminderService.getMissedReminders();
      setMissedReminders(missed);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to dismiss reminder');
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderTitle.trim()) return;
    try {
      const dueIso = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
      const item = await ReminderService.createReminder(
        newReminderTitle.trim(),
        dueIso,
        'personal',
        'medium'
      );
      setReminders((prev) => [item, ...prev.filter((r) => r.id !== item.id)]);
      setNewReminderTitle('');
      setIsAddingReminder(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save reminder');
    }
  };

  const handleSaveReflection = async () => {
    if (!reflectionText.trim()) return;
    setIsSavingReflection(true);
    await StorageService.saveMemory({
      category: 'personal',
      content: `[Daily Reflection] ${reflectionText.trim()}`,
      securityTier: 'medium',
      confidence: 0.99,
    });
    setIsSavingReflection(false);
    setReflectionText('');
    Alert.alert('Saved to Vault', 'Your reflection has been recorded into sovereign memory.');
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTabPress = (tab: TabName) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Friends') navigation.navigate('FriendsChat');
    else if (tab === 'Profile' || tab === 'MyLife') navigation.navigate('MyLife');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.title}>My Day</Text>
          </View>
          <NexAvatar variant={currentPhase === 'work' ? 'attention' : 'idle'} size="sm" />
        </View>

        {/* Missed Reminder Banner */}
        {missedReminders.length > 0 && (
          <GlassCard style={styles.missedCard}>
            <View style={styles.missedHeader}>
              <Text style={styles.missedIcon}>⚠️</Text>
              <View style={styles.missedInfo}>
                <Text style={styles.missedTitle}>Missed Reminder Detected</Text>
                <Text style={styles.missedSubtitle}>
                  "{missedReminders[0].title}" was scheduled for {new Date(missedReminders[0].dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
            <View style={styles.missedActions}>
              <TouchableOpacity
                style={styles.rescheduleBtn}
                onPress={() => handleRescheduleMissed(missedReminders[0].id)}
              >
                <Text style={styles.rescheduleBtnText}>Reschedule (+30m)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => handleDismissMissed(missedReminders[0].id)}
              >
                <Text style={styles.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* 5-Phase Day Timeline Bar */}
        <Text style={styles.sectionHeader}>Five-Phase Day Rhythm</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseScroll}>
          {DAY_PHASES.map((phase) => {
            const isCurrent = currentPhase === phase.id;
            const isSelected = selectedPhase === phase.id;
            return (
              <TouchableOpacity
                key={phase.id}
                onPress={() => setSelectedPhase(phase.id)}
                style={[
                  styles.phaseChip,
                  isSelected && styles.phaseChipSelected,
                  isCurrent && styles.phaseChipActiveBorder,
                ]}
              >
                <Text style={styles.phaseIcon}>{phase.icon}</Text>
                <Text style={[styles.phaseLabel, isSelected && styles.phaseLabelSelected]}>
                  {phase.label}
                </Text>
                {isCurrent && <View style={styles.currentIndicator} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selected Phase Detail Card */}
        {(() => {
          const active = DAY_PHASES.find((p) => p.id === selectedPhase) || DAY_PHASES[0];
          return (
            <GlassCard style={styles.phaseDetailCard}>
              <View style={styles.phaseDetailHeader}>
                <Text style={styles.phaseDetailTitle}>{active.icon} {active.label} Phase</Text>
                <Text style={styles.phaseDetailTime}>{active.timeRange}</Text>
              </View>
              <Text style={styles.phaseDetailDesc}>{active.description}</Text>
            </GlassCard>
          );
        })()}

        {/* Focus Timer Card */}
        <GlassCard style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <View>
              <Text style={styles.focusTitle}>Deep Work Focus Session</Text>
              <Text style={styles.focusSub}>Structured 25-minute Pomodoro Block</Text>
            </View>
            <Text style={styles.focusIcon}>⏱️</Text>
          </View>
          <Text style={styles.timerDisplay}>{formatTimer(focusSeconds)}</Text>
          <View style={styles.focusActions}>
            <GlassButton
              title={isFocusRunning ? 'Pause Session' : 'Start Focus'}
              variant={isFocusRunning ? 'secondary' : 'primary'}
              onPress={() => setIsFocusRunning(!isFocusRunning)}
              style={styles.focusButton}
            />
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setIsFocusRunning(false);
                setFocusSeconds(25 * 60);
              }}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Actionable Tasks List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Priority Tasks</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CreateTask')}>
            <Text style={styles.addLink}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        {tasks.map((task) => (
          <GlassCard key={task.id} style={styles.taskCard}>
            <TouchableOpacity
              style={styles.taskRow}
              activeOpacity={0.7}
              onPress={() => handleToggleTask(task.id)}
            >
              <View style={[styles.checkbox, task.completed && styles.checkboxCompleted]}>
                {task.completed && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
                  {task.title}
                </Text>
                <Text style={styles.taskMeta}>Category: {task.category}</Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        ))}

        {/* Sovereign Reminders List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Today's Reminders</Text>
          <TouchableOpacity onPress={() => setIsAddingReminder(!isAddingReminder)}>
            <Text style={styles.addLink}>{isAddingReminder ? 'Cancel' : '+ Add Reminder'}</Text>
          </TouchableOpacity>
        </View>

        {isAddingReminder && (
          <GlassCard style={styles.addReminderCard}>
            <TextInput
              style={styles.input}
              placeholder="Reminder label (e.g. Call mentor)..."
              placeholderTextColor={theme.colors.text.muted}
              value={newReminderTitle}
              onChangeText={setNewReminderTitle}
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              placeholder="Time (e.g. 18:30 or Tomorrow 9 AM)..."
              placeholderTextColor={theme.colors.text.muted}
              value={newReminderTime}
              onChangeText={setNewReminderTime}
            />
            <GlassButton
              title="Schedule Reminder"
              variant="primary"
              onPress={handleAddReminder}
              style={{ marginTop: 10 }}
            />
          </GlassCard>
        )}

        {reminders.map((rem) => (
          <GlassCard key={rem.id} style={styles.reminderCard}>
            <TouchableOpacity
              style={styles.reminderRow}
              onPress={() => handleToggleReminder(rem.id)}
            >
              <View style={[styles.checkbox, rem.status === 'completed' && styles.checkboxCompleted]}>
                {rem.status === 'completed' && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <View style={styles.reminderInfo}>
                <Text style={[styles.reminderTitle, rem.status === 'completed' && styles.taskTitleCompleted]}>
                  {rem.title}
                </Text>
                <Text style={styles.reminderMeta}>
                  ⏰ {new Date(rem.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Priority: {rem.priority.toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </GlassCard>
        ))}

        {/* Night Reflection & Sovereign Journal */}
        <Text style={styles.sectionHeader}>Evening Reflection & Memory Sync</Text>
        <GlassCard style={styles.reflectionCard}>
          <Text style={styles.reflectionPrompt}>
            What insights or breakthroughs did you record today?
          </Text>
          <TextInput
            style={styles.reflectionInput}
            placeholder="Log insights to local sovereign vault..."
            placeholderTextColor={theme.colors.text.muted}
            multiline
            numberOfLines={3}
            value={reflectionText}
            onChangeText={setReflectionText}
          />
          <GlassButton
            title={isSavingReflection ? 'Recording...' : 'Commit to Vault'}
            variant="secondary"
            onPress={handleSaveReflection}
            style={{ marginTop: 8 }}
          />
        </GlassCard>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Persistent Bottom Nav Dock */}
      <BottomNavBar activeTab="Plan" onTabPress={handleTabPress} />
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
    justifyContent: 'space-between',
    marginVertical: theme.spacing.md,
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
  missedCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  missedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  missedIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  missedInfo: {
    flex: 1,
  },
  missedTitle: {
    color: '#EF4444',
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  missedSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  missedActions: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'flex-end',
    gap: 8,
  },
  rescheduleBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  rescheduleBtnText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  dismissBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  dismissBtnText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  sectionHeader: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  addLink: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  phaseScroll: {
    marginVertical: theme.spacing.xs,
  },
  phaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
  },
  phaseChipSelected: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  phaseChipActiveBorder: {
    borderColor: theme.colors.status.listening,
  },
  phaseIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  phaseLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  phaseLabelSelected: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  currentIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent.primary,
    marginLeft: 6,
  },
  phaseDetailCard: {
    marginTop: 8,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(11, 18, 36, 0.6)',
  },
  phaseDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseDetailTitle: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  phaseDetailTime: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
  },
  phaseDetailDesc: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 6,
    lineHeight: 18,
  },
  focusCard: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  focusHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  focusTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  focusSub: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
  },
  focusIcon: {
    fontSize: 20,
  },
  timerDisplay: {
    fontSize: 44,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.accent.primary,
    letterSpacing: 2,
    marginVertical: 12,
  },
  focusActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  focusButton: {
    flex: 1,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resetButtonText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  taskCard: {
    marginTop: 8,
    padding: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: theme.colors.accent.primary,
  },
  checkIcon: {
    color: '#000000',
    fontSize: 13,
    fontWeight: 'bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.muted,
  },
  taskMeta: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  reminderCard: {
    marginTop: 8,
    padding: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  reminderMeta: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  addReminderCard: {
    marginTop: 8,
    padding: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  reflectionCard: {
    marginTop: 8,
    padding: theme.spacing.md,
  },
  reflectionPrompt: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginBottom: 8,
    lineHeight: 18,
  },
  reflectionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    textAlignVertical: 'top',
  },
});

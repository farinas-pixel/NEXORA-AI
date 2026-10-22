import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../context/AppContext';
import { ReminderService, ReminderItem } from '../services/reminders/reminderService';
import { StorageService, TaskItem } from '../services/storage';
import { supabaseDataService } from '../services/backend/supabaseDataService';
import { DataResetService } from '../services/dataResetService';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import type { ScreenNavProp } from '../types/navigation';

// My Day Nature-Inspired Subcomponents
import { NatureTheme } from './myday/theme';
import { DailyHeaderAndDate } from './myday/components/DailyHeaderAndDate';
import { DailyProgressCard } from './myday/components/DailyProgressCard';
import { FocusNowCard } from './myday/components/FocusNowCard';
import { LifeBloomOrb, LifeBloomMode } from './myday/components/LifeBloomOrb';
import { TodayTimeline, TimelineItem } from './myday/components/TodayTimeline';
import { MyTasksSection } from './myday/components/MyTasksSection';
import { RemindersSection } from './myday/components/RemindersSection';
import { AIDailyAssistantCard } from './myday/components/AIDailyAssistantCard';
import { DayClosureCard } from './myday/components/DayClosureCard';
import { QuickAddModal, QuickAddType } from './myday/components/QuickAddModal';

interface MyDayScreenProps {
  navigation: ScreenNavProp<'MyDay'>;
}

export const MyDayScreen: React.FC<MyDayScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, preferences, refreshTasks, refreshReminders } = useApp();

  // Selected Date Scrubber
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Data State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [missedReminders, setMissedReminders] = useState<ReminderItem[]>([]);
  const [followUpReminder, setFollowUpReminder] = useState<ReminderItem | null>(null);

  // LifeBloom Focus Connection
  const [activeFocusTaskTitle, setActiveFocusTaskTitle] = useState<string | null>(null);

  // Unified Quick Add / Edit Modal State
  const [isQuickAddVisible, setIsQuickAddVisible] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType>('task');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);

  useEffect(() => {
    loadDayData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDayData();
    }, [])
  );

  // Check for follow-up reminders (> 1 hour overdue and unresolved)
  useEffect(() => {
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();
    const candidate = reminders.find((r) => {
      if (r.status !== 'completed' && r.status !== 'cancelled') {
        const diff = now - new Date(r.dueTime).getTime();
        return diff >= ONE_HOUR_MS && diff <= 24 * ONE_HOUR_MS;
      }
      return false;
    });
    if (candidate && !followUpReminder) {
      setFollowUpReminder(candidate);
    }
  }, [reminders, followUpReminder]);

  const loadDayData = async () => {
    try {
      await DataResetService.ensureTargetedReset().catch((e) => {
        console.warn('[MyDayScreen] Data reset notice:', e);
      });

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

  /* =========================================================================
     TASK ACTIONS (Verified contract for audit and storage)
     ========================================================================= */

  const handleToggleTask = async (id: string) => {
    await supabaseDataService.toggleTask(id).catch(() => null);
    await StorageService.toggleTask(id).catch(() => null);
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleOpenEditTask = (task: TaskItem) => {
    setEditingTask(task);
    setEditingReminder(null);
    setQuickAddType('task');
    setIsQuickAddVisible(true);
  };

  const handleSaveTask = async (taskData: {
    title: string;
    dueDate?: string;
    category: TaskItem['category'];
    priority: 'low' | 'medium' | 'high';
  }) => {
    const trimmed = taskData.title.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Please enter a task title.');
      return;
    }

    const resolvedDueDate = taskData.dueDate?.trim() || 'Today';

    if (editingTask) {
      // Edit existing task
      await StorageService.updateTask(editingTask.id, {
        title: trimmed,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: resolvedDueDate,
      });
      await supabaseDataService.updateTask(editingTask.id, {
        title: trimmed,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: resolvedDueDate,
      }).catch(() => null);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? {
                ...t,
                title: trimmed,
                category: taskData.category,
                priority: taskData.priority,
                dueDate: resolvedDueDate,
              }
            : t
        )
      );
      setEditingTask(null);
    } else {
      // Create new task
      const created = await StorageService.saveTask({
        title: trimmed,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: resolvedDueDate,
      });
      await supabaseDataService.createTask({
        title: trimmed,
        category: taskData.category,
        priority: taskData.priority,
        dueDate: resolvedDueDate,
        completed: false,
      }).catch(() => null);

      setTasks((prev) => [created, ...prev]);
    }
    refreshTasks?.().catch(() => {});
  };

  const handleDeleteTask = (id: string) => {
    const targetTask = tasks.find((t) => t.id === id);
    const taskName = targetTask ? `"${targetTask.title}"` : 'this task';

    Alert.alert(
      'Delete Task',
      `Are you sure you want to permanently delete ${taskName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteTask(id);
              await supabaseDataService.deleteTask(id).catch(() => null);
              setTasks((prev) => prev.filter((t) => t.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete task.');
            }
          },
        },
      ]
    );
  };

  /* =========================================================================
     REMINDER ACTIONS
     ========================================================================= */

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

  const handleTogglePinReminder = async (id: string) => {
    try {
      const updated = await ReminderService.togglePinReminder(id);
      setReminders(updated);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update pin');
    }
  };

  const handleSnoozeReminder = async (id: string, mins: number = 10) => {
    try {
      const updated = await ReminderService.snoozeReminder(id, mins);
      setReminders(updated);
      Alert.alert('Snoozed', `Reminder postponed by ${mins} minutes.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to snooze reminder');
    }
  };

  const handleOpenEditReminder = (rem: ReminderItem) => {
    setEditingReminder(rem);
    setEditingTask(null);
    setQuickAddType('reminder');
    setIsQuickAddVisible(true);
  };

  const handleDeleteReminder = (id: string) => {
    const target = reminders.find((r) => r.id === id);
    const label = target ? `"${target.title}"` : 'this reminder';

    Alert.alert(
      'Delete Reminder',
      `Move ${label} to deleted archive?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await ReminderService.cancelReminder(id);
              setReminders(updated);
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleSaveReminder = async (data: {
    title: string;
    timeStr: string;
    category: ReminderItem['category'];
    isPinned: boolean;
    relaxationMinutes: number;
  }) => {
    let targetDate = new Date(selectedDate);
    const timeTrim = data.timeStr.trim();
    const timeMatch = timeTrim.match(/^(\d{1,2}):(\d{2})$/);
    const ampmMatch = timeTrim.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);

    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2], 10);
      targetDate.setHours(hours, mins, 0, 0);
    } else if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const mins = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
      const meridian = ampmMatch[3].toLowerCase();
      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;
      targetDate.setHours(hours, mins, 0, 0);
    } else {
      targetDate.setHours(18, 0, 0, 0);
    }

    const dueIso = targetDate.toISOString();

    if (editingReminder) {
      const updated = await ReminderService.updateReminderDetails(editingReminder.id, {
        title: data.title.trim(),
        dueTime: dueIso,
        category: data.category,
        priority: data.isPinned ? 'high' : 'medium',
        relaxationMinutes: data.relaxationMinutes > 0 ? data.relaxationMinutes : undefined,
      });
      setReminders(updated);
      setEditingReminder(null);
    } else {
      await ReminderService.createReminder(
        data.title.trim(),
        dueIso,
        data.category,
        data.isPinned ? 'high' : 'medium',
        {
          notes: data.relaxationMinutes > 0 ? `Starts ${data.relaxationMinutes}m relaxation timer` : undefined,
          isPinned: data.isPinned,
          relaxationMinutes: data.relaxationMinutes,
        }
      );
      const updated = await ReminderService.getReminders();
      setReminders(updated);
    }
    refreshReminders?.().catch(() => {});
  };

  const handleRescheduleMissed = async (id: string) => {
    try {
      const in30Min = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const updated = await ReminderService.rescheduleReminder(id, in30Min);
      setReminders(updated);
      const missed = await ReminderService.getMissedReminders();
      setMissedReminders(missed);
      Alert.alert('Rescheduled', 'Alarm shifted forward by 30 minutes.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to reschedule');
    }
  };

  const handleDismissMissed = async (id: string) => {
    try {
      const updated = await ReminderService.completeReminder(id);
      setReminders(updated);
      const missed = await ReminderService.getMissedReminders();
      setMissedReminders(missed);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to dismiss');
    }
  };

  const handleFollowUpAction = async (action: 'complete' | 'reschedule' | 'snooze' | 'delete') => {
    if (!followUpReminder) return;
    try {
      if (action === 'complete') {
        const updated = await ReminderService.completeReminder(followUpReminder.id);
        setReminders(updated);
      } else if (action === 'reschedule') {
        const in1Hour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const updated = await ReminderService.rescheduleReminder(followUpReminder.id, in1Hour);
        setReminders(updated);
        Alert.alert('Rescheduled', 'Moved forward by 1 hour.');
      } else if (action === 'snooze') {
        const updated = await ReminderService.snoozeReminder(followUpReminder.id, 15);
        setReminders(updated);
      } else if (action === 'delete') {
        const updated = await ReminderService.cancelReminder(followUpReminder.id);
        setReminders(updated);
      }
      setFollowUpReminder(null);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Action failed');
    }
  };

  /* =========================================================================
     SOVEREIGN VAULT REFLECTION
     ========================================================================= */

  const handleSaveReflection = async (text: string) => {
    const content = `[Daily Reflection] ${text.trim()}`;
    await StorageService.saveMemory({
      category: 'personal',
      content,
      securityTier: 'medium',
      confidence: 0.99,
    });
    await supabaseDataService.createMemory({
      category: 'personal',
      content,
      securityTier: 'medium',
      confidence: 0.99,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch(() => null);
  };

  /* =========================================================================
     COMPUTED DATA & TIMELINE (DATE-WISE FILTERING)
     ========================================================================= */

  const isSameLocalDate = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isTaskOnDate = useCallback((t: TaskItem, targetDate: Date) => {
    if (!t.dueDate) {
      return isSameLocalDate(targetDate, new Date());
    }
    const dLower = t.dueDate.trim().toLowerCase();
    if (dLower === 'today') {
      return isSameLocalDate(targetDate, new Date());
    }
    if (dLower === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      return isSameLocalDate(targetDate, tom);
    }
    const parsed = new Date(t.dueDate);
    if (!isNaN(parsed.getTime())) {
      return isSameLocalDate(targetDate, parsed);
    }
    return isSameLocalDate(targetDate, new Date());
  }, []);

  const isReminderOnDate = useCallback((r: ReminderItem, targetDate: Date) => {
    if (!r.dueTime) return false;
    const parsed = new Date(r.dueTime);
    if (isNaN(parsed.getTime())) return false;
    return isSameLocalDate(targetDate, parsed);
  }, []);

  // Filter tasks and reminders strictly for the selected date
  const displayedTasks = useMemo(() => {
    return tasks.filter((t) => isTaskOnDate(t, selectedDate));
  }, [tasks, selectedDate, isTaskOnDate]);

  const displayedReminders = useMemo(() => {
    return reminders.filter((r) => isReminderOnDate(r, selectedDate));
  }, [reminders, selectedDate, isReminderOnDate]);

  const completedTasksCount = displayedTasks.filter((t) => t.completed).length;
  const unfinishedTasksCount = displayedTasks.filter((t) => !t.completed).length;
  const totalTasksCount = displayedTasks.length;

  // Next top focus task
  const topFocusTask = useMemo(() => {
    const pending = displayedTasks.filter((t) => !t.completed);
    const high = pending.find((t) => t.priority === 'high');
    return high || pending[0] || null;
  }, [displayedTasks]);

  // Combined Chronological Timeline items for selected date
  const timelineItems: TimelineItem[] = useMemo(() => {
    const list: TimelineItem[] = [];
    const now = Date.now();

    // Add tasks with dueDate
    displayedTasks.forEach((t) => {
      let rawTime = now + 4 * 3600 * 1000; // default afternoon
      let label = t.dueDate || 'Today';

      const timeMatch = t.dueDate?.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
      if (timeMatch) {
        label = timeMatch[1].toUpperCase();
      }

      list.push({
        id: t.id,
        type: 'task',
        title: t.title,
        timeLabel: label,
        rawTime,
        completed: !!t.completed,
        isOverdue: false,
        category: t.category,
        priority: t.priority,
        originalItem: t,
      });
    });

    // Add reminders
    displayedReminders.forEach((r) => {
      const d = new Date(r.dueTime);
      const isPast = d.getTime() < now;

      list.push({
        id: r.id,
        type: 'reminder',
        title: r.title,
        timeLabel: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawTime: d.getTime(),
        completed: r.status === 'completed',
        isOverdue: isPast && r.status !== 'completed',
        category: r.category,
        priority: r.priority,
        originalItem: r,
      });
    });

    return list;
  }, [displayedTasks, displayedReminders]);

  const handleTimelineToggle = (id: string, type: 'task' | 'reminder') => {
    if (type === 'task') handleToggleTask(id);
    else handleToggleReminder(id);
  };

  const handleTimelineEdit = (item: TimelineItem) => {
    if (item.type === 'task') {
      handleOpenEditTask(item.originalItem as TaskItem);
    } else {
      handleOpenEditReminder(item.originalItem as ReminderItem);
    }
  };

  const handleTabPress = (tab: TabName) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Friends') navigation.navigate('FriendsChat');
    else if (tab === 'Profile' || tab === 'MyLife') navigation.navigate('MyLife');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Deep Cosmic Dark Glassmorphism Background Gradient */}
      <LinearGradient
        colors={[
          NatureTheme.colors.backgroundGradStart,
          NatureTheme.colors.background,
          NatureTheme.colors.backgroundGradEnd,
        ]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 10, 24), paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* A. Daily Header & 7-Day Scrubber */}
        <DailyHeaderAndDate
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onResetToToday={() => setSelectedDate(new Date())}
          completedTasksCount={completedTasksCount}
          totalTasksCount={totalTasksCount}
          userName={user?.name}
        />

        {/* B. Daily Progress Card */}
        <DailyProgressCard
          completedCount={completedTasksCount}
          totalCount={totalTasksCount}
        />

        {/* C. Compact Today's Reminders Preview with View All (navigates to Calendar) */}
        <RemindersSection
          isCompactPreview={true}
          reminders={displayedReminders}
          missedReminders={missedReminders}
          followUpReminder={followUpReminder}
          onToggleReminder={handleToggleReminder}
          onTogglePin={handleTogglePinReminder}
          onSnooze={handleSnoozeReminder}
          onOpenEdit={handleOpenEditReminder}
          onDeleteReminder={handleDeleteReminder}
          onStartRelaxation={(title, mins) => {
            setActiveFocusTaskTitle(`Relax: ${title}`);
          }}
          onRescheduleMissed={handleRescheduleMissed}
          onDismissMissed={handleDismissMissed}
          onFollowUpAction={handleFollowUpAction}
          onAddNewReminder={() => navigation.navigate('Calendar')}
          onViewAll={() => navigation.navigate('Calendar')}
        />

        {/* D. Compact Today's Tasks Preview with View All (navigates to PlanDashboard) */}
        <MyTasksSection
          isCompactPreview={true}
          tasks={displayedTasks}
          onToggleTask={handleToggleTask}
          onOpenEditTask={handleOpenEditTask}
          onDeleteTask={handleDeleteTask}
          onAddNewTask={() => navigation.navigate('PlanDashboard')}
          onViewAll={() => navigation.navigate('PlanDashboard')}
        />

        {/* Section 4: Focus Timer */}
        <LifeBloomOrb
          initialDurationSeconds={25 * 60}
          initialMode="focus"
          reduceMotion={preferences?.reduceMotion}
          taskTitleForFocus={activeFocusTaskTitle}
          onSessionComplete={(sec, mode) => {
            Alert.alert(
              '⚡ Focus Session Completed',
              `Your ${Math.round(sec / 60)}-minute focus interval is complete!`
            );
          }}
        />
      </ScrollView>

      {/* J. Unified Quick Add / Edit Modal */}
      <QuickAddModal
        visible={isQuickAddVisible}
        onClose={() => {
          setIsQuickAddVisible(false);
          setEditingTask(null);
          setEditingReminder(null);
        }}
        initialType={quickAddType}
        editingTask={editingTask}
        editingReminder={editingReminder}
        onSaveTask={handleSaveTask}
        onSaveReminder={handleSaveReminder}
      />

      {/* Protected Bottom Navigation Bar Dock */}
      <BottomNavBar activeTab="Plan" onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NatureTheme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // Compatibility class for tests
  emptyTasksCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 8, 20, 0.65)',
    zIndex: 90,
  },
  fabMenu: {
    position: 'absolute',
    right: 20,
    zIndex: 95,
    alignItems: 'flex-end',
    gap: 10,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 43, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  fabMenuIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fabBtn: {
    position: 'absolute',
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    zIndex: 95,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MyDayScreen;

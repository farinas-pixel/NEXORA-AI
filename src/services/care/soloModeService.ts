/**
 * NEXORA AI — Solo Mode & Daily Care Architecture
 * Manages personalized morning greetings, daily check-ins,
 * real task/reminder retrieval, respectful health check-ins,
 * quiet-hour enforcement, and clean schedule invalidation on disable.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { StorageService, TaskItem, HealthRecord, UserPreferences, UserProfile } from '../storage';
import { ReminderService, ReminderItem } from '../reminders/reminderService';
import { SpeechService } from '../voice/speechService';

export interface DailyCareBriefing {
  greeting: string;
  tasksCount: number;
  remindersCount: number;
  tasks: TaskItem[];
  reminders: ReminderItem[];
  healthNote?: string;
  spokenText: string;
  isWithinQuietHours: boolean;
}

export const SoloModeService = {
  /**
   * Evaluates if the current local time falls inside user-configured quiet hours
   */
  isCurrentTimeInQuietHours(prefs: UserPreferences): boolean {
    if (!prefs.quietHoursEnabled) return false;

    const startStr = prefs.quietHoursStart || '22:00';
    const endStr = prefs.quietHoursEnd || '07:00';

    const [startH, startM] = startStr.split(':').map((n) => parseInt(n, 10) || 0);
    const [endH, endM] = endStr.split(':').map((n) => parseInt(n, 10) || 0);

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins < endMins) {
      // Normal range: e.g. 13:00 to 15:00
      return currentMins >= startMins && currentMins < endMins;
    } else {
      // Overnight range: e.g. 22:00 to 07:00
      return currentMins >= startMins || currentMins < endMins;
    }
  },

  /**
   * Retrieves today's active tasks and reminders from persistent storage
   */
  async getTodayAgenda(): Promise<{ tasks: TaskItem[]; reminders: ReminderItem[] }> {
    try {
      const [allTasks, allReminders] = await Promise.all([
        StorageService.getTasks().catch(() => []),
        ReminderService.getReminders().catch(() => []),
      ]);

      const todayStr = new Date().toISOString().split('T')[0];

      // Filter tasks due today or pending
      const todayTasks = allTasks.filter((t) => {
        if (t.completed) return false;
        if (!t.dueDate) return true;
        return t.dueDate.startsWith(todayStr);
      });

      // Filter reminders due today and not completed/cancelled
      const todayReminders = allReminders.filter((r) => {
        if (r.status === 'completed' || r.status === 'cancelled') return false;
        if (!r.dueTime) return true;
        return r.dueTime.startsWith(todayStr);
      });

      return { tasks: todayTasks, reminders: todayReminders };
    } catch {
      return { tasks: [], reminders: [] };
    }
  },

  /**
   * Assembles the daily care briefing respecting user health privacy and permissions
   */
  async generateDailyCareBriefing(
    user: UserProfile | null,
    prefs: UserPreferences
  ): Promise<DailyCareBriefing> {
    const userName = user?.name ? user.name.split(' ')[0] : 'Partner';
    const hour = new Date().getHours();

    let timeGreeting = 'Good day';
    if (hour >= 5 && hour < 12) timeGreeting = 'Good morning';
    else if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    else if (hour >= 17 && hour < 22) timeGreeting = 'Good evening';

    const greeting = `${timeGreeting}, ${userName}!`;
    const inQuietHours = this.isCurrentTimeInQuietHours(prefs);
    const { tasks, reminders } = await this.getTodayAgenda();

    // Check health data only if user authorized solo health integration
    let healthNote = '';
    let healthSpoken = '';

    if (prefs.soloCareHealthIntegration) {
      try {
        const records: HealthRecord[] = await StorageService.getHealthRecords();
        const activeMeds = records.filter(
          (r) => r.category === 'medication' && r.status !== 'completed' && r.status !== 'resolved'
        );
        const unresolvedSymptoms = records.filter(
          (r) => r.category === 'symptom' && r.status !== 'resolved'
        );

        if (unresolvedSymptoms.length > 0) {
          healthNote = `Checking in: How are you feeling today regarding your ${unresolvedSymptoms[0].title}?`;
          if (prefs.allowSpokenHealthDetails) {
            healthSpoken = ` I hope you are feeling better regarding your ${unresolvedSymptoms[0].title}.`;
          }
        } else if (activeMeds.length > 0) {
          healthNote = `Care reminder: You have scheduled medication (${activeMeds[0].title}).`;
          if (prefs.allowSpokenHealthDetails) {
            healthSpoken = ` Just a gentle note about your ${activeMeds[0].title}.`;
          }
        } else {
          healthNote = 'How are you feeling right now? Remember to take gentle breaks today.';
          healthSpoken = ' How are you feeling today? Remember to take gentle breaks and stay hydrated.';
        }
      } catch {
        healthNote = 'How are you feeling right now?';
        healthSpoken = ' How are you feeling today?';
      }
    }

    // Build warm, supportive conversational summary (never pretending to be a doctor/human)
    let spokenText = `${greeting}. Here is your gentle companion check-in.`;

    if (tasks.length > 0 || reminders.length > 0) {
      spokenText += ` You have ${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'} and ${reminders.length} ${reminders.length === 1 ? 'reminder' : 'reminders'} scheduled for today.`;
    } else {
      spokenText += ` Your schedule is clear and open today.`;
    }

    if (healthSpoken) {
      spokenText += healthSpoken;
    }

    return {
      greeting,
      tasksCount: tasks.length,
      remindersCount: reminders.length,
      tasks,
      reminders,
      healthNote: healthNote || undefined,
      spokenText,
      isWithinQuietHours: inQuietHours,
    };
  },

  /**
   * Schedule native Android alarms/notifications for Solo Mode morning greeting and check-in
   */
  async scheduleSoloModeJobs(prefs: UserPreferences): Promise<{ morningJobId?: string; checkInJobId?: string }> {
    // If Solo Mode is disabled, cancel any existing jobs immediately
    if (!prefs.soloMode) {
      await this.cancelSoloModeJobs();
      return {};
    }

    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('nexora-solo-care', {
          name: 'NEXORA Solo Mode & Daily Care',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#00E5FF',
          showBadge: true,
        });
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        if (req.status !== 'granted') {
          console.warn('[SoloModeService] Notification permission not granted for Solo Mode.');
          return {};
        }
      }

      let morningJobId: string | undefined;
      let checkInJobId: string | undefined;

      // 1. Morning Greeting
      if (prefs.morningGreetingEnabled) {
        const timeStr = prefs.morningGreetingTime || '08:00';
        const [hour, min] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);

        morningJobId = await Notifications.scheduleNotificationAsync({
          identifier: 'solo_morning_greeting',
          content: {
            title: '☀️ NEXORA Morning Check-in',
            body: 'Good morning! Tap to review today’s companion agenda & reminders.',
            data: { type: 'solo_morning_greeting' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour,
            minute: min,
            repeats: true,
            channelId: 'nexora-solo-care',
          },
        });
      } else {
        await Notifications.cancelScheduledNotificationAsync('solo_morning_greeting').catch(() => {});
      }

      // 2. Afternoon/Evening Daily Check-in
      if (prefs.dailyCheckInEnabled) {
        const timeStr = prefs.checkInTime || '14:00';
        const [hour, min] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);

        checkInJobId = await Notifications.scheduleNotificationAsync({
          identifier: 'solo_daily_checkin',
          content: {
            title: '🌱 NEXORA Daily Care Check-in',
            body: 'How is your afternoon going? Tap for a gentle reflection and agenda update.',
            data: { type: 'solo_daily_checkin' },
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour,
            minute: min,
            repeats: true,
            channelId: 'nexora-solo-care',
          },
        });
      } else {
        await Notifications.cancelScheduledNotificationAsync('solo_daily_checkin').catch(() => {});
      }

      return { morningJobId, checkInJobId };
    } catch (e) {
      console.warn('[SoloModeService] Failed to schedule Solo Mode notifications:', e);
      return {};
    }
  },

  /**
   * Cancel and invalidate all Solo Mode scheduled alarms/notifications
   */
  async cancelSoloModeJobs(): Promise<void> {
    try {
      await Promise.all([
        Notifications.cancelScheduledNotificationAsync('solo_morning_greeting').catch(() => {}),
        Notifications.cancelScheduledNotificationAsync('solo_daily_checkin').catch(() => {}),
      ]);
    } catch {}
  },

  /**
   * Plays the voice briefing if quiet hours allow and autoSpeak is configured
   */
  async speakBriefingIfPermitted(
    briefing: DailyCareBriefing,
    prefs: UserPreferences
  ): Promise<boolean> {
    if (briefing.isWithinQuietHours) {
      console.log('[SoloModeService] Speech skipped due to active quiet hours.');
      return false;
    }

    try {
      await SpeechService.speak(briefing.spokenText, {
        rate: prefs.speechRate || 1.0,
        pitch: prefs.speechPitch || 1.0,
        language: prefs.appLanguage || 'en-US',
      });
      return true;
    } catch (e) {
      console.warn('[SoloModeService] Failed speaking briefing:', e);
      return false;
    }
  },
};

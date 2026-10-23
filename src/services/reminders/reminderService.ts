/**
 * NEXORA AI — Real Reminders & Notification Architecture
 * Handles persistent reminder creation, cancellation, completion,
 * missed reminder detection, and native device alarm/notification scheduling.
 * Sources of truth: live public.reminders table in Supabase via supabaseDataService
 * Local offline scheduler: native Android notification alarms via expo-notifications.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabaseDataService } from '../backend/supabaseDataService';
import { StorageService } from '../storage';

// Configure foreground notification handling so alerts show banner and play sound (native mobile only)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {}
}

export interface ReminderItem {
  id: string;
  userId?: string;
  title: string;
  dueTime: string; // ISO date-time string
  category: 'study' | 'work' | 'fitness' | 'personal' | 'medication' | 'social';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'missed' | 'cancelled' | 'snoozed';
  isPinned?: boolean;
  relaxationMinutes?: number;
  isShared?: boolean;
  groupId?: string;
  groupName?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  notified?: boolean;
  syncStatus?: 'synced' | 'pending_sync' | 'failed';
  notificationId?: string;
}

export const ReminderService = {
  /**
   * Request native or web notification permissions and configure Android channel
   */
  async ensureNotificationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') return true;
          if (Notification.permission !== 'denied') {
            const res = await Notification.requestPermission();
            return res === 'granted';
          }
        }
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('nexora-reminders', {
          name: 'NEXORA Reminders & Alarms',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00E5FF',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[ReminderService] Notification permissions check warning:', e);
      return false;
    }
  },

  /**
   * Schedule a native offline alarm/notification for a reminder
   */
  async scheduleNativeNotification(reminder: ReminderItem): Promise<string | undefined> {
    try {
      const targetDate = new Date(reminder.dueTime);
      const diffMs = targetDate.getTime() - Date.now();

      // Only schedule future reminders
      if (diffMs <= 0) {
        return undefined;
      }

      if (Platform.OS === 'web') {
        const hasPerm = await this.ensureNotificationPermissions();
        if (hasPerm && typeof window !== 'undefined' && 'Notification' in window) {
          const timeoutId = setTimeout(() => {
            try {
              new Notification(`⏰ Reminder: ${reminder.title}`, {
                body: reminder.notes || `Scheduled for ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              });
            } catch {}
          }, Math.min(diffMs, 2147483647));
          return `web_timer_${timeoutId}`;
        }
        return undefined;
      }

      const hasPermission = await this.ensureNotificationPermissions();
      if (!hasPermission) {
        console.warn('[ReminderService] Notification permission not granted; saved to database only.');
        return undefined;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier: `rem_${reminder.id}`,
        content: {
          title: `⏰ Reminder: ${reminder.title}`,
          body: reminder.notes || `Scheduled for ${targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          data: { reminderId: reminder.id, category: reminder.category },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          channelId: 'nexora-reminders',
        },
      });

      return notificationId;
    } catch (err) {
      console.warn('[ReminderService] Failed to schedule native notification:', err);
      return undefined;
    }
  },

  /**
   * Cancel a scheduled native notification by reminder ID
   */
  async cancelNativeNotification(reminderId: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        return;
      }
      await Notifications.cancelScheduledNotificationAsync(`rem_${reminderId}`).catch(() => {});
    } catch {}
  },

  /**
   * Retrieve all reminders and automatically evaluate missed states
   */
  async getReminders(): Promise<ReminderItem[]> {
    try {
      let reminders = await supabaseDataService.fetchReminders();
      const now = new Date();
      const missedToUpdate: string[] = [];

      // Detect missed reminders
      reminders = reminders.map((rem) => {
        if (rem.status === 'pending' && new Date(rem.dueTime) < now) {
          missedToUpdate.push(rem.id);
          return { ...rem, status: 'missed' as const };
        }
        return rem;
      });

      // Asynchronously update missed status in database
      if (missedToUpdate.length > 0) {
        Promise.all(
          missedToUpdate.map((id) =>
            supabaseDataService.updateReminder(id, { status: 'missed' }).catch(() => null)
          )
        ).catch(() => {});
      }

      return reminders;
    } catch {
      return [];
    }
  },

  /**
   * Create and persist a new reminder both in database and on native device scheduler
   */
  async createReminder(
    title: string,
    dueTime: string,
    category: ReminderItem['category'] = 'personal',
    priority: ReminderItem['priority'] = 'medium',
    options?: {
      isShared?: boolean;
      groupId?: string;
      groupName?: string;
      notes?: string;
      isPinned?: boolean;
      relaxationMinutes?: number;
    }
  ): Promise<ReminderItem> {
    const item = await supabaseDataService.createReminder({
      title: title.trim(),
      dueTime,
      category,
      priority,
      notes: options?.notes,
      isPinned: options?.isPinned,
      relaxationMinutes: options?.relaxationMinutes,
    });

    // Schedule real native device notification so alarm triggers even when app is closed
    if (item && item.id) {
      this.scheduleNativeNotification(item).catch(() => {});
    }

    return item;
  },

  /**
   * Mark reminder as completed and cancel scheduled alarm
   */
  async completeReminder(id: string): Promise<ReminderItem[]> {
    await this.cancelNativeNotification(id);
    const updatedItem = await supabaseDataService.completeReminder(id);
    const existing = await this.getReminders();
    return existing.map((r) => (r.id === id ? updatedItem : r));
  },

  /**
   * Cancel / Delete a reminder, archive to safe recovery history, and clear native scheduled alarm
   */
  async cancelReminder(id: string): Promise<ReminderItem[]> {
    await this.cancelNativeNotification(id);
    const existing = await this.getReminders();
    const target = existing.find((r) => r.id === id);
    if (target) {
      await StorageService.archiveDeletedReminder(target).catch(() => {});
    }
    await supabaseDataService.deleteReminder(id);
    return existing.filter((r) => r.id !== id);
  },

  /**
   * Reschedule a reminder and update native alarm
   */
  async rescheduleReminder(id: string, newDueTime: string): Promise<ReminderItem[]> {
    await this.cancelNativeNotification(id);
    const updatedItem = await supabaseDataService.rescheduleReminder(id, newDueTime);
    const existing = await this.getReminders();
    const updated = existing.map((r) => (r.id === id ? updatedItem : r));
    if (updatedItem) {
      this.scheduleNativeNotification(updatedItem).catch(() => {});
    }
    return updated;
  },

  /**
   * Snooze a reminder for specified minutes (default 10)
   */
  async snoozeReminder(id: string, minutes: number = 10): Promise<ReminderItem[]> {
    await this.cancelNativeNotification(id);
    const newDueTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const updatedItem = await supabaseDataService.updateReminder(id, {
      dueTime: newDueTime,
      status: 'snoozed',
      completedAt: null,
    });
    const existing = await this.getReminders();
    const updated = existing.map((r) => (r.id === id ? updatedItem : r));
    if (updatedItem) {
      this.scheduleNativeNotification(updatedItem).catch(() => {});
    }
    return updated;
  },

  /**
   * Pin or unpin a reminder for priority visibility
   */
  async togglePinReminder(id: string): Promise<ReminderItem[]> {
    const existing = await this.getReminders();
    const target = existing.find((r) => r.id === id);
    if (!target) return existing;
    const isPinned = !target.isPinned;
    const updatedItem = await supabaseDataService.updateReminder(id, {
      isPinned,
    });
    return existing.map((r) => (r.id === id ? updatedItem : r));
  },

  /**
   * Edit title or time of an existing reminder (updates record, never duplicates)
   */
  async updateReminderDetails(
    id: string,
    updates: { title?: string; dueTime?: string; category?: ReminderItem['category']; priority?: ReminderItem['priority']; notes?: string; relaxationMinutes?: number }
  ): Promise<ReminderItem[]> {
    await this.cancelNativeNotification(id);
    const updatedItem = await supabaseDataService.updateReminder(id, updates);
    const existing = await this.getReminders();
    const updated = existing.map((r) => (r.id === id ? updatedItem : r));
    if (updatedItem && updatedItem.status !== 'completed') {
      this.scheduleNativeNotification(updatedItem).catch(() => {});
    }
    return updated;
  },

  /**
   * Get missed reminders that need attention
   */
  async getMissedReminders(): Promise<ReminderItem[]> {
    const reminders = await this.getReminders();
    return reminders.filter((r) => r.status === 'missed');
  },
};

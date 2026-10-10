/**
 * NEXORA AI — Real Reminders & Notification Architecture
 * Handles persistent reminder creation, cancellation, completion,
 * missed reminder detection, and shared friend reminders.
 * Sources of truth: live public.reminders table in Supabase via supabaseDataService.
 */

import { supabaseDataService } from '../backend/supabaseDataService';

export interface ReminderItem {
  id: string;
  userId?: string;
  title: string;
  dueTime: string; // ISO date-time string
  category: 'study' | 'work' | 'fitness' | 'personal' | 'medication' | 'social';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'completed' | 'missed' | 'cancelled';
  isShared?: boolean;
  groupId?: string;
  groupName?: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
  notified?: boolean;
  syncStatus?: 'synced' | 'pending_sync' | 'failed';
}

export const ReminderService = {
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
   * Create and persist a new reminder
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
    }
  ): Promise<ReminderItem> {
    return await supabaseDataService.createReminder({
      title: title.trim(),
      dueTime,
      category,
      priority,
      notes: options?.notes,
    });
  },

  /**
   * Mark reminder as completed
   */
  async completeReminder(id: string): Promise<ReminderItem[]> {
    await supabaseDataService.completeReminder(id);
    return await this.getReminders();
  },

  /**
   * Cancel / Delete a reminder
   */
  async cancelReminder(id: string): Promise<ReminderItem[]> {
    await supabaseDataService.deleteReminder(id);
    return await this.getReminders();
  },

  /**
   * Reschedule a reminder
   */
  async rescheduleReminder(id: string, newDueTime: string): Promise<ReminderItem[]> {
    await supabaseDataService.rescheduleReminder(id, newDueTime);
    return await this.getReminders();
  },

  /**
   * Get missed reminders that need attention
   */
  async getMissedReminders(): Promise<ReminderItem[]> {
    const reminders = await this.getReminders();
    return reminders.filter((r) => r.status === 'missed');
  },
};

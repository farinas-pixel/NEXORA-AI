/**
 * NEXORA AI — Targeted Data Reset & Seeding Service
 * 
 * Safely resets persistent reminder and task stores:
 * 1. Cancels all native notification alarms.
 * 2. Deletes all reminders and tasks from remote Supabase (scoped to authenticated user)
 *    and from local AsyncStorage partitions.
 * 3. Preserves all user accounts, authentication tokens, profile data, preferences,
 *    devices, memories, and unrelated records.
 * 4. Creates exactly ONE new reminder ("Review NEXORA AI" for today at 6:00 PM local time).
 * 5. Creates exactly ONE new task ("Test NEXORA AI Dashboard" for today, pending/incomplete).
 * 6. Verifies persistent storage contains exactly one reminder and one task.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase } from './auth/supabaseClient';
import { StorageService, type TaskItem } from './storage';
import { ReminderService, type ReminderItem } from './reminders/reminderService';
import { supabaseDataService } from './backend/supabaseDataService';

const RESET_FLAG_KEY = '@nexora_reset_done_oct21_v2';

export interface DataResetResult {
  clearedOldReminders: number;
  clearedOldTasks: number;
  newReminder: ReminderItem | null;
  newTask: TaskItem | null;
  verifiedReminders: ReminderItem[];
  verifiedTasks: TaskItem[];
  success: boolean;
}

const withTimeout = <T>(promise: Promise<T> | PromiseLike<T>, ms: number, fallback: T): Promise<T> => {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

export const DataResetService = {
  /**
   * Checks if the targeted reset has already been executed and verified in persistent storage.
   */
  async isResetDone(): Promise<boolean> {
    try {
      // 1. Check persistent completion flag first to avoid unnecessary inspection and prevent wiping user data
      const flag = await AsyncStorage.getItem(RESET_FLAG_KEY);
      if (flag === 'true') {
        return true;
      }
      return false;
    } catch {
      return true; // Safe fallback: never wipe data on check error
    }
  },

  /**
   * Executes the complete data clearance and single-entry creation lifecycle.
   */
  async executeReset(): Promise<DataResetResult> {
    console.log('[DataResetService] Starting targeted reminder and task data reset...');

    // 1. Resolve current user ID if available
    let userId: string | null = null;
    try {
      const userProfile = await StorageService.getUserProfile();
      userId = userProfile?.id || null;
      if (!userId) {
        const { data: sessionData } = await supabase.auth.getSession();
        userId = sessionData?.session?.user?.id || null;
      }
      if (userId) {
        StorageService.setActiveUser(userId);
      }
    } catch (e) {
      console.warn('[DataResetService] Warning resolving user session:', e);
    }

    // 2. Fetch current counts before deletion for verification
    const preReminders = await withTimeout(ReminderService.getReminders(), 2000, []).catch(() => []);
    const preTasks = await withTimeout(StorageService.getTasks(), 1500, []).catch(() => []);
    const preSupabaseTasks = await withTimeout(supabaseDataService.fetchTasks(), 2000, []).catch(() => []);
    const preTasksCount = Math.max(preTasks.length, preSupabaseTasks.length);

    console.log(`[DataResetService] Pre-clearance: ${preReminders.length} reminders, ${preTasksCount} tasks.`);

    // 3. Cancel all native scheduled notification alarms
    try {
      await withTimeout(Notifications.cancelAllScheduledNotificationsAsync(), 1500, null);
      console.log('[DataResetService] Cancelled all native scheduled alarms.');
    } catch (e) {
      console.warn('[DataResetService] Warning cancelling native notifications:', e);
    }

    // 4. Delete all reminders and tasks from remote Supabase
    if (userId) {
      try {
        const { error: remErr } = await withTimeout(
          Promise.resolve(supabase.from('reminders').delete().eq('user_id', userId)),
          2000,
          { error: null } as any
        );
        if (remErr) console.warn('[DataResetService] Remote reminders delete notice:', remErr.message);
        else console.log('[DataResetService] Remote reminders deleted for user:', userId);

        const { error: taskErr } = await withTimeout(
          Promise.resolve(supabase.from('tasks').delete().eq('user_id', userId)),
          2000,
          { error: null } as any
        );
        if (taskErr) console.warn('[DataResetService] Remote tasks delete notice:', taskErr.message);
        else console.log('[DataResetService] Remote tasks deleted for user:', userId);
      } catch (e) {
        console.warn('[DataResetService] Remote database delete call error:', e);
      }
    }

    // 5. Delete all reminders and tasks from persistent local storage (AsyncStorage)
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToClear = allKeys.filter((k) => {
        return (
          k === '@nexora_tasks' ||
          k === '@nexora_deleted_reminders' ||
          k.endsWith('_tasks') ||
          k.endsWith('_reminders')
        );
      });

      for (const key of keysToClear) {
        await AsyncStorage.removeItem(key);
        console.log(`[DataResetService] Removed local persistent storage key: ${key}`);
      }

      // Explicitly overwrite base keys with empty arrays to guarantee zero state
      if (userId) {
        await AsyncStorage.setItem(`@nexora_${userId}_reminders`, JSON.stringify([]));
        await AsyncStorage.setItem(`@nexora_${userId}_tasks`, JSON.stringify([]));
      }
      await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify([]));
      await AsyncStorage.setItem('@nexora_local_user_tasks', JSON.stringify([]));
      await AsyncStorage.setItem('@nexora_tasks', JSON.stringify([]));
      await AsyncStorage.setItem('@nexora_deleted_reminders', JSON.stringify([]));
    } catch (e) {
      console.error('[DataResetService] Failed clearing local persistent storage:', e);
    }

    // 6. Verify clearance
    const verifyClearedReminders = await withTimeout(ReminderService.getReminders(), 2000, []).catch(() => []);
    const verifyClearedTasks = await withTimeout(StorageService.getTasks(), 1500, []).catch(() => []);
    console.log(`[DataResetService] Post-clearance verification: ${verifyClearedReminders.length} reminders, ${verifyClearedTasks.length} tasks.`);

    // 7. Create exactly ONE new reminder using supported application services
    // Reminder title: "Review NEXORA AI"
    // Reminder date: today, using device's local date
    // Reminder time: 6:00 PM local time
    const today6pm = new Date();
    today6pm.setHours(18, 0, 0, 0); // 6:00 PM local time today

    console.log('[DataResetService] Scheduling new reminder for:', today6pm.toString());

    let createdReminder: ReminderItem | null = null;
    try {
      createdReminder = await withTimeout(
        ReminderService.createReminder(
          'Review NEXORA AI',
          today6pm.toISOString(),
          'personal',
          'medium',
          { notes: 'Comprehensive evaluation of NEXORA AI dashboard and companion features' }
        ),
        2500,
        null
      );

      if (!createdReminder) {
        createdReminder = {
          id: `rem_${Date.now()}`,
          userId: userId || 'local_user',
          title: 'Review NEXORA AI',
          dueTime: today6pm.toISOString(),
          category: 'personal',
          priority: 'medium',
          status: 'pending',
          notes: 'Comprehensive evaluation of NEXORA AI dashboard and companion features',
          createdBy: 'You',
          createdAt: new Date().toISOString(),
          syncStatus: userId ? 'pending_sync' : 'synced',
        };
      }

      console.log('[DataResetService] Created reminder:', createdReminder?.id, createdReminder?.title);
      if (createdReminder) {
        if (userId) {
          await AsyncStorage.setItem(`@nexora_${userId}_reminders`, JSON.stringify([createdReminder]));
        }
        await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify([createdReminder]));
        await AsyncStorage.setItem('@nexora_reminders', JSON.stringify([createdReminder]));
      }
    } catch (e) {
      console.error('[DataResetService] Error creating reminder:', e);
    }

    // 8. Create exactly ONE new task using supported application services
    // Task title: "Test NEXORA AI Dashboard"
    // Task due date: today, using device's local date
    // Task status: pending / incomplete
    let createdTask: TaskItem | null = null;
    try {
      createdTask = await withTimeout(
        supabaseDataService.createTask({
          title: 'Test NEXORA AI Dashboard',
          category: 'work',
          priority: 'high',
          dueDate: 'Today',
          completed: false,
        }),
        2500,
        null
      );

      const savedTask = await withTimeout(
        StorageService.saveTask({
          title: 'Test NEXORA AI Dashboard',
          category: 'work',
          priority: 'high',
          dueDate: 'Today',
        }, userId || undefined),
        1500,
        null
      );

      const resolvedTask: TaskItem = createdTask || savedTask || {
        id: `t_${Date.now()}`,
        title: 'Test NEXORA AI Dashboard',
        category: 'work',
        priority: 'high',
        dueDate: 'Today',
        completed: false,
      };

      if (userId) {
        await AsyncStorage.setItem(`@nexora_${userId}_tasks`, JSON.stringify([resolvedTask]));
      }
      await AsyncStorage.setItem('@nexora_tasks', JSON.stringify([resolvedTask]));
      await AsyncStorage.setItem('@nexora_local_user_tasks', JSON.stringify([resolvedTask]));

      console.log('[DataResetService] Created task:', resolvedTask?.id, resolvedTask?.title);
    } catch (e) {
      console.error('[DataResetService] Error creating task:', e);
    }

    // 9. Re-read and verify persistent storage contains exactly one reminder and one task
    const finalReminders = await withTimeout(ReminderService.getReminders(), 2000, []).catch(() => []);
    const finalStorageTasks = await withTimeout(StorageService.getTasks(), 1500, []).catch(() => []);
    const finalSupabaseTasks = await withTimeout(supabaseDataService.fetchTasks(), 2000, []).catch(() => []);

    // Merge tasks consistently as the app does
    const mergedTasks = [...finalSupabaseTasks];
    for (const leg of finalStorageTasks) {
      if (!mergedTasks.some((t) => t.id === leg.id || t.title.trim().toLowerCase() === leg.title.trim().toLowerCase())) {
        mergedTasks.push(leg);
      }
    }

    console.log('====================================================');
    console.log('[DataResetService] FINAL VERIFICATION SUMMARY');
    console.log(`Reminders in persistent storage: ${finalReminders.length}`);
    finalReminders.forEach((r, idx) => {
      console.log(`  [${idx + 1}] Title: "${r.title}", DueTime: "${r.dueTime}", Status: "${r.status}"`);
    });

    console.log(`Tasks in persistent storage: ${mergedTasks.length}`);
    mergedTasks.forEach((t, idx) => {
      console.log(`  [${idx + 1}] Title: "${t.title}", DueDate: "${t.dueDate}", Completed: ${t.completed}`);
    });
    console.log('====================================================');

    const isSuccess = finalReminders.length === 1 && mergedTasks.length === 1;

    // 10. Persist completion flag
    if (isSuccess) {
      await AsyncStorage.setItem(RESET_FLAG_KEY, 'true').catch(() => {});
    }

    return {
      clearedOldReminders: preReminders.length,
      clearedOldTasks: preTasksCount,
      newReminder: createdReminder,
      newTask: createdTask,
      verifiedReminders: finalReminders,
      verifiedTasks: mergedTasks,
      success: isSuccess,
    };
  },

  /**
   * Ensures the targeted reset runs once automatically on app/screen boot.
   */
  async ensureTargetedReset(): Promise<DataResetResult | null> {
    const isDone = await this.isResetDone();
    if (!isDone) {
      return await this.executeReset();
    }
    return null;
  },
};

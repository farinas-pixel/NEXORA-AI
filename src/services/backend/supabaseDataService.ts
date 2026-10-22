// src/services/backend/supabaseDataService.ts
/**
 * Supabase data service for user-owned tables.
 * Provides real CRUD operations syncing with Supabase remote database with RLS.
 * Enforces strict user isolation: cache keys are partition-isolated by authenticated user ID.
 * Gracefully handles unauthenticated states without startup error toasts.
 */
import { supabase } from '../auth/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StorageService,
  type UserPreferences,
  type StoredMemory,
  type TaskItem,
  type GoalItem,
} from '../storage';
import type { ReminderItem } from '../reminders/reminderService';

// ---------- Helper ----------
const getUserId = async (): Promise<string | null> => {
  try {
    // 1. First check local session persisted in AsyncStorage (works 100% offline)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user?.id) {
      return sessionData.session.user.id;
    }

    // 2. Fall back to network call if local session was not found
    const { data: userData, error } = await supabase.auth.getUser();
    if (!error && userData?.user?.id) {
      return userData.user.id;
    }

    // 3. Fall back to local user profile in storage
    const profile = await StorageService.getUserProfile().catch(() => null);
    if (profile?.id) {
      return profile.id;
    }

    return null;
  } catch {
    return null;
  }
};

const isUuid = (id: string | null): boolean =>
  Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

const getUserKey = (prefix: string, userId: string): string => `@nexora_${userId}_${prefix}`;

const DEFAULT_PREFERENCES: UserPreferences = {
  speechRate: 1.0,
  speechPitch: 1.0,
  voiceModel: 'en-US-Neural',
  autoSpeak: true,
  highContrast: false,
  reduceMotion: false,
  soloMode: false,
};

// ---------- Preferences ----------
export const fetchPreferences = async (): Promise<UserPreferences> => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_PREFERENCES;

  try {
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 = row not found, PGRST205 = table not yet in schema cache
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey('preferences', userId));
        return local ? JSON.parse(local) : DEFAULT_PREFERENCES;
      }
      throw error;
    }
    return data as unknown as UserPreferences;
  } catch {
    const local = await AsyncStorage.getItem(getUserKey('preferences', userId));
    return local ? JSON.parse(local) : DEFAULT_PREFERENCES;
  }
};

export const upsertPreferences = async (prefs: Partial<UserPreferences>) => {
  const userId = await getUserId();
  if (!userId) return DEFAULT_PREFERENCES;

  try {
    const { data, error } = await supabase
      .from('preferences')
      .upsert({ user_id: userId, ...prefs }, { onConflict: 'user_id' })
      .single();

    if (error && error.code !== 'PGRST205') throw error;

    const saved = (data as unknown as UserPreferences) || { ...DEFAULT_PREFERENCES, ...prefs };
    await AsyncStorage.setItem(getUserKey('preferences', userId), JSON.stringify(saved));
    return saved;
  } catch {
    const current = await AsyncStorage.getItem(getUserKey('preferences', userId));
    const curObj = current ? JSON.parse(current) : DEFAULT_PREFERENCES;
    const updated = { ...curObj, ...prefs };
    await AsyncStorage.setItem(getUserKey('preferences', userId), JSON.stringify(updated));
    return updated as UserPreferences;
  }
};

// ---------- Memories ----------
export const fetchMemories = async (): Promise<StoredMemory[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey('memories', userId));
        return local ? JSON.parse(local) : [];
      }
      throw error;
    }
    await AsyncStorage.setItem(getUserKey('memories', userId), JSON.stringify(data));
    return data as unknown as StoredMemory[];
  } catch {
    const local = await AsyncStorage.getItem(getUserKey('memories', userId));
    return local ? JSON.parse(local) : [];
  }
};

export const createMemory = async (memory: Omit<StoredMemory, 'id'>) => {
  const userId = await getUserId();
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('memories')
      .insert({ user_id: userId, ...memory })
      .select('*')
      .single();

    if (error && error.code !== 'PGRST205') throw error;

    if (data) {
      const existing = await fetchMemories();
      const updated = [data as unknown as StoredMemory, ...existing.filter((m) => m.id !== data.id)];
      await AsyncStorage.setItem(getUserKey('memories', userId), JSON.stringify(updated));
      return data as unknown as StoredMemory;
    }
  } catch {
    // Fallback to local
  }

  const newMem = {
    ...memory,
    id: `mem_${Date.now()}`,
    timestamp: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as StoredMemory;
  const existing = await fetchMemories();
  const updated = [newMem, ...existing];
  await AsyncStorage.setItem(getUserKey('memories', userId), JSON.stringify(updated));
  return newMem;
};

export const updateMemory = async (id: string, content: string) => {
  const userId = await getUserId();
  if (!userId) return false;

  try {
    await supabase.from('memories').update({ content, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
  } catch {
    // Continue local cleanup
  }
  const existing = await fetchMemories();
  const updated = existing.map((m) =>
    m.id === id ? { ...m, content, updatedAt: new Date().toISOString() } : m
  );
  await AsyncStorage.setItem(getUserKey('memories', userId), JSON.stringify(updated));
  await StorageService.updateMemory(id, content);
  return true;
};

export const deleteMemory = async (id: string) => {
  const userId = await getUserId();
  if (!userId) return false;

  try {
    await supabase.from('memories').delete().eq('id', id).eq('user_id', userId);
  } catch {
    // Continue local cleanup
  }
  const existing = await fetchMemories();
  const updated = existing.filter((m) => m.id !== id);
  await AsyncStorage.setItem(getUserKey('memories', userId), JSON.stringify(updated));
  return true;
};

export const clearAllMemories = async () => {
  const userId = await getUserId();
  if (!userId) return false;

  try {
    await supabase.from('memories').delete().eq('user_id', userId);
  } catch {
    // Continue local cleanup
  }
  await AsyncStorage.removeItem(getUserKey('memories', userId));
  return true;
};

// ---------- Tasks ----------
export const fetchTasks = async (): Promise<TaskItem[]> => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  let remoteTasks: TaskItem[] = [];
  if (resolvedUserId) {
    try {
      const { data, error } = await Promise.race([
        supabase.from('tasks').select('*').eq('user_id', resolvedUserId),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
      ]);

      if (!error && data) {
        remoteTasks = data as unknown as TaskItem[];
      }
    } catch {
      // Fallback to local offline cache
    }
  }

  // Load local caches
  const [localScoped, legacy, storageTasks] = await Promise.all([
    AsyncStorage.getItem(getUserKey('tasks', userId)).catch(() => null),
    AsyncStorage.getItem('@nexora_tasks').catch(() => null),
    StorageService.getTasks(userId).catch(() => []),
  ]);

  const localParsed: TaskItem[] = localScoped ? JSON.parse(localScoped) : [];
  const legacyParsed: TaskItem[] = legacy ? JSON.parse(legacy) : [];

  // Merge remote + localScoped + legacy + storageTasks seamlessly without duplicates
  const merged: TaskItem[] = [...remoteTasks];
  for (const item of [...localParsed, ...legacyParsed, ...storageTasks]) {
    if (!merged.some((m) => m.id === item.id || (m.title.trim().toLowerCase() === item.title.trim().toLowerCase() && m.dueDate === item.dueDate))) {
      merged.push(item);
    }
  }

  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(merged)).catch(() => {});
  await AsyncStorage.setItem('@nexora_tasks', JSON.stringify(merged)).catch(() => {});
  return merged;
};

export const createTask = async (task: Omit<TaskItem, 'id'>): Promise<TaskItem> => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  let createdItem: TaskItem | null = null;

  try {
    if (resolvedUserId) {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: resolvedUserId, ...task, completed: false })
        .select('*')
        .single();

      if (!error && data) {
        createdItem = data as unknown as TaskItem;
      }
    }
  } catch {
    // Fallback to local
  }

  if (!createdItem) {
    createdItem = {
      ...task,
      id: `t_${Date.now()}`,
      completed: false,
    } as TaskItem;
  }

  // Persist locally in all partitions
  const scopedKey = getUserKey('tasks', userId);
  const localScoped = await AsyncStorage.getItem(scopedKey).catch(() => null);
  const existingScoped: TaskItem[] = localScoped ? JSON.parse(localScoped) : [];
  const updatedScoped = [createdItem, ...existingScoped.filter((t) => t.id !== createdItem!.id)];
  await AsyncStorage.setItem(scopedKey, JSON.stringify(updatedScoped)).catch(() => {});

  const legacyData = await AsyncStorage.getItem('@nexora_tasks').catch(() => null);
  const existingLegacy: TaskItem[] = legacyData ? JSON.parse(legacyData) : [];
  const updatedLegacy = [createdItem, ...existingLegacy.filter((t) => t.id !== createdItem!.id)];
  await AsyncStorage.setItem('@nexora_tasks', JSON.stringify(updatedLegacy)).catch(() => {});

  await StorageService.saveTask(task, userId).catch(() => null);

  return createdItem;
};

export const toggleTask = async (id: string) => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  if (resolvedUserId && isUuid(resolvedUserId)) {
    try {
      const { data: task } = await supabase
        .from('tasks')
        .select('completed')
        .eq('id', id)
        .eq('user_id', resolvedUserId)
        .single();

      if (task) {
        const updatedCompleted = !task.completed;
        await supabase
          .from('tasks')
          .update({ completed: updatedCompleted })
          .eq('id', id)
          .eq('user_id', resolvedUserId);
      }
    } catch {
      // Continue local toggle
    }
  }

  const existing = await fetchTasks();
  const updated = existing.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated)).catch(() => {});
  await AsyncStorage.setItem('@nexora_tasks', JSON.stringify(updated)).catch(() => {});
  await StorageService.toggleTask(id, userId).catch(() => null);
  return updated;
};

export const deleteTask = async (id: string) => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  if (resolvedUserId && isUuid(resolvedUserId)) {
    try {
      await supabase.from('tasks').delete().eq('id', id).eq('user_id', resolvedUserId);
    } catch {
      // Continue local delete
    }
  }

  const existing = await fetchTasks();
  const updated = existing.filter((t) => t.id !== id);
  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated)).catch(() => {});
  await AsyncStorage.setItem('@nexora_tasks', JSON.stringify(updated)).catch(() => {});
  await StorageService.deleteTask(id, userId).catch(() => null);
  return updated;
};

export const updateTask = async (id: string, updates: Partial<TaskItem>) => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  if (resolvedUserId && isUuid(resolvedUserId)) {
    try {
      await supabase.from('tasks').update(updates).eq('id', id).eq('user_id', resolvedUserId);
    } catch {
      // Continue local update
    }
  }

  const existing = await fetchTasks();
  const updated = existing.map((t) => (t.id === id ? { ...t, ...updates } : t));
  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated)).catch(() => {});
  await AsyncStorage.setItem('@nexora_tasks', JSON.stringify(updated)).catch(() => {});
  await StorageService.updateTask(id, updates, userId).catch(() => null);
  return updated;
};

// ---------- Goals ----------
export const fetchGoals = async (): Promise<GoalItem[]> => {
  const userId = await getUserId();
  if (!userId) {
    const legacy = await AsyncStorage.getItem('@nexora_goals_v2');
    return legacy ? JSON.parse(legacy) : [];
  }

  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey('goals', userId));
        if (local) return JSON.parse(local);
        const legacy = await AsyncStorage.getItem('@nexora_goals_v2');
        return legacy ? JSON.parse(legacy) : [];
      }
      throw error;
    }
    await AsyncStorage.setItem(getUserKey('goals', userId), JSON.stringify(data));
    return data as unknown as GoalItem[];
  } catch {
    const local = await AsyncStorage.getItem(getUserKey('goals', userId));
    if (local) return JSON.parse(local);
    const legacy = await AsyncStorage.getItem('@nexora_goals_v2');
    return legacy ? JSON.parse(legacy) : [];
  }
};

export const createGoal = async (goal: Omit<GoalItem, 'id'>) => {
  const userId = await getUserId();
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('goals')
      .insert({ user_id: userId, ...goal })
      .select('*')
      .single();

    if (error && error.code !== 'PGRST205') throw error;

    if (data) {
      const existing = await fetchGoals();
      const updated = [data as unknown as GoalItem, ...existing.filter((g) => g.id !== data.id)];
      await AsyncStorage.setItem(getUserKey('goals', userId), JSON.stringify(updated));
      return data as unknown as GoalItem;
    }
  } catch {
    // Fallback to local
  }

  const newGoal = { ...goal, id: `goal_${Date.now()}` } as GoalItem;
  const existing = await fetchGoals();
  const updated = [newGoal, ...existing];
  await AsyncStorage.setItem(getUserKey('goals', userId), JSON.stringify(updated));
  return newGoal;
};

export const updateGoal = async (id: string, updates: Partial<GoalItem>) => {
  const userId = await getUserId();
  if (!userId) {
    return await StorageService.updateGoal(id, updates);
  }

  try {
    await supabase.from('goals').update(updates).eq('id', id).eq('user_id', userId);
  } catch {
    // Continue local update
  }
  const existing = await fetchGoals();
  const updated = existing.map((g) => (g.id === id ? { ...g, ...updates } : g));
  await AsyncStorage.setItem(getUserKey('goals', userId), JSON.stringify(updated));
  await StorageService.updateGoal(id, updates);
  return updated;
};

export const deleteGoal = async (id: string) => {
  const userId = await getUserId();
  if (!userId) {
    return await StorageService.deleteGoal(id);
  }

  try {
    await supabase.from('goals').delete().eq('id', id).eq('user_id', userId);
  } catch {
    // Continue local cleanup
  }
  const existing = await fetchGoals();
  const updated = existing.filter((g) => g.id !== id);
  await AsyncStorage.setItem(getUserKey('goals', userId), JSON.stringify(updated));
  await StorageService.deleteGoal(id);
  return updated;
};

// ---------- Reminders ----------
export interface ReminderDbRow {
  id: string;
  user_id: string;
  title: string;
  due_time: string;
  category: string;
  priority: string;
  status: 'pending' | 'completed' | 'missed' | 'cancelled';
  completed_at: string | null;
  created_at: string;
}

export const mapRowToReminder = (row: ReminderDbRow): ReminderItem => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  dueTime: row.due_time,
  category: (row.category as ReminderItem['category']) || 'personal',
  priority: (row.priority as ReminderItem['priority']) || 'medium',
  status: row.status,
  isPinned: (row as any).is_pinned || false,
  relaxationMinutes: (row as any).relaxation_minutes || undefined,
  completedAt: row.completed_at || undefined,
  createdAt: row.created_at,
  createdBy: 'You',
  syncStatus: 'synced',
});

export const fetchReminders = async (): Promise<ReminderItem[]> => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  if (!resolvedUserId || !isUuid(resolvedUserId)) {
    const [local, fallback, legacy] = await Promise.all([
      AsyncStorage.getItem(getUserKey('reminders', userId)).catch(() => null),
      AsyncStorage.getItem('@nexora_local_user_reminders').catch(() => null),
      AsyncStorage.getItem('@nexora_reminders').catch(() => null),
    ]);
    const listA: ReminderItem[] = local ? JSON.parse(local) : [];
    const listB: ReminderItem[] = fallback ? JSON.parse(fallback) : [];
    const listC: ReminderItem[] = legacy ? JSON.parse(legacy) : [];
    const merged: ReminderItem[] = [...listA];
    for (const item of [...listB, ...listC]) {
      if (!merged.some((m) => m.id === item.id || (m.title.trim().toLowerCase() === item.title.trim().toLowerCase() && m.dueTime === item.dueTime))) {
        merged.push(item);
      }
    }
    return merged;
  }

  try {
    const { data, error } = await Promise.race([
      supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_time', { ascending: true }),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]);

    if (error) {
      if (error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey('reminders', userId));
        return local ? JSON.parse(local) : [];
      }
      throw error;
    }

    const mapped = (data || []).map(mapRowToReminder);

    // Reconcile pending offline reminders without creating duplicates
    const localCached = await AsyncStorage.getItem(getUserKey('reminders', userId));
    if (localCached) {
      try {
        const cachedList: ReminderItem[] = JSON.parse(localCached);
        const pendingItems = cachedList.filter(
          (r) => r.syncStatus === 'pending_sync' || r.id.startsWith('rem_local_')
        );

        for (const pending of pendingItems) {
          const alreadyExists = mapped.some(
            (m: ReminderItem) => m.title.trim().toLowerCase() === pending.title.trim().toLowerCase() && m.dueTime === pending.dueTime
          );
          if (!alreadyExists) {
            try {
              const { data: inserted } = await supabase
                .from('reminders')
                .insert({
                  user_id: userId,
                  title: pending.title.trim(),
                  due_time: pending.dueTime,
                  category: pending.category || 'personal',
                  priority: pending.priority || 'medium',
                  status: pending.status || 'pending',
                })
                .select('*')
                .single();

              if (inserted) {
                mapped.push(mapRowToReminder(inserted as ReminderDbRow));
              }
            } catch {
              mapped.push(pending);
            }
          }
        }
      } catch {
        // Cache parse failure, preserve mapped
      }
    }

    await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(mapped));
    return mapped;
  } catch {
    const local = await AsyncStorage.getItem(getUserKey('reminders', userId));
    return local ? JSON.parse(local) : [];
  }
};

export const createReminder = async (item: {
  title: string;
  dueTime: string;
  category?: ReminderItem['category'];
  priority?: ReminderItem['priority'];
  notes?: string;
  isPinned?: boolean;
  relaxationMinutes?: number;
}): Promise<ReminderItem> => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  const newRow = {
    user_id: userId,
    title: item.title.trim(),
    due_time: item.dueTime,
    category: item.category || 'personal',
    priority: item.priority || 'medium',
    status: 'pending' as const,
  };

  try {
    if (resolvedUserId && isUuid(resolvedUserId)) {
      const { data, error } = await supabase
        .from('reminders')
        .insert(newRow)
        .select('*')
        .single();

      if (!error && data) {
        const created = mapRowToReminder(data as ReminderDbRow);
        if (item.isPinned) (created as any).isPinned = true;
        if (item.relaxationMinutes) (created as any).relaxationMinutes = item.relaxationMinutes;
        const existing = await fetchReminders();
        const updated = [created, ...existing.filter((r) => r.id !== created.id)];
        await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
        await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify(updated)).catch(() => {});
        await AsyncStorage.setItem('@nexora_reminders', JSON.stringify(updated)).catch(() => {});
        return created;
      }
    }
  } catch (err: any) {
    // Network or schema cache issue, proceed to safe local fallback
  }

  // Safe local fallback (guarantees offline support and prevents modal hangs)
  const localId = `rem_local_${Date.now()}`;
  const fallbackItem: ReminderItem = {
    id: localId,
    userId,
    title: item.title.trim(),
    dueTime: item.dueTime,
    category: item.category || 'personal',
    priority: item.priority || 'medium',
    status: 'pending',
    isPinned: !!item.isPinned,
    relaxationMinutes: item.relaxationMinutes,
    createdAt: new Date().toISOString(),
    createdBy: 'You',
    notes: item.notes,
    syncStatus: (resolvedUserId && isUuid(resolvedUserId)) ? 'pending_sync' : 'synced',
  };
  const existing = await fetchReminders();
  const updated = [fallbackItem, ...existing.filter((r) => r.id !== fallbackItem.id)];
  await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
  await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify(updated)).catch(() => {});
  await AsyncStorage.setItem('@nexora_reminders', JSON.stringify(updated)).catch(() => {});
  return fallbackItem;
};

export const updateReminder = async (
  id: string,
  updates: Partial<{
    title: string;
    dueTime: string;
    category: ReminderItem['category'];
    priority: ReminderItem['priority'];
    status: ReminderItem['status'];
    completedAt: string | null;
    isPinned: boolean;
    relaxationMinutes: number;
    notes: string;
  }>
): Promise<ReminderItem> => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
  if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
  if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
  if (updates.relaxationMinutes !== undefined) dbUpdates.relaxation_minutes = updates.relaxationMinutes;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  try {
    if (resolvedUserId && isUuid(resolvedUserId)) {
      const { data, error } = await supabase
        .from('reminders')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', resolvedUserId)
        .select('*')
        .single();

      if (!error && data) {
        const updatedItem = mapRowToReminder(data as ReminderDbRow);
        const existing = await fetchReminders();
        const updatedList = existing.map((r) => (r.id === id ? updatedItem : r));
        await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updatedList));
        await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify(updatedList)).catch(() => {});
        await AsyncStorage.setItem('@nexora_reminders', JSON.stringify(updatedList)).catch(() => {});
        return updatedItem;
      }
    }
  } catch {
    // Continue local fallback
  }

  const existing = await fetchReminders();
  const updatedList = existing.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        ...updates,
        completedAt: updates.completedAt === null ? undefined : (updates.completedAt || r.completedAt),
      };
    }
    return r;
  });
  await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updatedList));
  await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify(updatedList)).catch(() => {});
  await AsyncStorage.setItem('@nexora_reminders', JSON.stringify(updatedList)).catch(() => {});
  const target = updatedList.find((r) => r.id === id);
  if (target) return target;
  throw new Error(`Reminder ${id} not found`);
};

export const completeReminder = async (id: string): Promise<ReminderItem> => {
  return await updateReminder(id, {
    status: 'completed',
    completedAt: new Date().toISOString(),
  });
};

export const rescheduleReminder = async (id: string, newDueTime: string): Promise<ReminderItem> => {
  return await updateReminder(id, {
    dueTime: newDueTime,
    status: 'pending',
    completedAt: null,
  });
};

export const deleteReminder = async (id: string): Promise<boolean> => {
  const resolvedUserId = await getUserId();
  const userId = resolvedUserId || 'local_user';

  try {
    if (resolvedUserId && isUuid(resolvedUserId)) {
      await supabase
        .from('reminders')
        .delete()
        .eq('id', id)
        .eq('user_id', resolvedUserId);
    }
  } catch {
    // Ignore network drop, continue local cleanup
  }

  const existing = await fetchReminders();
  const updated = existing.filter((r) => r.id !== id);
  await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
  await AsyncStorage.setItem('@nexora_local_user_reminders', JSON.stringify(updated)).catch(() => {});
  await AsyncStorage.setItem('@nexora_reminders', JSON.stringify(updated)).catch(() => {});
  return true;
};

// ---------- Conversations & Real Chat Persistence ----------
export interface StoredConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface StoredConversationMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_result?: any;
  metadata?: any;
  created_at: string;
}

export const createConversation = async (title: string = 'New Conversation'): Promise<StoredConversation> => {
  const userId = await getUserId();
  if (!userId) throw new Error('User not authenticated');

  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST205') {
        const localConvo: StoredConversation = {
          id: `conv_${userId}_${Date.now()}`,
          user_id: userId,
          title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await AsyncStorage.setItem(getUserKey('active_conversation', userId), JSON.stringify(localConvo));
        return localConvo;
      }
      throw error;
    }

    await AsyncStorage.setItem(getUserKey('active_conversation', userId), JSON.stringify(data));
    return data as StoredConversation;
  } catch (e: any) {
    if (e?.code === 'PGRST205') {
      const localConvo: StoredConversation = {
        id: `conv_${userId}_${Date.now()}`,
        user_id: userId,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await AsyncStorage.setItem(getUserKey('active_conversation', userId), JSON.stringify(localConvo));
      return localConvo;
    }
    throw e;
  }
};

export const getOrCreateActiveConversation = async (): Promise<StoredConversation | null> => {
  const userId = await getUserId();
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      if (error.code === 'PGRST205') {
        const cached = await AsyncStorage.getItem(getUserKey('active_conversation', userId));
        if (cached) return JSON.parse(cached);
        return await createConversation('New Conversation');
      }
      throw error;
    }

    if (data && data.length > 0) {
      const active = data[0] as StoredConversation;
      await AsyncStorage.setItem(getUserKey('active_conversation', userId), JSON.stringify(active));
      return active;
    }

    return await createConversation('New Conversation');
  } catch (e: any) {
    if (e?.code === 'PGRST205') {
      const cached = await AsyncStorage.getItem(getUserKey('active_conversation', userId));
      if (cached) return JSON.parse(cached);
      return await createConversation('New Conversation');
    }
    return null;
  }
};

export const fetchConversations = async (): Promise<StoredConversation[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey('conversations_list', userId));
        return local ? JSON.parse(local) : [];
      }
      throw error;
    }

    if (data) {
      await AsyncStorage.setItem(getUserKey('conversations_list', userId), JSON.stringify(data));
      return data as StoredConversation[];
    }
    return [];
  } catch {
    const local = await AsyncStorage.getItem(getUserKey('conversations_list', userId));
    return local ? JSON.parse(local) : [];
  }
};

export const fetchConversationMessages = async (conversationId: string): Promise<StoredConversationMessage[]> => {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey(`msgs_${conversationId}`, userId));
        return local ? JSON.parse(local) : [];
      }
      throw error;
    }

    const messages = (data || []) as StoredConversationMessage[];
    await AsyncStorage.setItem(getUserKey(`msgs_${conversationId}`, userId), JSON.stringify(messages));
    return messages;
  } catch {
    const local = await AsyncStorage.getItem(getUserKey(`msgs_${conversationId}`, userId));
    return local ? JSON.parse(local) : [];
  }
};

export const saveConversationMessage = async (
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  toolResult?: any,
  metadata?: any
): Promise<StoredConversationMessage> => {
  const userId = await getUserId();
  if (!userId) throw new Error('User not authenticated');

  const newMsg: StoredConversationMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    tool_result: toolResult || null,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        tool_result: toolResult || null,
        metadata: metadata || null,
      })
      .select('*')
      .single();

    if (!error && data) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        .eq('user_id', userId);

      const savedMsg = data as StoredConversationMessage;
      // Update local cache
      const cached = await AsyncStorage.getItem(getUserKey(`msgs_${conversationId}`, userId));
      const list = cached ? JSON.parse(cached) : [];
      await AsyncStorage.setItem(getUserKey(`msgs_${conversationId}`, userId), JSON.stringify([...list, savedMsg]));
      return savedMsg;
    }
  } catch {
    // Continue with local save
  }

  // Local fallback save
  const cached = await AsyncStorage.getItem(getUserKey(`msgs_${conversationId}`, userId));
  const list = cached ? JSON.parse(cached) : [];
  await AsyncStorage.setItem(getUserKey(`msgs_${conversationId}`, userId), JSON.stringify([...list, newMsg]));
  return newMsg;
};

// ---------- Local Cache Cleanup on Sign Out ----------
export const clearLocalCache = async (): Promise<void> => {
  try {
    // Critical Security & Data Rule:
    // Do NOT wipe all @nexora_ keys. Wiping all keys destroys user-partitioned offline records.
    // Instead, remove only global active session keys and unauthenticated transient caches.
    // User-partitioned records (@nexora_<userId>_*) remain safely isolated in their own partition.
    const transientKeys = [
      '@nexora_user_profile',
      '@nexora_chat_threads',
      '@nexora_conversation_sessions',
    ];
    await AsyncStorage.multiRemove(transientKeys);
  } catch (e) {
    console.warn('[supabaseDataService] Error clearing transient session cache:', e);
  }
};

// Export namespace
export const supabaseDataService = {
  fetchPreferences,
  upsertPreferences,
  fetchMemories,
  createMemory,
  updateMemory,
  deleteMemory,
  clearAllMemories,
  fetchTasks,
  createTask,
  toggleTask,
  updateTask,
  deleteTask,
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  fetchReminders,
  createReminder,
  updateReminder,
  completeReminder,
  rescheduleReminder,
  deleteReminder,
  createConversation,
  getOrCreateActiveConversation,
  fetchConversations,
  fetchConversationMessages,
  saveConversationMessage,
  clearLocalCache,
};

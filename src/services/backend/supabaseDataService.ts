// src/services/backend/supabaseDataService.ts
/**
 * Supabase data service for user-owned tables.
 * Provides real CRUD operations syncing with Supabase remote database with RLS.
 * Enforces strict user isolation: cache keys are partition-isolated by authenticated user ID.
 * Gracefully handles unauthenticated states without startup error toasts.
 */
import { supabase } from '../auth/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  UserPreferences,
  StoredMemory,
  TaskItem,
  GoalItem,
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

    return null;
  } catch {
    return null;
  }
};

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
  const userId = await getUserId();
  if (!userId) {
    const legacy = await AsyncStorage.getItem('@nexora_tasks');
    return legacy ? JSON.parse(legacy) : [];
  }

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      if (error.code === 'PGRST205') {
        const local = await AsyncStorage.getItem(getUserKey('tasks', userId));
        if (local) return JSON.parse(local);
        const legacy = await AsyncStorage.getItem('@nexora_tasks');
        return legacy ? JSON.parse(legacy) : [];
      }
      throw error;
    }
    await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(data));
    return data as unknown as TaskItem[];
  } catch {
    const local = await AsyncStorage.getItem(getUserKey('tasks', userId));
    if (local) return JSON.parse(local);
    const legacy = await AsyncStorage.getItem('@nexora_tasks');
    return legacy ? JSON.parse(legacy) : [];
  }
};

export const createTask = async (task: Omit<TaskItem, 'id'>) => {
  const userId = await getUserId();
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ user_id: userId, ...task, completed: false })
      .select('*')
      .single();

    if (error && error.code !== 'PGRST205') throw error;

    if (data) {
      const existing = await fetchTasks();
      const updated = [data as unknown as TaskItem, ...existing.filter((t) => t.id !== data.id)];
      await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated));
      return data as unknown as TaskItem;
    }
  } catch {
    // Fallback to local
  }

  const newTask = {
    ...task,
    id: `t_${Date.now()}`,
    completed: false,
  } as TaskItem;
  const existing = await fetchTasks();
  const updated = [newTask, ...existing];
  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated));
  return newTask;
};

export const toggleTask = async (id: string) => {
  const userId = await getUserId();
  if (!userId) return await fetchTasks();

  try {
    const { data: task } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (task) {
      const updatedCompleted = !task.completed;
      await supabase
        .from('tasks')
        .update({ completed: updatedCompleted })
        .eq('id', id)
        .eq('user_id', userId);
    }
  } catch {
    // Continue local toggle
  }

  const existing = await fetchTasks();
  const updated = existing.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated));
  return updated;
};

export const deleteTask = async (id: string) => {
  const userId = await getUserId();
  if (!userId) return await fetchTasks();

  try {
    await supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
  } catch {
    // Continue local delete
  }
  const existing = await fetchTasks();
  const updated = existing.filter((t) => t.id !== id);
  await AsyncStorage.setItem(getUserKey('tasks', userId), JSON.stringify(updated));
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
  completedAt: row.completed_at || undefined,
  createdAt: row.created_at,
  createdBy: 'You',
  syncStatus: 'synced',
});

export const fetchReminders = async (): Promise<ReminderItem[]> => {
  const userId = await getUserId();
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('due_time', { ascending: true });

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
            (m) => m.title.trim().toLowerCase() === pending.title.trim().toLowerCase() && m.dueTime === pending.dueTime
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
}): Promise<ReminderItem> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to create a reminder');
  }

  const newRow = {
    user_id: userId,
    title: item.title.trim(),
    due_time: item.dueTime,
    category: item.category || 'personal',
    priority: item.priority || 'medium',
    status: 'pending' as const,
  };

  try {
    const { data, error } = await supabase
      .from('reminders')
      .insert(newRow)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const created = mapRowToReminder(data as ReminderDbRow);
    const existing = await fetchReminders();
    const updated = [created, ...existing.filter((r) => r.id !== created.id)];
    await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
    return created;
  } catch (err: any) {
    if (err?.message?.includes('Network request failed') || err?.code === 'PGRST205') {
      const localId = `rem_local_${Date.now()}`;
      const fallbackItem: ReminderItem = {
        id: localId,
        userId,
        title: item.title.trim(),
        dueTime: item.dueTime,
        category: item.category || 'personal',
        priority: item.priority || 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: 'You',
        notes: item.notes,
        syncStatus: 'pending_sync',
      };
      const existing = await fetchReminders();
      const updated = [fallbackItem, ...existing];
      await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
      return fallbackItem;
    }
    throw new Error(`Failed to save reminder to database: ${err?.message || 'Unknown error'}`);
  }
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
  }>
): Promise<ReminderItem> => {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to update a reminder');
  }

  const dbUpdates: Record<string, any> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title.trim();
  if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;

  try {
    const { data, error } = await supabase
      .from('reminders')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    const updatedItem = mapRowToReminder(data as ReminderDbRow);
    const existing = await fetchReminders();
    const updatedList = existing.map((r) => (r.id === id ? updatedItem : r));
    await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updatedList));
    return updatedItem;
  } catch (err: any) {
    if (err?.message?.includes('Network request failed') || err?.code === 'PGRST205') {
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
      const target = updatedList.find((r) => r.id === id);
      if (target) return target;
    }
    throw new Error(`Failed to update reminder: ${err?.message || 'Unknown error'}`);
  }
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
  const userId = await getUserId();
  if (!userId) {
    throw new Error('User must be authenticated to delete a reminder');
  }

  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    const existing = await fetchReminders();
    const updated = existing.filter((r) => r.id !== id);
    await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
    return true;
  } catch (err: any) {
    if (err?.message?.includes('Network request failed') || err?.code === 'PGRST205') {
      const existing = await fetchReminders();
      const updated = existing.filter((r) => r.id !== id);
      await AsyncStorage.setItem(getUserKey('reminders', userId), JSON.stringify(updated));
      return true;
    }
    throw new Error(`Failed to delete reminder: ${err?.message || 'Unknown error'}`);
  }
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

// ---------- Local Cache Purge on Sign Out ----------
export const clearLocalCache = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const preservedKeys = new Set([
      '@nexora_app_language',
      '@nexora_onboarding_completed',
      '@nexora_ai_language',
    ]);
    const nexoraKeys = allKeys.filter(
      (k) => k.startsWith('@nexora_') && !preservedKeys.has(k)
    );
    if (nexoraKeys.length > 0) {
      await AsyncStorage.multiRemove(nexoraKeys);
    }
  } catch (e) {
    console.warn('[supabaseDataService] Error clearing local cache:', e);
  }
};

// Export namespace
export const supabaseDataService = {
  fetchPreferences,
  upsertPreferences,
  fetchMemories,
  createMemory,
  deleteMemory,
  clearAllMemories,
  fetchTasks,
  createTask,
  toggleTask,
  deleteTask,
  fetchGoals,
  createGoal,
  fetchReminders,
  createReminder,
  updateReminder,
  completeReminder,
  rescheduleReminder,
  deleteReminder,
  createConversation,
  getOrCreateActiveConversation,
  fetchConversationMessages,
  saveConversationMessage,
  clearLocalCache,
};

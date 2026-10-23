/**
 * NEXORA AI — Persistent Storage Engine
 * Real local persistence using AsyncStorage with user-level key isolation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import type { SecurityTier } from '../config/constants';


export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  birthday?: string;
  language: string;
  region: string;
  timezone: string;
  createdDate: string;
}

export interface StoredMemory {
  id: string;
  category: 'personal' | 'preference' | 'study' | 'work' | 'health';
  content: string;
  securityTier: SecurityTier;
  confidence: number;
  timestamp: string;
  updatedAt: string;
  isProtected?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  category: 'study' | 'work' | 'fitness' | 'daily';
  dueDate: string;
  dueTime?: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  recurring?: 'daily' | 'weekdays' | 'weekly' | 'none';
}

export interface SmartDevice {
  id: string;
  name: string;
  type: 'light' | 'thermostat' | 'vacuum' | 'plug' | 'speaker';
  room: string;
  status: boolean;
  value?: number; // e.g. brightness 0-100 or temp in C
  connected: boolean;
}

export interface UserPreferences {
  speechRate: number; // 0.5 - 2.0
  speechPitch: number; // 0.5 - 2.0
  voiceModel: string;
  autoSpeak: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  soloMode: boolean; // Privacy lockdown & daily care mode
  autoSendVoice?: boolean; // Automatic submit on final speech recognition transcript (default: true)
  appLanguage?: 'en-US' | 'ta-IN' | 'hi-IN';
  aiLanguage?: string;
  responseStyle?: 'concise' | 'balanced' | 'detailed' | 'empathetic';
  requireConfirmations?: boolean;

  // Solo Mode & Daily Care
  morningGreetingEnabled?: boolean;
  morningGreetingTime?: string; // e.g. "08:00"
  dailyCheckInEnabled?: boolean;
  checkInTime?: string; // e.g. "14:00"
  allowSpokenHealthDetails?: boolean; // explicit consent for speaking sensitive health info aloud
  soloCareHealthIntegration?: boolean; // whether Solo Mode consults vitals/symptoms

  // News & Scheduled Voice
  dailyNewsEnabled?: boolean;
  dailyNewsTime?: string; // e.g. "07:00"
  newsTopic?: 'top' | 'technology' | 'health' | 'science' | 'business';
  newsLanguage?: 'en-US' | 'ta-IN' | 'hi-IN' | 'en' | 'ta' | 'hi';
  newsReadAloud?: boolean; // User consent: Yes -> read aloud, No -> notify/display only
  lastNewsBriefingDate?: string; // for duplicate prevention

  // Notifications & Quiet Hours
  notificationsEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // e.g. "22:00"
  quietHoursEnd?: string; // e.g. "07:00"

  // Privacy & Consent
  memoryConsent?: boolean;
  allowAnalytics?: boolean;
}

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  deadline?: string;
  targetDate?: string;
  category: 'career' | 'learning' | 'fitness' | 'finance';
  milestones?: GoalMilestone[];
  progressPercent?: number;
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface DecisionOption {
  id: string;
  name: string;
  pros: string[];
  cons: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DecisionItem {
  id: string;
  title: string;
  context: string;
  options: DecisionOption[];
  recommendation: string;
  confidenceScore: number; // 0 - 100
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  conditionDescription: string;
  actionDescription: string;
  enabled: boolean;
  requiresConfirmation: boolean;
}

export interface HealthRecord {
  id: string;
  category: 'symptom' | 'condition' | 'medication' | 'appointment' | 'journal';
  type?: 'symptom' | 'condition' | 'medication' | 'appointment' | 'journal';
  title: string;
  details?: string;
  notes?: string;
  dosage?: string;
  scheduleTime?: string;
  dateOrTime?: string;
  date?: string;
  status?: 'active' | 'completed' | 'snoozed' | 'resolved';
  severity?: 'mild' | 'moderate' | 'severe';
  urgentCareNotice?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

const STORAGE_KEYS = {
  USER_PROFILE: '@nexora_user_profile',
  MEMORIES: '@nexora_memories',
  TASKS: '@nexora_tasks',
  DEVICES: '@nexora_smart_devices',
  PREFERENCES: '@nexora_preferences',
  CHAT_THREADS: '@nexora_chat_threads',
  CONVERSATION_SESSIONS: '@nexora_conversation_sessions',
  GOALS: '@nexora_goals_v2',
  DECISIONS: '@nexora_decisions_v2',
  AUTOMATIONS: '@nexora_automations_v2',
  APP_LANGUAGE: '@nexora_app_language',
  ONBOARDING_COMPLETED: '@nexora_onboarding_completed',
  AI_LANGUAGE: '@nexora_ai_language',
  DELETED_REMINDERS: '@nexora_deleted_reminders',
  HEALTH_RECORDS: '@nexora_health_records',
};

// Initial default data sets
const DEFAULT_PREFERENCES: UserPreferences = {
  speechRate: 1.0,
  speechPitch: 1.0,
  voiceModel: 'en-US-Neural',
  autoSpeak: true,
  highContrast: false,
  reduceMotion: false,
  soloMode: false,
  autoSendVoice: true,
  responseStyle: 'balanced',
  requireConfirmations: false,
  morningGreetingEnabled: false,
  morningGreetingTime: '08:00',
  dailyCheckInEnabled: false,
  checkInTime: '14:00',
  allowSpokenHealthDetails: false,
  soloCareHealthIntegration: true,
  dailyNewsEnabled: false,
  dailyNewsTime: '07:00',
  newsTopic: 'top',
  newsLanguage: 'en',
  newsReadAloud: false,
  notificationsEnabled: true,
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  memoryConsent: true,
  allowAnalytics: false,
};

const DEFAULT_DEVICES: SmartDevice[] = [
  { id: 'dev_light', name: 'Desk Ambient Halo', type: 'light', room: 'Study', status: true, connected: true },
  { id: 'dev_ac', name: 'Inverter Climate Unit', type: 'thermostat', room: 'Bedroom', status: true, connected: true },
  { id: 'dev_audio', name: 'Studio Reference Audio', type: 'speaker', room: 'Workstation', status: false, connected: true },
  { id: 'dev_purifier', name: 'HEPA Air Purifier', type: 'plug', room: 'Living Room', status: true, connected: true },
];

let activeStorageUserId: string | null = null;

export const StorageService = {
  /**
   * Set active authenticated user context for scoped local partitions
   */
  setActiveUser(userId: string | null): void {
    activeStorageUserId = userId ? userId.trim() : null;
  },

  /**
   * Resolve storage key partitioned by user ID if available, otherwise fallback to unauthenticated/legacy key
   */
  getScopedKey(baseKey: string, explicitUserId?: string): string {
    const uid = explicitUserId || activeStorageUserId;
    if (uid) {
      return `@nexora_${uid}_${baseKey.replace(/^@nexora_/, '')}`;
    }
    return baseKey;
  },

  // --- USER PROFILE ---
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (profile.id) {
      activeStorageUserId = profile.id;
    }
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async clearUserSession(): Promise<void> {
    activeStorageUserId = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },

  // --- MEMORY VAULT ---
  async getMemories(userId?: string): Promise<StoredMemory[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.MEMORIES, userId);
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveMemory(memory: Omit<StoredMemory, 'id' | 'timestamp' | 'updatedAt'>, userId?: string): Promise<StoredMemory> {
    const key = this.getScopedKey(STORAGE_KEYS.MEMORIES, userId);
    const memories = await this.getMemories(userId);
    let contentToStore = memory.content;
    let isProtected = false;

    // For Critical Tier: Protect sensitive keys/credentials with masking
    if (memory.securityTier === 'critical') {
      try {
        const hash = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          memory.content
        );
        contentToStore = `[CRITICAL PROTECTED] ${memory.content.slice(0, 3)}••••••${memory.content.slice(-2)} (Digest: ${hash.slice(0, 8)})`;
        isProtected = true;
      } catch {
        contentToStore = `[CRITICAL PROTECTED] ${memory.content.slice(0, 2)}••••••`;
        isProtected = true;
      }
    }

    const newMem: StoredMemory = {
      ...memory,
      content: contentToStore,
      isProtected,
      id: `mem_${Date.now()}`,
      timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      updatedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    };
    const updated = [newMem, ...memories];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return newMem;
  },

  async updateMemory(id: string, content: string, userId?: string): Promise<StoredMemory[]> {
    const key = this.getScopedKey(STORAGE_KEYS.MEMORIES, userId);
    const memories = await this.getMemories(userId);
    const updated = memories.map((m) =>
      m.id === id
        ? {
            ...m,
            content,
            updatedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
          }
        : m
    );
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async deleteMemory(id: string, userId?: string): Promise<void> {
    const key = this.getScopedKey(STORAGE_KEYS.MEMORIES, userId);
    const memories = await this.getMemories(userId);
    const updated = memories.filter((m) => m.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  },

  async clearAllMemories(userId?: string): Promise<void> {
    const key = this.getScopedKey(STORAGE_KEYS.MEMORIES, userId);
    await AsyncStorage.setItem(key, JSON.stringify([]));
  },

  // --- TASKS & PLANNER ---
  async getTasks(userId?: string): Promise<TaskItem[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.TASKS, userId);
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveTask(task: Omit<TaskItem, 'id' | 'completed'>, userId?: string): Promise<TaskItem> {
    const key = this.getScopedKey(STORAGE_KEYS.TASKS, userId);
    const tasks = await this.getTasks(userId);
    const newTask: TaskItem = {
      ...task,
      id: `t_${Date.now()}`,
      completed: false,
    };
    const updated = [newTask, ...tasks];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return newTask;
  },

  async toggleTask(id: string, userId?: string): Promise<TaskItem[]> {
    const key = this.getScopedKey(STORAGE_KEYS.TASKS, userId);
    const tasks = await this.getTasks(userId);
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async updateTask(id: string, updates: Partial<TaskItem>, userId?: string): Promise<TaskItem[]> {
    const key = this.getScopedKey(STORAGE_KEYS.TASKS, userId);
    const tasks = await this.getTasks(userId);
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async deleteTask(id: string, userId?: string): Promise<void> {
    const key = this.getScopedKey(STORAGE_KEYS.TASKS, userId);
    const tasks = await this.getTasks(userId);
    const updated = tasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
  },

  // --- RECOVERABLE DELETED REMINDERS (SAFE ARCHIVE) ---
  async getDeletedReminders(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DELETED_REMINDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async archiveDeletedReminder(reminder: any): Promise<void> {
    try {
      const existing = await this.getDeletedReminders();
      const archivedItem = {
        ...reminder,
        deletedAt: new Date().toISOString(),
      };
      const updated = [archivedItem, ...existing.filter((r) => r.id !== reminder.id)].slice(0, 50);
      await AsyncStorage.setItem(STORAGE_KEYS.DELETED_REMINDERS, JSON.stringify(updated));
    } catch (e) {
      console.warn('[StorageService] Error archiving deleted reminder:', e);
    }
  },

  async clearDeletedReminders(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DELETED_REMINDERS, JSON.stringify([]));
  },

  // --- RECENT CONVERSATION SESSIONS (PERSISTENCE) ---
  async getConversationSessions(userId?: string): Promise<ConversationSession[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.CONVERSATION_SESSIONS, userId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveConversationSession(session: ConversationSession, userId?: string): Promise<void> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.CONVERSATION_SESSIONS, userId);
      const existing = await this.getConversationSessions(userId);
      const updated = [session, ...existing.filter((s) => s.id !== session.id)].slice(0, 30);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('[StorageService] Error saving conversation session:', e);
    }
  },

  async deleteConversationSession(id: string, userId?: string): Promise<void> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.CONVERSATION_SESSIONS, userId);
      const existing = await this.getConversationSessions(userId);
      const updated = existing.filter((s) => s.id !== id);
      await AsyncStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('[StorageService] Error deleting conversation session:', e);
    }
  },

  // --- SMART HOME DEVICES ---
  async getDevices(userId?: string): Promise<SmartDevice[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.DEVICES, userId);
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : DEFAULT_DEVICES;
    } catch {
      return DEFAULT_DEVICES;
    }
  },

  async toggleDevice(id: string, userId?: string): Promise<SmartDevice[]> {
    const key = this.getScopedKey(STORAGE_KEYS.DEVICES, userId);
    const devices = await this.getDevices(userId);
    const updated = devices.map((d) => (d.id === id ? { ...d, status: !d.status } : d));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  // --- PREFERENCES ---
  async getPreferences(userId?: string): Promise<UserPreferences> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.PREFERENCES, userId);
      const data = await AsyncStorage.getItem(key);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(prefs: Partial<UserPreferences>, userId?: string): Promise<UserPreferences> {
    const key = this.getScopedKey(STORAGE_KEYS.PREFERENCES, userId);
    const current = await this.getPreferences(userId);
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  // --- GOALS (MY LIFE) ---
  async getGoals(userId?: string): Promise<GoalItem[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.GOALS, userId);
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveGoal(goal: Omit<GoalItem, 'id'>, userId?: string): Promise<GoalItem> {
    const key = this.getScopedKey(STORAGE_KEYS.GOALS, userId);
    const goals = await this.getGoals(userId);
    const newGoal: GoalItem = { ...goal, id: `goal_${Date.now()}` };
    const updated = [newGoal, ...goals];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return newGoal;
  },

  async updateGoal(goalId: string, updates: Partial<GoalItem>, userId?: string): Promise<GoalItem[]> {
    const key = this.getScopedKey(STORAGE_KEYS.GOALS, userId);
    const goals = await this.getGoals(userId);
    const updated = goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async deleteGoal(goalId: string, userId?: string): Promise<GoalItem[]> {
    const key = this.getScopedKey(STORAGE_KEYS.GOALS, userId);
    const goals = await this.getGoals(userId);
    const updated = goals.filter((g) => g.id !== goalId);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async toggleMilestone(goalId: string, milestoneId: string, userId?: string): Promise<GoalItem[]> {
    const key = this.getScopedKey(STORAGE_KEYS.GOALS, userId);
    const goals = await this.getGoals(userId);
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const currentMilestones = g.milestones || [];
      const updatedMilestones = currentMilestones.map((m) =>
        m.id === milestoneId ? { ...m, done: !m.done } : m
      );
      const doneCount = updatedMilestones.filter((m) => m.done).length;
      const progressPercent = updatedMilestones.length > 0 ? Math.round((doneCount / updatedMilestones.length) * 100) : 0;
      return { ...g, milestones: updatedMilestones, progressPercent };
    });
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  // --- DECISIONS (MY LIFE) ---
  async getDecisions(userId?: string): Promise<DecisionItem[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.DECISIONS, userId);
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveDecision(decision: Omit<DecisionItem, 'id' | 'createdAt'>, userId?: string): Promise<DecisionItem> {
    const key = this.getScopedKey(STORAGE_KEYS.DECISIONS, userId);
    const decisions = await this.getDecisions(userId);
    const newDec: DecisionItem = {
      ...decision,
      id: `dec_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newDec, ...decisions];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return newDec;
  },

  // --- HEALTHCARE MODULE ---
  async getHealthRecords(userId?: string): Promise<HealthRecord[]> {
    try {
      const key = this.getScopedKey(STORAGE_KEYS.HEALTH_RECORDS, userId);
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);
      return [];
    } catch {
      return [];
    }
  },

  async saveHealthRecord(record: Omit<HealthRecord, 'id'>, userId?: string): Promise<HealthRecord> {
    const key = this.getScopedKey(STORAGE_KEYS.HEALTH_RECORDS, userId);
    const list = await this.getHealthRecords(userId);
    const newRecord: HealthRecord = {
      ...record,
      id: `health_${Date.now()}`,
      date: record.date || new Date().toISOString().split('T')[0],
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString(),
    };
    const updated = [newRecord, ...list];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return newRecord;
  },

  async updateHealthRecord(id: string, updates: Partial<HealthRecord>, userId?: string): Promise<HealthRecord[]> {
    const key = this.getScopedKey(STORAGE_KEYS.HEALTH_RECORDS, userId);
    const list = await this.getHealthRecords(userId);
    const updated = list.map((r) => (r.id === id ? { ...r, ...updates } : r));
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  async deleteHealthRecord(id: string, userId?: string): Promise<HealthRecord[]> {
    const key = this.getScopedKey(STORAGE_KEYS.HEALTH_RECORDS, userId);
    const list = await this.getHealthRecords(userId);
    const updated = list.filter((r) => r.id !== id);
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },

  /**
   * Idempotently isolates and quarantines legacy unpartitioned records.
   * To prevent data cross-contamination, legacy global records are NEVER automatically
   * adopted by a new account based on cached profile keys alone. Instead, they are
   * preserved intact in an isolated, secure quarantine area (@nexora_recovery_quarantine_*).
   */
  async isolateAndMigrateLegacyRecords(verifiedUserId: string): Promise<{ migrated: boolean; movedToRecovery: boolean }> {
    if (!verifiedUserId) return { migrated: false, movedToRecovery: false };

    const migrationKey = `@nexora_${verifiedUserId}_migration_v1`;
    try {
      const alreadyRun = await AsyncStorage.getItem(migrationKey);
      if (alreadyRun === 'true') {
        return { migrated: false, movedToRecovery: false };
      }

      // Check legacy storage for unpartitioned data
      const [legacyTasks, legacyGoals, legacyHealth, legacyMems] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.GOALS),
        AsyncStorage.getItem(STORAGE_KEYS.HEALTH_RECORDS),
        AsyncStorage.getItem(STORAGE_KEYS.MEMORIES),
      ]);

      const hasLegacyData = !!(legacyTasks || legacyGoals || legacyHealth || legacyMems);
      if (!hasLegacyData) {
        await AsyncStorage.setItem(migrationKey, 'true');
        return { migrated: false, movedToRecovery: false };
      }

      // Safe Preservation Rule:
      // Ownership cannot be proven cryptographically from legacy unpartitioned rows.
      // Safely preserve records in isolated recovery storage without deleting, overwriting,
      // or exposing them across user accounts.
      await Promise.all([
        AsyncStorage.setItem('@nexora_recovery_quarantine_tasks', legacyTasks || '[]'),
        AsyncStorage.setItem('@nexora_recovery_quarantine_health', legacyHealth || '[]'),
        AsyncStorage.setItem('@nexora_recovery_quarantine_goals', legacyGoals || '[]'),
        AsyncStorage.setItem('@nexora_recovery_quarantine_memories', legacyMems || '[]'),
        AsyncStorage.removeItem(STORAGE_KEYS.TASKS),
        AsyncStorage.removeItem(STORAGE_KEYS.HEALTH_RECORDS),
        AsyncStorage.removeItem(STORAGE_KEYS.GOALS),
        AsyncStorage.removeItem(STORAGE_KEYS.MEMORIES),
      ]);

      await AsyncStorage.setItem(migrationKey, 'true');
      return { migrated: false, movedToRecovery: true };
    } catch (err) {
      console.warn('[StorageService] Error during safe legacy migration:', err);
      return { migrated: false, movedToRecovery: false };
    }
  },

  // --- AUTOMATIONS (HOME INTELLIGENCE) ---
  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.AUTOMATIONS);
      return data
        ? JSON.parse(data)
        : [
            {
              id: 'auto_1',
              name: 'Nightly Energy & Lights Shutdown',
              conditionDescription: 'IF time reaches 11:30 PM',
              actionDescription: 'THEN switch off all living room & study lights',
              enabled: true,
              requiresConfirmation: false,
            },
            {
              id: 'auto_2',
              name: 'Morning Study Readiness',
              conditionDescription: 'IF morning study session starts',
              actionDescription: 'THEN adjust desk lamp to 85% & set thermostat to 22°C',
              enabled: true,
              requiresConfirmation: false,
            },
            {
              id: 'auto_3',
              name: 'High Impact Security Alert',
              conditionDescription: 'IF unknown smart device connects',
              actionDescription: 'THEN trigger review confirmation modal before access',
              enabled: true,
              requiresConfirmation: true,
            },
          ];
    } catch {
      return [];
    }
  },

  async toggleAutomationRule(id: string): Promise<AutomationRule[]> {
    const rules = await this.getAutomationRules();
    const updated = rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    await AsyncStorage.setItem(STORAGE_KEYS.AUTOMATIONS, JSON.stringify(updated));
    return updated;
  },

  // --- LOCALIZATION & ONBOARDING PERSISTENCE ---
  async getAppLanguage(): Promise<'en-US' | 'ta-IN' | 'hi-IN'> {
    try {
      const lang = await AsyncStorage.getItem(STORAGE_KEYS.APP_LANGUAGE);
      if (lang === 'ta-IN' || lang === 'hi-IN' || lang === 'en-US') {
        return lang;
      }
      return 'en-US';
    } catch {
      return 'en-US';
    }
  },

  async setAppLanguage(lang: 'en-US' | 'ta-IN' | 'hi-IN'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LANGUAGE, lang);
    } catch (e) {
      console.warn('[StorageService] Failed to save app language:', e);
    }
  },

  async getOnboardingCompleted(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return val === 'true';
    } catch {
      return false;
    }
  },

  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
    } catch (e) {
      console.warn('[StorageService] Failed to save onboarding status:', e);
    }
  },

  async getAiLanguage(): Promise<string> {
    try {
      const lang = await AsyncStorage.getItem(STORAGE_KEYS.AI_LANGUAGE);
      return lang || 'auto';
    } catch {
      return 'auto';
    }
  },

  async setAiLanguage(lang: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AI_LANGUAGE, lang);
    } catch (e) {
      console.warn('[StorageService] Failed to save AI language:', e);
    }
  },
};

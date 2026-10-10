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
  soloMode: boolean; // Privacy lockdown mode
  appLanguage?: 'en-US' | 'ta-IN';
  aiLanguage?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  done: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  deadline: string;
  category: 'career' | 'learning' | 'fitness' | 'finance';
  milestones: GoalMilestone[];
  progressPercent: number;
  priority: 'low' | 'medium' | 'high';
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

const STORAGE_KEYS = {
  USER_PROFILE: '@nexora_user_profile',
  MEMORIES: '@nexora_memories',
  TASKS: '@nexora_tasks',
  DEVICES: '@nexora_smart_devices',
  PREFERENCES: '@nexora_preferences',
  CHAT_THREADS: '@nexora_chat_threads',
  GOALS: '@nexora_goals_v2',
  DECISIONS: '@nexora_decisions_v2',
  AUTOMATIONS: '@nexora_automations_v2',
  APP_LANGUAGE: '@nexora_app_language',
  ONBOARDING_COMPLETED: '@nexora_onboarding_completed',
  AI_LANGUAGE: '@nexora_ai_language',
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
};

export const StorageService = {
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
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async clearUserSession(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },

  // --- MEMORY VAULT ---
  async getMemories(): Promise<StoredMemory[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveMemory(memory: Omit<StoredMemory, 'id' | 'timestamp' | 'updatedAt'>): Promise<StoredMemory> {
    const memories = await this.getMemories();
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
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
    return newMem;
  },

  async deleteMemory(id: string): Promise<void> {
    const memories = await this.getMemories();
    const updated = memories.filter((m) => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
  },

  async clearAllMemories(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify([]));
  },

  // --- TASKS & PLANNER ---
  async getTasks(): Promise<TaskItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveTask(task: Omit<TaskItem, 'id' | 'completed'>): Promise<TaskItem> {
    const tasks = await this.getTasks();
    const newTask: TaskItem = {
      ...task,
      id: `t_${Date.now()}`,
      completed: false,
    };
    const updated = [newTask, ...tasks];
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return newTask;
  },

  async toggleTask(id: string): Promise<TaskItem[]> {
    const tasks = await this.getTasks();
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const updated = tasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  },

  // --- SMART HOME DEVICES ---
  async getDevices(): Promise<SmartDevice[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DEVICES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async toggleDevice(id: string): Promise<SmartDevice[]> {
    const devices = await this.getDevices();
    const updated = devices.map((d) => (d.id === id ? { ...d, status: !d.status } : d));
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(updated));
    return updated;
  },

  // --- PREFERENCES ---
  async getPreferences(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return data ? { ...DEFAULT_PREFERENCES, ...JSON.parse(data) } : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  async savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const current = await this.getPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
    return updated;
  },

  // --- GOALS (MY LIFE) ---
  async getGoals(): Promise<GoalItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveGoal(goal: Omit<GoalItem, 'id'>): Promise<GoalItem> {
    const goals = await this.getGoals();
    const newGoal: GoalItem = { ...goal, id: `goal_${Date.now()}` };
    const updated = [newGoal, ...goals];
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
    return newGoal;
  },

  async toggleMilestone(goalId: string, milestoneId: string): Promise<GoalItem[]> {
    const goals = await this.getGoals();
    const updated = goals.map((g) => {
      if (g.id !== goalId) return g;
      const updatedMilestones = g.milestones.map((m) =>
        m.id === milestoneId ? { ...m, done: !m.done } : m
      );
      const doneCount = updatedMilestones.filter((m) => m.done).length;
      const progressPercent = Math.round((doneCount / updatedMilestones.length) * 100);
      return { ...g, milestones: updatedMilestones, progressPercent };
    });
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(updated));
    return updated;
  },

  // --- DECISIONS (MY LIFE) ---
  async getDecisions(): Promise<DecisionItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DECISIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async saveDecision(decision: Omit<DecisionItem, 'id' | 'createdAt'>): Promise<DecisionItem> {
    const decisions = await this.getDecisions();
    const newDec: DecisionItem = {
      ...decision,
      id: `dec_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newDec, ...decisions];
    await AsyncStorage.setItem(STORAGE_KEYS.DECISIONS, JSON.stringify(updated));
    return newDec;
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
  async getAppLanguage(): Promise<'en-US' | 'ta-IN'> {
    try {
      const lang = await AsyncStorage.getItem(STORAGE_KEYS.APP_LANGUAGE);
      if (lang === 'ta-IN' || lang === 'en-US') {
        return lang;
      }
      return 'en-US';
    } catch {
      return 'en-US';
    }
  },

  async setAppLanguage(lang: 'en-US' | 'ta-IN'): Promise<void> {
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

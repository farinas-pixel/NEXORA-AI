import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AvatarState } from '../config/constants';
import type { TabName } from '../components/common/BottomNavBar';
import {
  StoredMemory,
  TaskItem,
  SmartDevice,
  UserPreferences,
  UserProfile,
 StorageService } from '../services/storage';
import { SpeechService } from '../services/voice/speechService';
import { ToolManager } from '../services/tools/toolManager';
import { supabase } from '../services/auth/supabaseClient';
import { signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut, resetPassword as supabaseResetPassword, restoreSession } from '../services/auth/authService';
import { supabaseDataService } from '../services/backend/supabaseDataService';
import * as SecureStore from '../services/secureStore';
import { AIBrain, RobotReaction, VisualEnvironment, InferredContext, DetectedLanguage, AgentRole } from '../services/ai/aiBrain';
import { NetworkService } from '../services/network/networkService';
import { ReminderService, ReminderItem } from '../services/reminders/reminderService';
import { DataResetService } from '../services/dataResetService';
import { AppLanguage, TranslationKey, translate } from '../i18n';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nex';
  text: string;
  timestamp: string;
  imageUri?: string;
  toolResult?: {
    toolName: string;
    output: string;
  };
  inferredContext?: InferredContext;
  selectedAgent?: AgentRole;
  detectedLanguage?: DetectedLanguage;
  followUpSuggestions?: string[];
  robotReaction?: RobotReaction;
}

export type BotMode =
  | 'general'
  | 'study'
  | 'cooking'
  | 'coding'
  | 'travel'
  | 'fitness'
  | 'home'
  | 'entertainment'
  | 'assistant';

interface AppContextType {
  // Auth & Profile
  isAuthenticated: boolean;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<UserProfile>;

  // Avatar & Mode
  avatarState: AvatarState;
  robotReaction: RobotReaction;
  setRobotReaction: (reaction: RobotReaction) => void;
  visualEnvironment: VisualEnvironment;
  activeMode: BotMode;
  setActiveMode: (mode: BotMode) => void;
  setAvatarState: (state: AvatarState) => void;

  // Navigation
  activeTab: TabName;
  setActiveTab: (tab: TabName) => void;

  // Chat & AI
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  startNewConversation: () => Promise<string>;
  switchConversation: (id: string) => Promise<void>;
  messages: ChatMessage[];
  sendMessage: (text: string, imageUri?: string) => Promise<void>;
  clearChat: () => void;

  // Voice & Speech
  isSpeaking: boolean;
  speakText: (text: string) => Promise<void>;
  stopSpeaking: () => Promise<void>;

  // Memory Vault
  memories: StoredMemory[];
  addMemory: (category: StoredMemory['category'], content: string, securityTier: StoredMemory['securityTier']) => Promise<void>;
  updateMemory: (id: string, content: string) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  clearAllMemories: () => Promise<void>;

  // Tasks & Daily Planner
  tasks: TaskItem[];
  addTask: (title: string, category: TaskItem['category'], priority: TaskItem['priority'], dueDate?: string) => Promise<void>;
  refreshTasks?: () => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Reminders
  reminders: ReminderItem[];
  missedReminders: ReminderItem[];
  refreshReminders: () => Promise<void>;
  createReminder: (title: string, dueTime: string, category?: ReminderItem['category'], priority?: ReminderItem['priority']) => Promise<ReminderItem>;
  completeReminder: (id: string) => Promise<void>;
  rescheduleReminder: (id: string, newDueTime: string) => Promise<void>;
  cancelReminder: (id: string) => Promise<void>;

  // Smart Home
  devices: SmartDevice[];
  toggleDevice: (id: string) => Promise<void>;

  // Preferences
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;

  // Localization & Onboarding
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => Promise<void>;
  aiLanguage: string;
  setAiLanguage: (lang: string) => Promise<void>;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;

  // Network State
  isOnline: boolean;

  // Authentication Initialization Lifecycle
  isAuthReady: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [];

const DEFAULT_ENVIRONMENT: VisualEnvironment = {
  context: 'general',
  accentColor: '#00E5FF',
  glowColor: '#00E5FF',
  ambientTone: 'rgba(0, 229, 255, 0.08)',
  particlesPreset: 'subtle_cyan',
  backdropDescription: 'Sovereign companion space',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  const [avatarState, setAvatarState] = useState<AvatarState>('idle');
  const [robotReaction, setRobotReaction] = useState<RobotReaction>('idle');
  const [visualEnvironment, setVisualEnvironment] = useState<VisualEnvironment>(DEFAULT_ENVIRONMENT);
  const [activeMode, setActiveMode] = useState<BotMode>('general');
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const [memories, setMemories] = useState<StoredMemory[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [missedReminders, setMissedReminders] = useState<ReminderItem[]>([]);
  const [devices, setDevices] = useState<SmartDevice[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    speechRate: 1.0,
    speechPitch: 1.0,
    voiceModel: 'en-US-Neural',
    autoSpeak: true,
    highContrast: false,
    reduceMotion: false,
    soloMode: false,
  });

  const [appLanguage, setAppLanguageState] = useState<AppLanguage>('en-US');
  const [aiLanguage, setAiLanguageState] = useState<string>('auto');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  const [isOnline, setIsOnline] = useState<boolean>(true);

  const refreshReminders = useCallback(async () => {
    try {
      const all = await ReminderService.getReminders();
      setReminders(all);
      setMissedReminders(all.filter((r) => r.status === 'missed'));
    } catch (e) {
      console.warn('[AppContext] Failed to refresh reminders:', e);
    }
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      await DataResetService.ensureTargetedReset().catch((e) => {
        console.warn('[AppContext] Targeted data reset check notice:', e);
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id || user?.id;

      const [savedMems, savedTasks, savedPrefs, savedReminders, activeConvo] = await Promise.all([
        supabaseDataService.fetchMemories().catch(() => []),
        supabaseDataService.fetchTasks().catch(() => []),
        supabaseDataService.fetchPreferences().catch(() => null),
        ReminderService.getReminders().catch(() => []),
        currentUserId ? supabaseDataService.getOrCreateActiveConversation().catch(() => null) : Promise.resolve(null),
      ]);
      setMemories(savedMems);
      setTasks(savedTasks);
      if (savedPrefs) {
        setPreferences(savedPrefs);
      }
      setReminders(savedReminders);
      setMissedReminders(savedReminders.filter((r) => r.status === 'missed'));
      if (activeConvo) {
        setActiveConversationId(activeConvo.id);
        const storedMsgs = await supabaseDataService.fetchConversationMessages(activeConvo.id).catch(() => []);
        if (storedMsgs && storedMsgs.length > 0) {
          const mapped: ChatMessage[] = storedMsgs.map((m) => {
            const meta = m.metadata || {};
            return {
              id: m.id,
              sender: m.role === 'user' ? 'user' : 'nex',
              text: m.content,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              imageUri: meta.imageUri,
              toolResult: m.tool_result || undefined,
              inferredContext: meta.inferredContext,
              selectedAgent: meta.selectedAgent,
              detectedLanguage: meta.detectedLanguage,
              followUpSuggestions: meta.followUpSuggestions,
              robotReaction: meta.robotReaction,
            };
          });
          setMessages(mapped);
        } else {
          setMessages([]);
        }
      }
    } catch (e) {
      console.error('[AppContext] Failed to load user data:', e);
    }
  }, [user]);

  // Monitor hardware network state: offline fallback and auto-reconnect
  useEffect(() => {
    let isMounted = true;

    // Check initial network connection
    NetworkService.checkConnection().then((state) => {
      if (!isMounted) return;
      setIsOnline(state.isOnline);
      if (!state.isOnline) {
        setAvatarState('offline');
        setRobotReaction('attention');
      }
    });

    // Subscribe to network changes
    const unsubscribe = NetworkService.subscribe((state) => {
      if (!isMounted) return;
      setIsOnline(state.isOnline);

      if (state.isOnline) {
        // Reconnected to internet
        setAvatarState('idle');
        setRobotReaction('idle');
        loadUserData();
      } else {
        // Lost internet connection
        setAvatarState('offline');
        setRobotReaction('attention');
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [loadUserData]);

  // Load persistent data on startup, including auth session & local preferences
  useEffect(() => {
    (async () => {
      try {
        const [savedLang, savedAiLang, savedOnboarded, savedDevices] = await Promise.all([
          StorageService.getAppLanguage(),
          StorageService.getAiLanguage(),
          StorageService.getOnboardingCompleted(),
          StorageService.getDevices(),
        ]);
        setAppLanguageState(savedLang);
        setAiLanguageState(savedAiLang);
        setHasCompletedOnboarding(savedOnboarded);
        setDevices(savedDevices);
      } catch (err) {
        console.warn('[AppContext] Error loading local startup preferences:', err);
      }

      try {
        const restoredProfile = await restoreSession();
        if (restoredProfile) {
          StorageService.setActiveUser(restoredProfile.id);
          setUser(restoredProfile);
          setIsAuthenticated(true);
          // Safely isolate and migrate legacy unpartitioned records for verified owner
          StorageService.isolateAndMigrateLegacyRecords(restoredProfile.id).catch((e) => {
            console.warn('[AppContext] Safe legacy migration notice:', e);
          });
          DataResetService.ensureTargetedReset().catch((e) => {
            console.warn('[AppContext] Targeted data reset notice:', e);
          });
          loadUserData().catch((e) => {
            console.warn('[AppContext] Startup loadUserData notice:', e);
          });
        } else {
          // Even without restored profile, ensure local data reset runs in background
          DataResetService.ensureTargetedReset().catch((e) => {
            console.warn('[AppContext] Targeted local data reset notice:', e);
          });
        }
      } catch (err) {
        console.warn('[AppContext] Error restoring session on startup:', err);
      } finally {
        // Guaranteed finalization: auth initialization resolution complete
        setIsAuthReady(true);
      }
    })();
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await supabaseSignIn(email, password);
    if (!result.ok) {
      const err: any = new Error(result.error ?? 'Login failed');
      err.isEmailNotConfirmed = result.isEmailNotConfirmed;
      throw err;
    }
    const profile = result.profile!;
    StorageService.setActiveUser(profile.id);
    setUser(profile);
    setIsAuthenticated(true);
    // Safely isolate and migrate legacy records for verified owner
    StorageService.isolateAndMigrateLegacyRecords(profile.id).catch((e) => {
      console.warn('[AppContext] Safe legacy migration notice on sign-in:', e);
    });
    // Unblock UI navigation immediately while data synchronizes in background
    loadUserData().catch((e) => {
      console.warn('[AppContext] Background loadUserData after sign-in failed:', e);
    });
    return true;
  }, [loadUserData]);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const result = await supabaseSignUp(name, email, password);
    if (!result.ok) {
      throw new Error(result.error ?? 'Signup failed');
    }
    if (result.requiresEmailConfirmation) {
      return { success: true, requiresEmailConfirmation: true };
    }
    const profile = result.profile!;
    StorageService.setActiveUser(profile.id);
    setUser(profile);
    setIsAuthenticated(true);
    // Unblock UI navigation immediately while data synchronizes in background
    loadUserData().catch((e) => {
      console.warn('[AppContext] Background loadUserData after sign-up failed:', e);
    });
    return { success: true, requiresEmailConfirmation: false };
  }, [loadUserData]);

  const resetPassword = useCallback(async (email: string) => {
    const result = await supabaseResetPassword(email);
    if (!result.ok) {
      throw new Error(result.error ?? 'Reset failed');
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    StorageService.setActiveUser(null);
    try {
      await supabaseSignOut();
    } catch (e) {
      console.warn('[AppContext] Error during supabaseSignOut:', e);
    }

    try {
      await supabaseDataService.clearLocalCache();
    } catch (e) {
      console.warn('[AppContext] Error clearing local cache:', e);
    }

    try {
      await StorageService.setOnboardingCompleted(false);
      setHasCompletedOnboarding(false);
    } catch (e) {
      console.warn('[AppContext] Error resetting onboarding status:', e);
    }

    setUser(null);
    setIsAuthenticated(false);
    setActiveConversationId(null);
    setMemories([]);
    setTasks([]);
    setReminders([]);
    setMissedReminders([]);
    setMessages([]);
    setDevices([]);
    setPreferences({
      speechRate: 1.0,
      speechPitch: 1.0,
      voiceModel: 'en-US-Neural',
      autoSpeak: true,
      highContrast: false,
      reduceMotion: false,
      soloMode: false,
    });
  }, []);

  const startNewConversation = useCallback(async (): Promise<string> => {
    try {
      const newConvo = await supabaseDataService.createConversation('New Conversation');
      setActiveConversationId(newConvo.id);
      setMessages([]);
      return newConvo.id;
    } catch (e) {
      console.error('[AppContext] Failed to start new conversation:', e);
      throw e;
    }
  }, []);

  const switchConversation = useCallback(async (id: string): Promise<void> => {
    try {
      setActiveConversationId(id);
      const storedMsgs = await supabaseDataService.fetchConversationMessages(id);
      if (storedMsgs && storedMsgs.length > 0) {
        const mapped: ChatMessage[] = storedMsgs.map((m) => {
          const meta = m.metadata || {};
          return {
            id: m.id,
            sender: m.role === 'user' ? 'user' : 'nex',
            text: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            imageUri: meta.imageUri,
            toolResult: m.tool_result || undefined,
            inferredContext: meta.inferredContext,
            selectedAgent: meta.selectedAgent,
            detectedLanguage: meta.detectedLanguage,
            followUpSuggestions: meta.followUpSuggestions,
            robotReaction: meta.robotReaction,
          };
        });
        setMessages(mapped);
      } else {
        setMessages([]);
      }
    } catch (e) {
      console.warn('[AppContext] Failed to switch conversation:', e);
    }
  }, []);

  const speakText = useCallback(
    async (text: string) => {
      await SpeechService.speak(text, {
        rate: preferences.speechRate,
        pitch: preferences.speechPitch,
        onStart: () => {
          setIsSpeaking(true);
          setAvatarState('responding');
          setRobotReaction('speaking');
        },
        onDone: () => {
          setIsSpeaking(false);
          setAvatarState('idle');
          setRobotReaction('idle');
        },
        onError: () => {
          setIsSpeaking(false);
          setAvatarState('idle');
          setRobotReaction('idle');
        },
      });
    },
    [preferences]
  );

  const stopSpeaking = useCallback(async () => {
    await SpeechService.stop();
    setIsSpeaking(false);
    setAvatarState('idle');
    setRobotReaction('idle');
  }, []);

  const sendMessage = useCallback(
    async (text: string, imageUri?: string) => {
      if (!text.trim() && !imageUri) return;

      let convoId = activeConversationId;
      if (!convoId) {
        const convo = await supabaseDataService.getOrCreateActiveConversation();
        if (convo) {
          convoId = convo.id;
          setActiveConversationId(convoId);
        }
      }

      if (!convoId) return;

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        imageUri,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);

      // If hardware network is disconnected, handle cleanly without failing calls
      if (!isOnline) {
        setAvatarState('offline');
        setRobotReaction('attention');
        const offlineReply: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'nex',
          text: 'NEXORA is currently offline. Internet connection is required to communicate with the sovereign AI core and sync your data. Please check your network connection.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          robotReaction: 'attention',
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, offlineReply]);
        }, 300);
        return;
      }

      setAvatarState('processing');
      setRobotReaction('thinking');

      // Persist user message to Supabase
      try {
        await supabaseDataService.saveConversationMessage(
          convoId,
          'user',
          text.trim(),
          undefined,
          { imageUri }
        );
      } catch (e) {
        console.warn('[AppContext] Failed to persist user message:', e);
      }

      // 1. Check if user request triggers an executable tool directly
      const toolIntent = ToolManager.detectToolIntent(text);
      let directToolOutput: { toolName: string; output: string } | undefined;

      if (toolIntent) {
        const result = await ToolManager.execute(toolIntent.toolName, toolIntent.params);
        directToolOutput = {
          toolName: result.toolName,
          output: result.output,
        };
        if (toolIntent.toolName === 'add_planner_task') {
          const updatedTasks = await supabaseDataService.fetchTasks();
          setTasks(updatedTasks);
        } else if (toolIntent.toolName === 'create_reminder') {
          await refreshReminders();
        } else if (toolIntent.toolName === 'toggle_device') {
          const updatedDevices = await StorageService.getDevices();
          setDevices(updatedDevices);
        } else if (toolIntent.toolName === 'save_to_memory_vault') {
          const updatedMems = await supabaseDataService.fetchMemories();
          setMemories(updatedMems);
        }
      }

      // 2. Central AI Brain Cognitive Processing Pipeline
      const historyTurns = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      // Pass real conversationId into AIBrain.process
      let brainResult: any;
      try {
        brainResult = await AIBrain.process(
          text,
          historyTurns,
          preferences.soloMode,
          convoId
        );
      } catch (err: any) {
        console.error('[AppContext] AIBrain.process failed:', err);
        setAvatarState('idle');
        setRobotReaction('attention');
        const errorMsg: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'nex',
          text: `NEXORA encountered an issue: ${err?.message || 'Failed to process message'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          robotReaction: 'attention',
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      // Update active environment and robot reactions
      setVisualEnvironment(brainResult.visualEnvironment);
      setRobotReaction(brainResult.robotReaction);
      setAvatarState(brainResult.robotReaction === 'speaking' ? 'responding' : 'idle');

      // Refresh reminders if reminder was created
      if (brainResult.reminderCreated) {
        await refreshReminders();
      }

      const finalOutput = directToolOutput
        ? `${directToolOutput.output}\n\n${brainResult.aiResponseText}`
        : brainResult.aiResponseText;

      const botMsg: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'nex',
        text: finalOutput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolResult: directToolOutput || (brainResult.toolResult ? {
          toolName: brainResult.toolResult.toolName,
          output: brainResult.toolResult.output,
        } : undefined),
        inferredContext: brainResult.inferredContext,
        selectedAgent: brainResult.selectedAgent,
        detectedLanguage: brainResult.detectedLanguage,
        followUpSuggestions: brainResult.followUpSuggestions,
        robotReaction: brainResult.robotReaction,
      };

      // Persist assistant message to Supabase
      try {
        await supabaseDataService.saveConversationMessage(
          convoId,
          'assistant',
          finalOutput,
          botMsg.toolResult,
          {
            inferredContext: brainResult.inferredContext,
            selectedAgent: brainResult.selectedAgent,
            detectedLanguage: brainResult.detectedLanguage,
            followUpSuggestions: brainResult.followUpSuggestions,
            robotReaction: brainResult.robotReaction,
          }
        );
      } catch (e) {
        console.warn('[AppContext] Failed to persist bot message:', e);
      }

      setMessages((prev) => [...prev, botMsg]);

      // Auto-speak response if enabled (default true)
      if (preferences.autoSpeak !== false) {
        speakText(finalOutput);
      } else {
        setTimeout(() => {
          setRobotReaction('idle');
          setAvatarState('idle');
        }, 3000);
      }
    },
    [activeConversationId, isOnline, messages, preferences.autoSpeak, preferences.soloMode, refreshReminders, speakText]
  );

  const clearChat = useCallback(async () => {
    try {
      await startNewConversation();
    } catch {
      setMessages([]);
    }
  }, [startNewConversation]);

  const addMemory = useCallback(
  async (category: StoredMemory['category'], content: string, securityTier: StoredMemory['securityTier']) => {
    const now = new Date().toISOString();
    const newMem = await supabaseDataService.createMemory({
      category,
      content,
      securityTier,
      confidence: 0.99,
      timestamp: now,
      updatedAt: now,
    });
    if (!newMem) return;
    // If memory is critical, store content securely and remove from cache
    if (newMem.securityTier === 'critical') {
      await SecureStore.setItemAsync(`critical_mem_${newMem.id}`, newMem.content);
      // Optionally omit content from in-memory cache for extra safety
      newMem.content = '[PROTECTED]';
    }
    setMemories((prev) => [newMem, ...prev]);
  },
  []
);

  const updateMemory = useCallback(async (id: string, content: string) => {
    await supabaseDataService.updateMemory(id, content);
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, updatedAt: new Date().toISOString() } : m))
    );
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    // Remove from SecureStore if critical tier
    const mem = memories.find((m) => m.id === id);
    if (mem?.securityTier === 'critical') {
      await SecureStore.deleteItemAsync(`critical_mem_${id}`);
    }
    await supabaseDataService.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, [memories]);

  const clearAllMemories = useCallback(async () => {
    // Remove critical memory entries from SecureStore
    for (const mem of memories) {
      if (mem.securityTier === 'critical') {
        await SecureStore.deleteItemAsync(`critical_mem_${mem.id}`);
      }
    }
    await supabaseDataService.clearAllMemories();
    setMemories([]);
    setTasks([]);
  }, [memories]);

  const refreshTasks = useCallback(async () => {
    try {
      const all = await supabaseDataService.fetchTasks();
      setTasks(all);
    } catch (e) {
      console.warn('[AppContext] Failed to refresh tasks:', e);
    }
  }, []);

  const addTask = useCallback(
    async (
      title: string,
      category: TaskItem['category'],
      priority: TaskItem['priority'],
      dueDate: string = 'Today'
    ) => {
      const newTask = await supabaseDataService.createTask({
        title,
        category,
        priority,
        dueDate,
        completed: false,
      });
      const savedTask = await StorageService.saveTask({
        title,
        category,
        priority,
        dueDate,
      }).catch(() => null);

      const resolved = newTask || savedTask;
      if (resolved) {
        setTasks((prev) => [resolved, ...prev.filter((t) => t.id !== resolved.id)]);
      }
    },
    []
  );

  const toggleTask = useCallback(async (id: string) => {
    const updated = await supabaseDataService.toggleTask(id);
    await StorageService.toggleTask(id).catch(() => null);
    setTasks(updated);
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await supabaseDataService.deleteTask(id);
    await StorageService.deleteTask(id).catch(() => null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const createReminder = useCallback(
    async (
      title: string,
      dueTime: string,
      category?: ReminderItem['category'],
      priority?: ReminderItem['priority']
    ) => {
      const item = await ReminderService.createReminder(title, dueTime, category, priority);
      await refreshReminders();
      return item;
    },
    [refreshReminders]
  );

  const completeReminder = useCallback(
    async (id: string) => {
      await ReminderService.completeReminder(id);
      await refreshReminders();
    },
    [refreshReminders]
  );

  const rescheduleReminder = useCallback(
    async (id: string, newDueTime: string) => {
      await ReminderService.rescheduleReminder(id, newDueTime);
      await refreshReminders();
    },
    [refreshReminders]
  );

  const cancelReminder = useCallback(
    async (id: string) => {
      await ReminderService.cancelReminder(id);
      await refreshReminders();
    },
    [refreshReminders]
  );

  const toggleDevice = useCallback(async (id: string) => {
    const updated = await StorageService.toggleDevice(id);
    setDevices(updated);
  }, []);

  const setAppLanguage = useCallback(async (lang: AppLanguage) => {
    setAppLanguageState(lang);
    await StorageService.setAppLanguage(lang);
    if (user) {
      const langName = lang === 'ta-IN' ? 'Tamil' : 'English (US)';
      const updatedProfile = { ...user, language: langName };
      setUser(updatedProfile);
      await StorageService.saveUserProfile(updatedProfile);
    }
  }, [user]);

  const setAiLanguage = useCallback(async (lang: string) => {
    setAiLanguageState(lang);
    await StorageService.setAiLanguage(lang);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(true);
    await StorageService.setOnboardingCompleted(true);
    if (!isAuthenticated) {
      let localProfile = await StorageService.getUserProfile();
      if (!localProfile) {
        localProfile = {
          id: 'local_user',
          name: 'Isha Shree S',
          email: 'isha@nexora.ai',
          language: 'English',
          region: 'India',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          createdDate: new Date().toISOString(),
        };
        await StorageService.saveUserProfile(localProfile);
      }
      StorageService.setActiveUser(localProfile.id);
      setUser(localProfile);
      setIsAuthenticated(true);
      loadUserData().catch(() => {});
    }
  }, [isAuthenticated, loadUserData]);

  const resetOnboarding = useCallback(async () => {
    setHasCompletedOnboarding(false);
    await StorageService.setOnboardingCompleted(false);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      return translate(key, appLanguage, params);
    },
    [appLanguage]
  );

  const updateUserProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<UserProfile> => {
      const current = user || {
        id: 'local_user',
        name: 'Partner',
        email: '',
        language: 'English',
        region: 'India',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdDate: new Date().toISOString(),
      };
      const updated: UserProfile = { ...current, ...updates };
      setUser(updated);
      await StorageService.saveUserProfile(updated);
      try {
        await SecureStore.setItemAsync('user_profile', JSON.stringify(updated)).catch(() => {});
      } catch {}

      // If connected and authenticated with Supabase, sync user_metadata to backend
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          await supabase.auth.updateUser({
            data: {
              full_name: updated.name,
              avatar_url: updated.avatarUrl,
              birthday: updated.birthday,
            },
          });
        }
      } catch (err) {
        console.warn('[AppContext] Non-blocking backend profile update:', err);
      }
      return updated;
    },
    [user]
  );

  const updatePreferences = useCallback(async (newPrefs: Partial<UserPreferences>) => {
    if (newPrefs.appLanguage) {
      setAppLanguageState(newPrefs.appLanguage);
      await StorageService.setAppLanguage(newPrefs.appLanguage);
    }
    if (newPrefs.aiLanguage) {
      setAiLanguageState(newPrefs.aiLanguage);
      await StorageService.setAiLanguage(newPrefs.aiLanguage);
    }
    const updated = await supabaseDataService.upsertPreferences(newPrefs);
    setPreferences(updated);
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        signIn,
        signUp,
        resetPassword,
        signOut,
        updateUserProfile,
        avatarState,
        robotReaction,
        setRobotReaction,
        visualEnvironment,
        activeMode,
        setActiveMode,
        setAvatarState,
        activeTab,
        setActiveTab,
        activeConversationId,
        setActiveConversationId,
        startNewConversation,
        switchConversation,
        messages,
        sendMessage,
        clearChat,
        isSpeaking,
        speakText,
        stopSpeaking,
        memories,
        addMemory,
        updateMemory,
        deleteMemory,
        clearAllMemories,
        tasks,
        addTask,
        refreshTasks,
        toggleTask,
        deleteTask,
        reminders,
        missedReminders,
        refreshReminders,
        createReminder,
        completeReminder,
        rescheduleReminder,
        cancelReminder,
        devices,
        toggleDevice,
        preferences,
        updatePreferences,
        appLanguage,
        setAppLanguage,
        aiLanguage,
        setAiLanguage,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
        t,
        isOnline,
        isAuthReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

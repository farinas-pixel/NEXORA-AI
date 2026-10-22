/**
 * NEXORA AI — Central AI Brain
 *
 * Cognitive pipeline:
 * User Input
 * -> Language Detection
 * -> Context Understanding
 * -> Memory Retrieval
 * -> Intent / Tool Detection
 * -> Safety
 * -> AI Response
 * -> Robot Reaction
 *
 * Real AI provider:
 * Local Ollama backend through generateResponse().
 *
 * Important:
 * - Never uses anonymous user IDs.
 * - Never invents a conversation ID.
 * - Conversation ID must come from the real Chat/App flow.
 */

import { generateResponse } from './aiService';
import { supabase } from '../auth/supabaseClient';
import { StorageService, StoredMemory } from '../storage';
import {
  ReminderService,
  ReminderItem,
} from '../reminders/reminderService';
import {
  ToolManager,
  ToolExecutionResult,
} from '../tools/toolManager';

export type InferredContext =
  | 'cooking'
  | 'study'
  | 'coding'
  | 'planning'
  | 'reflection'
  | 'social'
  | 'home'
  | 'fitness'
  | 'travel'
  | 'entertainment'
  | 'general';

export type DetectedLanguage =
  | 'english'
  | 'tanglish'
  | 'tamil'
  | 'hindi';

export type RobotReaction =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'success'
  | 'error'
  | 'attention'
  | 'confused'
  | 'happy'
  | 'task_complete';

export type AgentRole =
  | 'personal'
  | 'skills'
  | 'developer'
  | 'safety';

export interface VisualEnvironment {
  context: InferredContext;
  accentColor: string;
  glowColor: string;
  ambientTone: string;
  particlesPreset:
    | 'subtle_cyan'
    | 'warm_amber'
    | 'study_azure'
    | 'matrix_emerald'
    | 'zen_indigo'
    | 'social_violet';
  backdropDescription: string;
}

export interface BrainProcessingResult {
  userInput: string;
  detectedLanguage: DetectedLanguage;
  inferredContext: InferredContext;
  selectedAgent: AgentRole;
  robotReaction: RobotReaction;
  visualEnvironment: VisualEnvironment;
  aiResponseText: string;
  toolResult?: ToolExecutionResult;
  reminderCreated?: ReminderItem;
  memoryRetrieved?: StoredMemory[];
  safetyConfirmationRequired?: {
    actionType: string;
    details: string;
    payload: any;
  };
  followUpSuggestions: string[];
}

type ConversationMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export const AIBrain = {
  /**
   * Main NEXORA cognitive pipeline.
   *
   * conversationId MUST come from the real conversation/chat flow.
   * We intentionally do not invent one here.
   */
  async process(
    prompt: string,
    history: ConversationMessage[] = [],
    soloMode: boolean = false,
    conversationId?: string
  ): Promise<BrainProcessingResult> {
    const rawInput = prompt.trim();

    if (!rawInput) {
      throw new Error('NEXORA received an empty message.');
    }

    const lower = rawInput.toLowerCase();

    // ---------------------------------------------------------
    // 1. LANGUAGE DETECTION
    // ---------------------------------------------------------

    const detectedLanguage = this.detectLanguage(lower);

    // ---------------------------------------------------------
    // 2. CONTEXT UNDERSTANDING
    // ---------------------------------------------------------

    const inferredContext = this.inferContext(lower);

    // ---------------------------------------------------------
    // 3. AGENT SELECTION
    // ---------------------------------------------------------

    const selectedAgent = this.selectAgent(
      inferredContext,
      lower
    );

    // ---------------------------------------------------------
    // 4. MEMORY RETRIEVAL
    // ---------------------------------------------------------

    let memoryRetrieved: StoredMemory[] = [];

    if (!soloMode && lower.length > 5) {
      try {
        const allMemories =
          await StorageService.getMemories();

        memoryRetrieved = allMemories.filter((memory) => {
          if (memory.securityTier === 'critical') {
            return false;
          }

          const categoryMatch = lower.includes(
            memory.category.toLowerCase()
          );

          const keywordMatch = lower
            .split(/\s+/)
            .some(
              (word) =>
                word.length > 3 &&
                memory.content
                  .toLowerCase()
                  .includes(word)
            );

          return categoryMatch || keywordMatch;
        });
      } catch {
        memoryRetrieved = [];
      }
    }

    // ---------------------------------------------------------
    // 5. TOOL / REMINDER PROCESSING
    // ---------------------------------------------------------

    let toolResult: ToolExecutionResult | undefined;
    let reminderCreated: ReminderItem | undefined;

    let safetyConfirmationRequired:
      BrainProcessingResult['safetyConfirmationRequired'];

    const isTanglishReminder =
      lower.includes('reminder podu') ||
      lower.includes('reminder vey') ||
      (lower.includes('naalaiku') &&
        lower.includes('reminder'));

    const isHindiReminder =
      lower.includes('reminder lagao') ||
      lower.includes('yaad dilao') ||
      (lower.includes('kal') &&
        lower.includes('reminder'));

    const isEnglishReminder =
      lower.startsWith('remind me to') ||
      lower.startsWith('create reminder') ||
      lower.includes('set reminder for');

    if (
      isTanglishReminder ||
      isHindiReminder ||
      isEnglishReminder
    ) {
      const parsed =
        this.parseReminderDetails(
          rawInput,
          detectedLanguage
        );

      try {
        reminderCreated =
          await ReminderService.createReminder(
            parsed.title,
            parsed.dueTime,
            parsed.category,
            'high',
            {
              notes:
                `Created via ${detectedLanguage} ` +
                `voice/text parsing`,
            }
          );

        const isOffline = reminderCreated.syncStatus === 'pending_sync';
        const formattedTime = new Date(reminderCreated.dueTime).toLocaleString([], {
          dateStyle: 'short',
          timeStyle: 'short',
        });
        const outputMsg = isOffline
          ? `Reminder saved locally (offline, pending sync): "${reminderCreated.title}" for ${formattedTime}.`
          : `Scheduled reminder: "${reminderCreated.title}" for ${formattedTime}.`;

        toolResult = {
          toolName: 'create_reminder',
          success: true,
          output: outputMsg,
          data: reminderCreated,
        };
      } catch (remErr: any) {
        reminderCreated = undefined;
        toolResult = {
          toolName: 'create_reminder',
          success: false,
          output: `Failed to save reminder to database: ${remErr?.message || 'Database error'}.`,
        };
      }
    } else {
      const toolIntent =
        ToolManager.detectToolIntent(rawInput);

      if (toolIntent) {
        toolResult =
          await ToolManager.execute(
            toolIntent.toolName,
            toolIntent.params
          );
      }
    }

    // ---------------------------------------------------------
    // 6. VISUAL ENVIRONMENT
    // ---------------------------------------------------------

    const visualEnvironment =
      this.getVisualEnvironment(
        inferredContext
      );

    // ---------------------------------------------------------
    // 7. BUILD AI CONTEXT
    // ---------------------------------------------------------

    const contextualHistory:
      ConversationMessage[] = [...history];

    if (memoryRetrieved.length > 0) {
      contextualHistory.unshift({
        role: 'system',
        content:
          `Relevant user context from permitted memory: ` +
          memoryRetrieved
            .map((memory) => memory.content)
            .join('; '),
      });
    }

    // ---------------------------------------------------------
    // 8. AUTHENTICATION
    // ---------------------------------------------------------

    const { data: sessionData } = await supabase.auth.getSession();
    let userId = sessionData?.session?.user?.id;

    if (!userId) {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        throw new Error(
          'NEXORA requires an authenticated user before using the AI Brain.'
        );
      }
      userId = userData.user.id;
    }

    // ---------------------------------------------------------
    // 9. REAL CONVERSATION ID
    // ---------------------------------------------------------
    //
    // Do NOT invent:
    // - anonymous
    // - random IDs
    // - fake conversation IDs
    //
    // The real Chat/App flow must provide this ID.
    //

    if (!conversationId) {
      throw new Error(
        'NEXORA conversation ID is missing. ' +
        'The Chat/App flow must provide the active conversation ID.'
      );
    }

    // ---------------------------------------------------------
    // 10. REAL AI REQUEST
    // ---------------------------------------------------------

    const aiRes =
      await generateResponse({
        userId,
        conversationId,
        message: rawInput,
        context: {
          recentMessages:
            contextualHistory,
          inferredContext,
          language:
            detectedLanguage,
        },
      });

    if (!aiRes?.text) {
      throw new Error(
        'NEXORA AI returned an empty response.'
      );
    }

    // ---------------------------------------------------------
    // 11. ROBOT REACTION
    // ---------------------------------------------------------

    let robotReaction:
      RobotReaction = 'speaking';

    if (toolResult?.success) {
      robotReaction = 'task_complete';
    } else if (
      inferredContext === 'study'
    ) {
      robotReaction = 'attention';
    } else if (
      inferredContext === 'coding'
    ) {
      robotReaction = 'thinking';
    } else if (
      inferredContext === 'social'
    ) {
      robotReaction = 'happy';
    }

    // ---------------------------------------------------------
    // 12. FOLLOW-UP SUGGESTIONS
    // ---------------------------------------------------------

    const followUpSuggestions =
      this.getFollowUpSuggestions(
        inferredContext,
        detectedLanguage
      );

    // ---------------------------------------------------------
    // 13. FINAL BRAIN RESULT
    // ---------------------------------------------------------

    return {
      userInput: rawInput,
      detectedLanguage,
      inferredContext,
      selectedAgent,
      robotReaction,
      visualEnvironment,
      aiResponseText: toolResult
        ? `${toolResult.output}\n\n${aiRes.text}`
        : aiRes.text,
      toolResult,
      reminderCreated,
      memoryRetrieved,
      safetyConfirmationRequired,
      followUpSuggestions,
    };
  },

  // ===========================================================
  // LANGUAGE DETECTION
  // ===========================================================

  detectLanguage(
    lower: string
  ): DetectedLanguage {
    const tanglishWords = [
      'naalaiku',
      'podu',
      'vey',
      'mani',
      'ku',
      'sollu',
      'enna',
      'epdi',
      'pannu',
      'vaanga',
      'iruku',
      'venum',
      'kudu',
      'pannunga',
    ];

    const hindiWords = [
      'kal',
      'subah',
      'shaam',
      'baje',
      'lagao',
      'yaad',
      'karo',
      'kaise',
      'batao',
      'kripya',
    ];

    const tamilScript =
      /[\u0B80-\u0BFF]/.test(lower);

    const words =
      lower.split(/\s+/);

    if (tamilScript) {
      return 'tamil';
    }

    if (
      words.some((word) =>
        tanglishWords.includes(word)
      )
    ) {
      return 'tanglish';
    }

    if (
      words.some((word) =>
        hindiWords.includes(word)
      )
    ) {
      return 'hindi';
    }

    return 'english';
  },

  // ===========================================================
  // CONTEXT INFERENCE
  // ===========================================================

  inferContext(
    lower: string
  ): InferredContext {
    if (
      lower.includes('recipe') ||
      lower.includes('cook') ||
      lower.includes('dinner') ||
      lower.includes('ingredient')
    ) {
      return 'cooking';
    }

    if (
      lower.includes('math') ||
      lower.includes('physics') ||
      lower.includes('calculus') ||
      lower.includes('exam') ||
      lower.includes('study') ||
      lower.includes('pythagor') ||
      lower.includes('syllabus')
    ) {
      return 'study';
    }

    if (
      lower.includes('code') ||
      lower.includes('react') ||
      lower.includes('typescript') ||
      lower.includes('git') ||
      lower.includes('mcp') ||
      lower.includes('bug') ||
      lower.includes('api') ||
      lower.includes('backend')
    ) {
      return 'coding';
    }

    if (
      lower.includes('plan') ||
      lower.includes('schedule') ||
      lower.includes('task') ||
      lower.includes('reminder') ||
      lower.includes('agenda')
    ) {
      return 'planning';
    }

    if (
      lower.includes('feel') ||
      lower.includes('stressed') ||
      lower.includes('reflect') ||
      lower.includes('journal') ||
      lower.includes('mindful')
    ) {
      return 'reflection';
    }

    if (
      lower.includes('friend') ||
      lower.includes('group') ||
      lower.includes('team') ||
      lower.includes('chat') ||
      lower.includes('@nexora')
    ) {
      return 'social';
    }

    if (
      lower.includes('light') ||
      lower.includes('thermostat') ||
      lower.includes('home') ||
      lower.includes('automation')
    ) {
      return 'home';
    }

    if (
      lower.includes('workout') ||
      lower.includes('exercise') ||
      lower.includes('fitness') ||
      lower.includes('gym')
    ) {
      return 'fitness';
    }

    if (
      lower.includes('travel') ||
      lower.includes('flight') ||
      lower.includes('trip') ||
      lower.includes('hotel')
    ) {
      return 'travel';
    }

    if (
      lower.includes('music') ||
      lower.includes('song') ||
      lower.includes('playlist') ||
      lower.includes('movie')
    ) {
      return 'entertainment';
    }

    return 'general';
  },

  // ===========================================================
  // AGENT SELECTION
  // ===========================================================

  selectAgent(
    context: InferredContext,
    lower: string
  ): AgentRole {
    if (
      lower.includes('emergency') ||
      lower.includes('safety') ||
      lower.includes('sos') ||
      lower.includes('delete all')
    ) {
      return 'safety';
    }

    if (context === 'coding') {
      return 'developer';
    }

    if (
      context === 'study' ||
      lower.includes('calculate') ||
      lower.includes('translate') ||
      lower.includes('summarize')
    ) {
      return 'skills';
    }

    return 'personal';
  },

  // ===========================================================
  // VISUAL ENVIRONMENT
  // ===========================================================

  getVisualEnvironment(
    context: InferredContext
  ): VisualEnvironment {
    switch (context) {
      case 'cooking':
        return {
          context,
          accentColor: '#FFB300',
          glowColor:
            'rgba(255, 179, 0, 0.25)',
          ambientTone:
            'Culinary Studio Ambient',
          particlesPreset:
            'warm_amber',
          backdropDescription:
            'Warm amber tones with recipe focus layers',
        };

      case 'study':
        return {
          context,
          accentColor: '#00E5FF',
          glowColor:
            'rgba(0, 229, 255, 0.3)',
          ambientTone:
            'Academic Focus Mode',
          particlesPreset:
            'study_azure',
          backdropDescription:
            'Deep cyan aura with formula breakdown surfaces',
        };

      case 'coding':
        return {
          context,
          accentColor: '#00E676',
          glowColor:
            'rgba(0, 230, 118, 0.25)',
          ambientTone:
            'Software Engineering Matrix',
          particlesPreset:
            'matrix_emerald',
          backdropDescription:
            'Matrix green terminal glow with syntax layers',
        };

      case 'reflection':
        return {
          context,
          accentColor: '#7C4DFF',
          glowColor:
            'rgba(124, 77, 255, 0.2)',
          ambientTone:
            'Mindful Reflection Sanctuary',
          particlesPreset:
            'zen_indigo',
          backdropDescription:
            'Soft twilight gradients with gentle calming cadence',
        };

      case 'social':
        return {
          context,
          accentColor: '#D500F9',
          glowColor:
            'rgba(213, 0, 249, 0.25)',
          ambientTone:
            'Social Collaboration Field',
          particlesPreset:
            'social_violet',
          backdropDescription:
            'Dynamic purple tones for shared friend interactions',
        };

      case 'home':
        return {
          context,
          accentColor: '#00B0FF',
          glowColor:
            'rgba(0, 176, 255, 0.25)',
          ambientTone:
            'Smart IoT Automation Grid',
          particlesPreset:
            'subtle_cyan',
          backdropDescription:
            'Living smart home node status overlays',
        };

      default:
        return {
          context: 'general',
          accentColor: '#00E5FF',
          glowColor:
            'rgba(0, 229, 255, 0.22)',
          ambientTone:
            'Crystal Cosmic Companion',
          particlesPreset:
            'subtle_cyan',
          backdropDescription:
            'Deep cosmic space with glassmorphic layers',
        };
    }
  },

  // ===========================================================
  // REMINDER PARSER
  // ===========================================================

  parseReminderDetails(
    input: string,
    _lang: DetectedLanguage
  ): {
    title: string;
    dueTime: string;
    category: ReminderItem['category'];
  } {
    const lower =
      input.toLowerCase();

    const targetTime = new Date();
    const isTomorrow =
      lower.includes('naalaiku') ||
      lower.includes('kal') ||
      lower.includes('tomorrow');

    const isToday =
      lower.includes('today') ||
      lower.includes('tonight') ||
      lower.includes('inniku') ||
      lower.includes('aaj');

    if (isTomorrow) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    // Match explicit time patterns like "6 AM", "6:30 PM", "18:00", "7 mani", "8 baje"
    const explicitTimeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje|mani|clock|o'clock)?/i);

    let parsedHour: number | null = null;
    let parsedMinute = 0;

    if (explicitTimeMatch && explicitTimeMatch[1]) {
      const rawHour = parseInt(explicitTimeMatch[1], 10);
      const rawMin = explicitTimeMatch[2] ? parseInt(explicitTimeMatch[2], 10) : 0;
      const meridiem = explicitTimeMatch[3] ? explicitTimeMatch[3].toLowerCase() : '';

      if (rawHour >= 0 && rawHour <= 24) {
        parsedHour = rawHour;
        parsedMinute = rawMin;

        const isMorning =
          meridiem === 'am' ||
          lower.includes('morning') ||
          lower.includes('subah') ||
          lower.includes('kaalai') ||
          lower.includes('kalai');

        const isEveningOrNight =
          meridiem === 'pm' ||
          lower.includes('evening') ||
          lower.includes('night') ||
          lower.includes('shaam') ||
          lower.includes('maala') ||
          lower.includes('iravu');

        if (isEveningOrNight && !isMorning && parsedHour < 12) {
          parsedHour += 12;
        } else if (isMorning && parsedHour === 12) {
          parsedHour = 0;
        }
      }
    }

    if (parsedHour !== null) {
      targetTime.setHours(parsedHour, parsedMinute, 0, 0);

      // If time has already passed today and neither tomorrow nor today was explicitly stated, schedule for tomorrow
      if (!isTomorrow && !isToday && targetTime.getTime() <= Date.now()) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
    } else {
      // Default to 4 hours in future
      targetTime.setTime(Date.now() + 4 * 3600 * 1000);
    }

    // Clean title extraction: remove common reminder trigger phrases while preserving actual task subject (e.g. "study", "call mom")
    let cleanedTitle = input
      .replace(/^(remind me to|create reminder to|create reminder for|set reminder for|set reminder to|reminder)\s+/i, '')
      .replace(/(naalaiku|inniku|kal|aaj|tomorrow|today)\s*/gi, '')
      .replace(/(at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|o'clock)?)/gi, '')
      .replace(/(\d{1,2}\s*(?:mani|baje|am|pm)\s*(?:ku)?)/gi, '')
      .replace(/(reminder\s*(?:podu|vey|lagao|karo)?)/gi, '')
      .trim();

    // Remove leading prepositions like "to "
    cleanedTitle = cleanedTitle.replace(/^to\s+/i, '').trim();

    let title = cleanedTitle;

    if (!title || title.length < 2) {
      if (lower.includes('study')) {
        title = 'Study & Revision Sprint';
      } else if (lower.includes('workout') || lower.includes('gym')) {
        title = 'Workout Session';
      } else {
        title = 'Scheduled Focus Item';
      }
    }

    const category:
      ReminderItem['category'] =
      lower.includes('study')
        ? 'study'
        : lower.includes(
            'workout'
          ) ||
          lower.includes('gym')
        ? 'fitness'
        : lower.includes(
            'work'
          ) ||
          lower.includes(
            'project'
          )
        ? 'work'
        : 'personal';

    return {
      title,
      dueTime:
        targetTime.toISOString(),
      category,
    };
  },

  // ===========================================================
  // FOLLOW-UP SUGGESTIONS
  // ===========================================================

  getFollowUpSuggestions(
    context: InferredContext,
    lang: DetectedLanguage
  ): string[] {
    if (
      lang === 'tanglish'
    ) {
      return [
        'Naalaiku study plan kaatu',
        'Exam syllabus review pannu',
        'Living room light podu',
      ];
    }

    if (
      lang === 'tamil'
    ) {
      return [
        'இன்றைய My Day காட்டு',
        'படிப்பு திட்டம் உருவாக்கு',
        'நினைவகத்தைப் பார்',
      ];
    }

    if (
      lang === 'hindi'
    ) {
      return [
        'आज का My Day दिखाओ',
        'स्टडी प्लान बनाओ',
        'मेरी यादें दिखाओ',
      ];
    }

    switch (context) {
      case 'cooking':
        return [
          'Add ingredients to grocery list',
          'Find ingredient substitutions',
          'Start a cooking timer',
        ];

      case 'study':
        return [
          'Start a 3-question active recall quiz',
          'Explain with a practical analogy',
          'Break down the next theorem',
        ];

      case 'coding':
        return [
          'Inspect MCP tool execution',
          'Review React Native performance',
          'Debug the current logic',
        ];

      case 'planning':
        return [
          'View My Day timeline',
          'Show missed reminders',
          'Start a 25-minute focus sprint',
        ];

      case 'social':
        return [
          'Plan a group study session',
          'Create a team milestone',
          'Show team reminders',
        ];

      default:
        return [
          "What's on My Day today?",
          'Start exam revision',
          'Show my reminders',
        ];
    }
  },
};
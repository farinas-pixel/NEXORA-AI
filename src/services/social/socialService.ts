/**
 * NEXORA AI — Friends Chat & Social Collaboration Service
 * Handles 1-on-1 and Group chats with an embedded NEXORA AI assistant layer.
 * Strict Privacy Rule: User's private memory vault is completely isolated from group contexts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderService } from '../reminders/reminderService';

export interface SocialReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface SocialMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions: SocialReaction[];
  attachmentUri?: string;
  aiAction?: {
    type: 'shared_reminder' | 'shared_task' | 'study_poll';
    title: string;
    status: 'suggested' | 'confirmed' | 'executed';
    payload?: any;
  };
}

export interface FriendConversation {
  id: string;
  name: string;
  isGroup: boolean;
  avatarIcon: string;
  members: string[];
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
}

const SOCIAL_CONVERSATIONS_KEY = '@nexora_social_convos_v2';
const SOCIAL_MESSAGES_KEY_PREFIX = '@nexora_social_msgs_v2_';

const DEFAULT_CONVERSATIONS: FriendConversation[] = [
  {
    id: 'grp_engineering',
    name: 'CS & Robotics Hackathon Team',
    isGroup: true,
    avatarIcon: '🤖',
    members: ['You', 'Kavitha', 'Vikram', 'Maya', 'NEXORA'],
    lastMessage: 'Kavitha: @Nexora remind everyone tomorrow at 6 PM for sprint review',
    lastTimestamp: '10:45 AM',
    unreadCount: 1,
  },
  {
    id: 'grp_study',
    name: 'Calculus & Physics Study Group',
    isGroup: true,
    avatarIcon: '📐',
    members: ['You', 'Rahul', 'Sneha', 'NEXORA'],
    lastMessage: 'Rahul: Let us review the Pythagorean vector proof tonight',
    lastTimestamp: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'dm_alex',
    name: 'Alex Chen',
    isGroup: false,
    avatarIcon: '🧑‍💻',
    members: ['You', 'Alex Chen'],
    lastMessage: 'Hey! Did you test the sub-2nm semiconductor benchmark?',
    lastTimestamp: 'Sunday',
    unreadCount: 0,
  },
];

const INITIAL_GROUP_MESSAGES: SocialMessage[] = [
  {
    id: 'msg_1',
    conversationId: 'grp_engineering',
    senderId: 'usr_kavitha',
    senderName: 'Kavitha',
    text: 'Hey team, how is the MCP server endpoint progress coming along?',
    timestamp: '10:40 AM',
    reactions: [{ emoji: '👍', count: 2, userReacted: true }],
  },
  {
    id: 'msg_2',
    conversationId: 'grp_engineering',
    senderId: 'usr_vikram',
    senderName: 'Vikram',
    text: 'JSON-RPC 2.0 validation is finished! 34 automated tests passing.',
    timestamp: '10:42 AM',
    reactions: [{ emoji: '🚀', count: 3, userReacted: true }],
  },
  {
    id: 'msg_3',
    conversationId: 'grp_engineering',
    senderId: 'usr_kavitha',
    senderName: 'Kavitha',
    text: '@Nexora remind everyone tomorrow at 6 PM for sprint review',
    timestamp: '10:45 AM',
    reactions: [],
  },
  {
    id: 'msg_4',
    conversationId: 'grp_engineering',
    senderId: 'nexora_ai',
    senderName: 'NEXORA AI',
    isAi: true,
    text: 'I detected a shared reminder request for tomorrow at 6:00 PM: "Sprint review". Tap below to confirm and sync with everyone\'s planner.',
    timestamp: '10:45 AM',
    reactions: [{ emoji: '⚡', count: 2, userReacted: false }],
    aiAction: {
      type: 'shared_reminder',
      title: 'Sprint review with CS Hackathon Team',
      status: 'suggested',
      payload: {
        title: 'Sprint review with CS Hackathon Team',
        dueTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        category: 'work',
        isShared: true,
        groupName: 'CS & Robotics Hackathon Team',
      },
    },
  },
];

export const SocialService = {
  /**
   * Get all friend conversations
   */
  async getConversations(): Promise<FriendConversation[]> {
    try {
      const data = await AsyncStorage.getItem(SOCIAL_CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : DEFAULT_CONVERSATIONS;
    } catch {
      return DEFAULT_CONVERSATIONS;
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<SocialMessage[]> {
    try {
      const key = `${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`;
      const data = await AsyncStorage.getItem(key);
      if (data) return JSON.parse(data);

      if (conversationId === 'grp_engineering') {
        await AsyncStorage.setItem(key, JSON.stringify(INITIAL_GROUP_MESSAGES));
        return INITIAL_GROUP_MESSAGES;
      }
      return [];
    } catch {
      return conversationId === 'grp_engineering' ? INITIAL_GROUP_MESSAGES : [];
    }
  },

  /**
   * Send a message and process NEXORA AI assistance
   */
  async sendMessage(
    conversationId: string,
    text: string,
    senderName: string = 'You'
  ): Promise<{ userMessage: SocialMessage; aiResponse?: SocialMessage }> {
    const key = `${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`;
    const messages = await this.getMessages(conversationId);

    const userMessage: SocialMessage = {
      id: `smsg_${Date.now()}`,
      conversationId,
      senderId: 'current_user',
      senderName,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };

    let aiResponse: SocialMessage | undefined;

    // Check if message invokes NEXORA: @nexora or asking for a group action
    const lower = text.toLowerCase();
    if (lower.includes('@nexora') || lower.includes('remind everyone') || lower.includes('remind team')) {
      const isReminder = lower.includes('remind');
      if (isReminder) {
        aiResponse = {
          id: `smsg_${Date.now() + 1}`,
          conversationId,
          senderId: 'nexora_ai',
          senderName: 'NEXORA AI',
          isAi: true,
          text: `Got it! I understand the shared reminder: "${text.replace(/@nexora/i, '').trim()}". Tap below to confirm and sync to group schedules.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: [{ emoji: '⚡', count: 1 }],
          aiAction: {
            type: 'shared_reminder',
            title: text.replace(/@nexora|remind everyone|remind team/gi, '').trim() || 'Shared Group Goal',
            status: 'suggested',
            payload: {
              title: text.replace(/@nexora|remind everyone|remind team/gi, '').trim() || 'Shared Group Goal',
              dueTime: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
              category: 'social',
              isShared: true,
              groupId: conversationId,
            },
          },
        };
      } else {
        aiResponse = {
          id: `smsg_${Date.now() + 1}`,
          conversationId,
          senderId: 'nexora_ai',
          senderName: 'NEXORA AI',
          isAi: true,
          text: `NEXORA Group Assistant here! How can I assist the team with scheduling, research, or code debugging?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: [],
        };
      }
    }

    const updated = [...messages, userMessage, ...(aiResponse ? [aiResponse] : [])];
    await AsyncStorage.setItem(key, JSON.stringify(updated));

    // Update conversation list last message preview
    const convos = await this.getConversations();
    const updatedConvos = convos.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: `${senderName}: ${text.slice(0, 35)}...`,
            lastTimestamp: 'Just now',
          }
        : c
    );
    await AsyncStorage.setItem(SOCIAL_CONVERSATIONS_KEY, JSON.stringify(updatedConvos));

    return { userMessage, aiResponse };
  },

  /**
   * Execute shared AI Action (e.g. Confirm shared reminder)
   */
  async confirmSharedAction(
    conversationId: string,
    messageId: string
  ): Promise<{ success: boolean; resultText: string }> {
    const key = `${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`;
    const messages = await this.getMessages(conversationId);

    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.aiAction) {
      return { success: false, resultText: 'Action not found.' };
    }

    // Execute real reminder creation
    if (targetMsg.aiAction.type === 'shared_reminder') {
      const payload = targetMsg.aiAction.payload || {};
      await ReminderService.createReminder(
        payload.title || 'Shared Team Reminder',
        payload.dueTime || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        'social',
        'high',
        { isShared: true, groupId: conversationId, groupName: 'Group Chat' }
      );

      targetMsg.aiAction.status = 'executed';
      targetMsg.text = `✓ Shared reminder confirmed: "${payload.title}". Added to all members' My Day planner.`;
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      return { success: true, resultText: 'Shared reminder successfully scheduled.' };
    }

    return { success: true, resultText: 'Action executed.' };
  },

  /**
   * Add reaction to message
   */
  async toggleReaction(conversationId: string, messageId: string, emoji: string): Promise<SocialMessage[]> {
    const key = `${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`;
    const messages = await this.getMessages(conversationId);

    const updated = messages.map((m) => {
      if (m.id !== messageId) return m;
      const existing = m.reactions.find((r) => r.emoji === emoji);
      let newReactions = [...m.reactions];
      if (existing) {
        if (existing.userReacted) {
          existing.count = Math.max(0, existing.count - 1);
          existing.userReacted = false;
        } else {
          existing.count += 1;
          existing.userReacted = true;
        }
      } else {
        newReactions.push({ emoji, count: 1, userReacted: true });
      }
      return { ...m, reactions: newReactions.filter((r) => r.count > 0) };
    });

    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  },
};

/**
 * NEXORA AI — Friends Chat & Social Collaboration Service
 * Real user search, authentic friendships & requests, 1-on-1 and Group chats
 * with message editing, deletion (for me / everyone), and group admin controls.
 * Strict Privacy Rule: User's private memory vault is completely isolated from group contexts.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from '../auth/supabaseClient';
import { StorageService } from '../storage';
import { ReminderService } from '../reminders/reminderService';

export interface SocialReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface SocialMessage {
  id: string; // RFC4122 UUID
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
  isEdited?: boolean;
  isDeletedEveryone?: boolean;
  deletedFor?: string[];
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
  adminIds?: string[];
  createdBy?: string;
}

export interface UserProfileSearchResult {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface FriendshipRecord {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendEmail?: string;
  status: 'pending' | 'accepted' | 'declined';
  isIncoming: boolean;
  createdAt: string;
}

const SOCIAL_CONVERSATIONS_KEY = '@nexora_social_convos_v3';
const SOCIAL_MESSAGES_KEY_PREFIX = '@nexora_social_msgs_v3_';
const FRIENDSHIPS_KEY = '@nexora_friendships_v3';
const HIDDEN_CONVOS_KEY = '@nexora_hidden_convos_v3';

/**
 * Generate a valid RFC4122 v4 UUID
 */
export function generateUUID(): string {
  try {
    if (Crypto && typeof Crypto.randomUUID === 'function') {
      return Crypto.randomUUID();
    }
  } catch {}

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const SocialService = {
  /**
   * Helper to get current authenticated user ID
   */
  async getCurrentUserId(): Promise<string> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.user?.id || 'local_user';
    } catch {
      return 'local_user';
    }
  },

  /**
   * Deterministic symmetric Direct Message conversation ID
   * Guarantees both User A and User B map to the identical conversation partition.
   */
  getDirectConversationId(userId1: string, userId2: string): string {
    const sorted = [userId1, userId2].sort();
    return `dm_${sorted[0]}_${sorted[1]}`;
  },

  /**
   * Sync active profile to public directory for discovery
   */
  async syncPublicProfile(name: string, email?: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId || userId === 'local_user') return;

      await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: name,
          email: email || null,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('[SocialService] syncPublicProfile error:', err);
    }
  },

  /**
   * Search real registered users by name or email
   */
  async searchUsers(query: string): Promise<UserProfileSearchResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const currentUserId = await this.getCurrentUserId();

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .neq('id', currentUserId)
        .or(`full_name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .limit(10);

      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.email?.split('@')[0] || 'User',
          email: u.email,
          avatarUrl: u.avatar_url,
        }));
      }
    } catch (err) {
      console.warn('[SocialService] searchUsers error:', err);
    }

    // Return empty array for genuinely new or unindexed queries (Zero Fake Profiles)
    return [];
  },

  /**
   * Send a connection request to a registered user
   */
  async sendFriendRequest(targetUser: UserProfileSearchResult): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId || currentUserId === 'local_user' || currentUserId === targetUser.id) {
      return false;
    }

    const requestRecord: FriendshipRecord = {
      id: generateUUID(),
      userId: currentUserId,
      friendId: targetUser.id,
      friendName: targetUser.name,
      friendEmail: targetUser.email,
      status: 'pending',
      isIncoming: false,
      createdAt: new Date().toISOString(),
    };

    let remoteSuccess = false;
    try {
      const { data, error } = await supabase
        .from('friendships')
        .insert({
          id: requestRecord.id,
          user_id: currentUserId,
          friend_id: targetUser.id,
          status: 'pending',
        })
        .select('id')
        .single();

      if (!error && data) {
        remoteSuccess = true;
      } else if (error) {
        console.warn('[SocialService] sendFriendRequest remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] sendFriendRequest exception:', err);
    }

    // Update local cache
    const localCached = await AsyncStorage.getItem(FRIENDSHIPS_KEY).catch(() => null);
    const existing: FriendshipRecord[] = localCached ? JSON.parse(localCached) : [];
    const updated = [
      requestRecord,
      ...existing.filter((f) => !(f.userId === currentUserId && f.friendId === targetUser.id)),
    ];
    await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updated)).catch(() => {});

    return remoteSuccess || currentUserId === 'local_user';
  },

  /**
   * Get all friendship records (accepted friends + pending requests)
   */
  async getFriendships(): Promise<FriendshipRecord[]> {
    const currentUserId = await this.getCurrentUserId();
    if (!currentUserId || currentUserId === 'local_user') {
      const localCached = await AsyncStorage.getItem(FRIENDSHIPS_KEY).catch(() => null);
      return localCached ? JSON.parse(localCached) : [];
    }

    try {
      // Primary query: embedded profile join
      const { data, error } = await supabase
        .from('friendships')
        .select('*, user:user_id(id, full_name, email), friend:friend_id(id, full_name, email)')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const records: FriendshipRecord[] = data.map((row: any) => {
          const isIncoming = row.friend_id === currentUserId;
          const other = isIncoming ? row.user : row.friend;
          return {
            id: row.id,
            userId: row.user_id,
            friendId: isIncoming ? row.user_id : row.friend_id,
            friendName: other?.full_name || 'Friend',
            friendEmail: other?.email,
            status: row.status,
            isIncoming,
            createdAt: row.created_at,
          };
        });
        await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(records)).catch(() => {});
        return records;
      }

      // Fallback query if embedded join fails due to schema transition
      const { data: plainData, error: plainError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (!plainError && plainData) {
        const records: FriendshipRecord[] = plainData.map((row: any) => {
          const isIncoming = row.friend_id === currentUserId;
          return {
            id: row.id,
            userId: row.user_id,
            friendId: isIncoming ? row.user_id : row.friend_id,
            friendName: 'Friend',
            status: row.status,
            isIncoming,
            createdAt: row.created_at,
          };
        });
        await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(records)).catch(() => {});
        return records;
      }
    } catch (err) {
      console.warn('[SocialService] getFriendships remote error:', err);
    }

    const localCached = await AsyncStorage.getItem(FRIENDSHIPS_KEY).catch(() => null);
    return localCached ? JSON.parse(localCached) : [];
  },

  /**
   * Accept incoming friend request
   */
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    let remoteSuccess = false;
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        remoteSuccess = true;
      } else {
        console.warn('[SocialService] acceptFriendRequest remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] acceptFriendRequest exception:', err);
    }

    const localCached = await AsyncStorage.getItem(FRIENDSHIPS_KEY).catch(() => null);
    if (localCached) {
      const existing: FriendshipRecord[] = JSON.parse(localCached);
      const updated = existing.map((f) => (f.id === requestId ? { ...f, status: 'accepted' as const } : f));
      await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updated)).catch(() => {});
    }
    return remoteSuccess;
  },

  /**
   * Decline incoming friend request
   */
  async declineFriendRequest(requestId: string): Promise<boolean> {
    let remoteSuccess = false;
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        remoteSuccess = true;
      } else {
        console.warn('[SocialService] declineFriendRequest remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] declineFriendRequest exception:', err);
    }

    const localCached = await AsyncStorage.getItem(FRIENDSHIPS_KEY).catch(() => null);
    if (localCached) {
      const existing: FriendshipRecord[] = JSON.parse(localCached);
      const updated = existing.filter((f) => f.id !== requestId);
      await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(updated)).catch(() => {});
    }
    return remoteSuccess;
  },

  /**
   * Retrieve active conversations for accepted friends and groups
   */
  async getConversations(): Promise<FriendConversation[]> {
    const currentUserId = await this.getCurrentUserId();
    const hiddenCached = await AsyncStorage.getItem(HIDDEN_CONVOS_KEY).catch(() => null);
    const hiddenIds: string[] = hiddenCached ? JSON.parse(hiddenCached) : [];

    const friendships = await this.getFriendships();
    const acceptedFriends = friendships.filter((f) => f.status === 'accepted');

    // 1-on-1 Direct Messages with symmetric conversation IDs
    const friendConvos: FriendConversation[] = acceptedFriends.map((f) => ({
      id: this.getDirectConversationId(currentUserId, f.friendId),
      name: f.friendName,
      isGroup: false,
      avatarIcon: '👤',
      members: ['You', f.friendName],
      lastMessage: 'Tap to chat with ' + f.friendName,
      lastTimestamp: 'Now',
      unreadCount: 0,
    }));

    // Groups
    let groups: FriendConversation[] = [];
    try {
      const { data, error } = await supabase
        .from('social_groups')
        .select('*')
        .contains('member_ids', [currentUserId]);

      if (!error && data) {
        groups = data.map((g: any) => ({
          id: `grp_${g.id}`,
          name: g.name,
          isGroup: true,
          avatarIcon: '👥',
          members: ['You', ...(g.member_names || [])],
          lastMessage: 'Group active',
          lastTimestamp: 'Recent',
          unreadCount: 0,
          adminIds: g.admin_ids,
          createdBy: g.created_by,
        }));
      }
    } catch (err) {
      console.warn('[SocialService] getConversations groups error:', err);
    }

    const combined = [...friendConvos, ...groups].filter((c) => !hiddenIds.includes(c.id));
    return combined;
  },

  /**
   * Retrieve messages for an active conversation
   */
  async getMessages(conversationId: string): Promise<SocialMessage[]> {
    const currentUserId = await this.getCurrentUserId();

    try {
      const { data, error } = await supabase
        .from('social_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        const msgs: SocialMessage[] = data
          .filter((row: any) => !row.deleted_for?.includes(currentUserId))
          .map((row: any) => ({
            id: row.id,
            conversationId: row.conversation_id,
            senderId: row.sender_id,
            senderName: row.sender_id === currentUserId ? 'You' : row.sender_name,
            text: row.is_deleted_everyone ? 'This message was deleted' : row.text,
            timestamp: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEdited: row.is_edited,
            isDeletedEveryone: row.is_deleted_everyone,
            deletedFor: row.deleted_for || [],
            reactions: row.reactions || [],
          }));

        await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(msgs)).catch(() => {});
        return msgs;
      }
    } catch (err) {
      console.warn('[SocialService] getMessages remote error:', err);
    }

    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    return cached ? JSON.parse(cached) : [];
  },

  /**
   * Send a persistent message into a 1-to-1 or group chat
   */
  async sendMessage(
    conversationId: string,
    text: string,
    senderName: string = 'You'
  ): Promise<SocialMessage> {
    const currentUserId = await this.getCurrentUserId();
    const messageUuid = generateUUID();

    const newMsg: SocialMessage = {
      id: messageUuid,
      conversationId,
      senderId: currentUserId,
      senderName: 'You',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: [],
    };

    // Save locally immediately
    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    const list: SocialMessage[] = cached ? JSON.parse(cached) : [];
    await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify([...list, newMsg])).catch(() => {});

    // Unhide if conversation was previously hidden
    await this.unhideConversation(conversationId);

    // Persist to remote Supabase
    try {
      const { error } = await supabase
        .from('social_messages')
        .insert({
          id: messageUuid,
          conversation_id: conversationId,
          sender_id: currentUserId,
          sender_name: senderName,
          text: text.trim(),
        });

      if (error) {
        console.warn('[SocialService] sendMessage remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] sendMessage exception:', err);
    }

    return newMsg;
  },

  /**
   * Edit a message (only permitted by sender)
   */
  async editMessage(conversationId: string, messageId: string, newText: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    let remoteSuccess = false;

    try {
      const { error } = await supabase
        .from('social_messages')
        .update({
          text: newText.trim(),
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', currentUserId);

      if (!error) {
        remoteSuccess = true;
      } else {
        console.warn('[SocialService] editMessage remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] editMessage exception:', err);
    }

    // Update local cache
    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    if (cached) {
      const list: SocialMessage[] = JSON.parse(cached);
      const updated = list.map((m) => (m.id === messageId ? { ...m, text: newText.trim(), isEdited: true } : m));
      await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(updated)).catch(() => {});
    }

    return remoteSuccess || currentUserId === 'local_user';
  },

  /**
   * Delete message for current user only
   */
  async deleteMessageForMe(conversationId: string, messageId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    let remoteSuccess = false;

    try {
      // 1. Attempt secure RPC procedure
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('delete_social_message_for_me', {
        p_message_id: messageId,
      });

      if (!rpcError && rpcSuccess === true) {
        remoteSuccess = true;
      } else {
        // 2. Direct array append fallback
        const { data } = await supabase.from('social_messages').select('deleted_for').eq('id', messageId).single();
        const existingDeleted: string[] = data?.deleted_for || [];
        if (!existingDeleted.includes(currentUserId)) {
          const { error: updateError } = await supabase
            .from('social_messages')
            .update({ deleted_for: [...existingDeleted, currentUserId] })
            .eq('id', messageId);
          if (!updateError) remoteSuccess = true;
        } else {
          remoteSuccess = true;
        }
      }
    } catch (err) {
      console.warn('[SocialService] deleteMessageForMe remote error:', err);
    }

    // Update local cache
    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    if (cached) {
      const list: SocialMessage[] = JSON.parse(cached);
      const updated = list.filter((m) => m.id !== messageId);
      await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(updated)).catch(() => {});
    }

    return remoteSuccess || currentUserId === 'local_user';
  },

  /**
   * Delete message for everyone (sender or group admin)
   */
  async deleteMessageForEveryone(conversationId: string, messageId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    let remoteSuccess = false;

    try {
      const { error } = await supabase
        .from('social_messages')
        .update({
          is_deleted_everyone: true,
          text: 'This message was deleted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (!error) {
        remoteSuccess = true;
      } else {
        console.warn('[SocialService] deleteMessageForEveryone remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] deleteMessageForEveryone exception:', err);
    }

    // Update local cache
    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    if (cached) {
      const list: SocialMessage[] = JSON.parse(cached);
      const updated = list.map((m) =>
        m.id === messageId
          ? { ...m, text: 'This message was deleted', isDeletedEveryone: true }
          : m
      );
      await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(updated)).catch(() => {});
    }

    return remoteSuccess || currentUserId === 'local_user';
  },

  /**
   * Clear chat history for the current user's view
   * Remotely tags all existing messages in this conversation as deleted for the current user.
   */
  async clearChat(conversationId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    let remoteSuccess = false;

    try {
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('clear_social_chat_for_user', {
        p_conversation_id: conversationId,
      });

      if (!rpcError && rpcSuccess === true) {
        remoteSuccess = true;
      }
    } catch (err) {
      console.warn('[SocialService] clearChat remote error:', err);
    }

    // Clear local cache
    await AsyncStorage.removeItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => {});

    return remoteSuccess || currentUserId === 'local_user';
  },

  /**
   * Delete / Hide chat from current user's list
   */
  async deleteChat(conversationId: string): Promise<boolean> {
    const hiddenCached = await AsyncStorage.getItem(HIDDEN_CONVOS_KEY).catch(() => null);
    const hiddenIds: string[] = hiddenCached ? JSON.parse(hiddenCached) : [];
    if (!hiddenIds.includes(conversationId)) {
      hiddenIds.push(conversationId);
      await AsyncStorage.setItem(HIDDEN_CONVOS_KEY, JSON.stringify(hiddenIds)).catch(() => {});
    }
    return await this.clearChat(conversationId);
  },

  async unhideConversation(conversationId: string): Promise<void> {
    const hiddenCached = await AsyncStorage.getItem(HIDDEN_CONVOS_KEY).catch(() => null);
    if (hiddenCached) {
      const hiddenIds: string[] = JSON.parse(hiddenCached);
      const filtered = hiddenIds.filter((id) => id !== conversationId);
      await AsyncStorage.setItem(HIDDEN_CONVOS_KEY, JSON.stringify(filtered)).catch(() => {});
    }
  },

  /**
   * Create a genuine social chat group with member selection
   * Persists using valid database UUIDs without temporary ID discrepancies.
   */
  async createGroup(name: string, selectedFriendIds: string[], memberNames: string[] = []): Promise<FriendConversation> {
    const currentUserId = await this.getCurrentUserId();
    const groupUuid = generateUUID();
    const allMemberIds = Array.from(new Set([currentUserId, ...selectedFriendIds]));

    let finalGroupId = `grp_${groupUuid}`;
    try {
      const { data, error } = await supabase
        .from('social_groups')
        .insert({
          id: groupUuid,
          name: name.trim(),
          created_by: currentUserId,
          admin_ids: [currentUserId],
          member_ids: allMemberIds,
        })
        .select('id, name, created_by, admin_ids, member_ids')
        .single();

      if (!error && data) {
        finalGroupId = `grp_${data.id}`;
      } else if (error) {
        console.warn('[SocialService] createGroup remote error:', error.message);
      }
    } catch (err) {
      console.warn('[SocialService] createGroup exception:', err);
    }

    const newGroup: FriendConversation = {
      id: finalGroupId,
      name: name.trim(),
      isGroup: true,
      avatarIcon: '👥',
      members: ['You', ...memberNames],
      lastMessage: 'Group created',
      lastTimestamp: 'Now',
      unreadCount: 0,
      adminIds: [currentUserId],
      createdBy: currentUserId,
    };

    return newGroup;
  },

  /**
   * Add members to group (Admin only)
   */
  async addMembersToGroup(groupId: string, newMemberIds: string[]): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    const cleanUuid = groupId.replace(/^grp_/, '');

    try {
      const { data } = await supabase
        .from('social_groups')
        .select('admin_ids, member_ids')
        .eq('id', cleanUuid)
        .single();

      if (data && data.admin_ids?.includes(currentUserId)) {
        const merged = Array.from(new Set([...(data.member_ids || []), ...newMemberIds]));
        const { error } = await supabase
          .from('social_groups')
          .update({ member_ids: merged })
          .eq('id', cleanUuid);

        return !error;
      }
    } catch (err) {
      console.warn('[SocialService] addMembersToGroup error:', err);
    }
    return false;
  },

  /**
   * Leave group voluntarily (Non-admin or Admin)
   */
  async leaveGroup(groupId: string): Promise<boolean> {
    const currentUserId = await this.getCurrentUserId();
    const cleanUuid = groupId.replace(/^grp_/, '');

    // 1. Attempt secure RPC leave procedure
    try {
      const { data: rpcSuccess, error: rpcError } = await supabase.rpc('leave_social_group', {
        p_group_id: cleanUuid,
      });

      if (!rpcError && rpcSuccess === true) {
        return true;
      }
    } catch {}

    // 2. Direct row update fallback
    try {
      const { data } = await supabase
        .from('social_groups')
        .select('admin_ids, member_ids')
        .eq('id', cleanUuid)
        .single();

      if (data) {
        const updatedMembers = (data.member_ids || []).filter((id: string) => id !== currentUserId);
        let updatedAdmins = (data.admin_ids || []).filter((id: string) => id !== currentUserId);
        if (updatedAdmins.length === 0 && updatedMembers.length > 0) {
          updatedAdmins = [updatedMembers[0]];
        }
        const { error } = await supabase
          .from('social_groups')
          .update({ member_ids: updatedMembers, admin_ids: updatedAdmins })
          .eq('id', cleanUuid);

        return !error;
      }
    } catch (err) {
      console.warn('[SocialService] leaveGroup error:', err);
    }
    return false;
  },

  /**
   * Toggle emoji reactions
   */
  async toggleReaction(
    conversationId: string,
    messageId: string,
    emoji: string
  ): Promise<void> {
    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    if (!cached) return;

    const messages: SocialMessage[] = JSON.parse(cached);
    const target = messages.find((m) => m.id === messageId);
    if (!target) return;

    const existingReaction = target.reactions.find((r) => r.emoji === emoji);
    if (existingReaction) {
      if (existingReaction.userReacted) {
        existingReaction.count = Math.max(0, existingReaction.count - 1);
        existingReaction.userReacted = false;
      } else {
        existingReaction.count += 1;
        existingReaction.userReacted = true;
      }
      target.reactions = target.reactions.filter((r) => r.count > 0);
    } else {
      target.reactions.push({ emoji, count: 1, userReacted: true });
    }

    await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(messages)).catch(() => {});
  },

  /**
   * Confirm shared actionable reminders
   */
  async confirmSharedAction(
    conversationId: string,
    messageId: string
  ): Promise<{ success: boolean; resultText?: string }> {
    const cached = await AsyncStorage.getItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`).catch(() => null);
    if (!cached) return { success: false };

    const messages: SocialMessage[] = JSON.parse(cached);
    const target = messages.find((m) => m.id === messageId);
    if (!target || !target.aiAction) return { success: false };

    target.aiAction.status = 'confirmed';
    await AsyncStorage.setItem(`${SOCIAL_MESSAGES_KEY_PREFIX}${conversationId}`, JSON.stringify(messages)).catch(() => {});

    if (target.aiAction.type === 'shared_reminder') {
      const dueTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await ReminderService.createReminder(
        target.aiAction.title,
        dueTime,
        'social',
        'high',
        { isShared: true }
      );
      return { success: true, resultText: `Scheduled: ${target.aiAction.title}` };
    }

    return { success: true, resultText: 'Confirmed' };
  },
};

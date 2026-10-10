import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NexAvatar } from '../components/avatar/NexAvatar';
import {
  SocialService,
  FriendConversation,
  SocialMessage,
  SocialReaction,
} from '../services/social/socialService';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import type { ScreenNavProp } from '../types/navigation';

interface FriendsChatScreenProps {
  navigation: ScreenNavProp<'FriendsChat'>;
}

export const FriendsChatScreen: React.FC<FriendsChatScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<FriendConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('grp_engineering');
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [inputText, setInputText] = useState('');

  const loadConversations = useCallback(async () => {
    const list = await SocialService.getConversations();
    setConversations(list);
    if (list.length > 0 && !activeConvId) {
      setActiveConvId(list[0].id);
    }
  }, [activeConvId]);

  const loadMessages = useCallback(async (convId: string) => {
    const msgs = await SocialService.getMessages(convId);
    setMessages(msgs);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  const activeConversation =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConversation) return;
    const textToSend = inputText.trim();
    setInputText('');

    await SocialService.sendMessage(activeConversation.id, textToSend, 'You');
    await loadMessages(activeConversation.id);
  };

  const handleConfirmAction = async (messageId: string) => {
    if (!activeConversation) return;
    const result = await SocialService.confirmSharedAction(activeConversation.id, messageId);
    if (result.success) {
      Alert.alert('Action Confirmed', result.resultText || 'Shared reminder scheduled.');
      await loadMessages(activeConversation.id);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversation) return;
    await SocialService.toggleReaction(activeConversation.id, messageId, emoji);
    await loadMessages(activeConversation.id);
  };

  const handleBottomTabPress = (tab: TabName) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Plan' || tab === 'MyDay') navigation.navigate('MyDay');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Profile' || tab === 'MyLife') navigation.navigate('MyLife');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Social & Collaborations</Text>
          <Text style={styles.title}>Friends Space</Text>
        </View>
        <NexAvatar variant="happy" size="sm" />
      </View>

      {/* Strict Memory Isolation Disclosure */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyText}>
          🔒 Sovereign Vault Isolation: Private habits and confidential memories are strictly airgapped from all group chats.
        </Text>
      </View>

      {/* Conversation Selector Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.convScroll}>
        {conversations.map((conv) => {
          const isSelected = conv.id === activeConvId;
          return (
            <TouchableOpacity
              key={conv.id}
              style={[styles.convChip, isSelected && styles.convChipActive]}
              onPress={() => setActiveConvId(conv.id)}
            >
              <Text style={styles.convChipIcon}>{conv.avatarIcon}</Text>
              <Text style={[styles.convChipName, isSelected && styles.convChipNameActive]}>
                {conv.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Messages Scroll Area */}
      <ScrollView contentContainerStyle={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((msg: SocialMessage) => {
          const isMe = msg.senderName === 'You';
          const isAi = msg.isAi;

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isMe ? styles.messageRowMe : styles.messageRowOther,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? styles.bubbleMe
                    : isAi
                    ? styles.bubbleNexora
                    : styles.bubbleOther,
                ]}
              >
                <View style={styles.bubbleHeader}>
                  <Text
                    style={[
                      styles.senderName,
                      isAi && { color: theme.colors.accent.primary },
                    ]}
                  >
                    {msg.senderName}
                  </Text>
                  <Text style={styles.msgTime}>{msg.timestamp}</Text>
                </View>

                <Text style={styles.bubbleText}>{msg.text}</Text>

                {/* AI Shared Action Card */}
                {msg.aiAction && msg.aiAction.status === 'suggested' && (
                  <GlassCard style={styles.aiActionCard}>
                    <Text style={styles.aiActionTitle}>🤖 Shared Group Action</Text>
                    <Text style={styles.aiActionDesc}>{msg.aiAction.title}</Text>
                    <TouchableOpacity
                      style={styles.confirmActionBtn}
                      onPress={() => handleConfirmAction(msg.id)}
                    >
                      <Text style={styles.confirmActionBtnText}>Confirm & Add to Planner</Text>
                    </TouchableOpacity>
                  </GlassCard>
                )}

                {msg.aiAction && msg.aiAction.status === 'confirmed' && (
                  <View style={styles.confirmedPill}>
                    <Text style={styles.confirmedPillText}>✓ Synced to Group Planners</Text>
                  </View>
                )}

                {/* Emoji Reactions Bar */}
                <View style={styles.reactionsBar}>
                  {(msg.reactions || []).map((reaction: SocialReaction) => {
                    if (reaction.count <= 0) return null;
                    return (
                      <TouchableOpacity
                        key={reaction.emoji}
                        style={[
                          styles.reactionTag,
                          reaction.userReacted && styles.reactionTagActive,
                        ]}
                        onPress={() => handleReaction(msg.id, reaction.emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                        <Text style={styles.reactionCount}>{reaction.count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* Quick Reaction Triggers */}
                  <TouchableOpacity
                    style={styles.addReactionBtn}
                    onPress={() => handleReaction(msg.id, '👍')}
                  >
                    <Text style={styles.addReactionText}>+ 👍</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addReactionBtn}
                    onPress={() => handleReaction(msg.id, '❤️')}
                  >
                    <Text style={styles.addReactionText}>+ ❤️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message or '@Nexora remind everyone tomorrow...'"
          placeholderTextColor={theme.colors.text.muted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Dock Navigation */}
      <BottomNavBar activeTab="Friends" onTabPress={handleBottomTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  privacyBanner: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    marginHorizontal: theme.spacing.lg,
    marginTop: 10,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
  },
  privacyText: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    lineHeight: 14,
  },
  convScroll: {
    paddingHorizontal: theme.spacing.lg,
    marginVertical: 10,
    maxHeight: 44,
  },
  convChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  convChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  convChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  convChipName: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  convChipNameActive: {
    color: theme.colors.accent.primary,
  },
  messagesContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 16,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: theme.borderRadius.lg,
  },
  bubbleMe: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderWidth: 1,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  bubbleNexora: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  msgTime: {
    color: theme.colors.text.muted,
    fontSize: 9,
    marginLeft: 8,
  },
  bubbleText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  aiActionCard: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  aiActionTitle: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  aiActionDesc: {
    color: theme.colors.text.primary,
    fontSize: 11,
    marginTop: 2,
  },
  confirmActionBtn: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  confirmActionBtnText: {
    color: '#000000',
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  confirmedPill: {
    marginTop: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  confirmedPillText: {
    color: '#10B981',
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  reactionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  reactionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  reactionTagActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: theme.colors.text.primary,
    marginLeft: 4,
    fontFamily: theme.typography.fontFamily.bold,
  },
  addReactionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  addReactionText: {
    fontSize: 9,
    color: theme.colors.text.muted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(11, 18, 36, 0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
  },
  sendButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#000000',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.xs,
  },
});

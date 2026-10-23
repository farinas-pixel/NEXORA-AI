import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { useApp } from '../context/AppContext';
import {
  SocialService,
  FriendConversation,
  SocialMessage,
  UserProfileSearchResult,
  FriendshipRecord,
} from '../services/social/socialService';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import type { ScreenNavProp } from '../types/navigation';

interface FriendsChatScreenProps {
  navigation: ScreenNavProp<'FriendsChat'>;
}

type FriendsTab = 'friends' | 'chats' | 'all' | 'groups';

export const FriendsChatScreen: React.FC<FriendsChatScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, t } = useApp();

  const [activeTab, setActiveTab] = useState<FriendsTab>('friends');
  const [conversations, setConversations] = useState<FriendConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [inputText, setInputText] = useState('');

  // Friendships & User Search State
  const [friendships, setFriendships] = useState<FriendshipRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfileSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequestUserIds, setSentRequestUserIds] = useState<string[]>([]);

  // Create Group Modal State
  const [isCreateGroupModalVisible, setIsCreateGroupModalVisible] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);

  // Message Action Sheet State
  const [selectedMessage, setSelectedMessage] = useState<SocialMessage | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editText, setEditText] = useState('');

  // Sync public profile on mount
  useEffect(() => {
    if (user?.name) {
      SocialService.syncPublicProfile(user.name, user.email);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    const [convList, fList] = await Promise.all([
      SocialService.getConversations(),
      SocialService.getFriendships(),
    ]);
    setConversations(convList);
    setFriendships(fList);
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const msgs = await SocialService.getMessages(convId);
    setMessages(msgs);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId, loadMessages]);

  // Search real registered users
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await SocialService.searchUsers(searchQuery);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendFriendRequest = async (target: UserProfileSearchResult) => {
    setSentRequestUserIds((prev) => [...prev, target.id]);
    await SocialService.sendFriendRequest(target);
    await loadData();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.alert) window.alert(`Connection request sent to ${target.name}.`);
    } else {
      Alert.alert('Request Sent', `Connection request sent to ${target.name}.`);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    await SocialService.acceptFriendRequest(requestId);
    await loadData();
  };

  const handleDeclineRequest = async (requestId: string) => {
    await SocialService.declineFriendRequest(requestId);
    await loadData();
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeConvId) return;
    const textToSend = inputText.trim();
    setInputText('');

    await SocialService.sendMessage(activeConvId, textToSend, user?.name || 'You');
    await loadMessages(activeConvId);
  };

  const handleOpenConversation = (convId: string) => {
    setActiveConvId(convId);
  };

  const handleBackToConvos = () => {
    setActiveConvId(null);
    loadData();
  };

  // Message Actions
  const handleOpenMessageActions = (msg: SocialMessage) => {
    setSelectedMessage(msg);
  };

  const handleStartEditMessage = () => {
    if (!selectedMessage) return;
    setEditText(selectedMessage.text);
    setIsEditModalVisible(true);
  };

  const handleSaveEditMessage = async () => {
    if (!selectedMessage || !activeConvId || !editText.trim()) return;
    await SocialService.editMessage(activeConvId, selectedMessage.id, editText.trim());
    setIsEditModalVisible(false);
    setSelectedMessage(null);
    await loadMessages(activeConvId);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage || !activeConvId) return;
    await SocialService.deleteMessageForMe(activeConvId, selectedMessage.id);
    setSelectedMessage(null);
    await loadMessages(activeConvId);
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || !activeConvId) return;
    await SocialService.deleteMessageForEveryone(activeConvId, selectedMessage.id);
    setSelectedMessage(null);
    await loadMessages(activeConvId);
  };

  const handleClearChat = async () => {
    if (!activeConvId) return;
    const perform = async () => {
      await SocialService.clearChat(activeConvId);
      setMessages([]);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && window.confirm('Clear all messages from your view?')) {
        await perform();
      }
      return;
    }

    Alert.alert('Clear Chat', 'Clear all messages from your view?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: perform },
    ]);
  };

  const handleDeleteChat = async () => {
    if (!activeConvId) return;
    const perform = async () => {
      await SocialService.deleteChat(activeConvId);
      setActiveConvId(null);
      await loadData();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && window.confirm('Delete this conversation from your list?')) {
        await perform();
      }
      return;
    }

    Alert.alert('Delete Chat', 'Delete this conversation from your list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: perform },
    ]);
  };

  const handleLeaveGroup = async () => {
    if (!activeConvId || !activeConversation?.isGroup) return;
    const perform = async () => {
      await SocialService.leaveGroup(activeConvId);
      setActiveConvId(null);
      await loadData();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && window.confirm('Leave this group?')) {
        await perform();
      }
      return;
    }

    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: perform },
    ]);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Validation', 'Please enter a group name.');
      return;
    }
    const memberNames = friendships
      .filter((f) => selectedFriendIds.includes(f.friendId))
      .map((f) => f.friendName);

    const created = await SocialService.createGroup(newGroupName.trim(), selectedFriendIds, memberNames);
    setIsCreateGroupModalVisible(false);
    setNewGroupName('');
    setSelectedFriendIds([]);
    await loadData();
    setActiveConvId(created.id);
  };

  const handleToggleSelectFriend = (friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleConfirmAction = async (messageId: string) => {
    if (!activeConvId) return;
    const result = await SocialService.confirmSharedAction(activeConvId, messageId);
    if (result.success) {
      Alert.alert('Action Confirmed', result.resultText || 'Shared reminder scheduled.');
      await loadMessages(activeConvId);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeConvId) return;
    await SocialService.toggleReaction(activeConvId, messageId, emoji);
    await loadMessages(activeConvId);
  };

  const handleBottomTabPress = (tab: TabName) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Plan' || tab === 'MyDay') navigation.navigate('MyDay');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Profile' || tab === 'MyLife') navigation.navigate('MyLife');
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId);
  const pendingRequests = friendships.filter((f) => f.status === 'pending');
  const acceptedFriends = friendships.filter((f) => f.status === 'accepted');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => (activeConvId ? handleBackToConvos() : navigation.goBack())}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.eyebrow}>Social & Collaborations</Text>
          <Text style={styles.title}>
            {activeConversation ? activeConversation.name : t('friends_title')}
          </Text>
        </View>
        {activeConvId ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleClearChat} style={styles.headerActionBtn}>
              <Ionicons name="brush-outline" size={18} color={theme.colors.text.secondary} />
            </TouchableOpacity>
            {activeConversation?.isGroup && (
              <TouchableOpacity onPress={handleLeaveGroup} style={styles.headerActionBtn}>
                <Ionicons name="exit-outline" size={18} color="#F59E0B" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleDeleteChat} style={styles.headerActionBtn}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.status.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <NexAvatar variant="happy" size="sm" />
        )}
      </View>

      {/* Sovereign Vault Isolation Disclosure */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyText}>
          🔒 Sovereign Vault Isolation: Private habits and confidential memories are strictly airgapped from all group chats.
        </Text>
      </View>

      {/* When in Active Conversation: Render Chat View */}
      {activeConvId && activeConversation ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.messagesContainer}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyView}>
                <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.text.tertiary} />
                <Text style={styles.emptyText}>{t('friends_empty_chats')}</Text>
              </View>
            ) : (
              messages.map((msg: SocialMessage) => {
                const isMe = msg.senderName === 'You';
                const isAi = msg.isAi;

                return (
                  <TouchableOpacity
                    key={msg.id}
                    onLongPress={() => handleOpenMessageActions(msg)}
                    activeOpacity={0.9}
                    style={[
                      styles.messageRow,
                      isMe ? styles.messageRowMe : styles.messageRowOther,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleOther,
                        isAi ? styles.bubbleAi : null,
                      ]}
                    >
                      {!isMe && (
                        <Text style={[styles.senderName, isAi ? styles.senderNameAi : null]}>
                          {msg.senderName}
                        </Text>
                      )}

                      <Text
                        style={[
                          styles.messageText,
                          msg.isDeletedEveryone ? styles.deletedText : null,
                        ]}
                      >
                        {msg.text}
                      </Text>

                      <View style={styles.messageFooterRow}>
                        {msg.isEdited && (
                          <Text style={styles.editedBadge}>{t('friends_edited_badge')}</Text>
                        )}
                        <Text style={styles.timestamp}>{msg.timestamp}</Text>
                      </View>

                      {/* AI Action Block */}
                      {msg.aiAction && (
                        <GlassCard style={styles.aiActionCard}>
                          <Text style={styles.aiActionTitle}>
                            ⚡ {msg.aiAction.type === 'shared_reminder' ? 'Shared Task / Reminder' : 'Action'}
                          </Text>
                          <Text style={styles.aiActionDesc}>{msg.aiAction.title}</Text>
                          {msg.aiAction.status === 'suggested' ? (
                            <TouchableOpacity
                              style={styles.confirmActionBtn}
                              onPress={() => handleConfirmAction(msg.id)}
                            >
                              <Text style={styles.confirmActionBtnText}>Confirm to My Day</Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.confirmedPill}>
                              <Text style={styles.confirmedPillText}>✓ Confirmed</Text>
                            </View>
                          )}
                        </GlassCard>
                      )}

                      {/* Emoji Reactions Bar */}
                      <View style={styles.reactionsBar}>
                        {msg.reactions.map((r, i) => (
                          <TouchableOpacity
                            key={i}
                            style={[styles.reactionTag, r.userReacted && styles.reactionTagActive]}
                            onPress={() => handleReaction(msg.id, r.emoji)}
                          >
                            <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                            <Text style={styles.reactionCount}>{r.count}</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={styles.addReactionBtn}
                          onPress={() => handleReaction(msg.id, '👍')}
                        >
                          <Text style={styles.addReactionText}>+ 👍</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Bottom Chat Input Dock */}
          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
            <TextInput
              style={[
                styles.input,
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
              ]}
              placeholder={t('friends_input_placeholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Conversations & Connections Dashboard */
        <View style={{ flex: 1 }}>
          {/* Premium Segmented Navigation Controls */}
          <View style={styles.segmentedWrapper}>
            <View style={styles.segmentedContainer}>
              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'friends' && styles.segmentBtnActive]}
                onPress={() => setActiveTab('friends')}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, activeTab === 'friends' && styles.segmentTextActive]}>
                  {t('friends_tab_friends')}
                </Text>
                {acceptedFriends.length > 0 && (
                  <View style={[styles.segmentBadge, activeTab === 'friends' && styles.segmentBadgeActive]}>
                    <Text style={[styles.segmentBadgeText, activeTab === 'friends' && styles.segmentBadgeTextActive]}>
                      {acceptedFriends.length}
                    </Text>
                  </View>
                )}
                {pendingRequests.length > 0 && (
                  <View style={styles.segmentDotAlert} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'chats' && styles.segmentBtnActive]}
                onPress={() => setActiveTab('chats')}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, activeTab === 'chats' && styles.segmentTextActive]}>
                  {t('friends_tab_chats')}
                </Text>
                {conversations.filter((c) => !c.isGroup).length > 0 && (
                  <View style={[styles.segmentBadge, activeTab === 'chats' && styles.segmentBadgeActive]}>
                    <Text style={[styles.segmentBadgeText, activeTab === 'chats' && styles.segmentBadgeTextActive]}>
                      {conversations.filter((c) => !c.isGroup).length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'all' && styles.segmentBtnActive]}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, activeTab === 'all' && styles.segmentTextActive]}>
                  {t('friends_tab_all' as any) || 'All'}
                </Text>
                {conversations.length > 0 && (
                  <View style={[styles.segmentBadge, activeTab === 'all' && styles.segmentBadgeActive]}>
                    <Text style={[styles.segmentBadgeText, activeTab === 'all' && styles.segmentBadgeTextActive]}>
                      {conversations.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, activeTab === 'groups' && styles.segmentBtnActive]}
                onPress={() => setActiveTab('groups')}
                activeOpacity={0.7}
              >
                <Text style={[styles.segmentText, activeTab === 'groups' && styles.segmentTextActive]}>
                  {t('friends_tab_groups')}
                </Text>
                {conversations.filter((c) => c.isGroup).length > 0 && (
                  <View style={[styles.segmentBadge, activeTab === 'groups' && styles.segmentBadgeActive]}>
                    <Text style={[styles.segmentBadgeText, activeTab === 'groups' && styles.segmentBadgeTextActive]}>
                      {conversations.filter((c) => c.isGroup).length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            {/* 1. FRIENDS TAB (Search & Connected Friends) */}
            {activeTab === 'friends' && (
              <View>
                {/* Search Registered Users Bar */}
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={16} color={theme.colors.text.tertiary} />
                  <TextInput
                    style={[
                      styles.searchInput,
                      Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
                    ]}
                    placeholder={t('friends_search_placeholder')}
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {isSearching && <ActivityIndicator size="small" color={theme.colors.accent.primary} />}
                </View>

                {/* Search Results */}
                {searchQuery.trim().length >= 2 && (
                  <View style={styles.searchResultsBox}>
                    <Text style={styles.sectionHeaderTitle}>SEARCH RESULTS</Text>
                    {searchResults.length === 0 && !isSearching ? (
                      <Text style={styles.emptySearchResultText}>{t('friends_empty_search')}</Text>
                    ) : (
                      searchResults.map((target) => {
                        const isAlreadyFriend = acceptedFriends.some((f) => f.friendId === target.id);
                        const hasRequested =
                          sentRequestUserIds.includes(target.id) ||
                          friendships.some((f) => f.friendId === target.id && f.status === 'pending');

                        return (
                          <View key={target.id} style={styles.userResultItem}>
                            <View style={styles.userResultAvatar}>
                              <Text style={{ color: theme.colors.accent.primary, fontWeight: 'bold' }}>
                                {target.name.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <Text style={styles.userResultName}>{target.name}</Text>
                              {target.email && <Text style={styles.userResultEmail}>{target.email}</Text>}
                            </View>
                            {isAlreadyFriend ? (
                              <View style={styles.connectedBadge}>
                                <Text style={styles.connectedBadgeText}>Connected</Text>
                              </View>
                            ) : hasRequested ? (
                              <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>{t('friends_pending_badge')}</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.addFriendBtn}
                                onPress={() => handleSendFriendRequest(target)}
                              >
                                <Ionicons name="person-add" size={13} color="#050B14" />
                                <Text style={styles.addFriendBtnText}>{t('friends_send_request')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}

                {/* Pending Connection Requests (if any exist) */}
                {pendingRequests.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionHeaderTitle}>
                      PENDING REQUESTS ({pendingRequests.length})
                    </Text>
                    {pendingRequests.map((req) => (
                      <GlassCard key={req.id} style={styles.requestCard}>
                        <View style={styles.userResultAvatar}>
                          <Text style={{ color: theme.colors.accent.primary, fontWeight: 'bold' }}>
                            {req.friendName.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.userResultName}>{req.friendName}</Text>
                          <Text style={styles.userResultEmail}>
                            {req.isIncoming ? 'Sent you a connection request' : 'Request pending approval'}
                          </Text>
                        </View>
                        {req.isIncoming ? (
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => handleAcceptRequest(req.id)}
                            >
                              <Text style={styles.acceptBtnText}>{t('friends_accept')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.declineBtn}
                              onPress={() => handleDeclineRequest(req.id)}
                            >
                              <Text style={styles.declineBtnText}>{t('friends_decline')}</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{t('friends_pending_badge')}</Text>
                          </View>
                        )}
                      </GlassCard>
                    ))}
                  </View>
                )}

                {/* Connected Friends List */}
                <Text style={styles.sectionHeaderTitle}>
                  MY CONNECTED FRIENDS ({acceptedFriends.length})
                </Text>
                {acceptedFriends.length === 0 ? (
                  <View style={styles.emptyView}>
                    <Ionicons name="people-outline" size={40} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyText}>{t('friends_empty_friends')}</Text>
                  </View>
                ) : (
                  acceptedFriends.map((f) => (
                    <View key={f.id} style={styles.friendCard}>
                      <View style={styles.userResultAvatar}>
                        <Text style={{ color: theme.colors.accent.primary, fontWeight: 'bold' }}>
                          {f.friendName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.userResultName}>{f.friendName}</Text>
                        {f.friendEmail && <Text style={styles.userResultEmail}>{f.friendEmail}</Text>}
                      </View>
                      <TouchableOpacity
                        style={styles.chatActionBtn}
                        onPress={() =>
                          handleOpenConversation(
                            SocialService.getDirectConversationId(user?.id || 'local_user', f.friendId)
                          )
                        }
                      >
                        <Ionicons name="chatbubble" size={14} color="#050B14" />
                        <Text style={styles.chatActionBtnText}>Message</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* 2. CHATS TAB (1-on-1 Direct Conversations) */}
            {activeTab === 'chats' && (
              <View>
                {conversations.filter((c) => !c.isGroup).length === 0 ? (
                  <View style={styles.emptyView}>
                    <Ionicons name="chatbubbles-outline" size={44} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyText}>No 1-on-1 chats yet. Start a chat with a connected friend.</Text>
                    <TouchableOpacity
                      style={styles.connectPromptBtn}
                      onPress={() => setActiveTab('friends')}
                    >
                      <Text style={styles.connectPromptBtnText}>View Friends to Message</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  conversations
                    .filter((c) => !c.isGroup)
                    .map((conv) => (
                      <TouchableOpacity
                        key={conv.id}
                        style={styles.conversationCard}
                        onPress={() => handleOpenConversation(conv.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.convAvatarCircle}>
                          <Text style={{ fontSize: 20 }}>{conv.avatarIcon || '💬'}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.convName}>{conv.name}</Text>
                          <Text style={styles.convLastMessage} numberOfLines={1}>
                            {conv.lastMessage || 'Start a conversation'}
                          </Text>
                        </View>
                        <Text style={styles.convTime}>{conv.lastTimestamp}</Text>
                      </TouchableOpacity>
                    ))
                )}
              </View>
            )}

            {/* 3. ALL TAB (Unified Conversations & Active Collaborations) */}
            {activeTab === 'all' && (
              <View>
                {pendingRequests.length > 0 && (
                  <TouchableOpacity
                    style={styles.allPendingAlertBox}
                    onPress={() => setActiveTab('friends')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.allPendingAlertLeft}>
                      <Ionicons name="mail-unread" size={18} color="#F59E0B" />
                      <Text style={styles.allPendingAlertText}>
                        {pendingRequests.length} pending friend request{pendingRequests.length > 1 ? 's' : ''}
                      </Text>
                    </View>
                    <Text style={styles.allPendingAlertAction}>Review →</Text>
                  </TouchableOpacity>
                )}

                {conversations.length === 0 ? (
                  <View style={styles.emptyView}>
                    <Ionicons name="chatbubbles-outline" size={44} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyText}>No conversations yet. Connect with friends or create a group to start collaborating.</Text>
                    <TouchableOpacity
                      style={styles.connectPromptBtn}
                      onPress={() => setActiveTab('friends')}
                    >
                      <Text style={styles.connectPromptBtnText}>Find People</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  conversations.map((conv) => (
                    <TouchableOpacity
                      key={conv.id}
                      style={styles.conversationCard}
                      onPress={() => handleOpenConversation(conv.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.convAvatarCircle}>
                        <Text style={{ fontSize: 20 }}>{conv.isGroup ? '👥' : conv.avatarIcon || '💬'}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.convName}>{conv.name}</Text>
                          {conv.isGroup && (
                            <View style={styles.groupSmallTag}>
                              <Text style={styles.groupSmallTagText}>Group</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.convLastMessage} numberOfLines={1}>
                          {conv.lastMessage || 'Tap to open chat'}
                        </Text>
                      </View>
                      <Text style={styles.convTime}>{conv.lastTimestamp}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* 4. GROUPS TAB (Group Chats & Creation) */}
            {activeTab === 'groups' && (
              <View>
                <View style={styles.groupHeaderRow}>
                  <Text style={styles.sectionHeaderTitle}>COLLABORATION GROUPS</Text>
                  <TouchableOpacity
                    style={styles.createGroupBtn}
                    onPress={() => setIsCreateGroupModalVisible(true)}
                  >
                    <Ionicons name="add" size={14} color="#050B14" />
                    <Text style={styles.createGroupBtnText}>{t('friends_create_group')}</Text>
                  </TouchableOpacity>
                </View>

                {conversations.filter((c) => c.isGroup).length === 0 ? (
                  <View style={styles.emptyView}>
                    <Ionicons name="people-outline" size={44} color={theme.colors.text.tertiary} />
                    <Text style={styles.emptyText}>No groups created yet. Create a group to collaborate.</Text>
                  </View>
                ) : (
                  conversations
                    .filter((c) => c.isGroup)
                    .map((grp) => (
                      <TouchableOpacity
                        key={grp.id}
                        style={styles.conversationCard}
                        onPress={() => handleOpenConversation(grp.id)}
                      >
                        <View style={styles.convAvatarCircle}>
                          <Text style={{ fontSize: 20 }}>👥</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.convName}>{grp.name}</Text>
                          <Text style={styles.convLastMessage}>{grp.members.length} members</Text>
                        </View>
                        <Text style={styles.resumeArrow}>→</Text>
                      </TouchableOpacity>
                    ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Message Action Sheet Modal */}
      <Modal
        visible={!!selectedMessage && !isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedMessage(null)}
      >
        <TouchableOpacity
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMessage(null)}
        >
          <View style={styles.actionModalCard}>
            <Text style={styles.actionModalTitle}>Message Actions</Text>
            {selectedMessage?.senderName === 'You' && (
              <>
                <TouchableOpacity
                  style={styles.actionOptionBtn}
                  onPress={handleStartEditMessage}
                >
                  <Ionicons name="pencil-outline" size={18} color={theme.colors.accent.primary} />
                  <Text style={styles.actionOptionText}>{t('friends_msg_edit')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionOptionBtn}
                  onPress={handleDeleteForEveryone}
                >
                  <Ionicons name="trash-bin-outline" size={18} color={theme.colors.status.error} />
                  <Text style={[styles.actionOptionText, { color: theme.colors.status.error }]}>
                    {t('friends_msg_delete_all')}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.actionOptionBtn}
              onPress={handleDeleteForMe}
            >
              <Ionicons name="eye-off-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.actionOptionText}>{t('friends_msg_delete_me')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCancelBtn}
              onPress={() => setSelectedMessage(null)}
            >
              <Text style={styles.actionCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Message Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.actionModalOverlay}>
          <View style={styles.editMessageCard}>
            <Text style={styles.actionModalTitle}>{t('friends_msg_edit')}</Text>
            <TextInput
              style={[
                styles.editMessageInput,
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
              ]}
              value={editText}
              onChangeText={setEditText}
              multiline
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.declineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleSaveEditMessage}
              >
                <Text style={styles.acceptBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Group Modal */}
      <Modal
        visible={isCreateGroupModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCreateGroupModalVisible(false)}
      >
        <View style={styles.actionModalOverlay}>
          <View style={[styles.createGroupCard, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.groupModalHeader}>
              <Text style={styles.actionModalTitle}>{t('friends_create_group')}</Text>
              <TouchableOpacity onPress={() => setIsCreateGroupModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.groupNameInput,
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
              ]}
              placeholder={t('friends_group_name')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <Text style={styles.selectFriendsLabel}>Select Friends to Add:</Text>
            <ScrollView style={styles.friendsSelectScroll}>
              {acceptedFriends.length === 0 ? (
                <Text style={styles.emptyText}>No connected friends available to add.</Text>
              ) : (
                acceptedFriends.map((f) => {
                  const isSelected = selectedFriendIds.includes(f.friendId);
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[styles.friendSelectRow, isSelected && styles.friendSelectRowActive]}
                      onPress={() => handleToggleSelectFriend(f.friendId)}
                    >
                      <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={18}
                        color={isSelected ? theme.colors.accent.primary : theme.colors.text.tertiary}
                      />
                      <Text style={[styles.friendSelectName, isSelected && styles.friendSelectNameActive]}>
                        {f.friendName}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.confirmCreateGroupBtn}
              onPress={handleCreateGroup}
            >
              <Text style={styles.confirmCreateGroupBtnText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Dock */}
      {!activeConvId && (
        <BottomNavBar activeTab="Friends" onTabPress={handleBottomTabPress} />
      )}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backIcon: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  eyebrow: {
    color: theme.colors.accent.primary,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily.bold,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyBanner: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 229, 255, 0.1)',
  },
  privacyText: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    textAlign: 'center',
  },
  segmentedWrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  segmentText: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  segmentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  segmentBadgeText: {
    color: theme.colors.text.tertiary,
    fontSize: 9,
    fontWeight: '700',
  },
  segmentBadgeTextActive: {
    color: '#FFFFFF',
  },
  segmentDotAlert: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  allPendingAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  allPendingAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allPendingAlertText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '600',
  },
  allPendingAlertAction: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  groupSmallTag: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  groupSmallTagText: {
    color: '#C084FC',
    fontSize: 9,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: theme.colors.accent.primary,
  },
  tabText: {
    color: theme.colors.text.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: '700',
  },
  tabContent: {
    padding: theme.spacing.md,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  connectPromptBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
  },
  connectPromptBtnText: {
    color: '#050B14',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  convAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  convName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '700',
  },
  convLastMessage: {
    color: theme.colors.text.muted,
    fontSize: 11,
    marginTop: 2,
  },
  convTime: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
  },
  resumeArrow: {
    color: theme.colors.text.tertiary,
    fontSize: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 12,
    marginLeft: 8,
  },
  searchResultsBox: {
    marginBottom: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.03)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.1)',
  },
  sectionHeaderTitle: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  emptySearchResultText: {
    color: theme.colors.text.muted,
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  userResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  userResultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userResultName: {
    color: theme.colors.text.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  userResultEmail: {
    color: theme.colors.text.tertiary,
    fontSize: 10,
  },
  addFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  addFriendBtnText: {
    color: '#050B14',
    fontSize: 10,
    fontWeight: '700',
  },
  pendingBadge: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  pendingBadgeText: {
    color: '#EAB308',
    fontSize: 10,
    fontWeight: '600',
  },
  connectedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  connectedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 8,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  chatActionBtnText: {
    color: '#050B14',
    fontSize: 10,
    fontWeight: '700',
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  acceptBtn: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  acceptBtnText: {
    color: '#050B14',
    fontSize: 10,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  declineBtnText: {
    color: theme.colors.text.secondary,
    fontSize: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  createGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  createGroupBtnText: {
    color: '#050B14',
    fontSize: 10,
    fontWeight: '700',
  },
  messagesContainer: {
    padding: theme.spacing.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    padding: 10,
    borderRadius: theme.borderRadius.md,
  },
  bubbleMe: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 2,
  },
  bubbleAi: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  senderName: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    fontWeight: '700',
  },
  senderNameAi: {
    color: '#A855F7',
  },
  messageText: {
    color: theme.colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  deletedText: {
    fontStyle: 'italic',
    color: theme.colors.text.tertiary,
  },
  messageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  editedBadge: {
    fontSize: 8,
    color: theme.colors.text.tertiary,
  },
  timestamp: {
    color: theme.colors.text.tertiary,
    fontSize: 9,
  },
  aiActionCard: {
    marginTop: 6,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  aiActionTitle: {
    fontSize: 10,
    color: theme.colors.accent.primary,
    fontWeight: '700',
  },
  aiActionDesc: {
    color: theme.colors.text.primary,
    fontSize: 11,
    marginTop: 2,
  },
  confirmActionBtn: {
    backgroundColor: theme.colors.accent.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  confirmActionBtnText: {
    color: '#050B14',
    fontSize: 9,
    fontWeight: '700',
  },
  confirmedPill: {
    marginTop: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  confirmedPillText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
  },
  reactionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
    alignItems: 'center',
  },
  reactionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  reactionTagActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 11,
  },
  reactionCount: {
    fontSize: 9,
    color: theme.colors.text.primary,
    marginLeft: 3,
    fontWeight: '700',
  },
  addReactionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 5,
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
    paddingHorizontal: theme.spacing.md,
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
    paddingVertical: 7,
    color: theme.colors.text.primary,
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#050B14',
    fontWeight: '700',
    fontSize: 12,
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionModalTitle: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  actionOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionOptionText: {
    color: theme.colors.text.primary,
    fontSize: 12,
  },
  actionCancelBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionCancelBtnText: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  editMessageCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  editMessageInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.text.primary,
    padding: 10,
    fontSize: 13,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  createGroupCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  groupModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseText: {
    color: theme.colors.text.tertiary,
    fontSize: 16,
  },
  groupNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: theme.colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 12,
  },
  selectFriendsLabel: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  friendsSelectScroll: {
    maxHeight: 180,
    marginBottom: 14,
  },
  friendSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 4,
  },
  friendSelectRowActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  friendSelectName: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  friendSelectNameActive: {
    color: theme.colors.text.primary,
    fontWeight: '700',
  },
  confirmCreateGroupBtn: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmCreateGroupBtnText: {
    color: '#050B14',
    fontSize: 12,
    fontWeight: '700',
  },
});

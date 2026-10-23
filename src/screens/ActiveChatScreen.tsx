import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { theme } from '../theme';
import { useApp, ChatMessage } from '../context/AppContext';
import { supabaseDataService, StoredConversation } from '../services/backend/supabaseDataService';
import type { ScreenNavProp, ScreenRouteProp } from '../types/navigation';

interface ActiveChatScreenProps {
  navigation: ScreenNavProp<'ActiveChat'>;
  route: ScreenRouteProp<'ActiveChat'>;
}

const QUICK_TEST_PROMPTS = [
  'Naalaiku six mani ku study reminder podu',
  'Review Calculus exam preparation plan',
  'Turn on ambient living room lights',
  'What are today’s priority objectives?',
];

export const ActiveChatScreen: React.FC<ActiveChatScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const {
    messages,
    sendMessage,
    avatarState,
    robotReaction,
    visualEnvironment,
    preferences,
    isOnline,
    activeConversationId,
    startNewConversation,
    switchConversation,
    t,
  } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    name: string;
    type: 'image' | 'audio' | 'document' | 'pdf' | 'file';
    mimeType: string;
    size: number;
    uri: string;
  } | null>(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recentConversations, setRecentConversations] = useState<StoredConversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [editingConvoId, setEditingConvoId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const loadConversationsList = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const convos = await supabaseDataService.fetchConversations();
      setRecentConversations(convos);
    } catch (e) {
      console.warn('[ActiveChat] Error loading conversations list:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    loadConversationsList();
  };

  const handleSelectConversation = async (id: string) => {
    setShowHistoryModal(false);
    await switchConversation(id);
  };

  const handleStartNewSession = async () => {
    setShowHistoryModal(false);
    await startNewConversation();
  };

  const handleDeleteConversation = async (id: string) => {
    const perform = async () => {
      await supabaseDataService.deleteConversation(id);
      if (activeConversationId === id) {
        await startNewConversation();
      }
      await loadConversationsList();
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm && window.confirm('Delete this conversation?')) {
        await perform();
      }
      return;
    }

    Alert.alert('Delete Conversation', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: perform },
    ]);
  };

  const handleSaveRename = async (id: string) => {
    if (!editTitleText.trim()) return;
    await supabaseDataService.renameConversation(id, editTitleText.trim());
    setEditingConvoId(null);
    setEditTitleText('');
    await loadConversationsList();
  };

  // If initialPrompt was passed via route params, send it automatically
  useEffect(() => {
    if (route.params?.initialPrompt) {
      sendMessage(route.params.initialPrompt);
    }
  }, [route.params?.initialPrompt, sendMessage]);

  const handlePickImage = async () => {
    setShowAttachmentModal(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setSelectedAttachment({
          name: asset.fileName || 'image.jpg',
          size: asset.fileSize || 500000,
          type: 'image',
          mimeType: asset.mimeType || 'image/jpeg',
          uri: asset.uri,
        });
      }
    } catch {
      // Gracefully handled
    }
  };

  const pickWebAttachment = (accept: string, type: 'audio' | 'document' | 'pdf' | 'file') => {
    setShowAttachmentModal(false);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          if (file.size > 15 * 1024 * 1024) {
            if (typeof window !== 'undefined' && window.alert) window.alert('File size exceeds the 15MB limit.');
            return;
          }
          const url = URL.createObjectURL(file);
          setSelectedAttachment({
            name: file.name,
            size: file.size,
            type,
            mimeType: file.type || accept,
            uri: url,
          });
        }
      };
      input.click();
    } else {
      Alert.alert('Attachment', 'Select an image or document from your device.');
    }
  };

  const handleGoogleDrive = () => {
    setShowAttachmentModal(false);
    setShowDriveModal(true);
  };

  const [isListening, setIsListening] = useState(false);
  const speechDoneRef = useRef(false);
  const cancelVoiceRef = useRef(false);
  const hasReceivedSpeechRef = useRef(false);

  // Live native speech recognition callbacks
  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    speechDoneRef.current = false;
    cancelVoiceRef.current = false;
    hasReceivedSpeechRef.current = false;
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript && transcript.trim().length > 0) {
      hasReceivedSpeechRef.current = true;
      setInputText(transcript);
    }
    if (event.isFinal && transcript && transcript.trim().length > 0) {
      if (!speechDoneRef.current && !cancelVoiceRef.current) {
        speechDoneRef.current = true;
        setIsListening(false);
        // Automatic submit if autoSendVoice is enabled (default: true)
        const shouldAutoSend = preferences?.autoSendVoice ?? true;
        if (shouldAutoSend) {
          sendMessage(transcript.trim());
          setInputText('');
          setSelectedImageUri(null);
        }
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    cancelVoiceRef.current = true;
    console.warn('[ActiveChat] Speech error:', event.error, event.message);
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    if (
      !speechDoneRef.current &&
      !cancelVoiceRef.current &&
      hasReceivedSpeechRef.current &&
      inputText.trim().length > 0
    ) {
      const shouldAutoSend = preferences?.autoSendVoice ?? true;
      if (shouldAutoSend && avatarState !== 'processing') {
        speechDoneRef.current = true;
        sendMessage(inputText.trim());
        setInputText('');
        setSelectedImageUri(null);
      }
    }
  });

  const handleToggleMic = async () => {
    if (isListening) {
      cancelVoiceRef.current = true;
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Microphone Permission Required',
          'Please grant microphone permission to dictate messages.'
        );
        return;
      }

      speechDoneRef.current = false;
      cancelVoiceRef.current = false;
      hasReceivedSpeechRef.current = false;
      setIsListening(true);
      const sttLocale = preferences?.appLanguage === 'ta-IN' ? 'ta-IN' : 'en-IN';
      ExpoSpeechRecognitionModule.start({
        lang: sttLocale,
        interimResults: true,
        continuous: false,
      });
    } catch (e) {
      console.warn('[ActiveChat] Failed starting speech:', e);
      setIsListening(false);
    }
  };

  const handleSend = () => {
    if (avatarState === 'processing') return; // Prevent duplicate concurrent sends

    // If currently listening, stop recognition before manual send
    if (isListening) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {}
      setIsListening(false);
    }

    const textToSend = inputText.trim();
    if (!textToSend && !selectedImageUri && !selectedAttachment) {
      handleToggleMic();
      return;
    }

    const defaultAttachmentPrompt = selectedAttachment
      ? `Please inspect and review the attached ${selectedAttachment.type}: ${selectedAttachment.name}`
      : selectedImageUri
      ? 'Please inspect and analyze this attached image.'
      : '';

    sendMessage(
      textToSend || defaultAttachmentPrompt,
      selectedImageUri || (selectedAttachment?.type === 'image' ? selectedAttachment.uri : undefined),
      selectedAttachment || undefined
    );
    setInputText('');
    setSelectedImageUri(null);
    setSelectedAttachment(null);
  };

  const handleSelectSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage; index: number }) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.botRow,
        ]}
      >
        {!isUser && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('LiveVoice')}
            style={styles.botAvatarContainer}
          >
            <NexAvatar
              variant={item.robotReaction || robotReaction || avatarState}
              size="xs"
              glowColorOverride={visualEnvironment.glowColor}
            />
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          {/* Metadata Badges for Bot Responses */}
          {!isUser && (item.inferredContext || item.selectedAgent || item.detectedLanguage) && (
            <View style={styles.metaRow}>
              {item.inferredContext && (
                <View style={styles.contextBadge}>
                  <Text style={styles.contextBadgeText}>
                    [{item.inferredContext.toUpperCase()}]
                  </Text>
                </View>
              )}
              {item.selectedAgent && (
                <View style={styles.agentBadge}>
                  <Text style={styles.agentBadgeText}>
                    Agent: {item.selectedAgent.toUpperCase()}
                  </Text>
                </View>
              )}
              {item.detectedLanguage && item.detectedLanguage !== 'english' && (
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>
                    {item.detectedLanguage.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Attached Image */}
          {item.imageUri ? (
            <Image
              source={{ uri: item.imageUri }}
              style={styles.attachedImage}
              resizeMode="cover"
            />
          ) : null}

          {/* Attached Document / File */}
          {item.attachment && item.attachment.type !== 'image' && (
            <View style={styles.bubbleAttachmentBox}>
              <Ionicons
                name={
                  item.attachment.type === 'pdf'
                    ? 'document-text'
                    : item.attachment.type === 'audio'
                    ? 'musical-notes'
                    : 'document-attach'
                }
                size={18}
                color={theme.colors.accent.primary}
              />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.bubbleAttachmentName} numberOfLines={1}>
                  {item.attachment.name}
                </Text>
                <Text style={styles.bubbleAttachmentSize}>
                  {(item.attachment.size / 1024).toFixed(1)} KB • {item.attachment.type.toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          {/* Tool Execution Tag */}
          {item.toolResult && (
            <View style={styles.toolTag}>
              <Text style={styles.toolTagText}>
                ⚡ MCP Executed: {item.toolResult.toolName}
              </Text>
            </View>
          )}

          {/* Message Text */}
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>

          {/* Follow-up Suggestion Chips */}
          {!isUser && item.followUpSuggestions && item.followUpSuggestions.length > 0 && (
            <View style={styles.followUpContainer}>
              <Text style={styles.followUpLabel}>Suggestions:</Text>
              <View style={styles.followUpPills}>
                {item.followUpSuggestions.map((sug, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => handleSelectSuggestion(sug)}
                  >
                    <Text style={styles.suggestionChipText}>{sug} →</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <AppBackground style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Top Header Bar */}
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIdentity}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <NexAvatar
              variant={robotReaction !== 'idle' ? robotReaction : avatarState}
              size="xs"
              glowColorOverride={visualEnvironment.glowColor}
            />
            <View style={styles.nameStatusContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.botName}>NEXORA AI</Text>
                <View
                  style={[
                    styles.modeChip,
                    { borderColor: `${visualEnvironment.accentColor}55` },
                  ]}
                >
                  <Text style={[styles.modeChipText, { color: visualEnvironment.accentColor }]}>
                    {visualEnvironment.context.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  {!isOnline
                    ? 'Offline Mode'
                    : preferences.soloMode
                    ? 'Solo Airgap'
                    : 'Cognitive Brain'}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: !isOnline
                        ? '#EF4444'
                        : preferences.soloMode
                        ? '#F59E0B'
                        : '#10B981',
                    },
                  ]}
                />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={handleOpenHistory}
              accessibilityLabel="View recent conversations"
            >
              <Text style={styles.headerIcon}>📜</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={handleStartNewSession}
              accessibilityLabel="Start new conversation"
            >
              <Text style={styles.headerIcon}>➕</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VoicePreferences')}
            >
              <Text style={styles.headerIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Message Feed */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            avatarState === 'processing' ? (
              <View style={styles.thinkingRow}>
                <View style={styles.botAvatarContainer}>
                  <NexAvatar
                    variant="thinking"
                    size="xs"
                    glowColorOverride={visualEnvironment.glowColor}
                  />
                </View>
                <View style={styles.thinkingBubble}>
                  <Text style={styles.thinkingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Test Prompt Shortcuts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickPromptScroll}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.md }}
        >
          {QUICK_TEST_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickChip}
              onPress={() => handleSelectSuggestion(prompt)}
            >
              <Text style={styles.quickChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Attached file/image preview */}
        {selectedAttachment && (
          <View style={styles.previewContainer}>
            {selectedAttachment.type === 'image' ? (
              <Image source={{ uri: selectedAttachment.uri }} style={styles.previewThumbnail} />
            ) : (
              <View style={styles.previewFileIcon}>
                <Ionicons
                  name={
                    selectedAttachment.type === 'pdf'
                      ? 'document-text'
                      : selectedAttachment.type === 'audio'
                      ? 'musical-notes'
                      : 'document-attach'
                  }
                  size={20}
                  color={theme.colors.accent.primary}
                />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.previewLabel} numberOfLines={1}>{selectedAttachment.name}</Text>
              <Text style={styles.previewSubLabel}>
                {(selectedAttachment.size / 1024).toFixed(1)} KB • {selectedAttachment.type.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => {
                setSelectedAttachment(null);
                setSelectedImageUri(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Offline Indicator Banner */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>
              ⚠️ Offline • Internet connection required for AI chat & voice
            </Text>
          </View>
        )}

        {/* Bottom Input Dock */}
        <View style={[styles.inputDock, { paddingBottom: insets.bottom + theme.spacing.xs }]}>
          <TouchableOpacity
            style={styles.plusBtn}
            activeOpacity={0.7}
            onPress={() => setShowAttachmentModal(true)}
            accessibilityLabel="Attach files or media"
          >
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={
              !isOnline
                ? 'NEXORA is offline. Connect to internet to chat...'
                : selectedAttachment
                ? `Ask NEX about this ${selectedAttachment.type}...`
                : 'English, Tanglish, Hindi...'
            }
            placeholderTextColor={theme.colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnListening]}
            activeOpacity={0.8}
            onPress={handleSend}
            accessibilityLabel={inputText.trim() || selectedAttachment ? 'Send message' : isListening ? 'Stop listening' : 'Start speaking'}
          >
            <Ionicons
              name={inputText.trim() || selectedAttachment ? 'paper-plane' : isListening ? 'stop' : 'mic'}
              size={18}
              color={isListening ? '#FFFFFF' : '#000000'}
            />
          </TouchableOpacity>
        </View>

        {/* Universal Attachment Modal */}
        <Modal
          visible={showAttachmentModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAttachmentModal(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAttachmentModal(false)}
          >
            <View style={[styles.attachmentCard, { paddingBottom: insets.bottom + theme.spacing.md }]}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.modalTitle}>{t('chat_attach_title')}</Text>
                <TouchableOpacity onPress={() => setShowAttachmentModal(false)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.attachmentGrid}>
                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={handlePickImage}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                    <Ionicons name="images" size={24} color={theme.colors.accent.primary} />
                  </View>
                  <Text style={styles.attachOptionText}>{t('chat_attach_images')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={() => pickWebAttachment('audio/*', 'audio')}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                    <Ionicons name="musical-notes" size={24} color="#A855F7" />
                  </View>
                  <Text style={styles.attachOptionText}>{t('chat_attach_audio')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={() => pickWebAttachment('.txt,.doc,.docx,.rtf,text/plain', 'document')}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                  </View>
                  <Text style={styles.attachOptionText}>{t('chat_attach_documents')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={() => pickWebAttachment('.pdf,application/pdf', 'pdf')}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Ionicons name="document" size={24} color="#EF4444" />
                  </View>
                  <Text style={styles.attachOptionText}>{t('chat_attach_pdf')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={() => pickWebAttachment('*/*', 'file')}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Ionicons name="folder-open" size={24} color="#10B981" />
                  </View>
                  <Text style={styles.attachOptionText}>{t('chat_attach_browse')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.attachOption}
                  onPress={handleGoogleDrive}
                >
                  <View style={[styles.attachIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                    <Ionicons name="logo-google" size={24} color="#EAB308" />
                  </View>
                  <Text style={styles.attachOptionText}>{t('chat_attach_drive')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Google Drive Notice Modal */}
        <Modal
          visible={showDriveModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDriveModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.driveNoticeCard}>
              <Ionicons name="logo-google" size={32} color="#EAB308" style={{ alignSelf: 'center', marginBottom: 10 }} />
              <Text style={styles.driveTitle}>Google Drive Integration</Text>
              <Text style={styles.driveBody}>
                {t('chat_drive_auth_required')}
              </Text>
              <Text style={styles.driveDetails}>
                Setup steps:
                {'\n'}1. Enable Google Drive API in Google Cloud Console.
                {'\n'}2. Add EXPO_PUBLIC_GOOGLE_DRIVE_CLIENT_ID to .env.
                {'\n'}3. Local files can be attached immediately via 'Browse Files'.
              </Text>
              <TouchableOpacity
                style={styles.driveCloseBtn}
                onPress={() => setShowDriveModal(false)}
              >
                <Text style={styles.driveCloseBtnText}>Understood</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Date-Grouped Conversations List Modal */}
        <Modal
          visible={showHistoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { paddingBottom: insets.bottom + theme.spacing.md }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{t('chat_history_title')}</Text>
                  <Text style={styles.modalSub}>Sovereign day-wise session logs</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowHistoryModal(false)}
                  style={styles.modalCloseBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.newConvoBtn}
                activeOpacity={0.8}
                onPress={handleStartNewSession}
              >
                <Text style={styles.newConvoIcon}>➕</Text>
                <Text style={styles.newConvoText}>{t('chat_new_convo')}</Text>
              </TouchableOpacity>

              {isLoadingHistory ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="small" color={theme.colors.accent.primary} />
                  <Text style={styles.modalLoadingText}>Loading conversation history...</Text>
                </View>
              ) : recentConversations.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No previous conversations recorded yet.</Text>
                </View>
              ) : (
                <ScrollView style={styles.convoListScroll} showsVerticalScrollIndicator={false}>
                  {(() => {
                    const todayStr = new Date().toDateString();
                    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

                    const todayList = recentConversations.filter(
                      (c) => new Date(c.updated_at || c.created_at).toDateString() === todayStr
                    );
                    const yesterdayList = recentConversations.filter(
                      (c) => new Date(c.updated_at || c.created_at).toDateString() === yesterdayStr
                    );
                    const earlierList = recentConversations.filter((c) => {
                      const d = new Date(c.updated_at || c.created_at).toDateString();
                      return d !== todayStr && d !== yesterdayStr;
                    });

                    const renderGroup = (title: string, list: StoredConversation[]) => {
                      if (list.length === 0) return null;
                      return (
                        <View key={title} style={styles.convoGroupSection}>
                          <Text style={styles.convoGroupTitle}>{title}</Text>
                          {list.map((convo) => {
                            const isCurrent = convo.id === activeConversationId;
                            const isEditingThis = editingConvoId === convo.id;
                            const timeFormatted = new Date(convo.updated_at || convo.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            });

                            return (
                              <View
                                key={convo.id}
                                style={[styles.convoItem, isCurrent && styles.convoItemActive]}
                              >
                                {isEditingThis ? (
                                  <View style={styles.convoEditRow}>
                                    <TextInput
                                      style={[
                                        styles.convoEditInput,
                                        Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
                                      ]}
                                      value={editTitleText}
                                      onChangeText={setEditTitleText}
                                      autoFocus
                                    />
                                    <TouchableOpacity
                                      style={styles.convoActionSmallBtn}
                                      onPress={() => handleSaveRename(convo.id)}
                                    >
                                      <Ionicons name="checkmark" size={16} color={theme.colors.accent.primary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.convoActionSmallBtn}
                                      onPress={() => setEditingConvoId(null)}
                                    >
                                      <Ionicons name="close" size={16} color={theme.colors.text.tertiary} />
                                    </TouchableOpacity>
                                  </View>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.convoItemInfo}
                                    onPress={() => handleSelectConversation(convo.id)}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.convoItemTitle, isCurrent && styles.convoItemTitleActive]}>
                                      {convo.title || 'Conversation Session'}
                                    </Text>
                                    <Text style={styles.convoItemDate}>{timeFormatted}</Text>
                                  </TouchableOpacity>
                                )}

                                {!isEditingThis && (
                                  <View style={styles.convoActionsGroup}>
                                    <TouchableOpacity
                                      style={styles.convoActionBtn}
                                      onPress={() => {
                                        setEditingConvoId(convo.id);
                                        setEditTitleText(convo.title || '');
                                      }}
                                    >
                                      <Ionicons name="pencil-outline" size={14} color={theme.colors.text.secondary} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.convoActionBtn}
                                      onPress={() => handleDeleteConversation(convo.id)}
                                    >
                                      <Ionicons name="trash-outline" size={14} color={theme.colors.status.error} />
                                    </TouchableOpacity>
                                    {isCurrent && (
                                      <View style={styles.activeBadge}>
                                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                                      </View>
                                    )}
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      );
                    };

                    return (
                      <>
                        {renderGroup(t('chat_today'), todayList)}
                        {renderGroup(t('chat_yesterday'), yesterdayList)}
                        {renderGroup(t('chat_earlier'), earlierList)}
                      </>
                    );
                  })()}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerBtn: {
    padding: theme.spacing.xs,
  },
  headerIcon: {
    fontSize: 20,
    color: theme.colors.text.secondary,
  },
  headerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameStatusContainer: {
    alignItems: 'flex-start',
    marginLeft: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  botName: {
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  modeChip: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  modeChipText: {
    fontSize: 8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: 10,
    color: theme.colors.text.muted,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  messageRow: {
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '84%',
    padding: 12,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: 'rgba(0, 229, 255, 0.35)',
    borderWidth: 1,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: 'rgba(11, 18, 36, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  contextBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  contextBadgeText: {
    color: theme.colors.accent.primary,
    fontSize: 8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  agentBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  agentBadgeText: {
    color: '#A78BFA',
    fontSize: 8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  langBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
  },
  langBadgeText: {
    color: '#F59E0B',
    fontSize: 8,
    fontFamily: theme.typography.fontFamily.bold,
  },
  toolTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.xs,
    marginBottom: 6,
  },
  toolTagText: {
    color: '#10B981',
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  messageText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 19,
  },
  timestamp: {
    color: theme.colors.text.muted,
    fontSize: 8,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  followUpContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
  },
  followUpLabel: {
    color: theme.colors.text.muted,
    fontSize: 9,
    marginBottom: 4,
  },
  followUpPills: {
    gap: 4,
  },
  suggestionChip: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
  },
  suggestionChipText: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
  },
  attachedImage: {
    width: 200,
    height: 140,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
  },
  quickPromptScroll: {
    maxHeight: 34,
    marginBottom: 6,
  },
  quickChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  quickChipText: {
    color: theme.colors.text.secondary,
    fontSize: 10,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  previewThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
  },
  previewLabel: {
    color: theme.colors.text.muted,
    fontSize: 10,
    flex: 1,
  },
  removeImageBtn: {
    position: 'absolute',
    left: 44,
    top: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 10,
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: 'rgba(11, 18, 36, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  plusIcon: {
    color: theme.colors.text.secondary,
    fontSize: 20,
    fontWeight: '300',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  micBtnListening: {
    backgroundColor: '#EF4444',
  },
  micIcon: {
    fontSize: 16,
    color: '#000000',
  },
  offlineBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginHorizontal: theme.spacing.md,
    marginBottom: 6,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  offlineBannerText: {
    color: '#FCA5A5',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: theme.spacing.xs,
  },
  thinkingBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginLeft: 6,
  },
  thinkingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 24, 0.82)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: 'rgba(11, 18, 36, 0.98)',
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
  modalSub: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  newConvoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
  },
  newConvoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  newConvoText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  modalLoading: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  modalLoadingText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 8,
  },
  modalEmpty: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  modalEmptyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  convoListScroll: {
    marginBottom: theme.spacing.sm,
  },
  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  convoItemActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: theme.colors.accent.primary,
  },
  convoItemInfo: {
    flex: 1,
  },
  convoItemTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.medium,
  },
  convoItemTitleActive: {
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  convoItemDate: {
    color: theme.colors.text.tertiary,
    fontSize: 11,
    marginTop: 2,
  },
  convoGroupSection: {
    marginBottom: 14,
  },
  convoGroupTitle: {
    color: theme.colors.accent.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingLeft: 4,
  },
  convoEditRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  convoEditInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: theme.colors.text.primary,
    fontSize: 12,
  },
  convoActionSmallBtn: {
    padding: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  convoActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  convoActionBtn: {
    padding: 4,
  },
  previewFileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSubLabel: {
    color: theme.colors.text.tertiary,
    fontSize: 9,
    marginTop: 1,
  },
  bubbleAttachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: theme.borderRadius.sm,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  bubbleAttachmentName: {
    color: theme.colors.text.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  bubbleAttachmentSize: {
    color: theme.colors.text.tertiary,
    fontSize: 9,
  },
  attachmentCard: {
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  attachmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  attachOption: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  attachIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  attachOptionText: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  driveNoticeCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  driveTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  driveBody: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  driveDetails: {
    color: theme.colors.text.muted,
    fontSize: 11,
    lineHeight: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 14,
  },
  driveCloseBtn: {
    backgroundColor: theme.colors.accent.primary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  driveCloseBtnText: {
    color: '#050B14',
    fontSize: 12,
    fontWeight: '700',
  },
  activeBadge: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadgeText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: 'bold',
  },
  resumeArrow: {
    color: theme.colors.text.tertiary,
    fontSize: 16,
    marginLeft: 8,
  },
});

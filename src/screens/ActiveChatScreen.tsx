import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { theme } from '../theme';
import { useApp, ChatMessage } from '../context/AppContext';
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
  } = useApp();
  const [inputText, setInputText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // If initialPrompt was passed via route params, send it automatically
  useEffect(() => {
    if (route.params?.initialPrompt) {
      sendMessage(route.params.initialPrompt);
    }
  }, [route.params?.initialPrompt, sendMessage]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch {
      // Gracefully handled
    }
  };

  const handleSend = () => {
    if (avatarState === 'processing') return; // Prevent duplicate concurrent sends

    const textToSend = inputText.trim();
    if (!textToSend && !selectedImageUri) {
      navigation.navigate('LiveVoice');
      return;
    }

    sendMessage(
      textToSend || (selectedImageUri ? 'Please inspect and analyze this attached image.' : ''),
      selectedImageUri || undefined
    );
    setInputText('');
    setSelectedImageUri(null);
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
            onPress={() => navigation.navigate('AgentsHub')}
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

          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('VoicePreferences')}
          >
            <Text style={styles.headerIcon}>⚙️</Text>
          </TouchableOpacity>
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

        {/* Attached image preview */}
        {selectedImageUri && (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selectedImageUri }} style={styles.previewThumbnail} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setSelectedImageUri(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.previewLabel}>Image attached for multimodal analysis</Text>
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
            onPress={handlePickImage}
          >
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder={
              !isOnline
                ? 'NEXORA is offline. Connect to internet to chat...'
                : selectedImageUri
                ? 'Ask NEX about this image...'
                : 'English, Tanglish (Naalaiku six mani ku...), Hindi...'
            }
            placeholderTextColor={theme.colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={styles.micBtn}
            activeOpacity={0.8}
            onPress={handleSend}
          >
            <Text style={styles.micIcon}>{inputText.trim() || selectedImageUri ? '➤' : '🎤'}</Text>
          </TouchableOpacity>
        </View>
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
});

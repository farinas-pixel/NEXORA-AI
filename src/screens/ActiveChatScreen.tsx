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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { SuggestionPills } from '../components/common/SuggestionPills';
import { theme } from '../theme';
import { useApp, ChatMessage } from '../context/AppContext';
import type { ScreenNavProp, ScreenRouteProp } from '../types/navigation';

interface ActiveChatScreenProps {
  navigation: ScreenNavProp<'ActiveChat'>;
  route: ScreenRouteProp<'ActiveChat'>;
}

export const ActiveChatScreen: React.FC<ActiveChatScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { messages, sendMessage, avatarState } = useApp();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // If initialPrompt was passed via route params, send it automatically
  useEffect(() => {
    if (route.params?.initialPrompt) {
      sendMessage(route.params.initialPrompt);
    }
  }, [route.params?.initialPrompt, sendMessage]);

  const handleSend = () => {
    if (!inputText.trim()) {
      navigation.navigate('LiveVoice');
      return;
    }
    sendMessage(inputText);
    setInputText('');
  };

  const handleSelectSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const renderMessageItem = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.sender === 'user';

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.userRow : styles.botRow,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatarContainer}>
            <NexAvatar variant={avatarState} size="xs" />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{item.timestamp}</Text>

          {/* If it's the initial welcome bot message, show the suggestion pills */}
          {!isUser && index === 0 && (
            <View style={styles.pillsContainer}>
              <SuggestionPills onSelect={handleSelectSuggestion} />
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
        {/* Top Header Bar from Reference Screen 19 */}
        <View style={[styles.header, { paddingTop: insets.top + theme.spacing.xs }]}>
          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerIcon}>☰</Text>
          </TouchableOpacity>

          <View style={styles.headerIdentity}>
            <NexAvatar variant={avatarState} size="xs" />
            <View style={styles.nameStatusContainer}>
              <Text style={styles.botName}>NEX</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>
                  {avatarState === 'processing'
                    ? 'Processing...'
                    : avatarState === 'responding'
                    ? 'Responding...'
                    : 'Online'}
                </Text>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        avatarState === 'processing'
                          ? theme.colors.status.processing
                          : avatarState === 'responding'
                          ? theme.colors.status.responding
                          : theme.colors.status.success,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('LiveVoice')}
          >
            <Text style={styles.headerIcon}>⋮</Text>
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
        />

        {/* Bottom Input Dock from Reference Screen 19 */}
        <View style={[styles.inputDock, { paddingBottom: insets.bottom + theme.spacing.xs }]}>
          {/* Plus / Attachments Button */}
          <TouchableOpacity style={styles.plusBtn} activeOpacity={0.7}>
            <Text style={styles.plusIcon}>+</Text>
          </TouchableOpacity>

          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="Ask NEX anything..."
            placeholderTextColor={theme.colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {/* Cyan Mic / Send Action Button */}
          <TouchableOpacity
            style={styles.micBtn}
            activeOpacity={0.8}
            onPress={handleSend}
          >
            <Text style={styles.micIcon}>{inputText.trim() ? '➤' : '🎤'}</Text>
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
    alignItems: 'center',
  },
  botName: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatarContainer: {
    marginRight: theme.spacing.xs,
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: theme.spacing.md,
  },
  userBubble: {
    backgroundColor: 'rgba(0, 119, 254, 0.35)',
    borderColor: 'rgba(0, 229, 255, 0.45)',
    borderWidth: 1,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'rgba(13, 21, 44, 0.78)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * 1.35,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  pillsContainer: {
    marginTop: theme.spacing.sm,
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xs,
    backgroundColor: 'rgba(5, 8, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: theme.spacing.xs,
  },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    fontSize: 22,
    color: theme.colors.text.secondary,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  micIcon: {
    fontSize: 18,
    color: '#050814',
  },
});

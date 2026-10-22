import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { AudioWaveformVisualizer } from '../components/common/AudioWaveformVisualizer';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { SpeechService } from '../services/voice/speechService';
import { supabase } from '../services/auth/supabaseClient';
import { AIBrain } from '../services/ai/aiBrain';
import { supabaseDataService } from '../services/backend/supabaseDataService';
import type { ScreenNavProp } from '../types/navigation';
import type { AvatarState } from '../config/constants';

interface LiveVoiceScreenProps {
  navigation: ScreenNavProp<'LiveVoice'>;
}

export const LiveVoiceScreen: React.FC<LiveVoiceScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();

  const {
    setAvatarState,
    preferences,
    activeConversationId,
    setActiveConversationId,
    messages,
    isOnline,
    appLanguage,
    aiLanguage,
  } = useApp();

  const [voiceState, setVoiceState] = useState<AvatarState>('idle');
  const [captionText, setCaptionText] = useState('Initializing microphone...');
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);

  const isProcessingRef = useRef(false);
  const currentTranscriptRef = useRef('');

  // ---------------------------------------------------------
  // GLOBAL AVATAR STATE SYNC
  // ---------------------------------------------------------

  useEffect(() => {
    if (!isOnline) {
      setVoiceState('offline');
      setCaptionText('⚠️ Offline Mode: Internet connection is currently unavailable.');
    }
  }, [isOnline]);

  useEffect(() => {
    setAvatarState(voiceState);
  }, [voiceState, setAvatarState]);

  // ---------------------------------------------------------
  // CLEANUP ON UNMOUNT
  // ---------------------------------------------------------

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {}
      SpeechService.stop();
    };
  }, []);

  // ---------------------------------------------------------
  // START & STOP LISTENING
  // ---------------------------------------------------------

  const startListening = useCallback(async () => {
    try {
      await SpeechService.stop();
    } catch {}
    isProcessingRef.current = false;

    if (!isOnline) {
      setVoiceState('offline');
      setCaptionText('⚠️ Offline Mode: Cannot process voice queries without an active network connection.');
      return;
    }

    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setVoiceState('idle');
        setCaptionText('Microphone permission is required to listen. Tap the microphone to grant permission.');
        return;
      }

      currentTranscriptRef.current = '';
      setVoiceState('listening');
      setCaptionText('Listening... Speak naturally');

      // Determine appropriate speech recognition locale (default en-IN / en-US, ta-IN for Tamil / Tanglish)
      const sttLocale =
        appLanguage === 'ta-IN' || aiLanguage === 'ta'
          ? 'ta-IN'
          : 'en-IN';

      ExpoSpeechRecognitionModule.start({
        lang: sttLocale,
        interimResults: true,
        continuous: false,
      });
    } catch (err) {
      console.warn('[LiveVoice] start error:', err);
      setVoiceState('idle');
      setCaptionText('Could not initialize microphone. Tap to retry.');
    }
  }, [aiLanguage, appLanguage, isOnline]);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}
    setVoiceState('idle');
    setCaptionText('Listening paused. Tap the microphone to speak.');
  }, []);

  // ---------------------------------------------------------
  // AUTO-START ON MOUNT
  // ---------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      startListening();
    }, 350);

    return () => clearTimeout(timer);
  }, [startListening]);

  // ---------------------------------------------------------
  // VOICE QUERY PIPELINE
  // ---------------------------------------------------------

  const handleVoiceQuery = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isProcessingRef.current) {
      return;
    }

    if (!isOnline) {
      setVoiceState('offline');
      setCaptionText('⚠️ Offline Mode: Cannot process voice queries without an active network connection.');
      return;
    }

    isProcessingRef.current = true;
    setLastFailedQuery(null);
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {}

    setVoiceState('processing');
    setCaptionText(`"${trimmedQuery}"\n\nThinking and synthesizing...`);

    try {
      // 1. Authenticated Supabase User (read local session first for 0ms latency)
      const { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData?.session?.user?.id;

      if (!userId) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          throw new Error('Please sign in to your NEXORA account before using voice intelligence.');
        }
        userId = userData.user.id;
      }

      // 2. Active Real Conversation
      let convoId = activeConversationId;
      if (!convoId) {
        const convo = await supabaseDataService.getOrCreateActiveConversation();
        if (convo) {
          convoId = convo.id;
          setActiveConversationId(convoId);
        }
      }

      if (!convoId) {
        throw new Error(
          'Could not initialize an active conversation for voice.'
        );
      }

      // 3. Persist User Voice Input
      try {
        await supabaseDataService.saveConversationMessage(
          convoId,
          'user',
          trimmedQuery
        );
      } catch (e) {
        console.warn('[LiveVoice] Could not persist user message:', e);
      }

      // 4. Recent Contextual History Turns
      const historyTurns = messages.slice(-4).map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      // 5. Central AI Brain & Gateway Pipeline
      const brainResult = await AIBrain.process(
        trimmedQuery,
        historyTurns,
        preferences.soloMode,
        convoId
      );

      // 6. Persist Assistant Response
      try {
        await supabaseDataService.saveConversationMessage(
          convoId,
          'assistant',
          brainResult.aiResponseText,
          brainResult.toolResult,
          {
            robotReaction: brainResult.robotReaction,
            detectedLanguage: brainResult.detectedLanguage,
          }
        );
      } catch (e) {
        console.warn('[LiveVoice] Could not persist assistant response:', e);
      }

      // 7. Vocalize via Hardware Device TTS
      // Release processing lock so user can barge-in and tap mic at any time
      isProcessingRef.current = false;
      setVoiceState('responding');
      setCaptionText(brainResult.aiResponseText);

      await SpeechService.speak(brainResult.aiResponseText, {
        rate: preferences.speechRate,
        pitch: preferences.speechPitch,
        onStart: () => {
          setVoiceState('responding');
        },
        onDone: () => {
          setVoiceState('idle');
        },
        onError: () => {
          setVoiceState('idle');
        },
      });
    } catch (error: any) {
      setVoiceState('idle');
      isProcessingRef.current = false;
      setLastFailedQuery(trimmedQuery);

      const rawMsg = error instanceof Error ? error.message : String(error);
      let userFriendlyMsg = rawMsg;
      if (rawMsg.includes('Failed to fetch') || rawMsg.includes('fetch failed') || rawMsg.includes('Network request failed')) {
        userFriendlyMsg = 'Could not reach the AI gateway. Please check your internet connection or try again in a moment.';
      } else if (rawMsg.includes('rate limit') || rawMsg.includes('429')) {
        userFriendlyMsg = 'Free-tier rate limit reached. Please wait a few seconds and tap Retry.';
      } else if (rawMsg.includes('not configured')) {
        userFriendlyMsg = 'AI backend is currently starting or unconfigured. Please tap Retry.';
      }
      setCaptionText(`⚠️ ${userFriendlyMsg}`);
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    activeConversationId,
    isOnline,
    messages,
    preferences.soloMode,
    preferences.speechPitch,
    preferences.speechRate,
    setActiveConversationId,
  ]);

  // ---------------------------------------------------------
  // NATIVE SPEECH RECOGNITION EVENTS
  // ---------------------------------------------------------

  useSpeechRecognitionEvent('start', () => {
    if (!isProcessingRef.current) {
      setVoiceState('listening');
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    if (isProcessingRef.current) return;
    const transcript = event.results?.[0]?.transcript;
    if (transcript) {
      currentTranscriptRef.current = transcript;
      setCaptionText(transcript);
    }
    if (event.isFinal && transcript && transcript.trim().length > 0) {
      currentTranscriptRef.current = '';
      handleVoiceQuery(transcript);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    if (isProcessingRef.current) return;
    console.log('[LiveVoice] Recognition event error:', event.error, event.message);

    if (event.error === 'no-speech' || event.error === 'speech-timeout') {
      if (voiceState === 'listening') {
        setCaptionText('No speech detected. Tap the microphone to speak.');
        setVoiceState('idle');
      }
    } else if (event.error === 'not-allowed') {
      setCaptionText('Microphone permission not granted. Tap mic to request.');
      setVoiceState('idle');
    } else if (event.error !== 'aborted') {
      setCaptionText(`Speech recognizer: ${event.message || event.error}`);
      setVoiceState('idle');
    }
  });

  useSpeechRecognitionEvent('end', () => {
    if (!isProcessingRef.current && voiceState === 'listening') {
      const pendingText = currentTranscriptRef.current.trim();
      if (pendingText.length > 0) {
        currentTranscriptRef.current = '';
        handleVoiceQuery(pendingText);
      } else {
        setVoiceState('idle');
      }
    }
  });

  // ---------------------------------------------------------
  // MAIN MICROPHONE PRESS (HANDLES BARGE-IN & TOGGLE)
  // ---------------------------------------------------------

  const handleMicPress = async () => {
    if (voiceState === 'responding') {
      // Barge-in: interrupt speech synthesis and immediately listen
      await SpeechService.stop();
      isProcessingRef.current = false;
      setVoiceState('idle');
      startListening();
      return;
    }

    if (voiceState === 'listening') {
      stopListening();
      return;
    }

    if (voiceState === 'processing') {
      // Allow canceling stuck processing request
      isProcessingRef.current = false;
      setVoiceState('idle');
      setCaptionText('Voice query cancelled. Tap the microphone to speak.');
      return;
    }

    // Idle or other state: start listening
    startListening();
  };

  // ---------------------------------------------------------
  // STATUS TITLE
  // ---------------------------------------------------------

  const getStatusTitle = () => {
    switch (voiceState) {
      case 'processing':
        return 'Thinking...';
      case 'responding':
        return 'NEX is Speaking...';
      case 'listening':
        return 'Listening...';
      case 'offline':
        return 'Offline';
      case 'idle':
      default:
        return 'Ready';
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <AppBackground style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.lg,
          },
        ]}
      >
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={() => {
              SpeechService.stop();
              try {
                ExpoSpeechRecognitionModule.abort();
              } catch {}
              navigation.goBack();
            }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <View style={styles.capabilityBadge}>
            <Text style={styles.capabilityText}>
              Native STT · Ollama Llama 3.2 · Native TTS
            </Text>
          </View>
        </View>

        {/* NEX VOICE STAGE */}
        <View style={styles.centerStage}>
          <NexAvatar
            variant={
              voiceState === 'listening'
                ? 'voice_orb'
                : voiceState === 'responding'
                ? 'speaking'
                : voiceState === 'processing'
                ? 'thinking'
                : 'idle'
            }
            size="lg"
          />

          <Text style={styles.statusTitle}>
            {getStatusTitle()}
          </Text>

          <ScrollView
            style={styles.captionScroll}
            contentContainerStyle={styles.captionScrollInner}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.statusCaption}>
              {captionText}
            </Text>
            {lastFailedQuery && voiceState === 'idle' ? (
              <TouchableOpacity
                style={styles.retryBtn}
                activeOpacity={0.7}
                onPress={() => {
                  const toRetry = lastFailedQuery;
                  setLastFailedQuery(null);
                  handleVoiceQuery(toRetry);
                }}
              >
                <Text style={styles.retryBtnText}>🔄 Retry Query</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>

        {/* WAVEFORM */}
        <View style={styles.waveformContainer}>
          <AudioWaveformVisualizer
            isActive={
              voiceState === 'listening' ||
              voiceState === 'responding'
            }
            color={
              voiceState === 'processing'
                ? theme.colors.status.processing
                : voiceState === 'responding'
                ? theme.colors.accent.secondary
                : theme.colors.accent.primary
            }
          />
        </View>

        {/* SYSTEM STATUS INFO */}
        <View style={styles.infoSection}>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>
              🎙️ Automatic Silence Detection Active
            </Text>
          </View>
        </View>

        {/* MAIN MICROPHONE */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[
              styles.mainMicButton,
              voiceState === 'processing' && styles.micProcessing,
              voiceState === 'responding' && styles.micResponding,
              voiceState === 'listening' && styles.micListening,
            ]}
            activeOpacity={0.85}
            onPress={handleMicPress}
          >
            <Text style={styles.micButtonIcon}>
              {voiceState === 'processing'
                ? '⏳'
                : voiceState === 'responding'
                ? '⏹'
                : voiceState === 'listening'
                ? '🔴'
                : '🎤'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.micHint}>
            {voiceState === 'responding'
              ? 'Tap to Interrupt NEX'
              : voiceState === 'listening'
              ? 'Tap to Stop Listening'
              : voiceState === 'processing'
              ? 'Synthesizing Response...'
              : 'Tap to Speak'}
          </Text>
        </View>
      </View>
    </AppBackground>
  );
};

// ===========================================================
// STYLES
// ===========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeIcon: {
    fontSize: 18,
    color: theme.colors.text.secondary,
  },

  capabilityBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },

  capabilityText: {
    fontSize: 10,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },

  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  statusTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    letterSpacing: 0.5,
  },

  captionScroll: {
    maxHeight: 140,
    width: '100%',
    marginTop: theme.spacing.sm,
  },

  captionScrollInner: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },

  statusCaption: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  waveformContainer: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },

  infoSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },

  infoPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },

  infoPillText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },

  bottomAction: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },

  mainMicButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },

  micListening: {
    backgroundColor: '#00E5FF',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  micProcessing: {
    backgroundColor: theme.colors.status.processing,
  },

  micResponding: {
    backgroundColor: theme.colors.accent.secondary,
  },

  micButtonIcon: {
    fontSize: 28,
  },

  micHint: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  retryBtn: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
  },
  retryBtnText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { AudioWaveformVisualizer } from '../components/common/AudioWaveformVisualizer';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';
import type { AvatarState } from '../config/constants';

interface LiveVoiceScreenProps {
  navigation: ScreenNavProp<'LiveVoice'>;
}

export const LiveVoiceScreen: React.FC<LiveVoiceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setAvatarState } = useApp();
  const [voiceState, setVoiceState] = useState<AvatarState>('listening');
  const [captionText, setCaptionText] = useState('Speak now...');

  // Set avatar state in sync with voice lifecycle
  useEffect(() => {
    setAvatarState(voiceState);
  }, [voiceState, setAvatarState]);

  // When listening, simulate user speech completion after a delay or upon tap
  const toggleVoiceLoop = () => {
    if (voiceState === 'listening') {
      // Transition to processing
      setVoiceState('processing');
      setCaptionText('Thinking and synthesizing...');

      setTimeout(() => {
        // Transition to responding
        setVoiceState('responding');
        setCaptionText("I'm here! All systems are synced. What shall we tackle next?");

        setTimeout(() => {
          // Reset to listening for continuous loop
          setVoiceState('listening');
          setCaptionText('Speak now...');
        }, 3000);
      }, 1500);
    } else {
      setVoiceState('listening');
      setCaptionText('Speak now...');
    }
  };

  const getStatusTitle = () => {
    switch (voiceState) {
      case 'processing':
        return 'Thinking...';
      case 'responding':
        return 'Responding...';
      case 'listening':
      default:
        return 'Listening...';
    }
  };

  return (
    <AppBackground style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.xl,
          },
        ]}
      >
        {/* Top Close Button from Reference Screen 24 */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Central Authoritative Voice Orb & Orbit Rings */}
        <View style={styles.centerStage}>
          <NexAvatar
            variant={voiceState === 'listening' ? 'voice_orb' : voiceState}
            size="lg"
          />

          {/* Status Text from Reference Screen 24 */}
          <Text style={styles.statusTitle}>{getStatusTitle()}</Text>
          <Text style={styles.statusCaption}>{captionText}</Text>
        </View>

        {/* Dynamic Glowing Waveform from Reference Screen 24 */}
        <View style={styles.waveformContainer}>
          <AudioWaveformVisualizer
            isActive={voiceState === 'listening' || voiceState === 'responding'}
            color={
              voiceState === 'processing'
                ? theme.colors.status.processing
                : theme.colors.accent.primary
            }
          />
        </View>

        {/* Large Glowing Circular Mic Action Button from Reference Screen 24 */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[
              styles.mainMicButton,
              voiceState === 'processing' && styles.micProcessing,
            ]}
            activeOpacity={0.85}
            onPress={toggleVoiceLoop}
          >
            <Text style={styles.micButtonIcon}>
              {voiceState === 'processing' ? '⏳' : '🎤'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppBackground>
  );
};

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
    alignItems: 'flex-start',
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
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xl,
    letterSpacing: 0.5,
  },
  statusCaption: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  waveformContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  bottomAction: {
    alignItems: 'center',
  },
  mainMicButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  micProcessing: {
    backgroundColor: theme.colors.status.processing,
    shadowColor: theme.colors.status.processing,
  },
  micButtonIcon: {
    fontSize: 30,
    color: '#050814',
  },
});

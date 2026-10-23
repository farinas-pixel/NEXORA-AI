import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar, AvatarVariant } from '../components/avatar/NexAvatar';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface NexHomeScreenProps {
  navigation: ScreenNavProp<'Home'>;
}

export const NexHomeScreen: React.FC<NexHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const {
    user,
    avatarState,
    robotReaction,
    visualEnvironment,
    preferences,
    isOnline,
    t,
  } = useApp();

  const [homeInputText, setHomeInputText] = useState('');
  const isStartingVoiceRef = useRef(false);
  const innerRingAnim = useRef(new Animated.Value(0)).current;
  const outerRingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!preferences?.reduceMotion) {
      // Inner ring: slow clockwise rotation
      const innerLoop = Animated.loop(
        Animated.timing(innerRingAnim, {
          toValue: 1,
          duration: 22000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      // Outer ring: slow counterclockwise rotation
      const outerLoop = Animated.loop(
        Animated.timing(outerRingAnim, {
          toValue: 1,
          duration: 28000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      innerLoop.start();
      outerLoop.start();

      return () => {
        innerLoop.stop();
        outerLoop.stop();
      };
    }
  }, [preferences?.reduceMotion, innerRingAnim, outerRingAnim]);

  const innerRotate = innerRingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const outerRotate = outerRingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  /**
   * Primary voice-entry point: Single tap on center robot or mic icon initiates real voice flow
   */
  const handleAvatarTap = async () => {
    if (isStartingVoiceRef.current) return;
    isStartingVoiceRef.current = true;

    try {
      if (!isOnline) {
        Alert.alert('Offline Mode', 'Internet connection is required for live voice interaction.');
        return;
      }

      // Check and request microphone permission before navigating
      if (Platform.OS !== 'web') {
        const perm = await ExpoSpeechRecognitionModule.getPermissionsAsync();
        if (!perm?.granted) {
          const requested = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
          if (!requested?.granted) {
            Alert.alert(
              'Microphone Permission Required',
              'Please grant microphone permission to communicate with NEXORA AI by voice.',
              [{ text: 'OK' }]
            );
            return;
          }
        }
      } else if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          // Release test audio tracks immediately
          stream.getTracks().forEach((track) => track.stop());
        } catch {
          Alert.alert(
            'Microphone Permission Required',
            'Please grant microphone permission in your browser to communicate with NEXORA AI by voice.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Real voice input flow navigation
      navigation.navigate('LiveVoice');
    } catch (e: any) {
      console.warn('Microphone permission check error:', e);
      // Fallback navigate to LiveVoice which handles full fallback/permission UI
      navigation.navigate('LiveVoice');
    } finally {
      setTimeout(() => {
        isStartingVoiceRef.current = false;
      }, 600);
    }
  };

  /**
   * Handles submitting text query to chat
   */
  const handleHomeChatSubmit = () => {
    const trimmed = homeInputText.trim();
    if (!trimmed) {
      handleAvatarTap();
      return;
    }
    setHomeInputText('');
    navigation.navigate('ActiveChat', { initialPrompt: trimmed });
  };

  /**
   * Original 5-item bottom navigation tap handler
   */
  const handleTabPress = (tab: TabName) => {
    if (tab === 'Home') {
      // Already on Home screen
    } else if (tab === 'Plan' || tab === 'MyDay') {
      navigation.navigate('MyDay');
    } else if (tab === 'Chat' || tab === 'AIAssistant') {
      navigation.navigate('ActiveChat');
    } else if (tab === 'Friends') {
      navigation.navigate('FriendsChat');
    } else if (tab === 'Profile' || tab === 'MyLife') {
      navigation.navigate('MyLife');
    } else if (tab === 'Memory') {
      navigation.navigate('MemoryOverview');
    } else if (tab === 'SoloMode') {
      navigation.navigate('VoicePreferences', { initialCategory: 'solomode' } as any);
    } else if (tab === 'DailyNews') {
      navigation.navigate('NewsIntelligence');
    }
  };

  /**
   * Direct healthcare suite route helper (preserved for route contract)
   */
  const _handleOpenHealthcare = () => {
    navigation.navigate('Healthcare');
  };

  /**
   * Select avatar variant: defaults to the cute 3D voice orb head when idle
   */
  const getAvatarVariant = (): AvatarVariant => {
    if (robotReaction !== 'idle') return robotReaction;
    if (avatarState === 'idle') return 'voice_orb';
    return avatarState;
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 8, paddingBottom: Math.max(insets.bottom, 8) }]}>
        {/* Top Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Open Profile"
            accessibilityRole="button"
          >
            <Ionicons name="person-outline" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.centerBadge}>
            <Text style={styles.brandTitle}>NEXORA AI</Text>
            <StatusBadge
              label={!isOnline ? t('status_offline') : preferences.soloMode ? t('status_solo') : t('status_living')}
              status={!isOnline ? 'idle' : preferences.soloMode ? 'idle' : 'success'}
            />
          </View>

          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('VoicePreferences')}
            accessibilityLabel="Open Settings"
            accessibilityRole="button"
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Main Center Area: Cute 3D Robot Head + Large Glassmorphism Chat */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.contentContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. TOP SECTION: Cute Rounded 3D Robot Head with Double Circular Neon Rings */}
            <View style={styles.robotSection}>
              {/* Geometrically Centered Avatar Stage */}
              <View style={styles.avatarStage}>
                {/* Two Concentric Circular Neon Rings Behind Robot */}
                <View style={styles.ringsContainer} pointerEvents="none">
                  {/* Outer Ring: Electric Blue #3978FF (Rotates Counterclockwise) */}
                  <Animated.View
                    style={[
                      styles.outerNeonRing,
                      { transform: [{ rotate: outerRotate }] },
                    ]}
                  />
                  {/* Inner Ring: Ice Cyan #39E6FF (Rotates Clockwise) */}
                  <Animated.View
                    style={[
                      styles.innerNeonRing,
                      { transform: [{ rotate: innerRotate }] },
                    ]}
                  />
                </View>

                {/* Main 3D Robot Head Avatar Touch Target */}
                <NexAvatar
                  variant={getAvatarVariant()}
                  size="hero"
                  hideHalo
                  glowColorOverride={visualEnvironment.glowColor || '#00E5FF'}
                  onPress={handleAvatarTap}
                  showReactionBadge={false}
                />
              </View>

              {/* Status and Action Guidance Pill */}
              <TouchableOpacity
                style={[
                  styles.stateBadge,
                  {
                    borderColor:
                      avatarState === 'listening'
                        ? '#00E5FF'
                        : avatarState === 'processing'
                        ? '#F59E0B'
                        : avatarState === 'responding'
                        ? '#10B981'
                        : avatarState === 'offline'
                        ? '#EF4444'
                        : 'rgba(0, 229, 255, 0.4)',
                  },
                ]}
                activeOpacity={0.8}
                onPress={handleAvatarTap}
              >
                <View
                  style={[
                    styles.statePulseDot,
                    {
                      backgroundColor:
                        avatarState === 'listening'
                          ? '#00E5FF'
                          : avatarState === 'processing'
                          ? '#F59E0B'
                          : avatarState === 'responding'
                          ? '#10B981'
                          : avatarState === 'offline'
                          ? '#EF4444'
                          : '#00E5FF',
                    },
                  ]}
                />
                <Text style={styles.stateBadgeText}>
                  {avatarState === 'listening'
                    ? 'Listening...'
                    : avatarState === 'processing'
                    ? 'Thinking...'
                    : avatarState === 'responding'
                    ? 'Speaking'
                    : avatarState === 'offline'
                    ? 'Offline'
                    : 'Tap Robot to Talk'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. CHAT SECTION: Large Rounded Glassmorphism Chat Interface */}
            <GlassCard style={styles.homeComposerCard}>
              <View style={styles.chatHeaderRow}>
                <Text style={styles.chatGreeting}>
                  Hi, {user?.name || 'Explorer'}
                </Text>
                <Text style={styles.chatSubGreeting}>
                  How can NEXORA assist you right now?
                </Text>
              </View>

              {/* Input field with rounded glass backdrop */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.composerTextInput}
                  placeholder="Ask NEXORA anything or type prompt..."
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={homeInputText}
                  onChangeText={setHomeInputText}
                  onSubmitEditing={handleHomeChatSubmit}
                  returnKeyType="send"
                  multiline={false}
                />
              </View>

              {/* Actions row: Microphone Control & Send Button */}
              <View style={styles.chatActionsRow}>
                <TouchableOpacity
                  style={styles.micControlBtn}
                  activeOpacity={0.75}
                  onPress={handleAvatarTap}
                  accessibilityLabel="Voice microphone input"
                  accessibilityRole="button"
                >
                  <Ionicons name="mic" size={20} color="#C4B5FD" />
                  <Text style={styles.micControlText}>Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sendActionBtn,
                    homeInputText.trim() ? styles.sendActionBtnActive : null,
                  ]}
                  activeOpacity={0.8}
                  onPress={handleHomeChatSubmit}
                  accessibilityLabel="Send message"
                  accessibilityRole="button"
                >
                  <Ionicons
                    name="paper-plane"
                    size={18}
                    color={homeInputText.trim() ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)'}
                  />
                  <Text
                    style={[
                      styles.sendActionText,
                      homeInputText.trim() ? styles.sendActionTextActive : null,
                    ]}
                  >
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 3. ORIGINAL RESTORED 5-ITEM BOTTOM NAVIGATION (Home | My Day | Central Robot | Friends | My Life) */}
        <BottomNavBar
          activeTab="Home"
          onTabPress={handleTabPress}
          onDoubleTapChat={() => navigation.navigate('ActiveChat')}
        />
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09071A',
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(167, 139, 250, 0.22)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C4B5FD',
    letterSpacing: 2,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  robotSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 10,
    minHeight: 260,
  },
  avatarStage: {
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringsContainer: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  outerNeonRing: {
    position: 'absolute',
    width: 254,
    height: 254,
    borderRadius: 127,
    borderWidth: 1.5,
    borderColor: '#3978FF',
    shadowColor: '#3978FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
  innerNeonRing: {
    position: 'absolute',
    width: 216,
    height: 216,
    borderRadius: 108,
    borderWidth: 1.5,
    borderColor: '#39E6FF',
    shadowColor: '#39E6FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 8,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 20, 38, 0.75)',
    borderWidth: 1.2,
    gap: 8,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  statePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stateBadgeText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  homeComposerCard: {
    width: '100%',
    backgroundColor: 'rgba(18, 14, 42, 0.72)',
    borderColor: 'rgba(167, 139, 250, 0.22)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 18,
    marginTop: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  chatHeaderRow: {
    marginBottom: 12,
  },
  chatGreeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  chatSubGreeting: {
    fontSize: 13,
    color: '#DDD6FE',
    marginTop: 3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(196, 181, 253, 0.16)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  composerTextInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 28,
  },
  chatActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  micControlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
    borderWidth: 1,
  },
  micControlText: {
    color: '#C4B5FD',
    fontSize: 13,
    fontWeight: '600',
  },
  sendActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
  },
  sendActionBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendActionText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '600',
  },
  sendActionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

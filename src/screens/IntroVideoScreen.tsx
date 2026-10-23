import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { ScreenNavProp } from '../types/navigation';

interface IntroVideoScreenProps {
  navigation: ScreenNavProp<'IntroVideo'>;
}

const introVideoAsset = require('../../assets/robot/Nexora_intro_video.mp4');

export const IntroVideoScreen: React.FC<IntroVideoScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const hasNavigatedRef = useRef(false);
  const [isMuted, setIsMuted] = useState(Platform.OS === 'web');

  const handleFinish = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('Splash');
  }, [navigation]);

  const player = useVideoPlayer(introVideoAsset, (p) => {
    p.loop = false;
    p.muted = Platform.OS === 'web';
    try {
      p.play();
    } catch {
      // Autoplay might be restricted on initial interaction in some browsers
    }
  });

  useEffect(() => {
    const endSub = player.addListener('playToEnd', () => {
      handleFinish();
    });

    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') {
        handleFinish();
      }
    });

    // Fallback safety timeout in case video fails or hangs
    const safetyTimer = setTimeout(() => {
      handleFinish();
    }, 12000);

    return () => {
      endSub.remove();
      statusSub.remove();
      clearTimeout(safetyTimer);
    };
  }, [player, handleFinish]);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    player.muted = nextMuted;
    if (!player.playing) {
      player.play();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05020B" translucent />

      {/* Video View */}
      <VideoView
        style={styles.video}
        player={player}
        nativeControls={false}
        contentFit="contain"
      />

      {/* Top Floating Controls */}
      <View style={[styles.controlsOverlay, { top: Math.max(insets.top + 12, 20) }]}>
        <TouchableOpacity
          style={styles.controlPill}
          onPress={toggleSound}
          activeOpacity={0.7}
          accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlPill, styles.skipPill]}
          onPress={handleFinish}
          activeOpacity={0.7}
          accessibilityLabel="Skip intro video"
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05020B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#05020B',
  },
  controlsOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  skipPill: {
    gap: 4,
  },
  skipText: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

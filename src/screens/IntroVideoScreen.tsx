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
  const [isMuted, setIsMuted] = useState(false);

  const handleFinish = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    navigation.replace('Splash');
  }, [navigation]);

  const player = useVideoPlayer(introVideoAsset, (p) => {
    p.loop = false;
    p.muted = false;
    try {
      p.play();
    } catch {
      // In case browser autoplay policy blocks unmuted audio on web before gesture
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
      try {
        player.play();
      } catch {
        // ignore
      }
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

      {/* Top Floating Audio Control */}
      <View style={[styles.controlsOverlay, { top: Math.max(insets.top + 12, 20) }]}>
        <TouchableOpacity
          style={styles.controlPill}
          onPress={toggleSound}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#05020B',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#05020B',
  },
  controlsOverlay: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
});

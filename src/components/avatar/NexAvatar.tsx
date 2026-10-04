import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import type { AvatarState } from '../../config/constants';

export type AvatarVariant = AvatarState | 'hero' | 'voice_orb' | 'mini';

interface NexAvatarProps {
  variant?: AvatarVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
}

export const NexAvatar: React.FC<NexAvatarProps> = ({
  variant = 'idle',
  size = 'md',
  style,
  animated = true,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) return;

    // Gentle vertical floating motion
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    // Subtle breathing glow animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [animated, floatAnim, pulseAnim]);

  const getImageSource = () => {
    switch (variant) {
      case 'hero':
        return require('../../../assets/robot/hero_robot.png');
      case 'voice_orb':
        return require('../../../assets/robot/voice_orb.png');
      case 'listening':
        return require('../../../assets/robot/state_listening_head.png');
      case 'processing':
        return require('../../../assets/robot/state_processing_head.png');
      case 'responding':
        return require('../../../assets/robot/state_responding_head.png');
      case 'mini':
        return require('../../../assets/robot/avatar_mini.png');
      case 'idle':
      default:
        return require('../../../assets/robot/state_idle_head.png');
    }
  };

  const getDimensions = () => {
    switch (size) {
      case 'xs':
        return { width: 34, height: 34, borderRadius: 17 };
      case 'sm':
        return { width: 52, height: 52, borderRadius: 26 };
      case 'lg':
        return { width: 140, height: 140, borderRadius: 70 };
      case 'hero':
        return { width: 220, height: 260, borderRadius: 0 };
      case 'md':
      default:
        return { width: 88, height: 88, borderRadius: 44 };
    }
  };

  const getGlowColor = () => {
    switch (variant) {
      case 'listening':
        return theme.colors.status.listening;
      case 'processing':
        return theme.colors.status.processing;
      case 'responding':
        return theme.colors.status.responding;
      case 'hero':
      case 'voice_orb':
      case 'idle':
      default:
        return theme.colors.accent.primary;
    }
  };

  const dims = getDimensions();
  const glowColor = getGlowColor();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: animated && size !== 'xs' ? floatAnim : 0 },
            { scale: animated && (variant === 'listening' || variant === 'processing') ? pulseAnim : 1 },
          ],
        },
        style,
      ]}
    >
      {/* Outer Glow Halo */}
      {size !== 'xs' && (
        <View
          style={[
            styles.halo,
            {
              width: dims.width * 1.15,
              height: dims.height * 1.15,
              borderRadius: (dims.width * 1.15) / 2,
              shadowColor: glowColor,
              borderColor: `${glowColor}30`,
            },
          ]}
        />
      )}

      {/* Authoritative Extracted Character Image */}
      <Image
        source={getImageSource()}
        style={[
          styles.image,
          {
            width: dims.width,
            height: dims.height,
            borderRadius: dims.borderRadius,
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 8,
  },
  image: {
    overflow: 'hidden',
  },
});

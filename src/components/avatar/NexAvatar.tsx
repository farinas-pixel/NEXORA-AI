import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, StyleProp, ViewStyle, TouchableOpacity, Text } from 'react-native';
import { theme } from '../../theme';
import type { AvatarState } from '../../config/constants';
import type { RobotReaction } from '../../services/ai/aiBrain';

export type AvatarVariant = AvatarState | RobotReaction | 'hero' | 'voice_orb' | 'mini';

interface NexAvatarProps {
  variant?: AvatarVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  glowColorOverride?: string;
  onPress?: () => void;
  showReactionBadge?: boolean;
}

export const NexAvatar: React.FC<NexAvatarProps> = ({
  variant = 'idle',
  size = 'md',
  style,
  animated = true,
  glowColorOverride,
  onPress,
  showReactionBadge = false,
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

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
          toValue: variant === 'listening' || variant === 'attention' ? 1.12 : 1.05,
          duration: variant === 'listening' ? 800 : 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: variant === 'listening' ? 800 : 1200,
          useNativeDriver: true,
        }),
      ])
    );

    // Thinking / Confused subtle wobble or rotation
    let rotateLoop: Animated.CompositeAnimation | null = null;
    if (variant === 'thinking' || variant === 'processing' || variant === 'confused') {
      rotateLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: variant === 'confused' ? 1 : 0.5,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: variant === 'confused' ? -1 : -0.5,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      rotateLoop.start();
    }

    // Success / Happy bounce
    let bounceLoop: Animated.CompositeAnimation | null = null;
    if (variant === 'success' || variant === 'happy' || variant === 'task_complete') {
      bounceLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -12,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(1200),
        ])
      );
      bounceLoop.start();
    }

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      if (rotateLoop) rotateLoop.stop();
      if (bounceLoop) bounceLoop.stop();
    };
  }, [animated, floatAnim, pulseAnim, rotateAnim, bounceAnim, variant]);

  const getImageSource = () => {
    switch (variant) {
      case 'hero':
      case 'task_complete':
        return require('../../../assets/robot/hero_robot.png');
      case 'voice_orb':
        return require('../../../assets/robot/voice_orb.png');
      case 'listening':
      case 'attention':
        return require('../../../assets/robot/state_listening_head.png');
      case 'thinking':
      case 'processing':
      case 'confused':
      case 'error':
        return require('../../../assets/robot/state_processing_head.png');
      case 'speaking':
      case 'responding':
      case 'success':
      case 'happy':
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
    if (glowColorOverride) return glowColorOverride;

    switch (variant) {
      case 'listening':
        return theme.colors.status.listening;
      case 'thinking':
      case 'processing':
        return theme.colors.status.processing;
      case 'speaking':
      case 'responding':
        return theme.colors.status.responding;
      case 'success':
      case 'task_complete':
        return '#10B981'; // Emerald
      case 'error':
        return '#EF4444'; // Red
      case 'attention':
        return '#F59E0B'; // Amber
      case 'confused':
        return '#8B5CF6'; // Violet
      case 'happy':
        return '#FBBF24'; // Warm Gold
      case 'offline':
        return '#64748B'; // Offline Slate
      case 'hero':
      case 'voice_orb':
      case 'idle':
      default:
        return theme.colors.accent.primary;
    }
  };

  const getReactionBadgeEmoji = () => {
    switch (variant) {
      case 'listening': return '🎙️';
      case 'thinking':
      case 'processing': return '🧠';
      case 'speaking':
      case 'responding': return '💬';
      case 'success':
      case 'task_complete': return '✨';
      case 'error': return '⚠️';
      case 'attention': return '👀';
      case 'confused': return '❓';
      case 'happy': return '🌟';
      case 'offline': return '📡';
      default: return '🤖';
    }
  };

  const dims = getDimensions();
  const glowColor = getGlowColor();

  const spin = rotateAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const content = (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: animated && size !== 'xs' ? Animated.add(floatAnim, bounceAnim) : 0 },
            { scale: animated && (variant === 'listening' || variant === 'processing' || variant === 'attention') ? pulseAnim : 1 },
            { rotate: spin },
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
              width: dims.width * 1.18,
              height: dims.height * 1.18,
              borderRadius: (dims.width * 1.18) / 2,
              shadowColor: glowColor,
              borderColor: `${glowColor}40`,
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

      {/* Optional Reaction Badge */}
      {showReactionBadge && size !== 'xs' && (
        <View style={[styles.badge, { backgroundColor: `${glowColor}33`, borderColor: glowColor }]}>
          <Text style={styles.badgeText}>{getReactionBadgeEmoji()}</Text>
        </View>
      )}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  halo: {
    position: 'absolute',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 20,
    elevation: 10,
  },
  image: {
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
  },
});

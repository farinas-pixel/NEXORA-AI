import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { theme } from '../../theme';

interface AudioWaveformVisualizerProps {
  isActive?: boolean;
  barCount?: number;
  color?: string;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isActive = true,
  barCount = 18,
  color = theme.colors.accent.primary,
}) => {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (!isActive) {
      animatedValues.forEach((val) => val.setValue(0.2));
      return;
    }

    const animations = animatedValues.map((val, index) => {
      // Create distinct oscillating patterns for natural audio-spectrum visualizer
      const baseHeight = 0.2 + (Math.sin(index * 0.6) + 1) * 0.35;
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: Math.min(1.0, baseHeight + 0.35),
            duration: 250 + (index % 5) * 80,
            useNativeDriver: false,
          }),
          Animated.timing(val, {
            toValue: Math.max(0.15, baseHeight - 0.2),
            duration: 250 + (index % 5) * 80,
            useNativeDriver: false,
          }),
        ])
      );
    });

    Animated.parallel(animations).start();

    return () => {
      animations.forEach((anim) => anim.stop());
    };
  }, [isActive, animatedValues, barCount]);

  return (
    <View style={styles.container}>
      {animatedValues.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 4,
  },
  bar: {
    width: 3.5,
    height: 38,
    borderRadius: 2,
    opacity: 0.9,
  },
});

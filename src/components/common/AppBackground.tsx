import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ children, style }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0E0B25', '#0A081D', '#060512']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient Top Glow Layer - Atmospheric Violet Bloom */}
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.15)', 'rgba(99, 45, 248, 0.05)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />
      <View style={[styles.content, style]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  content: {
    flex: 1,
  },
});

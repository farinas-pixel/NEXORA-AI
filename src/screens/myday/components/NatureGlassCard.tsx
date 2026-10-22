import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { NatureTheme } from '../theme';

interface NatureGlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderColor?: string;
  glowColor?: string;
}

export const NatureGlassCard: React.FC<NatureGlassCardProps> = ({
  children,
  style,
  borderColor,
  glowColor,
}) => {
  return (
    <View
      style={[
        styles.card,
        NatureTheme.shadows.glass,
        borderColor ? { borderColor } : null,
        glowColor ? { shadowColor: glowColor, shadowOpacity: 0.35 } : null,
        style,
      ]}
    >
      {/* Specular Top Depth Highlight Line */}
      <View style={styles.topHighlightLine} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: NatureTheme.colors.glassSurface,
    borderRadius: NatureTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: NatureTheme.colors.glassBorder,
    padding: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  topHighlightLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.5,
    backgroundColor: NatureTheme.colors.topSpecular,
    borderRadius: 1,
  },
});

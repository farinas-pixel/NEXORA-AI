import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { theme } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'highlight' | 'violet' | 'subtle';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'highlight' && styles.highlight,
        variant === 'violet' && styles.violet,
        variant === 'subtle' && styles.subtle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.glass.panel,
    borderColor: theme.colors.glass.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    overflow: 'hidden',
  },
  highlight: {
    borderColor: theme.colors.glass.borderActive,
    backgroundColor: theme.colors.background.cardHighlight,
  },
  violet: {
    borderColor: theme.colors.glass.borderViolet,
    backgroundColor: 'rgba(59, 14, 115, 0.35)',
  },
  subtle: {
    backgroundColor: theme.colors.glass.background,
    borderColor: theme.colors.glass.borderSubtle,
  },
});

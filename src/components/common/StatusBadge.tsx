import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../theme';

export type BadgeStatus = 'idle' | 'listening' | 'processing' | 'responding' | 'error' | 'success' | 'info';

interface StatusBadgeProps {
  label: string;
  status?: BadgeStatus;
  style?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status = 'info',
  style,
}) => {
  const getStatusColor = (): string => {
    switch (status) {
      case 'idle':
        return theme.colors.status.idle;
      case 'listening':
        return theme.colors.status.listening;
      case 'processing':
        return theme.colors.status.processing;
      case 'responding':
      case 'success':
        return theme.colors.status.responding;
      case 'error':
        return theme.colors.status.error;
      case 'info':
      default:
        return theme.colors.accent.primary;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={[styles.container, { borderColor: `${statusColor}40` }, style]}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <Text style={[styles.text, { color: theme.colors.text.primary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.xs,
  },
  text: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { theme } from '../../theme';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'primary'
              ? theme.colors.text.inverse
              : theme.colors.accent.primary
          }
        />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'primary' && styles.primaryText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'ghost' && styles.ghostText,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: theme.colors.accent.primary,
  },
  secondary: {
    backgroundColor: theme.colors.glass.background,
    borderColor: theme.colors.glass.border,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  primaryText: {
    color: theme.colors.text.inverse,
  },
  secondaryText: {
    color: theme.colors.text.primary,
  },
  ghostText: {
    color: theme.colors.accent.primary,
  },
  disabledText: {
    color: theme.colors.text.tertiary,
  },
});

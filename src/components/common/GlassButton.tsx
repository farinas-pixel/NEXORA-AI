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
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'secondary' | 'violet';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
}) => {
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled || loading}
        style={[styles.wrapper, disabled && styles.disabled, style]}
        accessibilityRole="button"
      >
        <LinearGradient
          colors={[theme.colors.accent.primaryGradientStart, theme.colors.accent.primaryGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              {leftIcon}
              <Text style={[styles.primaryText, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.wrapper,
        styles.ghostBase,
        variant === 'violet' && styles.violetBorder,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.accent.primary} />
      ) : (
        <>
          {leftIcon}
          <Text
            style={[
              styles.ghostText,
              variant === 'violet' && styles.violetText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  primaryGradient: {
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  ghostBase: {
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: theme.colors.glass.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  violetBorder: {
    borderColor: theme.colors.glass.borderViolet,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  ghostText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  violetText: {
    color: '#C084FC',
  },
});

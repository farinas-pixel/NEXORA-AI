import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { theme } from '../../theme';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  containerStyle,
  leftIcon,
  rightIcon,
  multiline,
  style,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          multiline && styles.inputContainerMultiline,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={theme.colors.text.tertiary}
          selectionColor={theme.colors.accent.primary}
          cursorColor={theme.colors.accent.primary}
          multiline={multiline}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : undefined,
            style,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...inputProps}
        />
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.muted,
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: theme.colors.glass.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 48,
  },
  inputContainerMultiline: {
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.sm,
  },
  inputFocused: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  inputError: {
    borderColor: theme.colors.status.error,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    backgroundColor: 'transparent',
  },
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 64,
  },
  iconContainer: {
    marginRight: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xxs,
  },
});

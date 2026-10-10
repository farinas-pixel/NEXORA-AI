// src/screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { GlassInput } from '../components/common/GlassInput';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { theme } from '../theme';
import { updateUserPassword, setSessionFromUrl, signOut } from '../services/auth/authService';
import type { ScreenNavProp, ScreenRouteProp } from '../types/navigation';

interface ResetPasswordScreenProps {
  navigation: ScreenNavProp<'ResetPassword'>;
  route: ScreenRouteProp<'ResetPassword'>;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route: _route }) => {
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;
      const parsed = await setSessionFromUrl(url);
      if (parsed) {
        setSessionReady(true);
      }
    };

    // Check initial deep link
    Linking.getInitialURL().then(handleUrl);

    // Listen for incoming deep link events
    const sub = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => {
      sub.remove();
    };
  }, []);

  const isPasswordEntered = password.length > 0;
  const isPasswordLengthValid = password.length >= 6;
  const isConfirmEntered = confirmPassword.length > 0;
  const isPasswordMatch = isPasswordEntered && password === confirmPassword;

  const isFormValid = isPasswordLengthValid && isPasswordMatch;

  const handleUpdatePassword = async () => {
    if (loading) return; // Prevent duplicate in-flight requests

    setError('');
    if (!isPasswordLengthValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!isPasswordMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserPassword(password);
      if (!res.ok) {
        setError(res.error || 'Failed to update password. Please request a new reset link.');
        return;
      }

      // Password successfully updated! Sign out any temporary recovery session
      await signOut();

      Alert.alert(
        'Password Reset Successful',
        'Your password has been securely updated. Please sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred while resetting your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + theme.spacing.lg,
              paddingBottom: insets.bottom + theme.spacing.lg,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <NexAvatar variant="idle" size="sm" />
            <Text style={styles.title}>Create New Password</Text>
            <Text style={styles.subtitle}>Set a secure new password for your NEX account</Text>
          </View>

          {/* Glassmorphic Form Card */}
          <GlassCard style={styles.formCard}>
            {sessionReady && (
              <View style={styles.indicatorContainer}>
                <Text style={styles.indicatorGreen}>✓ Secure recovery link connected</Text>
              </View>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            <View>
              <GlassInput
                label="New Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                placeholder="Minimum 6 characters"
                secureTextEntry
              />
              {isPasswordEntered && (
                <View style={styles.indicatorContainer}>
                  {isPasswordLengthValid ? (
                    <Text style={styles.indicatorGreen}>✓ Password length valid</Text>
                  ) : (
                    <Text style={styles.indicatorRed}>
                      ⚠️ Minimum 6 characters ({password.length}/6)
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View>
              <GlassInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError('');
                }}
                placeholder="Re-enter password"
                secureTextEntry
              />
              {isConfirmEntered && (
                <View style={styles.indicatorContainer}>
                  {isPasswordMatch ? (
                    <Text style={styles.indicatorGreen}>✓ Passwords match</Text>
                  ) : (
                    <Text style={styles.indicatorRed}>⚠️ Passwords do not match</Text>
                  )}
                </View>
              )}
            </View>

            <GlassButton
              title="Save New Password"
              variant="primary"
              disabled={!isFormValid || loading}
              loading={loading}
              onPress={handleUpdatePassword}
              style={styles.submitBtn}
            />
          </GlassCard>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('SignIn')}
            >
              <Text style={styles.footerLink}>← Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xxs,
    textAlign: 'center',
  },
  formCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  errorText: {
    color: '#FF5252',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  indicatorContainer: {
    paddingHorizontal: theme.spacing.xs,
    paddingTop: 4,
    paddingBottom: 2,
  },
  indicatorGreen: {
    color: '#00E676',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  indicatorRed: {
    color: '#FF5252',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
});

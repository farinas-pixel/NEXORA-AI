import React, { useState } from 'react';
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
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { GlassInput } from '../components/common/GlassInput';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { resendConfirmationEmail } from '../services/auth/authService';
import type { ScreenNavProp } from '../types/navigation';

interface CreateAccountScreenProps {
  navigation: ScreenNavProp<'CreateAccount'>;
}

export const CreateAccountScreen: React.FC<CreateAccountScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signUp, t } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const isPasswordLengthValid = password.length >= 6;
  const isPasswordEntered = password.length > 0;
  const isConfirmEntered = confirmPassword.length > 0;
  const isPasswordMatch = isPasswordEntered && password === confirmPassword;
  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    email.includes('@') &&
    isPasswordLengthValid &&
    isPasswordMatch;

  const handleSignUp = async () => {
    if (loading) return; // Prevent duplicate in-flight sign-up requests

    setError('');
    if (!name.trim()) {
      setError(t('auth_err_name_required'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError(t('auth_err_email_invalid'));
      return;
    }
    if (!isPasswordLengthValid) {
      setError(t('auth_err_password_length'));
      return;
    }
    if (!isPasswordMatch) {
      setError(t('auth_err_password_mismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(name.trim(), email.trim(), password);
      if (result.requiresEmailConfirmation) {
        setEmailConfirmationRequired(true);
      } else {
        navigation.replace('SetupComplete');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending) return; // Prevent duplicate in-flight resend requests

    setResending(true);
    setResendSuccess(false);
    try {
      const res = await resendConfirmationEmail(email.trim());
      if (res.ok) {
        setResendSuccess(true);
        Alert.alert(t('auth_verification_sent_title'), t('auth_verification_sent_desc'));
      } else {
        setError(res.error || 'Failed to resend confirmation email.');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
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
              paddingTop: insets.top + theme.spacing.md,
              paddingBottom: insets.bottom + theme.spacing.lg,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {emailConfirmationRequired ? (
            /* Email Confirmation Required View */
            <View style={styles.confirmContainer}>
              <View style={styles.header}>
                <NexAvatar variant="idle" size="md" />
                <Text style={styles.title}>{t('auth_verification_sent_title')}</Text>
                <Text style={styles.subtitle}>
                  {t('auth_signup_verify_email')}
                </Text>
              </View>

              <GlassCard style={styles.formCard}>
                {resendSuccess && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>✓ {t('auth_verification_sent_desc')}</Text>
                  </View>
                )}
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                ) : null}

                <GlassButton
                  title={t('auth_resend_confirm')}
                  variant="secondary"
                  loading={resending}
                  disabled={resending}
                  onPress={handleResend}
                  style={styles.submitBtn}
                />

                <GlassButton
                  title={t('auth_signin_btn')}
                  variant="primary"
                  onPress={() => navigation.navigate('SignIn')}
                  style={styles.submitBtn}
                />
              </GlassCard>
            </View>
          ) : (
            /* Normal Sign Up Form */
            <>
              {/* Top Robot Badge & Heading */}
              <View style={styles.header}>
                <NexAvatar variant="idle" size="sm" />
                <Text style={styles.title}>{t('auth_signup_title')}</Text>
                <Text style={styles.subtitle}>{t('auth_signup_sub')}</Text>
              </View>

              {/* Glassmorphic Form Card */}
              <GlassCard style={styles.formCard}>
                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                  </View>
                ) : null}

                <GlassInput
                  label={t('auth_fullname_label')}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError('');
                  }}
                  placeholder={t('auth_fullname_placeholder')}
                  autoCapitalize="words"
                />
                <GlassInput
                  label={t('auth_email_label')}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  placeholder={t('auth_email_placeholder')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View>
                  <GlassInput
                    label={t('auth_password_label')}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (error) setError('');
                    }}
                    placeholder={t('auth_password_placeholder')}
                    secureTextEntry
                  />
                  {isPasswordEntered && (
                    <View style={styles.indicatorContainer}>
                      {isPasswordLengthValid ? (
                        <Text style={styles.indicatorGreen}>✓ Password length valid</Text>
                      ) : (
                        <Text style={styles.indicatorRed}>⚠️ Minimum 6 characters ({password.length}/6)</Text>
                      )}
                    </View>
                  )}
                </View>

                <View>
                  <GlassInput
                    label={t('auth_confirm_password_label')}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      if (error) setError('');
                    }}
                    placeholder={t('auth_confirm_password_placeholder')}
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

                <View style={styles.termsBox}>
                  <Text style={styles.termsText}>
                    By continuing, you agree that memory vault data is strictly encrypted
                    locally with zero cloud telemetry sold.
                  </Text>
                </View>

                <GlassButton
                  title={t('auth_signup_btn')}
                  variant="primary"
                  disabled={!isFormValid || loading}
                  loading={loading}
                  onPress={handleSignUp}
                  style={styles.submitBtn}
                />
              </GlassCard>

              {/* Footer Action */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('auth_already_have_account')}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('SignIn')}
                >
                  <Text style={styles.footerLink}>{t('auth_signin_link')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confirmContainer: {
    paddingTop: theme.spacing.xl,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xxs,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.md,
  },
  formCard: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 23, 68, 0.15)',
    borderColor: '#FF1744',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  errorText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#FF1744',
    fontWeight: theme.typography.fontWeight.medium,
  },
  successBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  successText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#00E676',
    fontWeight: theme.typography.fontWeight.medium,
  },
  termsBox: {
    paddingVertical: 4,
  },
  termsText: {
    fontSize: 10,
    color: theme.colors.text.muted,
    lineHeight: 14,
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
    marginTop: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
  },
  footerLink: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
  },
});

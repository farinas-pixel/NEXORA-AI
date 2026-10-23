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

interface SignInScreenProps {
  navigation: ScreenNavProp<'SignIn'>;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signIn, completeOnboarding, t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isEmailNotConfirmed, setIsEmailNotConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSignIn = async () => {
    if (loading) return; // Prevent duplicate in-flight requests

    setError('');
    setInfoMessage('');
    setIsEmailNotConfirmed(false);

    if (!email.trim() || !email.includes('@')) {
      setError(t('auth_err_email_invalid'));
      return;
    }
    if (!password) {
      setError(t('auth_err_password_required'));
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      await completeOnboarding();
      // Transition to Home is handled declaratively by RootNavigator upon isAuthenticated=true
    } catch (e: any) {
      const msg = e.message || '';
      if (e.isEmailNotConfirmed || msg.toLowerCase().includes('email not confirmed')) {
        setIsEmailNotConfirmed(true);
        setError(t('auth_err_email_unconfirmed'));
      } else {
        setError(t('auth_err_invalid_credentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resending) return; // Prevent duplicate in-flight resend requests

    if (!email.trim()) {
      setError(t('auth_err_email_invalid'));
      return;
    }
    setResending(true);
    try {
      const res = await resendConfirmationEmail(email.trim());
      if (res.ok) {
        setInfoMessage(t('auth_verification_sent_desc'));
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

  const handleForgot = () => {
    navigation.navigate('ForgotPassword');
  };

  const isFormValid = email.trim().length > 0 && email.includes('@') && password.length > 0;

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
          {/* Top Robot Badge & Heading */}
          <View style={styles.header}>
            <NexAvatar variant="idle" size="sm" />
            <Text style={styles.title}>{t('auth_signin_title')}</Text>
            <Text style={styles.subtitle}>{t('auth_signin_sub')}</Text>
          </View>

          {/* Glassmorphic Sign In Card */}
          <GlassCard style={styles.formCard}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {infoMessage ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>✓ {infoMessage}</Text>
              </View>
            ) : null}

            <GlassInput
              label={t('auth_email_label')}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
                if (infoMessage) setInfoMessage('');
                setIsEmailNotConfirmed(false);
              }}
              placeholder={t('auth_email_placeholder')}
              keyboardType="email-address"
              autoCapitalize="none"
            />
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

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7} onPress={handleForgot}>
              <Text style={styles.forgotText}>{t('auth_forgot_password')}</Text>
            </TouchableOpacity>

            <GlassButton
              title={loading ? t('auth_signing_in') : t('auth_signin_btn')}
              variant="primary"
              disabled={!isFormValid || loading}
              loading={loading}
              onPress={handleSignIn}
              style={styles.submitBtn}
            />

            {isEmailNotConfirmed && (
              <GlassButton
                title={resending ? t('auth_resending_confirm') : t('auth_resend_confirm')}
                variant="secondary"
                loading={resending}
                disabled={resending}
                onPress={handleResendConfirmation}
                style={styles.resendBtn}
              />
            )}
          </GlassCard>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth_no_account')}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={styles.footerLink}>{t('auth_create_account_link')}</Text>
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
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xxs,
  },
  formCard: {
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderWidth: 1,
    borderColor: '#FF5252',
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: '#FF5252',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#00E676',
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoText: {
    color: '#00E676',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitBtn: {
    width: '100%',
  },
  resendBtn: {
    width: '100%',
    marginTop: theme.spacing.sm,
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
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

// src/screens/ForgotPasswordScreen.tsx
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
import type { ScreenNavProp } from '../types/navigation';

interface ForgotPasswordScreenProps {
  navigation: ScreenNavProp<'ForgotPassword'>;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { resetPassword } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (loading) return; // Prevent duplicate in-flight requests

    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
      Alert.alert(
        'Reset Link Sent',
        'Instructions have been sent to your email address if an account exists.',
        [{ text: 'Return to Sign In', onPress: () => navigation.navigate('SignIn') }]
      );
    } catch (e: any) {
      Alert.alert('Reset Failed', e.message || 'Could not send reset email. Please try again.');
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
          <View style={styles.header}>
            <NexAvatar variant="idle" size="sm" />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your registered email address to receive recovery instructions.
            </Text>
          </View>

          <GlassCard style={styles.formCard}>
            <GlassInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="name@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <GlassButton
              title={sent ? 'Resend Reset Email' : 'Send Reset Link'}
              variant="primary"
              disabled={loading || !email.includes('@')}
              loading={loading}
              onPress={handleReset}
              style={styles.submitBtn}
            />
          </GlassCard>

          <View style={styles.footer}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.footerLink}>← Back to Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ResetPassword')}
              style={styles.directResetBtn}
            >
              <Text style={styles.directResetLink}>Received reset link? Reset password here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: theme.spacing.lg },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xxs,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  formCard: { gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  submitBtn: { marginTop: theme.spacing.sm },
  footer: { alignItems: 'center', gap: theme.spacing.sm },
  footerLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  directResetBtn: {
    paddingVertical: 6,
  },
  directResetLink: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textDecorationLine: 'underline',
  },
});

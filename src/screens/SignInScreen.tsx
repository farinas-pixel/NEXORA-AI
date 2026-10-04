import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

interface SignInScreenProps {
  navigation: ScreenNavProp<'SignIn'>;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { signIn } = useApp();
  const [email, setEmail] = useState('sha@nexora.ai');
  const [password, setPassword] = useState('••••••••');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    await signIn(email);
    setLoading(false);
    navigation.replace('SetupComplete');
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
          {/* Top Robot Badge & Heading */}
          <View style={styles.header}>
            <NexAvatar variant="idle" size="sm" />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to sync your memory vault</Text>
          </View>

          {/* Glassmorphic Sign In Card */}
          <GlassCard style={styles.formCard}>
            <GlassInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <GlassInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <GlassButton
              title="Sign In"
              variant="primary"
              loading={loading}
              onPress={handleSignIn}
              style={styles.submitBtn}
            />
          </GlassCard>

          {/* Footer Action */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.replace('SetupComplete')}
            >
              <Text style={styles.footerLink}>Create Account</Text>
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

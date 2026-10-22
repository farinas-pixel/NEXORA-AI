import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { GlassButton } from '../components/common/GlassButton';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface WelcomeScreenProps {
  navigation: ScreenNavProp<'Welcome'>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t, completeOnboarding } = useApp();

  const handleSkipToHome = async () => {
    await completeOnboarding();
    navigation.replace('Home');
  };

  return (
    <AppBackground style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl,
          },
        ]}
      >
        <View style={styles.avatarSection}>
          <NexAvatar variant="hero" size="hero" hideHalo />
        </View>

        <View style={styles.textSection}>
          <Text style={styles.title}>{t('welcome_title')}</Text>
          <Text style={styles.subtitle}>{t('welcome_subtitle')}</Text>
        </View>

        <View style={styles.actionSection}>
          <GlassButton
            title={t('action_get_started')}
            variant="primary"
            onPress={() => navigation.navigate('Language')}
            style={styles.mainButton}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSkipToHome}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>{t('action_skip_to_home')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xxl * 1.25,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  actionSection: {
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  mainButton: {
    width: '100%',
  },
  skipButton: {
    paddingVertical: theme.spacing.xs,
  },
  skipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

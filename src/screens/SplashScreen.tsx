import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface SplashScreenProps {
  navigation: ScreenNavProp<'Splash'>;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { isAuthenticated, hasCompletedOnboarding, t } = useApp();
  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;
  const onboardedRef = useRef(hasCompletedOnboarding);
  onboardedRef.current = hasCompletedOnboarding;

  useEffect(() => {
    // Smooth progress bar loading sequence matching Screen 01 reference
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2400,
      useNativeDriver: false,
    }).start(() => {
      // Direct navigation to Home if authenticated or already completed onboarding
      if (authRef.current || onboardedRef.current) {
        navigation.replace('Home');
      } else {
        navigation.replace('Welcome');
      }
    });
  }, [navigation, progressAnim]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        {/* Authoritative Hero Robot Avatar */}
        <View style={styles.avatarContainer}>
          <NexAvatar variant="hero" size="hero" />
        </View>

        {/* Identity & Subtitle from Reference Screen 01 */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('splash_title')}</Text>
          <Text style={styles.subtitle}>{t('splash_subtitle')}</Text>
          <Text style={styles.caption}>{t('splash_caption')}</Text>
        </View>

        {/* Glowing Cyan Loading Bar from Reference Screen 01 */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { width: progressBarWidth },
              ]}
            />
          </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 4,
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 8,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    letterSpacing: 0.5,
  },
  caption: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: theme.spacing.xxs,
    letterSpacing: 0.8,
  },
  progressWrapper: {
    width: '60%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 2,
    shadowColor: theme.colors.accent.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
});

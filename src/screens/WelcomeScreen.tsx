import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
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
  const { width, height } = useWindowDimensions();
  const { t, completeOnboarding } = useApp();

  const handleSkipToHome = async () => {
    await completeOnboarding();
    navigation.replace('Home');
  };

  // Viewport-aware responsive layout calculations
  const isCompactHeight = height < 740;
  const isTallViewport = height > 900;

  // Responsive avatar scaling: on compact laptop viewports (<740px height),
  // scale gracefully to prevent clipping and eliminate unnecessary vertical scrolling
  const avatarScale = isCompactHeight
    ? Math.max(0.72, Math.min(0.85, (height - 350) / 420))
    : 1.0;
  const avatarWrapperHeight = Math.round(260 * avatarScale);

  return (
    <AppBackground style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + (isCompactHeight ? theme.spacing.sm : theme.spacing.xl), 20),
            paddingBottom: Math.max(insets.bottom + (isCompactHeight ? theme.spacing.sm : theme.spacing.xl), 20),
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.cardContainer,
            isTallViewport && styles.cardContainerTall,
          ]}
        >
          {/* Hero Avatar Section */}
          <View
            style={[
              styles.avatarSection,
              {
                height: avatarWrapperHeight,
                marginBottom: isCompactHeight ? theme.spacing.xs : theme.spacing.sm,
              },
            ]}
          >
            <View style={{ transform: [{ scale: avatarScale }] }}>
              <NexAvatar variant="hero" size="hero" hideHalo />
            </View>
          </View>

          {/* Heading & Subtitle Section */}
          <View
            style={[
              styles.textSection,
              {
                marginBottom: isCompactHeight ? theme.spacing.md : theme.spacing.xl,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                isCompactHeight && styles.titleCompact,
              ]}
            >
              {t('welcome_title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                isCompactHeight && styles.subtitleCompact,
              ]}
            >
              {t('welcome_subtitle')}
            </Text>
          </View>

          {/* Call to Action Section */}
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
              accessibilityRole="button"
              accessibilityLabel={t('action_skip_to_home')}
            >
              <Text style={styles.skipText}>{t('action_skip_to_home')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardContainerTall: {
    maxHeight: 680,
  },
  avatarSection: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  textSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xxl * 1.25,
    letterSpacing: 0.5,
  },
  titleCompact: {
    fontSize: 25,
    lineHeight: 31,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
    maxWidth: 380,
  },
  subtitleCompact: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 6,
  },
  actionSection: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  mainButton: {
    width: '100%',
  },
  skipButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  skipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});

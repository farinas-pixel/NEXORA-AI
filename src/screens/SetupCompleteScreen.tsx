import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import type { ScreenNavProp } from '../types/navigation';

interface SetupCompleteScreenProps {
  navigation: ScreenNavProp<'SetupComplete'>;
}

export const SetupCompleteScreen: React.FC<SetupCompleteScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

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
        {/* Celebrating Avatar Section */}
        <View style={styles.avatarSection}>
          <NexAvatar variant="responding" size="lg" />
        </View>

        {/* Text Heading */}
        <View style={styles.textSection}>
          <Text style={styles.title}>You're All Set!</Text>
          <Text style={styles.subtitle}>
            Your intelligent companion is configured, calibrated, and ready.
          </Text>
        </View>

        {/* Feature Readiness Card */}
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.cardHeader}>System Readiness</Text>
          <View style={styles.badgeList}>
            <StatusBadge label="Dual Voice Loop: Ready" status="success" />
            <StatusBadge label="Sovereign Memory: Active" status="info" />
            <StatusBadge label="Robot State Sync: 100%" status="responding" />
          </View>
        </GlassCard>

        {/* Continue Action */}
        <View style={styles.actionSection}>
          <GlassButton
            title="Continue to Home"
            variant="primary"
            onPress={() => navigation.replace('Home')}
            style={styles.mainButton}
          />
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  summaryCard: {
    width: '100%',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  cardHeader: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeList: {
    gap: theme.spacing.xs,
  },
  actionSection: {
    width: '100%',
  },
  mainButton: {
    width: '100%',
  },
});

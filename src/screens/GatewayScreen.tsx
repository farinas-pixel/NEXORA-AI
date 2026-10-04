import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard, StatusBadge, AppButton } from '../components';
import { APP_CONFIG } from '../config/constants';
import { validateEnvironment } from '../config/env';
import type { AppNavigationProp } from '../types/navigation';

interface GatewayScreenProps {
  navigation?: AppNavigationProp;
}

export const GatewayScreen: React.FC<GatewayScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const envStatus = validateEnvironment();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + theme.spacing.md,
          paddingBottom: insets.bottom + theme.spacing.md,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Telemetry Header */}
        <View style={styles.header}>
          <StatusBadge label="Phase 0: Foundation" status="info" />
          <StatusBadge label="₹0 Active" status="success" />
        </View>

        {/* Project Title & Identity */}
        <View style={styles.titleSection}>
          <Text style={styles.appTitle}>{APP_CONFIG.name}</Text>
          <Text style={styles.appSubtitle}>{APP_CONFIG.codename}</Text>
        </View>

        {/* Visual Identity Status Banner */}
        <GlassCard variant="highlight" style={styles.card}>
          <Text style={styles.cardHeading}>Robot & UI Specification</Text>
          <Text style={styles.cardBody}>
            Visual Avatar rendering and interactive screen layouts are strictly
            blocked pending receipt of user-approved reference images.
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge label="Visuals: Awaiting User References" status="processing" />
          </View>
        </GlassCard>

        {/* Architectural Verification Card */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardHeading}>Architecture Verification</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Platform:</Text>
            <Text style={styles.specValue}>Mobile-First (React Native / Expo)</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Navigation:</Text>
            <Text style={styles.specValue}>React Navigation Native Stack</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Type Safety:</Text>
            <Text style={styles.specValue}>TypeScript Strict Mode Enabled</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Budget Constraint:</Text>
            <Text style={styles.specValue}>{APP_CONFIG.budgetConstraint}</Text>
          </View>
        </GlassCard>

        {/* Environment Diagnostics */}
        <GlassCard variant="subtle" style={styles.card}>
          <Text style={styles.cardHeading}>Environment Diagnostics</Text>
          <Text style={styles.cardBody}>
            {envStatus.valid
              ? 'All configured public variables are detected.'
              : `Awaiting optional config: ${envStatus.missing.join(', ')}`}
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge
              label={envStatus.valid ? 'Config Detected' : 'Template Ready (.env.example)'}
              status={envStatus.valid ? 'success' : 'idle'}
            />
          </View>
        </GlassCard>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <AppButton
            title="Foundation Initialized"
            variant="secondary"
            onPress={() => {}}
            disabled
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  titleSection: {
    marginBottom: theme.spacing.lg,
  },
  appTitle: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.accent.primary,
    marginTop: theme.spacing.xxs,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  cardHeading: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  cardBody: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.normal,
    marginBottom: theme.spacing.sm,
  },
  badgeRow: {
    marginTop: theme.spacing.xs,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xxs,
  },
  specLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  specValue: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  actionContainer: {
    marginTop: theme.spacing.md,
  },
});

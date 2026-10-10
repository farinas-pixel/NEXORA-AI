import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import type { ScreenNavProp } from '../types/navigation';

interface AboutLegalScreenProps {
  navigation: ScreenNavProp<'AboutLegal'>;
}

export const AboutLegalScreen: React.FC<AboutLegalScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>System & Architecture</Text>
            <Text style={styles.headerSub}>NEXORA AI v1.0.0</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Identity & Build Badge */}
          <View style={styles.identitySection}>
            <NexAvatar variant="idle" size="md" />
            <Text style={styles.appName}>NEXORA AI</Text>
            <Text style={styles.appTagline}>Autonomous Alexa+ Inspired Personal AI Companion</Text>
            <View style={styles.badgeRow}>
              <StatusBadge label="Production Build" status="success" />
              <StatusBadge label="Zero Cost ₹0" status="listening" />
            </View>
          </View>

          {/* Strict Zero Investment Guarantee Card */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial & Cloud Independence</Text>
          </View>

          <GlassCard variant="highlight" style={styles.card}>
            <Text style={styles.cardHeading}>Strict ₹0 Personal Investment Guarantee</Text>
            <Text style={styles.cardBody}>
              NEXORA AI is engineered from the ground up to operate with zero required
              personal financial outlay. All reasoning, voice synthesis, smart tool
              execution, and persistence utilize open-source frameworks and verified
              free-tier AI endpoints with sovereign offline fallback.
            </Text>

            <View style={styles.stackGrid}>
              <View style={styles.stackItem}>
                <Text style={styles.stackLabel}>Cloud Provider A</Text>
                <Text style={styles.stackVal}>Google Gemini 2.0 Flash (Free Tier)</Text>
              </View>
              <View style={styles.stackItem}>
                <Text style={styles.stackLabel}>Cloud Provider B</Text>
                <Text style={styles.stackVal}>Groq Llama 3.3 70B (Ultra Low Latency)</Text>
              </View>
              <View style={styles.stackItem}>
                <Text style={styles.stackLabel}>Sovereign Engine</Text>
                <Text style={styles.stackVal}>On-Device Deterministic Logic (Offline)</Text>
              </View>
              <View style={styles.stackItem}>
                <Text style={styles.stackLabel}>Protocol Support</Text>
                <Text style={styles.stackVal}>Model Context Protocol (MCP v1.0)</Text>
              </View>
            </View>
          </GlassCard>

          {/* Core Technical Specifications */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Runtime Specifications</Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Framework</Text>
              <Text style={styles.specVal}>Expo SDK 57 (React Native 0.81)</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Language</Text>
              <Text style={styles.specVal}>TypeScript 5.x Strict Mode</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Local Storage</Text>
              <Text style={styles.specVal}>AsyncStorage Key-Value Keystore</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Acoustics</Text>
              <Text style={styles.specVal}>Expo-Speech Native TTS Engine</Text>
            </View>
            <View style={styles.specDivider} />
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Platform</Text>
              <Text style={styles.specVal}>{Platform.OS.toUpperCase()} Native Layer</Text>
            </View>
          </GlassCard>

          {/* Privacy & Sovereignty Commitment */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sovereignty & Privacy</Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.privacyHeading}>Local-First Data Ownership</Text>
            <Text style={styles.privacyBody}>
              • 100% of memories, chat histories, and tasks remain strictly on this device.{'\n'}
              • No user telemetry, audio recordings, or behavioral analytics are transmitted to data brokers.{'\n'}
              • Solo Mode provides an immediate, hardware-level airgap for total privacy.
            </Text>
          </GlassCard>

          {/* Copyright & License */}
          <View style={styles.footer}>
            <Text style={styles.footerCopyright}>
              NEXORA AI © 2026. Built with Reference-Lock Fidelity.
            </Text>
            <Text style={styles.footerLicense}>
              Open-Source MIT Architecture · Personal Companion Edition
            </Text>
          </View>
        </ScrollView>
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  identitySection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cardHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  stackGrid: {
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  stackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stackLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
  },
  stackVal: {
    fontSize: 11,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  specLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  specVal: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  specDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  privacyHeading: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  privacyBody: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  footerCopyright: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  footerLicense: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
});

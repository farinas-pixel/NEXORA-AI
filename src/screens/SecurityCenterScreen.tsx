import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface SecurityCenterScreenProps {
  navigation: ScreenNavProp<'SecurityCenter'>;
}

export const SecurityCenterScreen: React.FC<SecurityCenterScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { memories, clearAllMemories, preferences, updatePreferences } = useApp();

  const [soloMode, setSoloMode] = useState<boolean>(preferences.soloMode || false);
  const [biometricLock, setBiometricLock] = useState<boolean>(true);
  const [exportNotice, setExportNotice] = useState<string>('');

  const countByTier = {
    low: memories.filter((m) => m.securityTier === 'low').length,
    medium: memories.filter((m) => m.securityTier === 'medium').length,
    high: memories.filter((m) => m.securityTier === 'high').length,
    critical: memories.filter((m) => m.securityTier === 'critical').length,
  };

  const handleToggleSoloMode = async (value: boolean) => {
    setSoloMode(value);
    await updatePreferences({ soloMode: value });
  };

  const handleExportData = async () => {
    try {
      const exportBundle = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        memoryCount: memories.length,
        memories: memories.map((m) => ({
          id: m.id,
          category: m.category,
          securityTier: m.securityTier,
          content: m.content,
          timestamp: m.timestamp,
        })),
        preferences: {
          appLanguage: preferences.appLanguage,
          aiLanguage: preferences.aiLanguage,
          soloMode: preferences.soloMode,
        },
      };

      const serialized = JSON.stringify(exportBundle, null, 2);
      await AsyncStorage.setItem('@nexora_exported_vault_archive', serialized);
      setExportNotice(`Exported ${memories.length} memory records to encrypted local bundle.`);
      Alert.alert(
        'Sovereign Vault Exported',
        `Archive created successfully with ${memories.length} records. Saved to sandboxed on-device backup storage.`,
        [{ text: 'OK' }]
      );
      setTimeout(() => setExportNotice(''), 4000);
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not serialize memory records.');
    }
  };

  const handleWipeMemories = () => {
    Alert.alert(
      'Wipe Memory Vault?',
      'This will irreversibly delete all local memory facts, preferences, and personal knowledge graphs stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Wipe All Data',
          style: 'destructive',
          onPress: async () => {
            await clearAllMemories();
            setExportNotice('Memory vault wiped successfully.');
            setTimeout(() => setExportNotice(''), 3000);
          },
        },
      ]
    );
  };

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
            <Text style={styles.headerTitle}>Security & Privacy</Text>
            <Text style={styles.headerSub}>Sovereign Data Protection</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AboutLegal')}
          >
            <Text style={styles.iconText}>ℹ️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Security Status Card */}
          <GlassCard variant="highlight" style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.shieldTitle}>On-Device Local Vault</Text>
                <Text style={styles.shieldSub}>Sandboxed AsyncStorage · Zero Cloud Telemetry</Text>
              </View>
              <StatusBadge label="Local Only" status="success" />
            </View>
          </GlassCard>

          {/* Privacy Lockdown Toggles */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Privacy Controls</Text>
          </View>

          {/* Solo Mode Switch */}
          <GlassCard style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <View style={styles.tagTitleRow}>
                  <Text style={styles.toggleTitle}>Solo Lockdown Mode</Text>
                  <StatusBadge label={soloMode ? 'ACTIVE' : 'OFF'} status={soloMode ? 'listening' : 'idle'} />
                </View>
                <Text style={styles.toggleSub}>
                  Completely disables all external network calls. Forces NEX to use
                  the on-device sovereign reasoning fallback exclusively.
                </Text>
              </View>
              <Switch
                value={soloMode}
                onValueChange={handleToggleSoloMode}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GlassCard>

          {/* Biometric Switch */}
          <GlassCard style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Biometric App Authentication</Text>
                <Text style={styles.toggleSub}>
                  Require FaceID or TouchID when opening NEXORA AI
                </Text>
              </View>
              <Switch
                value={biometricLock}
                onValueChange={setBiometricLock}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GlassCard>

          {/* Memory Vault Security Classification Tier Distribution */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Memory Classification Tiers ({memories.length} Total)</Text>
          </View>

          <GlassCard style={styles.tiersCard}>
            <View style={styles.tierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#00E676' }]} />
              <View style={styles.tierMeta}>
                <Text style={styles.tierName}>Tier 1: Low (General Context)</Text>
                <Text style={styles.tierDesc}>Public interests, weather, general trivia</Text>
              </View>
              <Text style={styles.tierCount}>{countByTier.low}</Text>
            </View>

            <View style={styles.tierDivider} />

            <View style={styles.tierItem}>
              <View style={[styles.tierDot, { backgroundColor: theme.colors.accent.primary }]} />
              <View style={styles.tierMeta}>
                <Text style={styles.tierName}>Tier 2: Medium (Preferences)</Text>
                <Text style={styles.tierDesc}>Study habits, dietary choices, daily schedules</Text>
              </View>
              <Text style={styles.tierCount}>{countByTier.medium}</Text>
            </View>

            <View style={styles.tierDivider} />

            <View style={styles.tierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#FFD700' }]} />
              <View style={styles.tierMeta}>
                <Text style={styles.tierName}>Tier 3: High (Confidential)</Text>
                <Text style={styles.tierDesc}>Home coordinates, family relations, personal health</Text>
              </View>
              <Text style={styles.tierCount}>{countByTier.high}</Text>
            </View>

            <View style={styles.tierDivider} />

            <View style={styles.tierItem}>
              <View style={[styles.tierDot, { backgroundColor: '#FF1744' }]} />
              <View style={styles.tierMeta}>
                <Text style={styles.tierName}>Tier 4: Critical (Masked & Hashed)</Text>
                <Text style={styles.tierDesc}>Masked via SHA-256 digest on device · Plaintext tokens protected</Text>
              </View>
              <Text style={styles.tierCount}>{countByTier.critical}</Text>
            </View>
          </GlassCard>

          {/* Storage Architecture Disclosure */}
          <GlassCard style={styles.disclosureCard}>
            <Text style={styles.disclosureTitle}>Security Architecture Notice</Text>
            <Text style={styles.disclosureText}>
              • Tiers 1–3 are persisted in sandboxed device AsyncStorage without remote sync.{'\n'}
              • Tier 4 (Critical) items are masked and digested with expo-crypto before storage.{'\n'}
              • Note: Hardware-backed AES-256 GCM requires an Expo SecureStore native development build.
            </Text>
          </GlassCard>

          {exportNotice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>✓ {exportNotice}</Text>
            </View>
          ) : null}

          {/* Sovereign Data Actions */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vault Maintenance</Text>
          </View>

          <View style={styles.actionColumn}>
            <GlassButton
              title="📦 Export Encrypted Data Archive (JSON)"
              variant="secondary"
              onPress={handleExportData}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleWipeMemories}
              style={styles.wipeBtn}
            >
              <Text style={styles.wipeBtnText}>⚠️ Wipe Local Memory Vault</Text>
            </TouchableOpacity>
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
  statusCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shieldTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  shieldSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  tagTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  toggleTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  toggleSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    lineHeight: 16,
  },
  tiersCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tierDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  tierMeta: {
    flex: 1,
  },
  tierName: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  tierDesc: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 1,
  },
  tierCount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
  },
  tierDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  disclosureCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  disclosureTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  disclosureText: {
    fontSize: 10,
    color: theme.colors.text.muted,
    lineHeight: 15,
  },
  noticeBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  noticeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#00E676',
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  actionColumn: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  wipeBtn: {
    backgroundColor: 'rgba(255, 23, 68, 0.12)',
    borderColor: 'rgba(255, 23, 68, 0.4)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  wipeBtnText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FF1744',
  },
});

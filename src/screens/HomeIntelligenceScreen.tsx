import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { StorageService, AutomationRule } from '../services/storage';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface HomeIntelligenceScreenProps {
  navigation: ScreenNavProp<'HomeIntelligence'>;
}

type HomeTab = 'devices' | 'automation' | 'prediction' | 'safety';

export const HomeIntelligenceScreen: React.FC<HomeIntelligenceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { devices, toggleDevice } = useApp();
  const [activeTab, setActiveTab] = useState<HomeTab>('devices');
  const [rules, setRules] = useState<AutomationRule[]>([]);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    const list = await StorageService.getAutomationRules();
    setRules(list);
  };

  const handleToggleDevice = async (id: string) => {
    await toggleDevice(id);
  };

  const handleToggleRule = async (id: string) => {
    const updated = await StorageService.toggleAutomationRule(id);
    setRules(updated);
  };

  const getDeviceIcon = (type: string, id: string) => {
    if (type === 'light' || id === 'dev_light') return '💡';
    if (type === 'thermostat' || id === 'dev_ac') return '❄️';
    if (type === 'speaker' || id === 'dev_audio') return '🔊';
    return '🍃';
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.eyebrow}>IoT & Ecosystem Control</Text>
            <Text style={styles.title}>Home Intelligence</Text>
          </View>
          <NexAvatar variant="idle" size="sm" />
        </View>

        {/* Honest Simulation Notice */}
        <View style={styles.honestNotice}>
          <Text style={styles.honestText}>
            ℹ️ Transparent Disclosure: Local Software State Emulation · Zero Physical Hardware Required
          </Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          {(['devices', 'automation', 'prediction', 'safety'] as HomeTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- TAB 1: DEVICES --- */}
        {activeTab === 'devices' && (
          <View>
            <Text style={styles.sectionTitle}>Simulated Appliances</Text>
            <View style={styles.deviceGrid}>
              {devices.map((device) => (
                <GlassCard key={device.id} style={styles.deviceCard}>
                  <View style={styles.deviceHeader}>
                    <Text style={styles.deviceIcon}>{getDeviceIcon(device.type, device.id)}</Text>
                    <Switch
                      value={device.status}
                      onValueChange={() => handleToggleDevice(device.id)}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
                    />
                  </View>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceRoom}>{device.room}</Text>
                  <View style={styles.statusPill}>
                    <Text style={[styles.statusPillText, device.status && styles.statusPillOn]}>
                      {device.status ? 'ACTIVE (SIM)' : 'STANDBY'}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </View>
        )}

        {/* --- TAB 2: AUTOMATION (IF-THEN) --- */}
        {activeTab === 'automation' && (
          <View>
            <Text style={styles.sectionTitle}>Autonomous IF-THEN Rules</Text>
            {rules.map((rule) => (
              <GlassCard key={rule.id} style={styles.ruleCard}>
                <View style={styles.ruleHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleTitle}>{rule.name}</Text>
                    <Text style={styles.ruleTrigger}>⚡ IF: {rule.conditionDescription}</Text>
                    <Text style={styles.ruleAction}>🎯 THEN: {rule.actionDescription}</Text>
                  </View>
                  <Switch
                    value={rule.enabled}
                    onValueChange={() => handleToggleRule(rule.id)}
                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* --- TAB 3: PREDICTION --- */}
        {activeTab === 'prediction' && (
          <View>
            <Text style={styles.sectionTitle}>Predictive Living Recommendations</Text>
            <GlassCard style={styles.predictionCard}>
              <Text style={styles.predIcon}>🌅 Morning Light Synchronization</Text>
              <Text style={styles.predDesc}>
                Predicted wake-up at 06:30 AM based on your Calculus exam schedule. Bedroom halo light will softly ramp up at 06:15 AM.
              </Text>
            </GlassCard>

            <GlassCard style={[styles.predictionCard, { marginTop: 10 }]}>
              <Text style={styles.predIcon}>⚡ Deep Focus Automation</Text>
              <Text style={styles.predDesc}>
                When starting a Pomodoro block, NEXORA will set desk lights to cool azure, silence non-critical notifications, and turn on the air purifier.
              </Text>
            </GlassCard>
          </View>
        )}

        {/* --- TAB 4: SAFETY & HEALTH --- */}
        {activeTab === 'safety' && (
          <View>
            <Text style={styles.sectionTitle}>Environment & Safety Telemetry</Text>
            <GlassCard style={styles.safetyCard}>
              <View style={styles.safetyMetricRow}>
                <Text style={styles.safetyMetricLabel}>Air Quality Index (AQI)</Text>
                <Text style={styles.safetyMetricValueGood}>28 · Optimal</Text>
              </View>
              <View style={styles.safetyMetricRow}>
                <Text style={styles.safetyMetricLabel}>Appliance Power Draw</Text>
                <Text style={styles.safetyMetricValue}>Nominal · 140 W</Text>
              </View>
              <View style={styles.safetyMetricRow}>
                <Text style={styles.safetyMetricLabel}>Local Network Security</Text>
                <Text style={styles.safetyMetricValueGood}>Airgap Guard Active</Text>
              </View>
              <View style={styles.safetyMetricRow}>
                <Text style={styles.safetyMetricLabel}>Thermal Safety Protocol</Text>
                <Text style={styles.safetyMetricValue}>All Relays Normal</Text>
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  honestNotice: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  honestText: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  tabText: {
    color: theme.colors.text.muted,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
  },
  tabTextActive: {
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  deviceCard: {
    flexBasis: '48%',
    padding: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 8,
  },
  deviceRoom: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 2,
  },
  deviceMetric: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    marginTop: 4,
  },
  statusPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  statusPillText: {
    fontSize: 8,
    color: theme.colors.text.muted,
    fontFamily: theme.typography.fontFamily.bold,
  },
  statusPillOn: {
    color: '#10B981',
  },
  ruleCard: {
    marginTop: 8,
    padding: 12,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ruleTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  ruleTrigger: {
    color: theme.colors.accent.primary,
    fontSize: 11,
    marginTop: 3,
  },
  ruleAction: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    marginTop: 2,
  },
  predictionCard: {
    marginTop: 8,
    padding: theme.spacing.md,
  },
  predIcon: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  predDesc: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
    marginTop: 4,
  },
  safetyCard: {
    marginTop: 8,
    padding: theme.spacing.md,
  },
  safetyMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  safetyMetricLabel: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
  safetyMetricValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  safetyMetricValueGood: {
    color: '#10B981',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
});

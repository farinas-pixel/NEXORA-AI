import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { NexAvatar } from '../components/avatar/NexAvatar';
import type { AgentRole } from '../services/ai/aiBrain';
import type { ScreenNavProp } from '../types/navigation';

interface AgentsHubScreenProps {
  navigation: ScreenNavProp<'AgentsHub'>;
}

interface AgentProfile {
  id: AgentRole;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  description: string;
  capabilities: string[];
}

const AGENTS: AgentProfile[] = [
  {
    id: 'personal',
    title: 'Personal Companion',
    subtitle: 'Daily Habits & Reflection',
    icon: '👤',
    badge: 'Core Empathy',
    description: 'Understands daily rhythms, maintains sovereign memory, and guides mindful reflection without judgment.',
    capabilities: ['Sovereign Memory Query', '5-Phase Day Rhythm', 'Mindset Guidance', 'Conversational Empathy'],
  },
  {
    id: 'skills',
    title: 'Skills & Academic Tutor',
    subtitle: 'Concept Mastery & Exams',
    icon: '🎓',
    badge: 'Mastery Engine',
    description: 'Calculates dynamic revision timetables, detects weak topics, and teaches through failure-recovery interactive quizzes.',
    capabilities: ['Predictive Countdown', 'Tiny Hint & Simple Explanation Loop', 'Topic Prioritization', 'Formula Synthesis'],
  },
  {
    id: 'developer',
    title: 'Developer & Systems Agent',
    subtitle: 'Code, Tools & MCP',
    icon: '💻',
    badge: 'Protocol 2024-11-05',
    description: 'Executes Model Context Protocol (MCP) tools, verifies JSON-RPC 2.0 requests, and performs system diagnostics.',
    capabilities: ['MCP JSON-RPC Execution', 'Zero-Cost Tool Calling', 'Code Debugging', 'Diagnostic Telemetry'],
  },
  {
    id: 'safety',
    title: 'Safety & Airgap Agent',
    subtitle: 'Security & Integrity',
    icon: '🛡️',
    badge: 'Sovereign Guard',
    description: 'Enforces Solo Mode airgapping, applies SHA-256 masking to critical secrets, and requires Review-Confirm-Execute approval.',
    capabilities: ['Solo Network Airgap', 'SHA-256 Cryptographic Masking', 'Review-Confirm-Execute Protocol', 'Hardware Simulation Isolation'],
  },
];

export const AgentsHubScreen: React.FC<AgentsHubScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>('personal');
  const [pendingSafetyAction, setPendingSafetyAction] = useState<{
    title: string;
    details: string;
    tier: string;
  } | null>(null);

  const handleTestSafetyProtocol = () => {
    setPendingSafetyAction({
      title: 'Authorize High-Tier Memory Sync',
      details: 'Sync verified calendar events to local sovereign vault with SHA-256 integrity check.',
      tier: 'Tier 3 (High)',
    });
  };

  const handleConfirmSafetyAction = () => {
    setPendingSafetyAction(null);
    Alert.alert('Protocol Confirmed', 'Action executed cleanly through Review-Confirm-Execute verification pipeline.');
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
            <Text style={styles.eyebrow}>Autonomous Intelligence</Text>
            <Text style={styles.title}>Agents Hub</Text>
          </View>
          <NexAvatar variant={selectedAgent === 'developer' ? 'thinking' : 'idle'} size="sm" />
        </View>

        <Text style={styles.sectionSubtitle}>
          NEXORA dynamically switches between 4 sovereign agents based on your conversation context. You can also inspect or lock an active agent role below.
        </Text>

        {/* 4 Agent Cards */}
        {AGENTS.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          return (
            <GlassCard
              key={agent.id}
              style={[styles.agentCard, isSelected && styles.agentCardActive]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedAgent(agent.id)}
              >
                <View style={styles.agentHeader}>
                  <Text style={styles.agentIcon}>{agent.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.agentTitle}>{agent.title}</Text>
                    <Text style={styles.agentSubtitle}>{agent.subtitle}</Text>
                  </View>
                  <View style={[styles.agentBadge, isSelected && styles.agentBadgeActive]}>
                    <Text style={[styles.agentBadgeText, isSelected && styles.agentBadgeTextActive]}>
                      {agent.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.agentDesc}>{agent.description}</Text>

                <View style={styles.capList}>
                  {agent.capabilities.map((cap, i) => (
                    <View key={i} style={styles.capChip}>
                      <Text style={styles.capText}>✓ {cap}</Text>
                    </View>
                  ))}
                </View>

                {isSelected && (
                  <View style={styles.activeFooter}>
                    <Text style={styles.activeText}>● Currently Active Sovereign Agent</Text>
                  </View>
                )}
              </TouchableOpacity>
            </GlassCard>
          );
        })}

        {/* Review-Confirm-Execute Protocol Demo */}
        <Text style={styles.sectionTitle}>Review-Confirm-Execute Protocol</Text>
        <GlassCard style={styles.protocolCard}>
          <Text style={styles.protoHeader}>🛡️ Transparent Action Verification</Text>
          <Text style={styles.protoDesc}>
            High-tier operations (such as critical memory modifications, device states, or network broadcasts) can never execute in the background without explicit user confirmation.
          </Text>
          <GlassButton
            title="Test Safety Confirmation Protocol"
            variant="secondary"
            onPress={handleTestSafetyProtocol}
            style={{ marginTop: 10 }}
          />

          {pendingSafetyAction && (
            <View style={styles.confirmationModalBox}>
              <View style={styles.confirmHeaderRow}>
                <Text style={styles.confirmModalTitle}>{pendingSafetyAction.title}</Text>
                <Text style={styles.tierTag}>{pendingSafetyAction.tier}</Text>
              </View>
              <Text style={styles.confirmModalDesc}>{pendingSafetyAction.details}</Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity style={styles.btnApprove} onPress={handleConfirmSafetyAction}>
                  <Text style={styles.btnApproveText}>Confirm & Execute</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnReject} onPress={() => setPendingSafetyAction(null)}>
                  <Text style={styles.btnRejectText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </GlassCard>

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
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  agentCard: {
    marginTop: 10,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  agentCardActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentIcon: {
    fontSize: 26,
  },
  agentTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  agentSubtitle: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 1,
  },
  agentBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  agentBadgeActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  agentBadgeText: {
    color: theme.colors.text.muted,
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  agentBadgeTextActive: {
    color: theme.colors.accent.primary,
  },
  agentDesc: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
    marginTop: 10,
  },
  capList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  capChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  capText: {
    color: theme.colors.text.secondary,
    fontSize: 9,
  },
  activeFooter: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 229, 255, 0.2)',
    paddingTop: 8,
  },
  activeText: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
  },
  protocolCard: {
    marginTop: 8,
    padding: theme.spacing.md,
  },
  protoHeader: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  protoDesc: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  confirmationModalBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  confirmHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmModalTitle: {
    color: '#F59E0B',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  tierTag: {
    fontSize: 9,
    color: theme.colors.text.muted,
  },
  confirmModalDesc: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 4,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  btnApprove: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  btnApproveText: {
    color: '#000000',
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  btnReject: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  btnRejectText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
  },
});

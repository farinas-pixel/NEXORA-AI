import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface MemoryOverviewScreenProps {
  navigation: ScreenNavProp<'MemoryOverview'>;
}

export const MemoryOverviewScreen: React.FC<MemoryOverviewScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { memories, deleteMemory, activeTab, setActiveTab } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Plan') navigation.navigate('PlanDashboard');
    else if (tab === 'Profile') navigation.navigate('SecurityCenter');
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Header from Reference Screen 63 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Memory Vault</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('AddMemory')}
          >
            <Text style={styles.iconText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Security Tier Guidance Card */}
          <GlassCard variant="highlight" style={styles.infoCard}>
            <Text style={styles.infoTitle}>Sovereign Data Protection</Text>
            <Text style={styles.infoBody}>
              Memories are stored locally and encrypted. High and Critical data
              require biometric authentication and are never used in third-party model training.
            </Text>
          </GlassCard>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search remembered facts..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Memory Fact Cards */}
          <View style={styles.memoryList}>
            {filteredMemories.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>No matching memories found.</Text>
              </GlassCard>
            ) : (
              filteredMemories.map((mem) => (
                <GlassCard key={mem.id} style={styles.memCard}>
                  <View style={styles.cardHeaderRow}>
                    <StatusBadge
                      label={mem.category}
                      status="info"
                    />
                    <StatusBadge
                      label={`Tier: ${mem.securityTier.toUpperCase()}`}
                      status={
                        mem.securityTier === 'critical' || mem.securityTier === 'high'
                          ? 'processing'
                          : 'idle'
                      }
                    />
                  </View>

                  <Text style={styles.memContent}>{mem.content}</Text>

                  <View style={styles.cardFooterRow}>
                    <Text style={styles.timestamp}>{mem.timestamp}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => deleteMemory(mem.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteText}>Delete Fact</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))
            )}
          </View>

          {/* Add Memory Button */}
          <View style={styles.actionSection}>
            <GlassButton
              title="+ Add New Memory"
              variant="secondary"
              onPress={() => navigation.navigate('AddMemory')}
            />
          </View>
        </ScrollView>

        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
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
    paddingBottom: theme.spacing.md,
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
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 90,
  },
  infoCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: theme.colors.glass.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  memoryList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  memCard: {
    padding: theme.spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  memContent: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginVertical: theme.spacing.xs,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  deleteBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontSize: 11,
    color: theme.colors.status.error,
  },
  emptyCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.sm,
  },
  actionSection: {
    marginBottom: theme.spacing.lg,
  },
});

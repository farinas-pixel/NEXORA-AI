import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';

interface PrivacyMemorySettingsPageProps {
  onBack: () => void;
}

export const PrivacyMemorySettingsPage: React.FC<PrivacyMemorySettingsPageProps> = ({ onBack }) => {
  const { memories, deleteMemory, preferences, updatePreferences } = useApp();

  const [memoryConsent, setMemoryConsent] = useState<boolean>(preferences.memoryConsent ?? true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleToggleConsent = async (val: boolean) => {
    setMemoryConsent(val);
    try {
      await updatePreferences({ memoryConsent: val });
      setStatusMessage({ text: `Memory learning ${val ? 'enabled' : 'disabled'}.`, type: 'info' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Error updating memory consent', type: 'error' });
    }
  };

  const handleDeleteSingle = (id: string, excerpt: string) => {
    Alert.alert(
      'Delete Memory Entry',
      `Are you sure you want to delete this memory?\n\n"${excerpt.slice(0, 80)}..."`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              await deleteMemory(id);
              setStatusMessage({ text: 'Memory entry deleted successfully.', type: 'success' });
              setTimeout(() => setStatusMessage(null), 3000);
            } catch (err: any) {
              setStatusMessage({ text: err.message || 'Failed to delete memory.', type: 'error' });
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSafePurgeAll = () => {
    if (!memories || memories.length === 0) {
      Alert.alert('Memory Vault Empty', 'There are no stored memory entries to delete.');
      return;
    }

    Alert.alert(
      'Purge Stored Memories',
      `This will permanently delete ${memories.length} memory entries from your private vault. Your tasks, reminders, and profile data will remain untouched and safe.\n\nDo you wish to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Purge',
          style: 'destructive',
          onPress: async () => {
            setIsBulkDeleting(true);
            setStatusMessage(null);

            let successCount = 0;
            let failCount = 0;
            const targetIds = memories.map((m) => m.id);

            for (const mId of targetIds) {
              try {
                await deleteMemory(mId);
                successCount++;
              } catch {
                failCount++;
              }
            }

            setIsBulkDeleting(false);

            if (failCount === 0) {
              setStatusMessage({
                text: `Successfully purged all ${successCount} memory entries. Tasks and profile preserved.`,
                type: 'success',
              });
            } else {
              setStatusMessage({
                text: `Purged ${successCount} entries. ${failCount} entries could not be removed.`,
                type: 'error',
              });
            }
            setTimeout(() => setStatusMessage(null), 5000);
          },
        },
      ]
    );
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'critical':
        return styles.tierCritical;
      case 'sensitive':
        return styles.tierSensitive;
      case 'personal':
        return styles.tierPersonal;
      default:
        return styles.tierGeneral;
    }
  };

  return (
    <ScrollView
      testID="settings-page-privacymemory"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Banner */}
      {statusMessage && (
        <View
          style={[
            styles.banner,
            statusMessage.type === 'success'
              ? styles.bannerSuccess
              : statusMessage.type === 'error'
              ? styles.bannerError
              : styles.bannerInfo,
          ]}
        >
          <Ionicons
            name={
              statusMessage.type === 'success'
                ? 'checkmark-circle'
                : statusMessage.type === 'error'
                ? 'alert-circle'
                : 'information-circle'
            }
            size={18}
            color={
              statusMessage.type === 'success'
                ? '#10B981'
                : statusMessage.type === 'error'
                ? '#EF4444'
                : '#00E5FF'
            }
          />
          <Text style={styles.bannerText}>{statusMessage.text}</Text>
        </View>
      )}

      {/* Memory Learning Toggle */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="bulb-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Continuous Memory Learning</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Allow Adaptive Context Learning</Text>
            <Text style={styles.toggleSubtitle}>
              When enabled, NEXORA AI remembers relevant preferences, names, and projects across conversations
            </Text>
          </View>
          <Switch
            value={memoryConsent}
            onValueChange={handleToggleConsent}
            thumbColor={memoryConsent ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>
      </View>

      {/* Memory Vault Items Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRowSpace}>
          <View style={styles.titleWithCount}>
            <Text style={styles.cardTitle}>Stored Memory Vault</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{memories?.length || 0}</Text>
            </View>
          </View>

          {memories && memories.length > 0 ? (
            <TouchableOpacity
              style={styles.purgeAllBtn}
              onPress={handleSafePurgeAll}
              disabled={isBulkDeleting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Purge all memories"
            >
              {isBulkDeleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons name="trash-bin-outline" size={14} color="#EF4444" />
                  <Text style={styles.purgeAllBtnText}>Clear All</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.cardSubtitle}>
          Isolated to your account. Sensitive tiers are stored in encrypted SecureStore.
        </Text>

        {!memories || memories.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="file-tray-outline" size={32} color="#64748B" />
            <Text style={styles.emptyTitle}>No Memories Stored</Text>
            <Text style={styles.emptyDesc}>
              As you chat, key context and preferences will be securely saved here.
            </Text>
          </View>
        ) : (
          <View style={styles.memoriesList}>
            {memories.map((mem) => (
              <View key={mem.id} style={styles.memoryItem}>
                <View style={styles.memoryHeader}>
                  <View style={[styles.tierTag, getTierBadgeStyle(mem.securityTier)]}>
                    <Text style={styles.tierTagText}>{(mem.securityTier || 'general').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.categoryText}>{mem.category || 'Context'}</Text>

                  <TouchableOpacity
                    style={styles.deleteSingleBtn}
                    onPress={() => handleDeleteSingle(mem.id, mem.content)}
                    disabled={deletingId === mem.id || isBulkDeleting}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete memory ${mem.category}`}
                  >
                    {deletingId === mem.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.memoryContentText}>{mem.content}</Text>
                <Text style={styles.memoryDateText}>
                  {new Date(mem.timestamp || Date.now()).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Airgap & Data Safety Guarantee Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="lock-closed-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Airgap & Data Isolation</Text>
        </View>
        <Text style={styles.safetyBodyText}>
          • User Isolation: Memory keys are bound strictly to your authenticated UID.
        </Text>
        <Text style={styles.safetyBodyText}>
          • Zero Telemetry: Memory embeddings and conversational records are never sent to third-party ad networks.
        </Text>
        <Text style={styles.safetyBodyText}>
          • Non-Destructive Storage: Clearing memories operates exclusively on your memory vault and never deletes tasks or reminders.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  bannerInfo: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  glassCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  headerRowSpace: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  countBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  countText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  purgeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  purgeAllBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyTitle: {
    color: '#CBD5E1',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  emptyDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  memoriesList: {
    gap: 10,
  },
  memoryItem: {
    backgroundColor: 'rgba(5, 11, 25, 0.75)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tierTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
  },
  tierTagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tierGeneral: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderColor: '#94A3B8',
  },
  tierPersonal: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
  tierSensitive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  tierCritical: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  categoryText: {
    color: '#94A3B8',
    fontSize: 12,
    flex: 1,
    textTransform: 'capitalize',
  },
  deleteSingleBtn: {
    padding: 4,
  },
  memoryContentText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  memoryDateText: {
    color: '#64748B',
    fontSize: 11,
  },
  safetyBodyText: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
});

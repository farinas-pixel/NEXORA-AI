import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { memories, updateMemory, deleteMemory, activeTab, setActiveTab, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditText(content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editText.trim()) {
      Alert.alert('Validation', 'Memory content cannot be blank.');
      return;
    }
    setIsSaving(true);
    try {
      await updateMemory(id, editText.trim());
      setEditingId(null);
      setEditText('');
    } catch {
      Alert.alert('Error', 'Failed to update memory fact.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Memory Fact',
      'Are you sure you want to remove this fact from your sovereign memory vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMemory(id),
        },
      ]
    );
  };

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Plan' || tab === 'MyDay') navigation.navigate('MyDay');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Friends') navigation.navigate('FriendsChat');
    else if (tab === 'Profile' || tab === 'MyLife') navigation.navigate('MyLife');
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
              style={[
                styles.searchInput,
                Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : undefined,
              ]}
              selectionColor={theme.colors.accent.primary}
              cursorColor={theme.colors.accent.primary}
              placeholder={t('memory_search_placeholder')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Memory Fact Cards */}
          <View style={styles.memoryList}>
            {filteredMemories.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>{t('memory_empty')}</Text>
              </GlassCard>
            ) : (
              filteredMemories.map((mem) => {
                const isEditing = editingId === mem.id;
                return (
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

                    {isEditing ? (
                      <View style={styles.editSection}>
                        <TextInput
                          style={[
                            styles.editInput,
                            Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : undefined,
                          ]}
                          selectionColor={theme.colors.accent.primary}
                          cursorColor={theme.colors.accent.primary}
                          value={editText}
                          onChangeText={setEditText}
                          multiline
                          placeholder="Edit memory fact..."
                          placeholderTextColor={theme.colors.text.tertiary}
                        />
                        <View style={styles.editActionRow}>
                          <TouchableOpacity
                            style={[styles.smallBtn, styles.cancelBtn]}
                            onPress={() => setEditingId(null)}
                            disabled={isSaving}
                          >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.smallBtn, styles.saveBtn]}
                            onPress={() => handleSaveEdit(mem.id)}
                            disabled={isSaving}
                          >
                            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save'}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.memContent}>{mem.content}</Text>

                        <View style={styles.cardFooterRow}>
                          <Text style={styles.timestamp}>{mem.timestamp}</Text>
                          <View style={styles.actionBtnRow}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleStartEdit(mem.id, mem.content)}
                              style={styles.editBtn}
                            >
                              <Ionicons name="pencil-outline" size={14} color={theme.colors.accent.primary} />
                              <Text style={styles.editText}>Edit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() => handleDelete(mem.id)}
                              style={styles.deleteBtn}
                            >
                              <Ionicons name="trash-outline" size={14} color={theme.colors.status.error} />
                              <Text style={styles.deleteText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </>
                    )}
                  </GlassCard>
                );
              })
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
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  editText: {
    fontSize: 11,
    color: theme.colors.accent.primary,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  deleteText: {
    fontSize: 11,
    color: theme.colors.status.error,
    fontWeight: '600',
  },
  editSection: {
    marginVertical: theme.spacing.xs,
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    padding: theme.spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.borderRadius.sm,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: theme.colors.accent.primary,
  },
  saveBtnText: {
    color: '#050B14',
    fontSize: 12,
    fontWeight: '700',
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

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import { theme } from '../theme';
import { StorageService, HealthRecord } from '../services/storage';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface HealthcareScreenProps {
  navigation: ScreenNavProp<'Healthcare'>;
}

type CategoryFilter = 'all' | HealthRecord['category'];

export const HealthcareScreen: React.FC<HealthcareScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { activeTab, setActiveTab } = useApp();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [formCategory, setFormCategory] = useState<HealthRecord['category']>('symptom');
  const [formTitle, setFormTitle] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formDosage, setFormDosage] = useState('');
  const [formDateOrTime, setFormDateOrTime] = useState('');
  const [formSeverity, setFormSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [isSaving, setIsSaving] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await StorageService.getHealthRecords();
      setRecords(data);
    } catch {
      Alert.alert('Error', 'Unable to retrieve healthcare records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleOpenAddModal = (presetCategory?: HealthRecord['category']) => {
    setIsEditing(false);
    setActiveRecordId(null);
    setFormCategory(presetCategory || (filter !== 'all' ? filter : 'symptom'));
    setFormTitle('');
    setFormNotes('');
    setFormDosage('');
    setFormDateOrTime('');
    setFormSeverity('mild');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: HealthRecord) => {
    setIsEditing(true);
    setActiveRecordId(rec.id);
    setFormCategory(rec.category);
    setFormTitle(rec.title);
    setFormNotes(rec.notes || '');
    setFormDosage(rec.dosage || '');
    setFormDateOrTime(rec.dateOrTime || '');
    setFormSeverity(rec.severity || 'mild');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation Error', 'Title or description is required.');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && activeRecordId) {
        await StorageService.updateHealthRecord(activeRecordId, {
          category: formCategory,
          title: formTitle.trim(),
          notes: formNotes.trim() || undefined,
          dosage: formCategory === 'medication' ? formDosage.trim() || undefined : undefined,
          dateOrTime: formDateOrTime.trim() || undefined,
          severity: formCategory === 'symptom' ? formSeverity : undefined,
        });
      } else {
        await StorageService.saveHealthRecord({
          category: formCategory,
          title: formTitle.trim(),
          notes: formNotes.trim() || undefined,
          dosage: formCategory === 'medication' ? formDosage.trim() || undefined : undefined,
          dateOrTime: formDateOrTime.trim() || undefined,
          severity: formCategory === 'symptom' ? formSeverity : undefined,
          status: formCategory === 'medication' ? 'active' : undefined,
        });
      }
      await loadRecords();
      setIsModalOpen(false);
    } catch {
      Alert.alert('Error', 'Failed to save health record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Record',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteHealthRecord(id);
              await loadRecords();
            } catch {
              Alert.alert('Error', 'Failed to delete record.');
            }
          },
        },
      ]
    );
  };

  const handleToggleMedicationTaken = async (rec: HealthRecord) => {
    try {
      const nextStatus = rec.status === 'completed' ? 'active' : 'completed';
      await StorageService.updateHealthRecord(rec.id, { status: nextStatus });
      await loadRecords();
    } catch {
      Alert.alert('Error', 'Failed to update medication status.');
    }
  };

  const handleToggleSymptomResolved = async (rec: HealthRecord) => {
    try {
      const nextStatus = rec.status === 'resolved' ? 'active' : 'resolved';
      await StorageService.updateHealthRecord(rec.id, { status: nextStatus });
      await loadRecords();
    } catch {
      Alert.alert('Error', 'Failed to update symptom status.');
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesCategory = filter === 'all' || r.category === filter;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.dosage && r.dosage.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const activeMedsCount = records.filter((r) => r.category === 'medication' && r.status === 'active').length;
  const activeSymptomsCount = records.filter((r) => r.category === 'symptom' && r.status !== 'resolved').length;
  const appointmentsCount = records.filter((r) => r.category === 'appointment').length;

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Plan' || tab === 'MyDay') navigation.navigate('MyDay');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Friends') navigation.navigate('FriendsChat');
    else if (tab === 'Profile' || tab === 'MyLife') navigation.navigate('MyLife');
  };

  const getCategoryColor = (cat: HealthRecord['category']) => {
    switch (cat) {
      case 'medication':
        return '#00E5FF';
      case 'symptom':
        return '#FF5252';
      case 'condition':
        return '#FFB300';
      case 'appointment':
        return '#7C4DFF';
      case 'journal':
        return '#00E676';
    }
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
            <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Healthcare & Vitals</Text>
            <Text style={styles.headerSubtitle}>Personal Health Record & Diary</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconBtn, styles.addBtn]}
            activeOpacity={0.7}
            onPress={() => handleOpenAddModal()}
          >
            <Ionicons name="add" size={22} color="#050B14" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Urgent Care & Medical Disclaimer Notice */}
          <GlassCard style={styles.warningCard}>
            <View style={styles.warningHeader}>
              <Ionicons name="warning-outline" size={18} color="#FF5252" />
              <Text style={styles.warningTitle}>Medical Guidance & Urgent Care Notice</Text>
            </View>
            <Text style={styles.warningText}>
              NEXORA is a wellness and self-care log assistant, not a doctor or medical professional. Never ignore urgent medical advice. If you experience severe chest pain, shortness of breath, acute trauma, or allergic reactions, immediately call emergency services (112 / 911 / 102).
            </Text>
          </GlassCard>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsRow}>
            <GlassCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{activeMedsCount}</Text>
              <Text style={styles.metricLabel}>Active Meds</Text>
            </GlassCard>
            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#FF5252' }]}>{activeSymptomsCount}</Text>
              <Text style={styles.metricLabel}>Symptoms</Text>
            </GlassCard>
            <GlassCard style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: '#7C4DFF' }]}>{appointmentsCount}</Text>
              <Text style={styles.metricLabel}>Visits</Text>
            </GlassCard>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={theme.colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search symptoms, meds, notes..."
              placeholderTextColor={theme.colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBar}
          >
            {(['all', 'symptom', 'condition', 'medication', 'appointment', 'journal'] as CategoryFilter[]).map((cat) => {
              const active = filter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setFilter(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {cat === 'all' ? 'All Records' : cat.charAt(0).toUpperCase() + cat.slice(1) + 's'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Records List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={theme.colors.accent.primary} size="large" />
              <Text style={styles.loadingText}>Loading health records...</Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="fitness-outline" size={36} color={theme.colors.accent.primary} />
              <Text style={styles.emptyTitle}>No health records found</Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? 'No entries match your search query.'
                  : 'Start tracking your symptoms, medications, appointments, or wellness notes.'}
              </Text>
              <View style={styles.emptyBtnWrap}>
                <GlassButton
                  title="+ Add Entry"
                  variant="primary"
                  onPress={() => handleOpenAddModal()}
                />
              </View>
            </GlassCard>
          ) : (
            <View style={styles.recordsList}>
              {filteredRecords.map((rec) => {
                const color = getCategoryColor(rec.category);
                return (
                  <GlassCard key={rec.id} style={styles.recordCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeGroup}>
                        <View style={[styles.categoryBadge, { borderColor: color }]}>
                          <Text style={[styles.categoryBadgeText, { color }]}>
                            {rec.category.toUpperCase()}
                          </Text>
                        </View>
                        {rec.severity && (
                          <StatusBadge
                            label={`Severity: ${rec.severity}`}
                            status={rec.severity === 'severe' ? 'processing' : 'idle'}
                          />
                        )}
                        {rec.status && (
                          <StatusBadge
                            label={rec.status.toUpperCase()}
                            status={rec.status === 'completed' || rec.status === 'resolved' ? 'idle' : 'info'}
                          />
                        )}
                      </View>
                      <View style={styles.cardHeaderActions}>
                        <TouchableOpacity
                          style={styles.actionIcon}
                          onPress={() => handleOpenEditModal(rec)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil-outline" size={16} color={theme.colors.accent.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionIcon}
                          onPress={() => handleDelete(rec.id, rec.title)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.colors.status.error} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.recordTitle}>{rec.title}</Text>

                    {rec.dosage && (
                      <View style={styles.metaRow}>
                        <Ionicons name="medkit-outline" size={14} color={theme.colors.accent.primary} />
                        <Text style={styles.metaText}>Dosage / Frequency: {rec.dosage}</Text>
                      </View>
                    )}

                    {rec.dateOrTime && (
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
                        <Text style={styles.metaText}>Schedule: {rec.dateOrTime}</Text>
                      </View>
                    )}

                    {rec.notes && <Text style={styles.recordNotes}>{rec.notes}</Text>}

                    {/* Quick status toggle actions */}
                    {rec.category === 'medication' && (
                      <View style={styles.cardFooter}>
                        <TouchableOpacity
                          style={[
                            styles.toggleActionBtn,
                            rec.status === 'completed' && styles.toggleActionBtnDone,
                          ]}
                          onPress={() => handleToggleMedicationTaken(rec)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={rec.status === 'completed' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                            size={16}
                            color={rec.status === 'completed' ? '#00E676' : theme.colors.accent.primary}
                          />
                          <Text
                            style={[
                              styles.toggleActionText,
                              rec.status === 'completed' && { color: '#00E676' },
                            ]}
                          >
                            {rec.status === 'completed' ? 'Taken today' : 'Mark Taken'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {rec.category === 'symptom' && (
                      <View style={styles.cardFooter}>
                        <TouchableOpacity
                          style={[
                            styles.toggleActionBtn,
                            rec.status === 'resolved' && styles.toggleActionBtnDone,
                          ]}
                          onPress={() => handleToggleSymptomResolved(rec)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={rec.status === 'resolved' ? 'checkmark-done-circle' : 'ellipse-outline'}
                            size={16}
                            color={rec.status === 'resolved' ? '#00E676' : theme.colors.text.secondary}
                          />
                          <Text
                            style={[
                              styles.toggleActionText,
                              rec.status === 'resolved' && { color: '#00E676' },
                            ]}
                          >
                            {rec.status === 'resolved' ? 'Resolved' : 'Mark Resolved'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          )}
        </ScrollView>

        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
      </View>

      {/* Add / Edit Health Record Modal */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Health Record' : 'Log Health Entry'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Category selector */}
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.categoryPickerRow}>
                {(['symptom', 'condition', 'medication', 'appointment', 'journal'] as HealthRecord['category'][]).map(
                  (c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.categoryOption,
                        formCategory === c && {
                          backgroundColor: `${getCategoryColor(c)}22`,
                          borderColor: getCategoryColor(c),
                        },
                      ]}
                      onPress={() => setFormCategory(c)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          formCategory === c && { color: getCategoryColor(c), fontWeight: '700' },
                        ]}
                      >
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* Title Input */}
              <Text style={styles.fieldLabel}>
                {formCategory === 'medication'
                  ? 'Medication Name'
                  : formCategory === 'appointment'
                  ? 'Doctor or Clinic / Purpose'
                  : 'Title / Subject'} *
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={
                  formCategory === 'medication'
                    ? 'e.g. Paracetamol 500mg'
                    : formCategory === 'symptom'
                    ? 'e.g. Mild headache after study'
                    : 'e.g. Annual health checkup'
                }
                placeholderTextColor={theme.colors.text.tertiary}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              {/* Dosage for medication */}
              {formCategory === 'medication' && (
                <>
                  <Text style={styles.fieldLabel}>Dosage & Frequency</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 1 tablet twice daily after food"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formDosage}
                    onChangeText={setFormDosage}
                  />
                </>
              )}

              {/* Severity for symptom */}
              {formCategory === 'symptom' && (
                <>
                  <Text style={styles.fieldLabel}>Severity</Text>
                  <View style={styles.severityPickerRow}>
                    {(['mild', 'moderate', 'severe'] as const).map((sev) => (
                      <TouchableOpacity
                        key={sev}
                        style={[
                          styles.severityOption,
                          formSeverity === sev && styles.severityOptionActive,
                        ]}
                        onPress={() => setFormSeverity(sev)}
                      >
                        <Text
                          style={[
                            styles.severityOptionText,
                            formSeverity === sev && styles.severityOptionTextActive,
                          ]}
                        >
                          {sev.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Date/Time for appointment or medication */}
              {(formCategory === 'appointment' || formCategory === 'medication') && (
                <>
                  <Text style={styles.fieldLabel}>Date / Time / Reminder Window</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Tomorrow at 10:00 AM"
                    placeholderTextColor={theme.colors.text.tertiary}
                    value={formDateOrTime}
                    onChangeText={setFormDateOrTime}
                  />
                </>
              )}

              {/* Notes */}
              <Text style={styles.fieldLabel}>Detailed Notes / Observations</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Additional notes, side-effects, or doctor recommendations..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={formNotes}
                onChangeText={setFormNotes}
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#050B14" />
                ) : (
                  <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Add Record'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>
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
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    marginTop: 2,
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
  addBtn: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  warningCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(255, 82, 82, 0.08)',
    borderColor: 'rgba(255, 82, 82, 0.25)',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FF5252',
    textTransform: 'uppercase',
  },
  warningText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
  },
  metricLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    height: 44,
    marginBottom: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  filterBar: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  filterText: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.sm,
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  emptySub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyBtnWrap: {
    marginTop: theme.spacing.md,
    width: 160,
  },
  recordsList: {
    gap: theme.spacing.sm,
  },
  recordCard: {
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  actionIcon: {
    padding: 4,
  },
  recordTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  recordNotes: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: theme.spacing.xs,
  },
  toggleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  toggleActionBtnDone: {
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
  },
  toggleActionText: {
    fontSize: 11,
    color: theme.colors.accent.primary,
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: theme.spacing.md,
  },
  modalContent: {
    maxHeight: '85%',
    padding: theme.spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modalBody: {
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 6,
    marginTop: 10,
  },
  categoryPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categoryOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  categoryOptionText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  severityPickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  severityOptionActive: {
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
    borderColor: '#FF5252',
  },
  severityOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.tertiary,
  },
  severityOptionTextActive: {
    color: '#FF5252',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: theme.spacing.md,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent.primary,
    minWidth: 110,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#050B14',
    fontSize: 13,
    fontWeight: '700',
  },
});

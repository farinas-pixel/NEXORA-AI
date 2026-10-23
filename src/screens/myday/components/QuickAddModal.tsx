import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../../../services/storage';
import { ReminderItem } from '../../../services/reminders/reminderService';
import { NatureTheme } from '../theme';

export type QuickAddType = 'task' | 'reminder';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  initialType?: QuickAddType;
  editingTask?: TaskItem | null;
  editingReminder?: ReminderItem | null;
  onSaveTask: (taskData: {
    title: string;
    dueDate?: string;
    category: TaskItem['category'];
    priority: 'low' | 'medium' | 'high';
  }) => Promise<void>;
  onSaveReminder: (reminderData: {
    title: string;
    timeStr: string;
    category: ReminderItem['category'];
    isPinned: boolean;
    relaxationMinutes: number;
  }) => Promise<void>;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  visible,
  onClose,
  initialType = 'task',
  editingTask,
  editingReminder,
  onSaveTask,
  onSaveReminder,
}) => {
  const [activeType, setActiveType] = useState<QuickAddType>(initialType);

  // Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskItem['category']>('work');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');

  // Reminder Form State
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderTime, setReminderTime] = useState('18:00');
  const [reminderCategory, setReminderCategory] = useState<ReminderItem['category']>('personal');
  const [isPinned, setIsPinned] = useState(false);
  const [relaxationMinutes, setRelaxationMinutes] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingTask) {
      setActiveType('task');
      setTaskTitle(editingTask.title);
      setTaskDueDate(editingTask.dueDate || '');
      setTaskCategory((editingTask.category as any) || 'work');
      setTaskPriority(editingTask.priority || 'medium');
      setErrorMsg(null);
    } else if (editingReminder) {
      setActiveType('reminder');
      setReminderTitle(editingReminder.title);
      const d = new Date(editingReminder.dueTime);
      setReminderTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
      setReminderCategory(editingReminder.category || 'personal');
      setIsPinned(!!editingReminder.isPinned);
      setRelaxationMinutes(editingReminder.relaxationMinutes || 0);
      setErrorMsg(null);
    } else {
      setActiveType(initialType);
      resetForms();
    }
  }, [visible, editingTask, editingReminder, initialType]);

  const resetForms = () => {
    setTaskTitle('');
    setTaskDueDate('');
    setTaskCategory('work');
    setTaskPriority('medium');
    setReminderTitle('');
    setReminderTime('18:00');
    setReminderCategory('personal');
    setIsPinned(false);
    setRelaxationMinutes(0);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setErrorMsg(null);
    setIsSaving(true);
    try {
      if (activeType === 'task') {
        const trimmed = taskTitle.trim();
        if (!trimmed) {
          setErrorMsg('Task title cannot be blank.');
          setIsSaving(false);
          return;
        }
        await onSaveTask({
          title: trimmed,
          dueDate: taskDueDate.trim() || undefined,
          category: taskCategory,
          priority: taskPriority,
        });
      } else {
        const trimmed = reminderTitle.trim();
        if (!trimmed) {
          setErrorMsg('Reminder title cannot be blank.');
          setIsSaving(false);
          return;
        }
        await onSaveReminder({
          title: trimmed,
          timeStr: reminderTime.trim() || '18:00',
          category: reminderCategory,
          isPinned,
          relaxationMinutes,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const isEditing = Boolean(editingTask || editingReminder);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Top Specular Highlight */}
          <View style={styles.specularBar} />

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Entry' : 'Create New Entry'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Schedule and organize your daily priorities
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={20} color={NatureTheme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Type Segmented Control (only when not editing) */}
          {!isEditing && (
            <View style={styles.typeSegment}>
              <TouchableOpacity
                onPress={() => setActiveType('task')}
                style={[styles.segmentBtn, activeType === 'task' && styles.segmentBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="Switch to Task form"
              >
                <Ionicons
                  name="checkbox-outline"
                  size={14}
                  color={activeType === 'task' ? NatureTheme.colors.background : NatureTheme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    activeType === 'task' && styles.segmentTextActive,
                  ]}
                >
                  Priority Task
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveType('reminder')}
                style={[styles.segmentBtn, activeType === 'reminder' && styles.segmentBtnActive]}
                accessibilityRole="button"
                accessibilityLabel="Switch to Reminder form"
              >
                <Ionicons
                  name="alarm-outline"
                  size={14}
                  color={activeType === 'reminder' ? NatureTheme.colors.background : NatureTheme.colors.textMuted}
                />
                <Text
                  style={[
                    styles.segmentText,
                    activeType === 'reminder' && styles.segmentTextActive,
                  ]}
                >
                  Reminder / Alarm
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
            {activeType === 'task' ? (
              /* TASK FORM */
              <View style={styles.formFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Task Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g. Review machine learning paper..."
                    placeholderTextColor={NatureTheme.colors.textMuted}
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Scheduled / Due Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g. Today 5 PM or Tomorrow..."
                    placeholderTextColor={NatureTheme.colors.textMuted}
                    value={taskDueDate}
                    onChangeText={setTaskDueDate}
                  />
                </View>

                {/* Category Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.chipsRow}>
                    {(['work', 'study', 'fitness', 'daily'] as const).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setTaskCategory(cat)}
                        style={[
                          styles.chip,
                          taskCategory === cat && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            taskCategory === cat && styles.chipTextActive,
                          ]}
                        >
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Priority Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Priority</Text>
                  <View style={styles.chipsRow}>
                    {(['low', 'medium', 'high'] as const).map((pri) => (
                      <TouchableOpacity
                        key={pri}
                        onPress={() => setTaskPriority(pri)}
                        style={[
                          styles.chip,
                          taskPriority === pri && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            taskPriority === pri && styles.chipTextActive,
                          ]}
                        >
                          {pri.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : (
              /* REMINDER FORM */
              <View style={styles.formFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Reminder Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g. Drink glass of fresh water..."
                    placeholderTextColor={NatureTheme.colors.textMuted}
                    value={reminderTitle}
                    onChangeText={setReminderTitle}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Time (24h or 12h)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="E.g. 18:30 or 7:00 PM..."
                    placeholderTextColor={NatureTheme.colors.textMuted}
                    value={reminderTime}
                    onChangeText={setReminderTime}
                  />
                </View>

                {/* Category Selection */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Category</Text>
                  <View style={styles.chipsRow}>
                    {(['personal', 'work', 'study', 'fitness', 'medication', 'social'] as const).map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setReminderCategory(cat)}
                        style={[
                          styles.chip,
                          reminderCategory === cat && styles.chipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            reminderCategory === cat && styles.chipTextActive,
                          ]}
                        >
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Options: Pin & Relaxation Timer */}
                <View style={styles.optionsCol}>
                  <TouchableOpacity
                    onPress={() => setIsPinned(!isPinned)}
                    style={[styles.optionToggle, isPinned && styles.optionToggleActive]}
                  >
                    <Ionicons
                      name={isPinned ? 'star' : 'star-outline'}
                      size={16}
                      color={isPinned ? NatureTheme.colors.gold : NatureTheme.colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.optionToggleText,
                        isPinned && styles.optionToggleTextActive,
                      ]}
                    >
                      {isPinned ? 'Pinned to Top' : 'Pin to Top'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setRelaxationMinutes(relaxationMinutes > 0 ? 0 : 10)}
                    style={[
                      styles.optionToggle,
                      relaxationMinutes > 0 && styles.optionToggleActive,
                    ]}
                  >
                    <Ionicons
                      name="leaf-outline"
                      size={16}
                      color={
                        relaxationMinutes > 0
                          ? NatureTheme.colors.sage
                          : NatureTheme.colors.textMuted
                      }
                    />
                    <Text
                      style={[
                        styles.optionToggleText,
                        relaxationMinutes > 0 && styles.optionToggleTextActive,
                      ]}
                    >
                      {relaxationMinutes > 0
                        ? '10m Relaxation Routine Attached'
                        : '+ Attach 10m Relaxation Routine'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel="Save entry"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={NatureTheme.colors.background} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color={NatureTheme.colors.background} />
                  <Text style={styles.saveBtnText}>
                    {isEditing ? 'Save Changes' : 'Add to Plan'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 5, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: NatureTheme.colors.glassSurface,
    borderRadius: NatureTheme.borderRadius.xl,
    borderWidth: 1,
    borderColor: NatureTheme.colors.glassBorderBright,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    ...NatureTheme.shadows.glass,
  },
  specularBar: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 2,
    backgroundColor: NatureTheme.colors.topSpecular,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: NatureTheme.borderRadius.lg,
    padding: 4,
    marginBottom: 14,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: NatureTheme.borderRadius.md,
  },
  segmentBtnActive: {
    backgroundColor: NatureTheme.colors.emerald,
  },
  segmentText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: NatureTheme.colors.background,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 8,
    borderRadius: NatureTheme.borderRadius.sm,
    marginBottom: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  formScroll: {
    maxHeight: 340,
  },
  formFields: {
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  fieldLabel: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: NatureTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: NatureTheme.colors.textPrimary,
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: NatureTheme.borderRadius.sm,
  },
  chipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
    borderColor: NatureTheme.colors.emerald,
  },
  chipText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  chipTextActive: {
    color: NatureTheme.colors.sage,
  },
  optionsCol: {
    gap: 8,
    marginTop: 4,
  },
  optionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: NatureTheme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionToggleActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: NatureTheme.colors.emerald,
  },
  optionToggleText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
  },
  optionToggleTextActive: {
    color: NatureTheme.colors.textPrimary,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: NatureTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cancelBtnText: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NatureTheme.colors.emerald,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: NatureTheme.borderRadius.md,
  },
  saveBtnText: {
    color: NatureTheme.colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
});

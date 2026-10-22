import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { ReminderService, ReminderItem } from '../services/reminders/reminderService';
import type { ScreenNavProp } from '../types/navigation';

interface CalendarScreenProps {
  navigation: ScreenNavProp<'Calendar'>;
}

type TabType = 'upcoming' | 'all' | 'completed';

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { reminders: contextReminders, refreshReminders } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [remindersList, setRemindersList] = useState<ReminderItem[]>(contextReminders || []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterByDate, setFilterByDate] = useState<boolean>(false);

  // New Reminder / Edit Reminder Modal State
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderItem | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDateOption, setFormDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [formTimeStr, setFormTimeStr] = useState('09:00 AM');
  const [formCategory, setFormCategory] = useState<ReminderItem['category']>('personal');
  const [formPriority, setFormPriority] = useState<ReminderItem['priority']>('medium');
  const [formNotes, setFormNotes] = useState('');

  // Reschedule Modal State
  const [rescheduleTarget, setRescheduleTarget] = useState<ReminderItem | null>(null);

  const loadReminders = useCallback(async () => {
    try {
      const all = await ReminderService.getReminders();
      setRemindersList(all);
      refreshReminders().catch(() => {});
    } catch {
      // Fallback to context
      if (contextReminders) setRemindersList(contextReminders);
    }
  }, [contextReminders, refreshReminders]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  // Generate 7-day strip centered on today
  const weekDays = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 2 + i);
      return d;
    });
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Filtered Reminders based on Active Tab and Date Filter
  const filteredReminders = useMemo(() => {
    const now = Date.now();
    return remindersList.filter((rem) => {
      if (rem.status === 'cancelled') return false;

      // 1. Tab check
      if (activeTab === 'upcoming') {
        const isCompleted = rem.status === 'completed';
        if (isCompleted) return false;
      } else if (activeTab === 'completed') {
        if (rem.status !== 'completed') return false;
      }

      // 2. Date check (if enabled)
      if (filterByDate && selectedDate) {
        if (!rem.dueTime) return false;
        const remDate = new Date(rem.dueTime);
        if (isNaN(remDate.getTime())) return false;
        if (!isSameDay(remDate, selectedDate)) return false;
      }

      return true;
    });
  }, [remindersList, activeTab, filterByDate, selectedDate]);

  // Actions
  const handleToggleComplete = async (rem: ReminderItem) => {
    try {
      if (rem.status === 'completed') {
        // Reopen reminder
        const updated = await ReminderService.updateReminderDetails(rem.id, {
          title: rem.title,
          status: 'pending',
        } as any);
        setRemindersList(updated);
      } else {
        const updated = await ReminderService.completeReminder(rem.id);
        setRemindersList(updated);
      }
      refreshReminders().catch(() => {});
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update reminder status');
    }
  };

  const handleDeleteReminder = (id: string) => {
    const target = remindersList.find((r) => r.id === id);
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${target?.title || 'this reminder'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await ReminderService.cancelReminder(id);
              setRemindersList(updated);
              refreshReminders().catch(() => {});
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleOpenNewReminder = () => {
    setEditingReminder(null);
    setFormTitle('');
    setFormDateOption('today');
    setFormTimeStr('09:00 AM');
    setFormCategory('personal');
    setFormPriority('medium');
    setFormNotes('');
    setIsEditorVisible(true);
  };

  const handleOpenEditReminder = (rem: ReminderItem) => {
    setEditingReminder(rem);
    setFormTitle(rem.title);
    setFormCategory(rem.category);
    setFormPriority(rem.priority);
    setFormNotes(rem.notes || '');

    const remDate = new Date(rem.dueTime);
    if (!isNaN(remDate.getTime())) {
      const today = new Date();
      if (isSameDay(remDate, today)) {
        setFormDateOption('today');
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        if (isSameDay(remDate, tomorrow)) {
          setFormDateOption('tomorrow');
        } else {
          setFormDateOption('custom');
        }
      }
      setFormTimeStr(
        remDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }
    setIsEditorVisible(true);
  };

  const handleSaveReminder = async () => {
    const trimmedTitle = formTitle.trim();
    if (!trimmedTitle) {
      Alert.alert('Validation Error', 'Please enter a reminder title.');
      return;
    }

    // Compute Target Date & Time
    const target = new Date();
    if (formDateOption === 'tomorrow') {
      target.setDate(target.getDate() + 1);
    } else if (formDateOption === 'custom' && selectedDate) {
      target.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    }

    const timeMatch = formTimeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const mins = parseInt(timeMatch[2], 10);
      const meridian = timeMatch[3]?.toLowerCase();
      if (meridian === 'pm' && hours < 12) hours += 12;
      if (meridian === 'am' && hours === 12) hours = 0;
      target.setHours(hours, mins, 0, 0);
    } else {
      // Default to 1 hour from now
      target.setTime(Date.now() + 60 * 60 * 1000);
    }

    const isoDueTime = target.toISOString();

    try {
      if (editingReminder) {
        const updated = await ReminderService.updateReminderDetails(editingReminder.id, {
          title: trimmedTitle,
          dueTime: isoDueTime,
          category: formCategory,
          priority: formPriority,
          notes: formNotes.trim() || undefined,
        });
        setRemindersList(updated);
      } else {
        await ReminderService.createReminder(
          trimmedTitle,
          isoDueTime,
          formCategory,
          formPriority,
          { notes: formNotes.trim() || undefined }
        );
        const updated = await ReminderService.getReminders();
        setRemindersList(updated);
      }
      setIsEditorVisible(false);
      refreshReminders().catch(() => {});
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save reminder.');
    }
  };

  // Reschedule Handlers
  const handleApplyReschedule = async (option: '30m' | '1h' | 'tomorrow' | '2days') => {
    if (!rescheduleTarget) return;
    try {
      const now = new Date();
      let targetTime = new Date();
      if (option === '30m') {
        targetTime = new Date(now.getTime() + 30 * 60 * 1000);
      } else if (option === '1h') {
        targetTime = new Date(now.getTime() + 60 * 60 * 1000);
      } else if (option === 'tomorrow') {
        targetTime.setDate(now.getDate() + 1);
        targetTime.setHours(9, 0, 0, 0);
      } else if (option === '2days') {
        targetTime.setDate(now.getDate() + 2);
        targetTime.setHours(9, 0, 0, 0);
      }

      const updated = await ReminderService.rescheduleReminder(
        rescheduleTarget.id,
        targetTime.toISOString()
      );
      setRemindersList(updated);
      setRescheduleTarget(null);
      refreshReminders().catch(() => {});
      Alert.alert(
        'Rescheduled',
        `Reminder moved to ${targetTime.toLocaleDateString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        })} at ${targetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reschedule.');
    }
  };

  const formatDueLabel = (dueIso: string) => {
    const d = new Date(dueIso);
    if (isNaN(d.getTime())) return 'Scheduled';
    const today = new Date();
    const isTodayVal = isSameDay(d, today);
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const isTomorrowVal = isSameDay(d, tomorrow);

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isTodayVal) return `Today · ${timeStr}`;
    if (isTomorrowVal) return `Tomorrow · ${timeStr}`;
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeStr}`;
  };

  const getCategoryColor = (cat: ReminderItem['category']) => {
    switch (cat) {
      case 'work': return '#8B5CF6';
      case 'study': return '#00E5FF';
      case 'fitness': return '#10B981';
      case 'medication': return '#EF4444';
      default: return '#38BDF8';
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 8 }]}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Reminders & Alarms</Text>
            <Text style={styles.headerSub}>
              {remindersList.filter((r) => r.status !== 'completed').length} pending ·{' '}
              {remindersList.filter((r) => r.status === 'completed').length} completed
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* 7-Day Date Strip & Filter Toggle */}
        <View style={styles.dateStripContainer}>
          <View style={styles.dateStripHeader}>
            <Text style={styles.dateStripTitle}>
              {selectedDate
                ? selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })
                : 'All Dates'}
            </Text>
            <TouchableOpacity
              onPress={() => setFilterByDate((prev) => !prev)}
              style={[
                styles.filterByDateToggle,
                filterByDate && styles.filterByDateToggleActive,
              ]}
              accessibilityRole="button"
              accessibilityLabel={filterByDate ? 'Disable date filter' : 'Filter by date'}
            >
              <Ionicons
                name="funnel-outline"
                size={12}
                color={filterByDate ? '#00E5FF' : '#94A3B8'}
              />
              <Text
                style={[
                  styles.filterByDateText,
                  filterByDate && styles.filterByDateTextActive,
                ]}
              >
                {filterByDate ? 'Date Filter ON' : 'All Dates'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekStripScroll}
          >
            {weekDays.map((item, idx) => {
              const isSelected = selectedDate ? isSameDay(item, selectedDate) : false;
              const isTodayItem = isSameDay(item, new Date());

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedDate(item);
                    setFilterByDate(true);
                  }}
                  style={[
                    styles.datePill,
                    isSelected && filterByDate && styles.datePillActive,
                    isTodayItem && !isSelected && styles.datePillToday,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${dayNames[item.getDay()]} ${item.getDate()}`}
                >
                  <Text
                    style={[
                      styles.dayName,
                      isSelected && filterByDate && styles.dayNameActive,
                    ]}
                  >
                    {dayNames[item.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dateNum,
                      isSelected && filterByDate && styles.dateNumActive,
                    ]}
                  >
                    {item.getDate()}
                  </Text>
                  {isTodayItem && <View style={styles.todayIndicatorDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Tabs: Upcoming | All | Completed */}
        <View style={styles.tabsContainer}>
          {(['upcoming', 'all', 'completed'] as const).map((tab) => {
            const isActive = activeTab === tab;
            const count =
              tab === 'upcoming'
                ? remindersList.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').length
                : tab === 'completed'
                ? remindersList.filter((r) => r.status === 'completed').length
                : remindersList.filter((r) => r.status !== 'cancelled').length;

            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={`View ${tab} reminders`}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Reminders List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          {filteredReminders.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="notifications-outline" size={36} color="#64748B" />
              <Text style={styles.emptyTitle}>No Reminders Found</Text>
              <Text style={styles.emptySub}>
                {filterByDate
                  ? 'No reminders scheduled for this selected date.'
                  : activeTab === 'completed'
                  ? 'No completed reminders yet.'
                  : 'You have no scheduled reminders. Tap the + button to add one.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={handleOpenNewReminder}
                accessibilityRole="button"
                accessibilityLabel="Create reminder"
              >
                <Ionicons name="add" size={16} color="#050814" />
                <Text style={styles.emptyActionBtnText}>Create Reminder</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            filteredReminders.map((rem) => {
              const isCompleted = rem.status === 'completed';
              const catColor = getCategoryColor(rem.category);
              const dueFormatted = formatDueLabel(rem.dueTime);

              return (
                <GlassCard
                  key={rem.id}
                  style={[styles.reminderCard, isCompleted && styles.reminderCardCompleted]}
                >
                  <View style={styles.cardMainRow}>
                    {/* Completion Checkbox */}
                    <TouchableOpacity
                      onPress={() => handleToggleComplete(rem)}
                      style={[
                        styles.checkbox,
                        isCompleted && styles.checkboxCompleted,
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isCompleted }}
                      accessibilityLabel={`Toggle completion for ${rem.title}`}
                    >
                      {isCompleted && (
                        <Ionicons name="checkmark" size={14} color="#050814" />
                      )}
                    </TouchableOpacity>

                    {/* Content Column */}
                    <View style={styles.cardContentCol}>
                      <Text
                        style={[
                          styles.cardTitle,
                          isCompleted && styles.cardTitleCompleted,
                        ]}
                        numberOfLines={2}
                      >
                        {rem.title}
                      </Text>

                      <View style={styles.cardMetaRow}>
                        <View style={[styles.catBadge, { backgroundColor: `${catColor}20`, borderColor: `${catColor}60` }]}>
                          <Text style={[styles.catBadgeText, { color: catColor }]}>
                            {rem.category.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.timeBadge}>
                          <Ionicons name="time-outline" size={12} color="#00E5FF" />
                          <Text style={styles.timeBadgeText}>{dueFormatted}</Text>
                        </View>
                        {rem.priority === 'high' && (
                          <View style={styles.priorityHighBadge}>
                            <Text style={styles.priorityHighText}>HIGH</Text>
                          </View>
                        )}
                      </View>

                      {rem.notes ? (
                        <Text style={styles.cardNotesText} numberOfLines={1}>
                          {rem.notes}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => setRescheduleTarget(rem)}
                      accessibilityRole="button"
                      accessibilityLabel="Reschedule reminder"
                    >
                      <Ionicons name="calendar-outline" size={13} color="#00E5FF" />
                      <Text style={styles.cardActionBtnText}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleOpenEditReminder(rem)}
                      accessibilityRole="button"
                      accessibilityLabel="Edit reminder"
                    >
                      <Ionicons name="create-outline" size={13} color="#8B5CF6" />
                      <Text style={[styles.cardActionBtnText, { color: '#8B5CF6' }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleDeleteReminder(rem.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete reminder"
                    >
                      <Ionicons name="trash-outline" size={13} color="#EF4444" />
                      <Text style={[styles.cardActionBtnText, { color: '#EF4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })
          )}
        </ScrollView>

        {/* Floating Plus Button (FAB) - Opens New Reminder DIRECTLY */}
        <TouchableOpacity
          style={[styles.fabBtn, { bottom: Math.max(insets.bottom + 20, 24) }]}
          onPress={handleOpenNewReminder}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create new reminder"
        >
          <LinearGradient
            colors={['#00E5FF', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#050814" />
          </LinearGradient>
        </TouchableOpacity>

        {/* New / Edit Reminder Modal */}
        <Modal
          visible={isEditorVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setIsEditorVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingReminder ? 'Edit Reminder' : 'New Reminder'}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsEditorVisible(false)}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close editor"
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title Input */}
                <Text style={styles.fieldLabel}>TITLE</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. System design sync or take vitamins"
                  placeholderTextColor="#64748B"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />

                {/* Date Selection */}
                <Text style={styles.fieldLabel}>DATE</Text>
                <View style={styles.pillRow}>
                  {(['today', 'tomorrow', 'custom'] as const).map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setFormDateOption(opt)}
                      style={[
                        styles.selectorPill,
                        formDateOption === opt && styles.selectorPillActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select date ${opt}`}
                    >
                      <Text
                        style={[
                          styles.selectorPillText,
                          formDateOption === opt && styles.selectorPillTextActive,
                        ]}
                      >
                        {opt === 'today'
                          ? 'Today'
                          : opt === 'tomorrow'
                          ? 'Tomorrow'
                          : 'Selected Day'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Time Input */}
                <Text style={styles.fieldLabel}>TIME (HH:MM AM/PM)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 09:30 AM or 18:00"
                  placeholderTextColor="#64748B"
                  value={formTimeStr}
                  onChangeText={setFormTimeStr}
                />

                {/* Category Selection */}
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.pillRow}>
                  {(['personal', 'work', 'study', 'fitness', 'medication'] as const).map(
                    (cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setFormCategory(cat)}
                        style={[
                          styles.selectorPill,
                          formCategory === cat && styles.selectorPillActive,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Select category ${cat}`}
                      >
                        <Text
                          style={[
                            styles.selectorPillText,
                            formCategory === cat && styles.selectorPillTextActive,
                          ]}
                        >
                          {cat.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>

                {/* Priority Selection */}
                <Text style={styles.fieldLabel}>PRIORITY</Text>
                <View style={styles.pillRow}>
                  {(['low', 'medium', 'high'] as const).map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      onPress={() => setFormPriority(pri)}
                      style={[
                        styles.selectorPill,
                        formPriority === pri && styles.selectorPillActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select priority ${pri}`}
                    >
                      <Text
                        style={[
                          styles.selectorPillText,
                          formPriority === pri && styles.selectorPillTextActive,
                        ]}
                      >
                        {pri.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Notes Input */}
                <Text style={styles.fieldLabel}>NOTES (OPTIONAL)</Text>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="e.g. Bring architecture documentation"
                  placeholderTextColor="#64748B"
                  multiline
                  value={formNotes}
                  onChangeText={setFormNotes}
                />

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSaveReminder}
                  style={styles.modalSubmitBtn}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Save reminder"
                >
                  <LinearGradient
                    colors={['#00E5FF', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalSubmitGradient}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#050814" />
                    <Text style={styles.modalSubmitText}>
                      {editingReminder ? 'Update Reminder' : 'Schedule Reminder'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Reschedule Modal */}
        <Modal
          visible={!!rescheduleTarget}
          animationType="fade"
          transparent
          onRequestClose={() => setRescheduleTarget(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reschedule Reminder</Text>
                <TouchableOpacity
                  onPress={() => setRescheduleTarget(null)}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close reschedule"
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.rescheduleTargetTitle} numberOfLines={2}>
                "{rescheduleTarget?.title}"
              </Text>
              <Text style={styles.reschedulePrompt}>
                Select when to move this alert:
              </Text>

              <View style={styles.rescheduleOptionsList}>
                <TouchableOpacity
                  style={styles.rescheduleOptionBtn}
                  onPress={() => handleApplyReschedule('30m')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule in 30 minutes"
                >
                  <Ionicons name="time-outline" size={18} color="#00E5FF" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rescheduleOptionText}>In 30 Minutes</Text>
                    <Text style={styles.rescheduleOptionSub}>Quick postpone</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescheduleOptionBtn}
                  onPress={() => handleApplyReschedule('1h')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule in 1 hour"
                >
                  <Ionicons name="time-outline" size={18} color="#00E5FF" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rescheduleOptionText}>In 1 Hour</Text>
                    <Text style={styles.rescheduleOptionSub}>Short focus delay</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescheduleOptionBtn}
                  onPress={() => handleApplyReschedule('tomorrow')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule to tomorrow 9 AM"
                >
                  <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rescheduleOptionText}>Tomorrow at 9:00 AM</Text>
                    <Text style={styles.rescheduleOptionSub}>Next morning schedule</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rescheduleOptionBtn}
                  onPress={() => handleApplyReschedule('2days')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule in 2 days"
                >
                  <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.rescheduleOptionText}>In 2 Days at 9:00 AM</Text>
                    <Text style={styles.rescheduleOptionSub}>Later this week</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050814',
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  dateStripContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dateStripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  filterByDateToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterByDateToggleActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.35)',
  },
  filterByDateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterByDateTextActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  weekStripScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  datePill: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  datePillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.16)',
    borderColor: '#00E5FF',
  },
  datePillToday: {
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  dayName: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  dayNameActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  dateNum: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  dateNumActive: {
    color: '#00E5FF',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
    marginTop: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButtonActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  tabBadgeText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#00E5FF',
  },
  listScroll: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginVertical: 20,
    backgroundColor: 'rgba(11, 18, 38, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyActionBtnText: {
    color: '#050814',
    fontSize: 13,
    fontWeight: '800',
  },
  reminderCard: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: 'rgba(11, 18, 38, 0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  reminderCardCompleted: {
    opacity: 0.65,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  checkboxCompleted: {
    backgroundColor: '#00E5FF',
    borderColor: '#00E5FF',
  },
  cardContentCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
  },
  cardTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  catBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeBadgeText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  priorityHighBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  priorityHighText: {
    color: '#EF4444',
    fontSize: 9,
    fontWeight: '800',
  },
  cardNotesText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00E5FF',
  },
  fabBtn: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    zIndex: 50,
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 20, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#070D1E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectorPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectorPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
  selectorPillText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  selectorPillTextActive: {
    color: '#00E5FF',
    fontWeight: '800',
  },
  modalSubmitBtn: {
    marginTop: 18,
    marginBottom: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  modalSubmitText: {
    color: '#050814',
    fontSize: 14,
    fontWeight: '800',
  },
  rescheduleTargetTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  reschedulePrompt: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  rescheduleOptionsList: {
    gap: 8,
  },
  rescheduleOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rescheduleOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  rescheduleOptionSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
});

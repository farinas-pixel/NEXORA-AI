import React, { useState, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { StorageService, TaskItem } from '../services/storage';
import { supabaseDataService } from '../services/backend/supabaseDataService';
import type { ScreenNavProp } from '../types/navigation';

interface PlanDashboardScreenProps {
  navigation: ScreenNavProp<'PlanDashboard'>;
}

type TaskTab = 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';

export const PlanDashboardScreen: React.FC<PlanDashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, deleteTask, refreshTasks } = useApp();

  useFocusEffect(
    useCallback(() => {
      refreshTasks?.().catch(() => {});
    }, [refreshTasks])
  );

  const [activeTab, setActiveTab] = useState<TaskTab>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterByDate, setFilterByDate] = useState<boolean>(false);

  // Reschedule Modal State
  const [rescheduleTask, setRescheduleTask] = useState<TaskItem | null>(null);

  // Quick Edit Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<TaskItem['category']>('work');
  const [editPriority, setEditPriority] = useState<TaskItem['priority']>('medium');
  const [editDueDate, setEditDueDate] = useState('Today');

  const isSameLocalDate = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = useMemo(() => new Date(), []);

  // 7-Day Week Strip
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 3 + i);
      return d;
    });
  }, [today]);

  // Determine Task Date Category
  const getTaskStatusCategory = useCallback((t: TaskItem): 'today' | 'upcoming' | 'overdue' => {
    if (!t.dueDate) return 'today';
    const dueLower = t.dueDate.trim().toLowerCase();
    if (dueLower === 'today') return 'today';
    if (dueLower === 'tomorrow' || dueLower === 'this week' || dueLower === 'upcoming') {
      return 'upcoming';
    }

    const parsed = new Date(t.dueDate);
    if (!isNaN(parsed.getTime())) {
      if (isSameLocalDate(parsed, today)) return 'today';
      // Compare by midnight timestamp
      const parsedMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      if (parsedMidnight < todayMidnight) return 'overdue';
      return 'upcoming';
    }

    return 'today';
  }, [today]);

  // Tab Filtering & Counts
  const { categorizedTasks, tabCounts } = useMemo(() => {
    const todayList: TaskItem[] = [];
    const upcomingList: TaskItem[] = [];
    const overdueList: TaskItem[] = [];
    const completedList: TaskItem[] = [];
    const allList: TaskItem[] = [...tasks];

    tasks.forEach((t) => {
      if (t.completed) {
        completedList.push(t);
      } else {
        const cat = getTaskStatusCategory(t);
        if (cat === 'today') todayList.push(t);
        else if (cat === 'upcoming') upcomingList.push(t);
        else if (cat === 'overdue') overdueList.push(t);
      }
    });

    return {
      categorizedTasks: {
        today: todayList,
        upcoming: upcomingList,
        overdue: overdueList,
        completed: completedList,
        all: allList,
      },
      tabCounts: {
        today: todayList.length,
        upcoming: upcomingList.length,
        overdue: overdueList.length,
        completed: completedList.length,
        all: allList.length,
      },
    };
  }, [tasks, getTaskStatusCategory]);

  // Active filtered tasks
  const displayedTasks = useMemo(() => {
    const baseList = categorizedTasks[activeTab];
    if (!filterByDate) return baseList;

    return baseList.filter((t) => {
      if (!t.dueDate) return isSameLocalDate(selectedDate, today);
      const dLower = t.dueDate.trim().toLowerCase();
      if (dLower === 'today') return isSameLocalDate(selectedDate, today);
      if (dLower === 'tomorrow') {
        const tom = new Date(today);
        tom.setDate(today.getDate() + 1);
        return isSameLocalDate(selectedDate, tom);
      }
      const parsed = new Date(t.dueDate);
      if (!isNaN(parsed.getTime())) {
        return isSameLocalDate(parsed, selectedDate);
      }
      return isSameLocalDate(selectedDate, today);
    });
  }, [categorizedTasks, activeTab, filterByDate, selectedDate, today]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Reschedule Task Action
  const handleReschedule = async (newDueDate: string) => {
    if (!rescheduleTask) return;
    try {
      await StorageService.updateTask(rescheduleTask.id, { dueDate: newDueDate });
      await supabaseDataService.updateTask(rescheduleTask.id, { dueDate: newDueDate }).catch(() => null);
      // Toggle task back in state if needed or re-sync
      const target = tasks.find((t) => t.id === rescheduleTask.id);
      if (target) {
        target.dueDate = newDueDate;
      }
      setRescheduleTask(null);
      Alert.alert('Rescheduled', `Task rescheduled to ${newDueDate}.`);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reschedule task.');
    }
  };

  // Edit Task Action
  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditCategory(task.category);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || 'Today');
  };

  const handleSaveEdit = async () => {
    if (!editingTask) return;
    const trimmed = editTitle.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Task title cannot be empty.');
      return;
    }

    try {
      await StorageService.updateTask(editingTask.id, {
        title: trimmed,
        category: editCategory,
        priority: editPriority,
        dueDate: editDueDate,
      });
      await supabaseDataService.updateTask(editingTask.id, {
        title: trimmed,
        category: editCategory,
        priority: editPriority,
        dueDate: editDueDate,
      }).catch(() => null);

      editingTask.title = trimmed;
      editingTask.category = editCategory;
      editingTask.priority = editPriority;
      editingTask.dueDate = editDueDate;

      setEditingTask(null);
      Alert.alert('Saved', 'Task details updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save task.');
    }
  };

  const handleDelete = (id: string) => {
    const target = tasks.find((t) => t.id === id);
    Alert.alert(
      'Delete Task',
      `Delete "${target?.title || 'this task'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(id);
          },
        },
      ]
    );
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + 8 }]}>
        {/* Header */}
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
            <Text style={styles.headerTitle}>Tasks & Planning</Text>
            <Text style={styles.headerSub}>
              {completedCount} of {totalCount} completed ({progressPercent}%)
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* 7-Day Date Scrubber */}
        <View style={styles.dateStripContainer}>
          <View style={styles.dateStripHeader}>
            <Text style={styles.dateStripTitle}>
              {selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
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
              const isSelected = isSameLocalDate(item, selectedDate);
              const isTodayItem = isSameLocalDate(item, today);

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

        {/* Organized Tabs: Today | Upcoming | Overdue | Completed | All */}
        <View style={styles.tabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            {(['today', 'upcoming', 'overdue', 'completed', 'all'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              const label =
                tab === 'today'
                  ? 'Today'
                  : tab === 'upcoming'
                  ? 'Upcoming'
                  : tab === 'overdue'
                  ? 'Overdue'
                  : tab === 'completed'
                  ? 'Completed'
                  : 'All';

              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.8}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${label} tasks`}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {label}
                  </Text>
                  <View
                    style={[
                      styles.tabBadge,
                      isActive && styles.tabBadgeActive,
                      tab === 'overdue' && count > 0 && styles.tabBadgeOverdue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        isActive && styles.tabBadgeTextActive,
                        tab === 'overdue' && count > 0 && { color: '#EF4444' },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tasks List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listScroll, { paddingBottom: insets.bottom + 90 }]}
        >
          {displayedTasks.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Ionicons name="checkbox-outline" size={36} color="#64748B" />
              <Text style={styles.emptyTitle}>No Tasks Found</Text>
              <Text style={styles.emptySub}>
                {filterByDate
                  ? 'No tasks scheduled for this selected date.'
                  : activeTab === 'overdue'
                  ? 'All caught up! Zero overdue tasks.'
                  : activeTab === 'completed'
                  ? 'No completed tasks in this view.'
                  : 'No tasks scheduled. Tap the + button to add one.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => navigation.navigate('CreateTask')}
                accessibilityRole="button"
                accessibilityLabel="Create task"
              >
                <Ionicons name="add" size={16} color="#050814" />
                <Text style={styles.emptyActionBtnText}>Create Task</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            displayedTasks.map((task) => {
              const isCompleted = task.completed;
              const priorityColor =
                task.priority === 'high'
                  ? '#EF4444'
                  : task.priority === 'low'
                  ? '#00E5FF'
                  : '#F59E0B';

              return (
                <GlassCard
                  key={task.id}
                  style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
                >
                  <View style={styles.cardMainRow}>
                    {/* Completion Checkbox */}
                    <TouchableOpacity
                      onPress={() => toggleTask(task.id)}
                      style={[
                        styles.checkbox,
                        isCompleted && styles.checkboxCompleted,
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isCompleted }}
                      accessibilityLabel={`Toggle completion for ${task.title}`}
                    >
                      {isCompleted && (
                        <Ionicons name="checkmark" size={14} color="#050814" />
                      )}
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.cardContentCol}>
                      <Text
                        style={[
                          styles.cardTitle,
                          isCompleted && styles.cardTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>

                      <View style={styles.cardMetaRow}>
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>
                            {(task.category || 'work').toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.dueDateBadge}>
                          <Ionicons name="calendar-outline" size={11} color="#94A3B8" />
                          <Text style={styles.dueDateText}>
                            {task.dueDate || 'Today'}
                          </Text>
                        </View>

                        <View style={[styles.priorityBadge, { borderColor: `${priorityColor}50` }]}>
                          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                          <Text style={[styles.priorityText, { color: priorityColor }]}>
                            {task.priority ? task.priority.toUpperCase() : 'MEDIUM'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Actions Row: Reschedule, Edit, Delete */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => setRescheduleTask(task)}
                      accessibilityRole="button"
                      accessibilityLabel="Reschedule task"
                    >
                      <Ionicons name="time-outline" size={13} color="#00E5FF" />
                      <Text style={styles.cardActionBtnText}>Reschedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleOpenEdit(task)}
                      accessibilityRole="button"
                      accessibilityLabel="Edit task"
                    >
                      <Ionicons name="create-outline" size={13} color="#8B5CF6" />
                      <Text style={[styles.cardActionBtnText, { color: '#8B5CF6' }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleDelete(task.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete task"
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

        {/* Floating Plus Button (FAB) - Opens New Task directly */}
        <TouchableOpacity
          style={[styles.fabBtn, { bottom: Math.max(insets.bottom + 20, 24) }]}
          onPress={() => navigation.navigate('CreateTask')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create new task"
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

        {/* Reschedule Modal */}
        <Modal
          visible={!!rescheduleTask}
          animationType="fade"
          transparent
          onRequestClose={() => setRescheduleTask(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reschedule Task</Text>
                <TouchableOpacity
                  onPress={() => setRescheduleTask(null)}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close reschedule"
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTargetTitle} numberOfLines={2}>
                "{rescheduleTask?.title}"
              </Text>
              <Text style={styles.modalPrompt}>
                Rescheduling updates the due date in-place without duplicating:
              </Text>

              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => handleReschedule('Today')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule to Today"
                >
                  <Ionicons name="sunny-outline" size={18} color="#00E5FF" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.optionTitle}>Today</Text>
                    <Text style={styles.optionSub}>Due before end of day</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => handleReschedule('Tomorrow')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule to Tomorrow"
                >
                  <Ionicons name="calendar-outline" size={18} color="#8B5CF6" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.optionTitle}>Tomorrow</Text>
                    <Text style={styles.optionSub}>First priority tomorrow</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => handleReschedule('This Week')}
                  accessibilityRole="button"
                  accessibilityLabel="Reschedule to This Week"
                >
                  <Ionicons name="calendar-number-outline" size={18} color="#10B981" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.optionTitle}>This Week</Text>
                    <Text style={styles.optionSub}>Flexible weekly milestone</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Task Modal */}
        <Modal
          visible={!!editingTask}
          animationType="fade"
          transparent
          onRequestClose={() => setEditingTask(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Task</Text>
                <TouchableOpacity
                  onPress={() => setEditingTask(null)}
                  style={styles.modalCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Close edit"
                >
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>TASK TITLE</Text>
                <TextInput
                  style={styles.textInput}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Task title"
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.pillRow}>
                  {(['work', 'study', 'fitness', 'daily'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setEditCategory(cat)}
                      style={[
                        styles.selectorPill,
                        editCategory === cat && styles.selectorPillActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select category ${cat}`}
                    >
                      <Text
                        style={[
                          styles.selectorPillText,
                          editCategory === cat && styles.selectorPillTextActive,
                        ]}
                      >
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>PRIORITY</Text>
                <View style={styles.pillRow}>
                  {(['low', 'medium', 'high'] as const).map((pri) => (
                    <TouchableOpacity
                      key={pri}
                      onPress={() => setEditPriority(pri)}
                      style={[
                        styles.selectorPill,
                        editPriority === pri && styles.selectorPillActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select priority ${pri}`}
                    >
                      <Text
                        style={[
                          styles.selectorPillText,
                          editPriority === pri && styles.selectorPillTextActive,
                        ]}
                      >
                        {pri.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>DUE HORIZON</Text>
                <View style={styles.pillRow}>
                  {['Today', 'Tomorrow', 'This Week'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => setEditDueDate(d)}
                      style={[
                        styles.selectorPill,
                        editDueDate === d && styles.selectorPillActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select due ${d}`}
                    >
                      <Text
                        style={[
                          styles.selectorPillText,
                          editDueDate === d && styles.selectorPillTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={styles.submitBtn}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Save task changes"
                >
                  <LinearGradient
                    colors={['#00E5FF', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#050814" />
                    <Text style={styles.submitBtnText}>Update Task</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
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
  tabsWrapper: {
    height: 50,
    marginVertical: 4,
  },
  tabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 36,
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
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.25)',
  },
  tabBadgeOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
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
  taskCard: {
    marginBottom: 10,
    padding: 14,
    backgroundColor: 'rgba(11, 18, 38, 0.78)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  taskCardCompleted: {
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.5,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dueDateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  modalTargetTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalPrompt: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  optionSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
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
  submitBtn: {
    marginTop: 18,
    marginBottom: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  submitBtnText: {
    color: '#050814',
    fontSize: 14,
    fontWeight: '800',
  },
});

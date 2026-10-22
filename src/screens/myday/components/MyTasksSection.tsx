import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../../../services/storage';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

export type TaskFilterType = 'all' | 'pending' | 'completed';

interface MyTasksSectionProps {
  tasks: TaskItem[];
  onToggleTask: (id: string) => void;
  onOpenEditTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onAddNewTask: () => void;
  onViewAll?: () => void;
  isCompactPreview?: boolean;
}

export const MyTasksSection: React.FC<MyTasksSectionProps> = ({
  tasks,
  onToggleTask,
  onOpenEditTask,
  onDeleteTask,
  onAddNewTask,
  onViewAll,
  isCompactPreview = false,
}) => {
  const [filter, setFilter] = useState<TaskFilterType>('all');

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={{ flex: 1, marginRight: 8 }}
          activeOpacity={isCompactPreview ? 0.7 : 1}
          onPress={isCompactPreview ? onViewAll : undefined}
          disabled={!isCompactPreview || !onViewAll}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Ionicons name="checkbox" size={17} color={NatureTheme.colors.cyan} />
            <Text style={styles.sectionTitle}>Priority Tasks</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Actionable focus goals & daily milestones</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {onViewAll && (
            <TouchableOpacity
              onPress={onViewAll}
              style={styles.viewAllBtn}
              accessibilityRole="button"
              accessibilityLabel="View all tasks in Planner"
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Ionicons name="arrow-forward" size={13} color={NatureTheme.colors.sage} />
            </TouchableOpacity>
          )}
          {!isCompactPreview && (
            <TouchableOpacity
              onPress={onAddNewTask}
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Add new priority task"
            >
              <Ionicons name="add" size={16} color={NatureTheme.colors.background} />
              <Text style={styles.addBtnText}>+ Add Task</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs (Full Mode only) */}
      {!isCompactPreview && (
        <View style={styles.filterRow}>
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab;
            const count =
              tab === 'all'
                ? tasks.length
                : tab === 'pending'
                ? tasks.filter((t) => !t.completed).length
                : tasks.filter((t) => t.completed).length;

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setFilter(tab)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${tab} tasks`}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Empty State */}
      {(isCompactPreview ? tasks.slice(0, 3) : filteredTasks).length === 0 ? (
        <NatureGlassCard style={styles.emptyTasksCard}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={32}
            color={NatureTheme.colors.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyTasksTitle}>No Priority Tasks Scheduled</Text>
          <Text style={styles.emptyTasksSubtitle}>
            {filter === 'completed'
              ? 'No tasks completed yet. Complete your first goal to see it here!'
              : filter === 'pending'
              ? 'All clear! Every scheduled priority has been completed.'
              : 'No tasks scheduled for this date.'}
          </Text>
          {tasks.length === 0 && (
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={onViewAll || onAddNewTask}
              accessibilityRole="button"
              accessibilityLabel="Add your first priority task"
            >
              <Ionicons name="add" size={15} color={NatureTheme.colors.cyan} />
              <Text style={styles.emptyActionText}>+ Add Task</Text>
            </TouchableOpacity>
          )}
        </NatureGlassCard>
      ) : (
        /* Tasks List */
        <View style={styles.tasksList}>
          {(isCompactPreview ? tasks.slice(0, 3) : filteredTasks).map((task) => {
            const isCompleted = task.completed;
            const priorityColor =
              task.priority === 'high'
                ? NatureTheme.colors.statusHighPriority
                : task.priority === 'low'
                ? NatureTheme.colors.statusLowPriority
                : NatureTheme.colors.statusMedPriority;

            return (
              <NatureGlassCard
                key={task.id}
                style={[styles.taskCard, isCompleted && styles.taskCardCompleted]}
              >
                <View style={styles.taskCardRow}>
                  {/* Left Checkbox */}
                  <TouchableOpacity
                    style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                    onPress={() => onToggleTask(task.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isCompleted }}
                    accessibilityLabel={`Toggle completion for ${task.title}`}
                  >
                    {isCompleted && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={NatureTheme.colors.background}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Task Content (Tap to edit) */}
                  <TouchableOpacity
                    style={styles.taskInfo}
                    activeOpacity={0.7}
                    onPress={() => onOpenEditTask(task)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit task ${task.title}`}
                  >
                    <Text
                      style={[styles.taskTitle, isCompleted && styles.taskTitleCompleted]}
                    >
                      {task.title}
                    </Text>

                    <View style={styles.taskMetaRow}>
                      <View style={styles.categoryPill}>
                        <Text style={styles.categoryText}>
                          {(task.category || 'work').toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.priorityPill}>
                        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                        <Text style={[styles.priorityText, { color: priorityColor }]}>
                          {(task.priority || 'medium').toUpperCase()}
                        </Text>
                      </View>

                      {task.dueDate ? (
                        <View style={styles.dueDateRow}>
                          <Ionicons
                            name="calendar-outline"
                            size={11}
                            color={NatureTheme.colors.textMuted}
                          />
                          <Text style={styles.dueDateText}>{task.dueDate}</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>

                  {/* Right Actions */}
                  <View style={styles.actionsCol}>
                    <TouchableOpacity
                      onPress={() => onOpenEditTask(task)}
                      style={styles.actionBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit task ${task.title}`}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={15}
                        color={NatureTheme.colors.textSecondary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => onDeleteTask(task.id)}
                      style={[styles.actionBtn, styles.deleteBtn]}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete task ${task.title}`}
                    >
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </NatureGlassCard>
            );
          })}

          {isCompactPreview && tasks.length > 2 && (
            <TouchableOpacity
              style={styles.moreFooterBtn}
              onPress={onViewAll || onAddNewTask}
              accessibilityRole="button"
              accessibilityLabel={`View all ${tasks.length} tasks`}
            >
              <Text style={styles.moreFooterText}>
                View all {tasks.length} tasks
              </Text>
              <Ionicons name="chevron-forward" size={14} color={NatureTheme.colors.sage} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: NatureTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  viewAllBtnText: {
    color: NatureTheme.colors.sage,
    fontSize: 12,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: NatureTheme.colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: NatureTheme.borderRadius.full,
  },
  addBtnText: {
    color: NatureTheme.colors.background,
    fontSize: 12,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: NatureTheme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: NatureTheme.colors.emerald,
  },
  filterText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  filterTextActive: {
    color: NatureTheme.colors.sage,
    fontWeight: '800',
  },
  emptyTasksCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  emptyTasksTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyTasksSubtitle: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  tasksList: {
    gap: 10,
  },
  taskCard: {
    padding: 14,
  },
  taskCardCompleted: {
    opacity: 0.65,
    backgroundColor: 'rgba(6, 20, 14, 0.55)',
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: NatureTheme.colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: NatureTheme.colors.emerald,
    borderColor: NatureTheme.colors.emerald,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: NatureTheme.colors.textMuted,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
  },
  priorityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDateText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 10,
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  moreFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    gap: 6,
  },
  moreFooterText: {
    color: NatureTheme.colors.sage,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  emptyActionText: {
    color: NatureTheme.colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  },
});

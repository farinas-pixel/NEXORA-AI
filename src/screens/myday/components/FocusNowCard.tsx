import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../../../services/storage';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

interface FocusNowCardProps {
  task: TaskItem | null;
  onStartFocus: (taskTitle: string) => void;
  onToggleComplete: (id: string) => void;
  onEditTask: (task: TaskItem) => void;
  onQuickAddTask: () => void;
}

export const FocusNowCard: React.FC<FocusNowCardProps> = ({
  task,
  onStartFocus,
  onToggleComplete,
  onEditTask,
  onQuickAddTask,
}) => {
  if (!task) {
    return (
      <NatureGlassCard style={styles.card}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="sparkles" size={24} color={NatureTheme.colors.sage} />
          </View>
          <Text style={styles.emptyTitle}>Clear Focus Horizon</Text>
          <Text style={styles.emptySubtitle}>
            All pending tasks are accomplished or no priorities scheduled yet today.
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={onQuickAddTask}
            accessibilityRole="button"
            accessibilityLabel="Add next priority task"
          >
            <Ionicons name="add" size={16} color={NatureTheme.colors.background} />
            <Text style={styles.emptyActionBtnText}>Add Next Priority</Text>
          </TouchableOpacity>
        </View>
      </NatureGlassCard>
    );
  }

  const priorityColor =
    task.priority === 'high'
      ? NatureTheme.colors.statusHighPriority
      : task.priority === 'low'
      ? NatureTheme.colors.statusLowPriority
      : NatureTheme.colors.statusMedPriority;

  const priorityBg =
    task.priority === 'high'
      ? NatureTheme.colors.statusHighPriorityBg
      : task.priority === 'low'
      ? NatureTheme.colors.statusLowPriorityBg
      : NatureTheme.colors.statusMedPriorityBg;

  return (
    <NatureGlassCard style={styles.card} glowColor={NatureTheme.colors.emerald}>
      {/* Eyebrow Label */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <Ionicons name="compass-outline" size={15} color={NatureTheme.colors.sage} />
          <Text style={styles.badgeText}>FOCUS NOW • TOP PRIORITY</Text>
        </View>

        <View style={[styles.priorityPill, { backgroundColor: priorityBg }]}>
          <Text style={[styles.priorityPillText, { color: priorityColor }]}>
            {(task.priority || 'medium').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Task Title */}
      <Text style={styles.taskTitle}>{task.title}</Text>

      {/* Metadata Row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="folder-outline" size={13} color={NatureTheme.colors.textMuted} />
          <Text style={styles.metaText}>{(task.category || 'work').toUpperCase()}</Text>
        </View>

        {task.dueDate ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={NatureTheme.colors.gold} />
            <Text style={[styles.metaText, { color: NatureTheme.colors.goldLight }]}>
              {task.dueDate}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.focusActionBtn}
          onPress={() => onStartFocus(task.title)}
          accessibilityRole="button"
          accessibilityLabel={`Start LifeBloom focus on ${task.title}`}
        >
          <Ionicons name="leaf" size={16} color={NatureTheme.colors.background} />
          <Text style={styles.focusActionBtnText}>Focus with LifeBloom</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => onToggleComplete(task.id)}
          accessibilityRole="button"
          accessibilityLabel="Mark task as completed"
        >
          <Ionicons name="checkmark" size={18} color={NatureTheme.colors.emerald} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => onEditTask(task)}
          accessibilityRole="button"
          accessibilityLabel="Edit or reschedule task"
        >
          <Ionicons name="pencil-outline" size={16} color={NatureTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </NatureGlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 18,
    borderColor: 'rgba(52, 211, 153, 0.32)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    color: NatureTheme.colors.sage,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: NatureTheme.borderRadius.full,
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  taskTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  focusActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: NatureTheme.colors.emerald,
    paddingVertical: 12,
    borderRadius: NatureTheme.borderRadius.md,
  },
  focusActionBtnText: {
    color: NatureTheme.colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
  completeBtn: {
    width: 44,
    height: 44,
    borderRadius: NatureTheme.borderRadius.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 44,
    height: 44,
    borderRadius: NatureTheme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: NatureTheme.colors.emerald,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: NatureTheme.borderRadius.full,
  },
  emptyActionBtnText: {
    color: NatureTheme.colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReminderItem } from '../../../services/reminders/reminderService';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

export type ReminderFilterType = 'all' | 'morning' | 'evening' | 'night' | 'pinned';

interface RemindersSectionProps {
  reminders: ReminderItem[];
  missedReminders: ReminderItem[];
  followUpReminder: ReminderItem | null;
  onToggleReminder: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSnooze: (id: string, mins: number) => void;
  onOpenEdit: (rem: ReminderItem) => void;
  onDeleteReminder: (id: string) => void;
  onStartRelaxation: (title: string, mins: number) => void;
  onRescheduleMissed: (id: string) => void;
  onDismissMissed: (id: string) => void;
  onFollowUpAction: (action: 'complete' | 'reschedule' | 'snooze' | 'delete') => void;
  onAddNewReminder: () => void;
  onViewAll?: () => void;
  isCompactPreview?: boolean;
}

export const RemindersSection: React.FC<RemindersSectionProps> = ({
  reminders,
  missedReminders,
  followUpReminder,
  onToggleReminder,
  onTogglePin,
  onSnooze,
  onOpenEdit,
  onDeleteReminder,
  onStartRelaxation,
  onRescheduleMissed,
  onDismissMissed,
  onFollowUpAction,
  onAddNewReminder,
  onViewAll,
  isCompactPreview = false,
}) => {
  const [filter, setFilter] = useState<ReminderFilterType>('all');

  const filtered = reminders.filter((r) => {
    if (filter === 'pinned') return !!r.isPinned;
    if (filter === 'all') return true;
    const hour = new Date(r.dueTime).getHours();
    if (filter === 'morning') return hour >= 5 && hour < 12;
    if (filter === 'evening') return hour >= 12 && hour < 20;
    if (filter === 'night') return hour >= 20 || hour < 5;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Missed Reminder Banner */}
      {missedReminders.length > 0 && (
        <NatureGlassCard
          style={styles.missedCard}
          borderColor="rgba(239, 68, 68, 0.45)"
          glowColor="#EF4444"
        >
          <View style={styles.missedHeader}>
            <View style={styles.missedIconCircle}>
              <Ionicons name="warning" size={18} color="#EF4444" />
            </View>
            <View style={styles.missedInfo}>
              <Text style={styles.missedTitle}>Missed Alarm Detected</Text>
              <Text style={styles.missedSubtitle} numberOfLines={2}>
                "{missedReminders[0].title}" was scheduled for{' '}
                {new Date(missedReminders[0].dueTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
          <View style={styles.missedActions}>
            <TouchableOpacity
              style={styles.rescheduleBtn}
              onPress={() => onRescheduleMissed(missedReminders[0].id)}
              accessibilityRole="button"
              accessibilityLabel="Reschedule missed reminder by 30 minutes"
            >
              <Ionicons name="time-outline" size={13} color="#FFFFFF" />
              <Text style={styles.rescheduleBtnText}>Reschedule (+30m)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissBtn}
              onPress={() => onDismissMissed(missedReminders[0].id)}
              accessibilityRole="button"
              accessibilityLabel="Dismiss missed reminder"
            >
              <Text style={styles.dismissBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </NatureGlassCard>
      )}

      {/* Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={{ flex: 1, marginRight: 8 }}
          activeOpacity={isCompactPreview ? 0.7 : 1}
          onPress={isCompactPreview ? onViewAll : undefined}
          disabled={!isCompactPreview || !onViewAll}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Ionicons name="notifications" size={17} color={NatureTheme.colors.cyan} />
            <Text style={styles.sectionTitle}>Today's Reminders</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Time-critical alerts & scheduled notifications</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          {onViewAll && (
            <TouchableOpacity
              onPress={onViewAll}
              style={styles.viewAllBtn}
              accessibilityRole="button"
              accessibilityLabel="View all reminders in Calendar"
            >
              <Text style={styles.viewAllBtnText}>View All</Text>
              <Ionicons name="arrow-forward" size={13} color={NatureTheme.colors.sage} />
            </TouchableOpacity>
          )}
          {!isCompactPreview && (
            <TouchableOpacity
              onPress={onAddNewReminder}
              style={styles.addBtn}
              accessibilityRole="button"
              accessibilityLabel="Add new reminder"
            >
              <Ionicons name="alarm" size={16} color={NatureTheme.colors.background} />
              <Text style={styles.addBtnText}>+ Reminder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Scrubber (Full Mode only) */}
      {!isCompactPreview && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['all', 'morning', 'evening', 'night', 'pinned'] as const).map((tab) => {
            const isSelected = filter === tab;
            const label =
              tab === 'all'
                ? 'All'
                : tab === 'morning'
                ? 'Morning (5AM-12PM)'
                : tab === 'evening'
                ? 'Evening (12PM-8PM)'
                : tab === 'night'
                ? 'Night (8PM-5AM)'
                : '⭐ Pinned';

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setFilter(tab)}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                accessibilityRole="button"
                accessibilityLabel={`Filter ${label}`}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Reminders List */}
      {(isCompactPreview ? reminders.slice(0, 3) : filtered).length === 0 ? (
        <NatureGlassCard style={styles.emptyCard}>
          <Ionicons
            name="notifications-outline"
            size={28}
            color={NatureTheme.colors.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>
            {filter === 'pinned'
              ? 'No pinned reminders. Tap the star on any reminder to pin.'
              : reminders.length === 0
              ? 'No reminders scheduled for this date.'
              : `No ${filter} reminders scheduled.`}
          </Text>
          {reminders.length === 0 && (
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={onViewAll || onAddNewReminder}
              accessibilityRole="button"
              accessibilityLabel="Add your first reminder"
            >
              <Ionicons name="alarm-outline" size={14} color={NatureTheme.colors.cyan} />
              <Text style={styles.emptyActionText}>+ Add Reminder</Text>
            </TouchableOpacity>
          )}
        </NatureGlassCard>
      ) : (
        <View style={styles.list}>
          {(isCompactPreview ? reminders.slice(0, 3) : filtered).map((rem) => {
            const isCompleted = rem.status === 'completed';
            const isMissed = rem.status === 'missed';
            const isSnoozed = rem.status === 'snoozed';
            const isPinned = !!rem.isPinned;

            return (
              <NatureGlassCard
                key={rem.id}
                style={[styles.reminderCard, isPinned && styles.pinnedReminderCard]}
              >
                <View style={styles.mainRow}>
                  {/* Left Checkbox */}
                  <TouchableOpacity
                    style={[styles.checkbox, isCompleted && styles.checkboxCompleted]}
                    onPress={() => onToggleReminder(rem.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isCompleted }}
                    accessibilityLabel={`Toggle completion for ${rem.title}`}
                  >
                    {isCompleted && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={NatureTheme.colors.background}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Content (Tap to edit) */}
                  <TouchableOpacity
                    style={styles.infoCol}
                    activeOpacity={0.7}
                    onPress={() => onOpenEdit(rem)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit reminder ${rem.title}`}
                  >
                    <View style={styles.titleRow}>
                      {isPinned && (
                        <Ionicons
                          name="star"
                          size={14}
                          color={NatureTheme.colors.gold}
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={[styles.reminderTitle, isCompleted && styles.titleCompleted]}
                        numberOfLines={2}
                      >
                        {rem.title}
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Ionicons
                        name="time-outline"
                        size={12}
                        color={NatureTheme.colors.textMuted}
                      />
                      <Text style={styles.metaTime}>
                        {new Date(rem.dueTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • Category: {rem.category}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted
                        ? styles.statusCompletedBadge
                        : isMissed
                        ? styles.statusMissedBadge
                        : isSnoozed
                        ? styles.statusSnoozedBadge
                        : styles.statusUpcomingBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isCompleted
                          ? styles.statusCompletedText
                          : isMissed
                          ? styles.statusMissedText
                          : isSnoozed
                          ? styles.statusSnoozedText
                          : styles.statusUpcomingText,
                      ]}
                    >
                      {isCompleted
                        ? 'Completed'
                        : isMissed
                        ? 'Missed'
                        : isSnoozed
                        ? 'Snoozed'
                        : 'Upcoming'}
                    </Text>
                  </View>
                </View>

                {/* Secondary Action Controls */}
                {!isCompactPreview && (
                  <View style={styles.actionsBar}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onTogglePin(rem.id)}
                      accessibilityRole="button"
                      accessibilityLabel={isPinned ? 'Unpin reminder' : 'Pin reminder'}
                    >
                      <Ionicons
                        name={isPinned ? 'star' : 'star-outline'}
                        size={13}
                        color={isPinned ? NatureTheme.colors.gold : NatureTheme.colors.textSecondary}
                      />
                      <Text style={styles.actionBtnText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onOpenEdit(rem)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit reminder ${rem.title}`}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={13}
                        color={NatureTheme.colors.textSecondary}
                      />
                      <Text style={styles.actionBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onSnooze(rem.id, 10)}
                      accessibilityRole="button"
                      accessibilityLabel="Snooze for 10 minutes"
                    >
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={NatureTheme.colors.textSecondary}
                      />
                      <Text style={styles.actionBtnText}>Snooze 10m</Text>
                    </TouchableOpacity>

                    {rem.relaxationMinutes && rem.relaxationMinutes > 0 ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.relaxBtn]}
                        onPress={() => onStartRelaxation(rem.title, rem.relaxationMinutes!)}
                        accessibilityRole="button"
                        accessibilityLabel={`Start ${rem.relaxationMinutes}m relaxation session`}
                      >
                        <Ionicons name="leaf-outline" size={13} color={NatureTheme.colors.sage} />
                        <Text style={styles.relaxBtnText}>Relax {rem.relaxationMinutes}m</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => onDeleteReminder(rem.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete reminder ${rem.title}`}
                    >
                      <Ionicons name="trash-outline" size={13} color="#EF4444" />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </NatureGlassCard>
            );
          })}

          {isCompactPreview && reminders.length > 2 && (
            <TouchableOpacity
              style={styles.moreFooterBtn}
              onPress={onViewAll || onAddNewReminder}
              accessibilityRole="button"
              accessibilityLabel={`View all ${reminders.length} reminders`}
            >
              <Text style={styles.moreFooterText}>
                View all {reminders.length} reminders
              </Text>
              <Ionicons name="chevron-forward" size={13} color={NatureTheme.colors.sage} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 1-Hour Overdue Follow-up Modal Card */}
      {followUpReminder && (
        <NatureGlassCard
          style={styles.followUpCard}
          borderColor="rgba(245, 158, 11, 0.45)"
          glowColor={NatureTheme.colors.gold}
        >
          <View style={styles.followUpHeader}>
            <Ionicons name="alarm-outline" size={24} color={NatureTheme.colors.gold} />
            <View style={styles.followUpInfo}>
              <Text style={styles.followUpTitle}>Reminder Follow-up</Text>
              <Text style={styles.followUpDesc}>
                "{followUpReminder.title}" was scheduled over an hour ago. What would you like to
                do?
              </Text>
            </View>
          </View>
          <View style={styles.followUpActions}>
            <TouchableOpacity
              style={styles.followUpDoneBtn}
              onPress={() => onFollowUpAction('complete')}
            >
              <Text style={styles.followUpDoneText}>Mark Completed</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.followUpReschedBtn}
              onPress={() => onFollowUpAction('reschedule')}
            >
              <Text style={styles.followUpReschedText}>Reschedule +1h</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.followUpSnoozeBtn}
              onPress={() => onFollowUpAction('snooze')}
            >
              <Text style={styles.followUpSnoozeText}>Snooze 15m</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.followUpDeleteBtn}
              onPress={() => onFollowUpAction('delete')}
            >
              <Text style={styles.followUpDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </NatureGlassCard>
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
  filterScroll: {
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
  missedCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 14,
    marginBottom: 14,
  },
  missedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missedInfo: {
    flex: 1,
  },
  missedTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  missedSubtitle: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  missedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: NatureTheme.borderRadius.sm,
  },
  rescheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  dismissBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: NatureTheme.borderRadius.sm,
  },
  dismissBtnText: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 11,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: 6,
  },
  emptyText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  reminderCard: {
    padding: 14,
  },
  pinnedReminderCard: {
    borderColor: 'rgba(245, 158, 11, 0.45)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  mainRow: {
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
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: NatureTheme.colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  metaTime: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: NatureTheme.borderRadius.sm,
    borderWidth: 1,
  },
  statusCompletedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusMissedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  statusSnoozedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusUpcomingBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusCompletedText: { color: NatureTheme.colors.emerald },
  statusMissedText: { color: '#EF4444' },
  statusSnoozedText: { color: '#F59E0B' },
  statusUpcomingText: { color: NatureTheme.colors.sage },
  actionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  actionBtnText: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  relaxBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  relaxBtnText: {
    color: NatureTheme.colors.sage,
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  deleteBtnText: {
    color: '#FCA5A5',
    fontSize: 10,
  },
  followUpCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    padding: 14,
    marginTop: 14,
  },
  followUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  followUpInfo: {
    flex: 1,
  },
  followUpTitle: {
    color: NatureTheme.colors.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  followUpDesc: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  followUpActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  followUpDoneBtn: {
    backgroundColor: NatureTheme.colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  followUpDoneText: {
    color: NatureTheme.colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  followUpReschedBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  followUpReschedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  followUpSnoozeBtn: {
    backgroundColor: NatureTheme.colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  followUpSnoozeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '700',
  },
  followUpDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  followUpDeleteText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: 10,
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

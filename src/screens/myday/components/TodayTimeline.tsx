import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../../../services/storage';
import { ReminderItem } from '../../../services/reminders/reminderService';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

export interface TimelineItem {
  id: string;
  type: 'task' | 'reminder';
  title: string;
  timeLabel: string;
  rawTime: number;
  completed: boolean;
  isOverdue: boolean;
  priority?: string;
  category?: string;
  originalItem: TaskItem | ReminderItem;
}

interface TodayTimelineProps {
  items: TimelineItem[];
  onToggleItem: (id: string, type: 'task' | 'reminder') => void;
  onEditItem: (item: TimelineItem) => void;
}

export const TodayTimeline: React.FC<TodayTimelineProps> = ({
  items,
  onToggleItem,
  onEditItem,
}) => {
  if (items.length === 0) {
    return (
      <NatureGlassCard style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Today's Timeline</Text>
          <Ionicons name="time-outline" size={18} color={NatureTheme.colors.sage} />
        </View>
        <View style={styles.emptyBox}>
          <Ionicons name="calendar-outline" size={28} color={NatureTheme.colors.textMuted} />
          <Text style={styles.emptyText}>No timed events or scheduled blocks for this day.</Text>
        </View>
      </NatureGlassCard>
    );
  }

  // Sort chronologically
  const sorted = [...items].sort((a, b) => a.rawTime - b.rawTime);

  return (
    <NatureGlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionTitle}>Today's Rhythm Timeline</Text>
          <Text style={styles.sectionSubtitle}>Chronological harmony of scheduled tasks & alarms</Text>
        </View>
        <Ionicons name="trail-sign-outline" size={18} color={NatureTheme.colors.sage} />
      </View>

      <View style={styles.timelineList}>
        {sorted.map((item, idx) => {
          const isLast = idx === sorted.length - 1;

          return (
            <View key={`${item.type}-${item.id}`} style={styles.timelineRow}>
              {/* Left Column: Time & Node */}
              <View style={styles.leftCol}>
                <Text style={styles.timeText}>{item.timeLabel}</Text>
                <View
                  style={[
                    styles.nodeDot,
                    item.completed && styles.nodeDotCompleted,
                    item.isOverdue && !item.completed && styles.nodeDotOverdue,
                  ]}
                >
                  <Ionicons
                    name={
                      item.completed
                        ? 'checkmark'
                        : item.isOverdue
                        ? 'warning'
                        : item.type === 'reminder'
                        ? 'alarm'
                        : 'ellipse'
                    }
                    size={item.completed ? 10 : 9}
                    color={
                      item.completed
                        ? NatureTheme.colors.background
                        : item.isOverdue
                        ? '#EF4444'
                        : NatureTheme.colors.emerald
                    }
                  />
                </View>
                {!isLast && <View style={styles.verticalTrack} />}
              </View>

              {/* Right Content Card */}
              <TouchableOpacity
                onPress={() => onEditItem(item)}
                style={[
                  styles.itemCard,
                  item.completed && styles.itemCardCompleted,
                  item.isOverdue && !item.completed && styles.itemCardOverdue,
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}, ${item.completed ? 'completed' : 'pending'}, ${item.timeLabel}`}
              >
                <View style={styles.itemHeaderRow}>
                  <View style={styles.typeBadge}>
                    <Ionicons
                      name={item.type === 'reminder' ? 'notifications-outline' : 'checkbox-outline'}
                      size={12}
                      color={NatureTheme.colors.sage}
                    />
                    <Text style={styles.typeBadgeText}>
                      {item.type.toUpperCase()}
                    </Text>
                  </View>

                  {/* Complete Checkbox */}
                  <TouchableOpacity
                    onPress={() => onToggleItem(item.id, item.type)}
                    style={[
                      styles.checkCircle,
                      item.completed && styles.checkCircleCompleted,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.completed }}
                    accessibilityLabel={`Toggle ${item.title}`}
                  >
                    {item.completed && (
                      <Ionicons name="checkmark" size={12} color={NatureTheme.colors.background} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text
                  style={[
                    styles.itemTitle,
                    item.completed && styles.itemTitleCompleted,
                  ]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                <View style={styles.itemMetaRow}>
                  {item.category && (
                    <Text style={styles.metaLabel}>• {item.category.toUpperCase()}</Text>
                  )}
                  {item.isOverdue && !item.completed && (
                    <Text style={styles.overdueLabel}>• Overdue</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </NatureGlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 12,
  },
  timelineList: {
    gap: 12,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  leftCol: {
    width: 68,
    alignItems: 'center',
    position: 'relative',
    paddingTop: 2,
  },
  timeText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  nodeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: NatureTheme.colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  nodeDotCompleted: {
    backgroundColor: NatureTheme.colors.emerald,
    borderColor: NatureTheme.colors.emerald,
  },
  nodeDotOverdue: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  verticalTrack: {
    position: 'absolute',
    top: 36,
    bottom: -18,
    width: 1.5,
    backgroundColor: 'rgba(0, 229, 255, 0.22)',
    zIndex: 1,
  },
  itemCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: NatureTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginLeft: 8,
  },
  itemCardCompleted: {
    opacity: 0.65,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  itemCardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typeBadgeText: {
    color: NatureTheme.colors.sage,
    fontSize: 9,
    fontWeight: '800',
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: NatureTheme.colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleCompleted: {
    backgroundColor: NatureTheme.colors.emerald,
  },
  itemTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: NatureTheme.colors.textMuted,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaLabel: {
    color: NatureTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  overdueLabel: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
});

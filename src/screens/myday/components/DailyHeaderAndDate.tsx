import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NatureTheme } from '../theme';

interface DailyHeaderAndDateProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  completedTasksCount: number;
  totalTasksCount: number;
  userName?: string;
  onResetToToday?: () => void;
}

export const DailyHeaderAndDate: React.FC<DailyHeaderAndDateProps> = ({
  selectedDate,
  onSelectDate,
  completedTasksCount,
  totalTasksCount,
  userName,
  onResetToToday,
}) => {
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good afternoon';
  else if (currentHour >= 17) greeting = 'Good evening';

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };
  const isCurrentToday = isSameDay(selectedDate, today);

  // Generate 7-day strip centered around selectedDate or today
  const daysStrip = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + idx);
    return d;
  });

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onSelectDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onSelectDate(next);
  };

  const handleReturnToday = () => {
    if (onResetToToday) onResetToToday();
    else onSelectDate(new Date());
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View style={styles.container}>
      {/* Top Greeting Row */}
      <View style={styles.topRow}>
        <View style={styles.greetingCol}>
          <View style={styles.brandRow}>
            <Ionicons name="sparkles" size={14} color={NatureTheme.colors.sage} />
            <Text style={styles.eyebrow}>MY DAY INTELLIGENCE</Text>
          </View>
          <Text style={styles.greetingTitle}>
            {greeting}{userName ? `, ${userName}` : ''}
          </Text>
          <View style={styles.dateRow}>
            <Text style={styles.dateSubtitle} numberOfLines={1}>
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            {!isCurrentToday && (
              <TouchableOpacity
                onPress={handleReturnToday}
                style={styles.returnTodayPill}
                accessibilityRole="button"
                accessibilityLabel="Return to Today"
              >
                <Ionicons name="calendar-outline" size={12} color={NatureTheme.colors.emerald} />
                <Text style={styles.returnTodayText}>Today</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Progress Counter Pill */}
        <View style={styles.counterBadge}>
          <Ionicons name="checkmark-done-circle" size={16} color={NatureTheme.colors.emerald} />
          <Text style={styles.counterText}>
            {completedTasksCount} / {totalTasksCount} done
          </Text>
        </View>
      </View>

      {/* Week Navigation & 7-Day Calendar Scrubber */}
      <View style={styles.scrubberRow}>
        <TouchableOpacity
          onPress={handlePrevDay}
          style={styles.navChevronBtn}
          accessibilityRole="button"
          accessibilityLabel="Previous day"
        >
          <Ionicons name="chevron-back" size={16} color={NatureTheme.colors.textMuted} />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripScroll}
        >
          {daysStrip.map((dayItem, idx) => {
            const isSelected = isSameDay(dayItem, selectedDate);
            const isTodayItem = isSameDay(dayItem, today);

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => onSelectDate(dayItem)}
                style={[
                  styles.dayChip,
                  isSelected && styles.dayChipSelected,
                  isTodayItem && !isSelected && styles.dayChipTodayBorder,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select date ${dayNames[dayItem.getDay()]} ${dayItem.getDate()}`}
              >
                <Text
                  style={[
                    styles.dayNameText,
                    isSelected && styles.dayNameTextSelected,
                  ]}
                >
                  {dayNames[dayItem.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.dayNumText,
                    isSelected && styles.dayNumTextSelected,
                  ]}
                >
                  {dayItem.getDate()}
                </Text>
                {isTodayItem && (
                  <View
                    style={[
                      styles.todayDot,
                      isSelected && { backgroundColor: NatureTheme.colors.background },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={handleNextDay}
          style={styles.navChevronBtn}
          accessibilityRole="button"
          accessibilityLabel="Next day"
        >
          <Ionicons name="chevron-forward" size={16} color={NatureTheme.colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  greetingCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  eyebrow: {
    color: NatureTheme.colors.sage,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  greetingTitle: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  dateSubtitle: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: NatureTheme.borderRadius.full,
    marginTop: 6,
  },
  counterText: {
    color: NatureTheme.colors.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  stripScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    paddingVertical: 8,
    borderRadius: NatureTheme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayChipSelected: {
    backgroundColor: NatureTheme.colors.emerald,
    borderColor: NatureTheme.colors.emerald,
  },
  dayChipTodayBorder: {
    borderColor: NatureTheme.colors.sage,
  },
  dayNameText: {
    color: NatureTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  dayNameTextSelected: {
    color: NatureTheme.colors.background,
    fontWeight: '700',
  },
  dayNumText: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  dayNumTextSelected: {
    color: NatureTheme.colors.background,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: NatureTheme.colors.sage,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  returnTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  returnTodayText: {
    color: NatureTheme.colors.emerald,
    fontSize: 11,
    fontWeight: '700',
  },
  scrubberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navChevronBtn: {
    width: 28,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

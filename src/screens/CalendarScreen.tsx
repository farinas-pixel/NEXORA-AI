import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface CalendarScreenProps {
  navigation: ScreenNavProp<'Calendar'>;
}

interface AgendaBlock {
  id: string;
  time: string;
  title: string;
  category: 'work' | 'study' | 'fitness' | 'daily';
  location?: string;
  completed: boolean;
}

const DEFAULT_AGENDA: AgendaBlock[] = [
  { id: 'ev1', time: '09:00 AM', title: 'Daily Cognitive Sync & Goal Brief', category: 'work', location: 'Virtual Hub', completed: true },
  { id: 'ev2', time: '11:30 AM', title: 'Calculus & Geometry Proofs', category: 'study', location: 'Study Desk', completed: false },
  { id: 'ev3', time: '02:00 PM', title: 'NEXORA Architecture & MCP Server Check', category: 'work', location: 'Local Dev Rig', completed: false },
  { id: 'ev4', time: '05:00 PM', title: 'HIIT Cardio & Stamina Tracking', category: 'fitness', location: 'Home Gym', completed: false },
  { id: 'ev5', time: '08:00 PM', title: 'Daily Reflection & Memory Vault Sync', category: 'daily', location: 'NEX Ambient Hub', completed: false },
];

const WEEK_DAYS = [
  { day: 'Sun', date: 4 },
  { day: 'Mon', date: 5 },
  { day: 'Tue', date: 6 },
  { day: 'Wed', date: 7 },
  { day: 'Thu', date: 8 },
  { day: 'Fri', date: 9 },
  { day: 'Sat', date: 10 },
];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { tasks } = useApp();
  const [selectedDate, setSelectedDate] = useState<number>(4);
  const [agenda, setAgenda] = useState<AgendaBlock[]>(DEFAULT_AGENDA);

  const toggleEventCompleted = (id: string) => {
    setAgenda((prev) =>
      prev.map((ev) => (ev.id === id ? { ...ev, completed: !ev.completed } : ev))
    );
  };

  const getCategoryColor = (category: AgendaBlock['category']) => {
    switch (category) {
      case 'study': return theme.colors.accent.primary;
      case 'work': return theme.colors.accent.secondary;
      case 'fitness': return '#00E676';
      default: return '#FFD700';
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
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>October 2026</Text>
            <Text style={styles.headerSub}>Cognitive Schedule & Timeline</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CreateTask')}
          >
            <Text style={styles.iconText}>+</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Week Date Strip */}
          <View style={styles.weekStrip}>
            {WEEK_DAYS.map((item) => {
              const isSelected = selectedDate === item.date;
              return (
                <TouchableOpacity
                  key={item.date}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(item.date)}
                  style={[
                    styles.datePill,
                    isSelected && styles.datePillActive,
                  ]}
                >
                  <Text style={[styles.dayLabel, isSelected && styles.dayLabelActive]}>
                    {item.day}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberActive]}>
                    {item.date}
                  </Text>
                  {isSelected && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Today Overview Card */}
          <GlassCard variant="highlight" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryTitle}>Sunday Focus</Text>
                <Text style={styles.summarySub}>
                  {agenda.filter((e) => e.completed).length} of {agenda.length} blocks completed
                </Text>
              </View>
              <StatusBadge label="Optimized" status="listening" />
            </View>
          </GlassCard>

          {/* Timeline Blocks */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Timeline Schedule</Text>
          </View>

          <View style={styles.timelineList}>
            {agenda.map((item) => {
              const catColor = getCategoryColor(item.category);
              return (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timeColumn}>
                    <Text style={styles.timeText}>{item.time}</Text>
                    <View style={[styles.timeIndicatorDot, { backgroundColor: catColor }]} />
                    <View style={styles.verticalLine} />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleEventCompleted(item.id)}
                    style={{ flex: 1 }}
                  >
                    <GlassCard
                      variant={item.completed ? 'default' : 'highlight'}
                      style={[styles.eventCard, item.completed && styles.eventCardCompleted]}
                    >
                      <View style={styles.eventRow}>
                        <View style={styles.eventInfo}>
                          <Text
                            style={[
                              styles.eventTitle,
                              item.completed && styles.eventTitleCompleted,
                            ]}
                          >
                            {item.title}
                          </Text>
                          {item.location ? (
                            <Text style={styles.eventLoc}>📍 {item.location}</Text>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.checkbox,
                            item.completed && styles.checkboxChecked,
                            { borderColor: catColor },
                          ]}
                        >
                          {item.completed && <Text style={styles.checkIcon}>✓</Text>}
                        </View>
                      </View>
                    </GlassCard>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Attached App Tasks */}
          {tasks.length > 0 && (
            <View style={styles.tasksSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sync'd Action Items ({tasks.length})</Text>
              </View>
              {tasks.slice(0, 3).map((t) => (
                <GlassCard key={t.id} style={styles.taskCard}>
                  <View style={styles.taskCardRow}>
                    <Text
                      style={[
                        styles.taskCardTitle,
                        t.completed && styles.eventTitleCompleted,
                      ]}
                    >
                      {t.title}
                    </Text>
                    <StatusBadge
                      label={t.category.toUpperCase()}
                      status={t.completed ? 'idle' : 'listening'}
                    />
                  </View>
                </GlassCard>
              ))}
            </View>
          )}
        </ScrollView>
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
    paddingBottom: theme.spacing.sm,
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
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  datePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    marginHorizontal: 3,
  },
  datePillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  dayLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
  },
  dayLabelActive: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: 4,
  },
  dateNumberActive: {
    color: theme.colors.accent.primary,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent.primary,
    marginTop: 4,
  },
  summaryCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  summarySub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineList: {
    marginBottom: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timeColumn: {
    width: 70,
    alignItems: 'center',
    paddingTop: 8,
  },
  timeText: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  timeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  verticalLine: {
    width: 1,
    flex: 1,
    minHeight: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  eventCard: {
    padding: theme.spacing.sm,
  },
  eventCardCompleted: {
    opacity: 0.6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  eventTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.muted,
  },
  eventLoc: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accent.primary,
  },
  checkIcon: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
  },
  tasksSection: {
    marginTop: theme.spacing.xs,
  },
  taskCard: {
    marginBottom: 8,
    padding: theme.spacing.sm,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskCardTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    flex: 1,
  },
});

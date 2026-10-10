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
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface PlanDashboardScreenProps {
  navigation: ScreenNavProp<'PlanDashboard'>;
}

export const PlanDashboardScreen: React.FC<PlanDashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { tasks, toggleTask, deleteTask, activeTab, setActiveTab } = useApp();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'work' | 'study' | 'fitness'>('all');

  const filteredTasks = tasks.filter((t) => {
    if (selectedFilter === 'all') return true;
    return t.category === selectedFilter;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleTabPress = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Memory') navigation.navigate('MemoryOverview');
    else if (tab === 'Profile') navigation.navigate('SecurityCenter');
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.sm }]}>
        {/* Header from Reference Screen 41 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Dashboard</Text>
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
          contentContainerStyle={styles.scrollContent}
        >
          {/* Progress Infographic Card */}
          <GlassCard variant="highlight" style={styles.progressCard}>
            <View style={styles.progressRow}>
              <View>
                <Text style={styles.progressLabel}>Today's Completion</Text>
                <Text style={styles.progressStat}>
                  {completedCount} of {totalCount} Completed
                </Text>
                <Text style={styles.progressSub}>Keep up your cognitive momentum!</Text>
              </View>
              <View style={styles.percentageCircle}>
                <Text style={styles.percentageText}>{progressPercent}%</Text>
              </View>
            </View>
          </GlassCard>

          {/* Category Filter Pills */}
          <View style={styles.filtersRow}>
            {(['all', 'work', 'study', 'fitness'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.75}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterPill,
                  selectedFilter === filter && styles.activeFilterPill,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === filter && styles.activeFilterText,
                  ]}
                >
                  {filter.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Interactive Task Checklist */}
          <View style={styles.taskList}>
            {filteredTasks.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.emptyText}>No tasks in this category.</Text>
              </GlassCard>
            ) : (
              filteredTasks.map((task) => (
                <GlassCard key={task.id} style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleTask(task.id)}
                      style={[
                        styles.checkbox,
                        task.completed && styles.checkboxActive,
                      ]}
                    >
                      {task.completed && <Text style={styles.checkMark}>✓</Text>}
                    </TouchableOpacity>

                    <View style={styles.taskInfo}>
                      <Text
                        style={[
                          styles.taskTitle,
                          task.completed && styles.taskTitleCompleted,
                        ]}
                      >
                        {task.title}
                      </Text>
                      <View style={styles.taskMetaRow}>
                        <StatusBadge
                          label={task.category}
                          status={task.priority === 'high' ? 'error' : 'info'}
                        />
                        <Text style={styles.taskTime}>
                          {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ''}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => deleteTask(task.id)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))
            )}
          </View>

          {/* Add Task Button */}
          <View style={styles.actionSection}>
            <GlassButton
              title="+ Add New Task"
              variant="secondary"
              onPress={() => navigation.navigate('CreateTask')}
            />
          </View>
        </ScrollView>

        {/* Bottom Navigation Dock */}
        <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
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
    paddingBottom: theme.spacing.md,
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
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 90,
  },
  progressCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressStat: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  progressSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  percentageCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  percentageText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  filterPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterPill: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  filterText: {
    fontSize: 11,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.medium,
  },
  activeFilterText: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  taskList: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  taskCard: {
    padding: theme.spacing.md,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.glass.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  checkboxActive: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#050814',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.tertiary,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  taskTime: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  deleteBtn: {
    padding: theme.spacing.xs,
  },
  deleteIcon: {
    fontSize: 16,
    color: theme.colors.text.tertiary,
  },
  emptyCard: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.sm,
  },
  actionSection: {
    marginBottom: theme.spacing.lg,
  },
});

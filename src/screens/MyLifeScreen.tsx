import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { NexAvatar } from '../components/avatar/NexAvatar';
import {
  StorageService,
  GoalItem,
  DecisionItem,
  TaskItem,
  StoredMemory,
} from '../services/storage';
import { ReminderService } from '../services/reminders/reminderService';
import { supabaseDataService } from '../services/backend/supabaseDataService';
import { BottomNavBar, TabName } from '../components/common/BottomNavBar';
import type { ScreenNavProp } from '../types/navigation';

interface MyLifeScreenProps {
  navigation: ScreenNavProp<'MyLife'>;
}

type LifeTab = 'goals' | 'planner' | 'progress' | 'decisions';

export const MyLifeScreen: React.FC<MyLifeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<LifeTab>('goals');
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [memories, setMemories] = useState<StoredMemory[]>([]);
  const [reminderCount, setReminderCount] = useState(0);

  // New Goal Inputs
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState<'career' | 'learning' | 'fitness' | 'finance'>('career');

  // New Decision Inputs
  const [isAddingDecision, setIsAddingDecision] = useState(false);
  const [newDecisionTitle, setNewDecisionTitle] = useState('');
  const [newDecisionOptionA, setNewDecisionOptionA] = useState('');
  const [newDecisionOptionB, setNewDecisionOptionB] = useState('');

  useEffect(() => {
    loadLifeData();
  }, []);

  const loadLifeData = async () => {
    try {
      const [gUser, gLocal, d, t, m, rems] = await Promise.all([
        supabaseDataService.fetchGoals().catch(() => []),
        StorageService.getGoals().catch(() => []),
        StorageService.getDecisions().catch(() => []),
        StorageService.getTasks().catch(() => []),
        StorageService.getMemories().catch(() => []),
        ReminderService.getReminders().catch(() => []),
      ]);

      const mergedGoals = [...gUser];
      for (const leg of gLocal) {
        if (!mergedGoals.some((g) => g.id === leg.id || g.title.toLowerCase() === leg.title.toLowerCase())) {
          mergedGoals.push(leg);
        }
      }

      setGoals(mergedGoals);
      setDecisions(d);
      setTasks(t);
      setMemories(m);
      setReminderCount(rems.length);
    } catch (e) {
      console.warn('Failed to load life data:', e);
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const updated = await StorageService.toggleMilestone(goalId, milestoneId);
    setGoals(updated);
  };

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  const handleDeleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to permanently delete this master goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await StorageService.deleteGoal(goalId);
            await supabaseDataService.deleteGoal(goalId).catch(() => null);
            setGoals(updated);
          },
        },
      ]
    );
  };

  const handleCreateGoal = async () => {
    const trimmed = newGoalTitle.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Please enter a goal title.');
      return;
    }
    if (editingGoalId) {
      const updated = await StorageService.updateGoal(editingGoalId, {
        title: trimmed,
        category: newGoalCategory,
      });
      await supabaseDataService.updateGoal(editingGoalId, {
        title: trimmed,
        category: newGoalCategory,
      }).catch(() => null);
      setGoals(updated);
      setEditingGoalId(null);
      setNewGoalTitle('');
      setIsAddingGoal(false);
      Alert.alert('Goal Updated', 'Goal changes have been saved.');
      return;
    }

    const newGoal: GoalItem = {
      id: `goal_${Date.now()}`,
      title: trimmed,
      category: newGoalCategory,
      deadline: '2026-12-31',
      progressPercent: 0,
      priority: 'high',
      milestones: [
        { id: `m1_${Date.now()}`, title: 'Initial research & roadmap setup', done: false },
        { id: `m2_${Date.now()}`, title: 'Implement foundation prototype', done: false },
        { id: `m3_${Date.now()}`, title: 'Verification and milestone delivery', done: false },
      ],
    };
    const saved = await StorageService.saveGoal(newGoal);
    await supabaseDataService.createGoal(newGoal).catch(() => null);
    setGoals((prev) => [saved, ...prev.filter((g) => g.id !== saved.id)]);
    setNewGoalTitle('');
    setIsAddingGoal(false);
    Alert.alert('Goal Created', 'New master goal created.');
  };

  const handleCreateDecision = async () => {
    if (!newDecisionTitle.trim()) return;
    const newDec: DecisionItem = {
      id: `dec_${Date.now()}`,
      title: newDecisionTitle.trim(),
      context: 'Strategic architecture and life milestone optimization',
      options: [
        {
          id: `opt_1_${Date.now()}`,
          name: newDecisionOptionA.trim() || 'Option A: High sovereign resilience',
          pros: ['Maximizes long-term autonomy', 'Zero recurring cost'],
          cons: ['Requires deliberate focus blocks'],
          riskLevel: 'medium',
        },
        {
          id: `opt_2_${Date.now()}`,
          name: newDecisionOptionB.trim() || 'Option B: Standard quick prototype',
          pros: ['Faster initial delivery'],
          cons: ['Higher technical debt'],
          riskLevel: 'low',
        },
      ],
      confidenceScore: 88,
      recommendation: 'Adopt Option A with staged milestones.',
      createdAt: new Date().toISOString(),
    };
    const saved = await StorageService.saveDecision(newDec);
    setDecisions((prev) => [saved, ...prev]);
    setNewDecisionTitle('');
    setNewDecisionOptionA('');
    setNewDecisionOptionB('');
    setIsAddingDecision(false);
  };

  const calculateMilestonePercent = (goal: GoalItem) => {
    if (!goal.milestones || goal.milestones.length === 0) return 0;
    const completed = goal.milestones.filter((m) => m.done).length;
    return Math.round((completed / goal.milestones.length) * 100);
  };

  const handleBottomTabPress = (tab: TabName) => {
    if (tab === 'Home') navigation.navigate('Home');
    else if (tab === 'Plan' || tab === 'MyDay') navigation.navigate('MyDay');
    else if (tab === 'Chat') navigation.navigate('ActiveChat');
    else if (tab === 'Friends') navigation.navigate('FriendsChat');
    else if (tab === 'Profile') navigation.navigate('Profile');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Strategic Direction</Text>
            <Text style={styles.title}>My Life</Text>
          </View>
          <NexAvatar variant="task_complete" size="sm" />
        </View>

        {/* 4 Tabs: Goals, Planner, Progress, Decisions */}
        <View style={styles.tabBar}>
          {(['goals', 'planner', 'progress', 'decisions'] as LifeTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- TAB 1: GOALS --- */}
        {activeTab === 'goals' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Master Goals</Text>
              <TouchableOpacity onPress={() => setIsAddingGoal(!isAddingGoal)}>
                <Text style={styles.actionLink}>{isAddingGoal ? 'Cancel' : '+ New Goal'}</Text>
              </TouchableOpacity>
            </View>

            {isAddingGoal && (
              <GlassCard style={styles.formCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Goal title (e.g. Master Distributed Systems)..."
                  placeholderTextColor={theme.colors.text.muted}
                  value={newGoalTitle}
                  onChangeText={setNewGoalTitle}
                />
                <View style={styles.categoryRow}>
                  {(['career', 'learning', 'fitness', 'finance'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChip, newGoalCategory === cat && styles.catChipActive]}
                      onPress={() => setNewGoalCategory(cat)}
                    >
                      <Text style={[styles.catChipText, newGoalCategory === cat && styles.catChipTextActive]}>
                        {cat.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <GlassButton title="Create Goal" variant="primary" onPress={handleCreateGoal} style={{ marginTop: 10 }} />
              </GlassCard>
            )}

            {goals.map((goal) => {
              const pct = calculateMilestonePercent(goal);
              return (
                <GlassCard key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalCategoryBadge}>{goal.category.toUpperCase()}</Text>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.percentBadge}>
                        <Text style={styles.percentText}>{pct}%</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingGoalId(goal.id);
                          setNewGoalTitle(goal.title);
                          setNewGoalCategory(goal.category);
                          setIsAddingGoal(true);
                        }}
                        style={styles.goalActionBtn}
                        accessibilityLabel="Edit goal"
                      >
                        <Ionicons name="pencil-outline" size={14} color={theme.colors.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteGoal(goal.id)}
                        style={styles.goalActionBtn}
                        accessibilityLabel="Delete goal"
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                  </View>

                  {/* Milestones Checklist */}
                  <Text style={styles.milestoneHeading}>Milestones</Text>
                  {(goal.milestones || []).map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.milestoneRow}
                      onPress={() => handleToggleMilestone(goal.id, m.id)}
                    >
                      <View style={[styles.miniCheck, m.done && styles.miniCheckCompleted]}>
                        {m.done && <Text style={styles.miniCheckIcon}>✓</Text>}
                      </View>
                      <Text style={[styles.milestoneText, m.done && styles.milestoneTextDone]}>
                        {m.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* --- TAB 2: PLANNER --- */}
        {activeTab === 'planner' && (
          <View>
            <Text style={styles.sectionTitle}>Strategic Roadmap</Text>
            <GlassCard style={styles.plannerCard}>
              <Text style={styles.roadmapHeading}>📅 Weekly Execution Horizon</Text>
              <Text style={styles.roadmapDesc}>
                Synchronized with your daily focus blocks and priority targets.
              </Text>
              <View style={styles.plannerItem}>
                <Text style={styles.dayDot}>🟢 Mon - Wed</Text>
                <Text style={styles.plannerItemTitle}>Deep Core Logic & Algorithms</Text>
              </View>
              <View style={styles.plannerItem}>
                <Text style={styles.dayDot}>🔵 Thu - Fri</Text>
                <Text style={styles.plannerItemTitle}>System Verification & QA Testing</Text>
              </View>
              <View style={styles.plannerItem}>
                <Text style={styles.dayDot}>🟣 Sat - Sun</Text>
                <Text style={styles.plannerItemTitle}>Strategic Synthesis & Milestone Review</Text>
              </View>
            </GlassCard>

            <GlassCard style={[styles.plannerCard, { marginTop: 12 }]}>
              <Text style={styles.roadmapHeading}>🎯 Monthly Milestone Horizon</Text>
              <Text style={styles.roadmapDesc}>
                Q4 Target: 100% Sovereign Companion Autonomous Readiness with Zero Simulated Telemetry.
              </Text>
            </GlassCard>
          </View>
        )}

        {/* --- TAB 3: PROGRESS TELEMETRY --- */}
        {activeTab === 'progress' && (
          <View>
            <Text style={styles.sectionTitle}>Real Sovereign Telemetry</Text>
            <View style={styles.metricsGrid}>
              <GlassCard style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {tasks.filter((t) => t.completed).length} / {tasks.length}
                </Text>
                <Text style={styles.metricLabel}>Tasks Completed</Text>
              </GlassCard>
              <GlassCard style={styles.metricCard}>
                <Text style={styles.metricValue}>{memories.length}</Text>
                <Text style={styles.metricLabel}>Memories in Vault</Text>
              </GlassCard>
              <GlassCard style={styles.metricCard}>
                <Text style={styles.metricValue}>{reminderCount}</Text>
                <Text style={styles.metricLabel}>Active Reminders</Text>
              </GlassCard>
              <GlassCard style={styles.metricCard}>
                <Text style={styles.metricValue}>{goals.length}</Text>
                <Text style={styles.metricLabel}>Master Goals</Text>
              </GlassCard>
            </View>

            <GlassCard style={[styles.plannerCard, { marginTop: 16 }]}>
              <Text style={styles.roadmapHeading}>🛡️ Sovereign Storage Integrity</Text>
              <Text style={styles.roadmapDesc}>
                Data stored securely on-device via sovereign local partition. Unencrypted local storage with SHA-256 protected critical secrets.
              </Text>
            </GlassCard>
          </View>
        )}

        {/* --- TAB 4: DECISIONS MATRIX --- */}
        {activeTab === 'decisions' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Decisions Matrix</Text>
              <TouchableOpacity onPress={() => setIsAddingDecision(!isAddingDecision)}>
                <Text style={styles.actionLink}>{isAddingDecision ? 'Cancel' : '+ New Decision'}</Text>
              </TouchableOpacity>
            </View>

            {isAddingDecision && (
              <GlassCard style={styles.formCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Decision Dilemma (e.g. Choose Tech Stack)..."
                  placeholderTextColor={theme.colors.text.muted}
                  value={newDecisionTitle}
                  onChangeText={setNewDecisionTitle}
                />
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Option 1 (e.g. Expo + TypeScript)..."
                  placeholderTextColor={theme.colors.text.muted}
                  value={newDecisionOptionA}
                  onChangeText={setNewDecisionOptionA}
                />
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="Option 2 (e.g. Alternative framework)..."
                  placeholderTextColor={theme.colors.text.muted}
                  value={newDecisionOptionB}
                  onChangeText={setNewDecisionOptionB}
                />
                <GlassButton title="Record & Analyze Decision" variant="primary" onPress={handleCreateDecision} style={{ marginTop: 10 }} />
              </GlassCard>
            )}

            {decisions.map((dec) => {
              const primaryRisk = dec.options[0]?.riskLevel || 'medium';
              return (
                <GlassCard key={dec.id} style={styles.decisionCard}>
                  <View style={styles.decisionHeader}>
                    <Text style={styles.decisionTitle}>{dec.title}</Text>
                    <View
                      style={[
                        styles.riskBadge,
                        primaryRisk === 'high'
                          ? styles.riskHigh
                          : primaryRisk === 'medium'
                          ? styles.riskMedium
                          : styles.riskLow,
                      ]}
                    >
                      <Text style={styles.riskText}>{primaryRisk.toUpperCase()} RISK</Text>
                    </View>
                  </View>

                  {/* Confidence Bar */}
                  <View style={styles.confidenceRow}>
                    <Text style={styles.confidenceLabel}>Confidence: {dec.confidenceScore}%</Text>
                    <View style={styles.confidenceTrack}>
                      <View style={[styles.confidenceFill, { width: `${dec.confidenceScore}%` }]} />
                    </View>
                  </View>

                  {/* Options List */}
                  <Text style={styles.subHeading}>Options Considered</Text>
                  {dec.options.map((opt, i) => (
                    <Text key={i} style={styles.optionBullet}>
                      • {opt.name} ({opt.riskLevel.toUpperCase()} RISK)
                    </Text>
                  ))}

                  {/* Recommendation */}
                  <View style={styles.recommendationBox}>
                    <Text style={styles.recommendationTag}>💡 NEXORA Recommendation:</Text>
                    <Text style={styles.recommendationText}>{dec.recommendation}</Text>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Persistent Bottom Nav Dock */}
      <BottomNavBar activeTab="Profile" onTabPress={handleBottomTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: theme.spacing.md,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: theme.borderRadius.full,
    padding: 4,
    marginBottom: theme.spacing.md,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.full,
  },
  tabItemActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  tabText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  tabTextActive: {
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  actionLink: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  goalCard: {
    marginTop: 10,
    padding: theme.spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalCategoryBadge: {
    fontSize: 9,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 1,
  },
  goalTitle: {
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  percentText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  goalActionBtn: {
    padding: 5,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 3,
  },
  milestoneHeading: {
    color: theme.colors.text.muted,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 6,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  miniCheck: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  miniCheckCompleted: {
    backgroundColor: theme.colors.accent.primary,
  },
  miniCheckIcon: {
    fontSize: 10,
    color: '#000000',
    fontWeight: 'bold',
  },
  milestoneText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    flex: 1,
  },
  milestoneTextDone: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.muted,
  },
  formCard: {
    marginVertical: 10,
    padding: theme.spacing.md,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.md,
    padding: 10,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  catChipActive: {
    backgroundColor: theme.colors.accent.primary,
  },
  catChipText: {
    fontSize: 9,
    color: theme.colors.text.muted,
    fontFamily: theme.typography.fontFamily.bold,
  },
  catChipTextActive: {
    color: '#000000',
  },
  plannerCard: {
    marginTop: 10,
    padding: theme.spacing.md,
  },
  roadmapHeading: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 4,
  },
  roadmapDesc: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    marginBottom: 10,
    lineHeight: 18,
  },
  plannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  dayDot: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: theme.typography.fontFamily.bold,
    width: 100,
  },
  plannerItemTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xs,
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  metricCard: {
    flexBasis: '48%',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.accent.primary,
  },
  metricLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 4,
  },
  decisionCard: {
    marginTop: 10,
    padding: theme.spacing.md,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  decisionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    flex: 1,
    marginRight: 8,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  riskLow: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  riskMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  riskHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  riskText: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  confidenceRow: {
    marginVertical: 10,
  },
  confidenceLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginBottom: 4,
  },
  confidenceTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  subHeading: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 4,
    marginBottom: 4,
  },
  optionBullet: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    marginLeft: 4,
    marginTop: 2,
  },
  recommendationBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent.primary,
  },
  recommendationTag: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  recommendationText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
});

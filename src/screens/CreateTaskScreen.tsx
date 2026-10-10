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
import { GlassInput } from '../components/common/GlassInput';
import { GlassButton } from '../components/common/GlassButton';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';
import type { TaskItem } from '../services/storage';

interface CreateTaskScreenProps {
  navigation: ScreenNavProp<'CreateTask'>;
}

export const CreateTaskScreen: React.FC<CreateTaskScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addTask } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskItem['category']>('work');
  const [priority, setPriority] = useState<TaskItem['priority']>('medium');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a task title');
      return;
    }
    await addTask(title.trim(), category, priority);
    navigation.goBack();
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
          <Text style={styles.headerTitle}>Create Task</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GlassCard style={styles.formCard}>
            <GlassInput
              label="Task Title"
              placeholder="e.g. Complete math study session"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError('');
              }}
              error={error}
            />

            {/* Category Selector */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.pillsRow}>
              {(['work', 'study', 'fitness', 'daily'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.pill,
                    category === cat && styles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      category === cat && styles.pillTextActive,
                    ]}
                  >
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selector */}
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.pillsRow}>
              {(['low', 'medium', 'high'] as const).map((pri) => (
                <TouchableOpacity
                  key={pri}
                  activeOpacity={0.7}
                  onPress={() => setPriority(pri)}
                  style={[
                    styles.pill,
                    priority === pri && styles.pillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      priority === pri && styles.pillTextActive,
                    ]}
                  >
                    {pri.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <GlassButton
                title="Schedule Task"
                variant="primary"
                onPress={handleCreate}
              />
            </View>
          </GlassCard>
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
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  formCard: {
    padding: theme.spacing.lg,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  pillText: {
    fontSize: 11,
    color: theme.colors.text.muted,
  },
  pillTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  btnRow: {
    marginTop: theme.spacing.lg,
  },
});

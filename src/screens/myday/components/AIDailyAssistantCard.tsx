import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem } from '../../../services/storage';
import { ReminderItem } from '../../../services/reminders/reminderService';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

interface AIDailyAssistantCardProps {
  tasks: TaskItem[];
  reminders: ReminderItem[];
  onQuickCreateTask: (title: string, dueDate?: string) => Promise<void>;
}

export const AIDailyAssistantCard: React.FC<AIDailyAssistantCardProps> = ({
  tasks,
  reminders,
  onQuickCreateTask,
}) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate real daily intelligence summary
  const pendingTasks = tasks.filter((t) => !t.completed);
  const highPriority = pendingTasks.find((t) => t.priority === 'high');
  const totalItems = pendingTasks.length + reminders.length;

  let advice = 'Your daily schedule is open and serene. Good time for creative exploration.';
  if (highPriority) {
    advice = `Priority alert: Focus energy on "${highPriority.title}" first.`;
  } else if (pendingTasks.length > 3) {
    advice = `You have ${pendingTasks.length} pending tasks. Group them into two 25-minute LifeBloom blocks.`;
  } else if (pendingTasks.length > 0) {
    advice = `Gentle momentum: ${pendingTasks.length} priorities remaining. Steady focus will complete them cleanly.`;
  }

  const handleParseAndCreate = async () => {
    const raw = naturalInput.trim();
    if (!raw) return;

    // Simple natural time parser (e.g., "Review paper by 4pm" -> title: "Review paper", dueDate: "4:00 PM")
    let title = raw;
    let dueDate: string | undefined = undefined;

    const byMatch = raw.match(/(.+?)\s+(?:by|at)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    if (byMatch) {
      title = byMatch[1].trim();
      dueDate = `Today ${byMatch[2].trim().toUpperCase()}`;
    }

    Alert.alert(
      'Confirm New Focus Task',
      `Create task:\n\nTitle: "${title}"\n${dueDate ? `Scheduled: ${dueDate}\n` : ''}\nWould you like to add this to your planner?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Plan',
          onPress: async () => {
            setIsProcessing(true);
            try {
              await onQuickCreateTask(title, dueDate);
              setNaturalInput('');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to create task');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <NatureGlassCard style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <View style={styles.brandRow}>
            <Ionicons name="sparkles" size={14} color={NatureTheme.colors.sage} />
            <Text style={styles.brandText}>NEXORA ASSISTANT</Text>
          </View>
          <Text style={styles.title}>Daily Intelligence Brief</Text>
        </View>

        <View style={styles.badge}>
          <Ionicons name="leaf" size={13} color={NatureTheme.colors.emerald} />
          <Text style={styles.badgeText}>{totalItems} Active</Text>
        </View>
      </View>

      {/* Real Summary Advice */}
      <View style={styles.adviceBox}>
        <Ionicons
          name="bulb-outline"
          size={18}
          color={NatureTheme.colors.gold}
          style={styles.adviceIcon}
        />
        <Text style={styles.adviceText}>{advice}</Text>
      </View>

      {/* Natural Language Task Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="E.g. Prepare lab report by 4pm..."
          placeholderTextColor={NatureTheme.colors.textMuted}
          value={naturalInput}
          onChangeText={setNaturalInput}
          onSubmitEditing={handleParseAndCreate}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.submitBtn, !naturalInput.trim() && styles.submitBtnDisabled]}
          onPress={handleParseAndCreate}
          disabled={!naturalInput.trim() || isProcessing}
          accessibilityRole="button"
          accessibilityLabel="Create task from prompt"
        >
          <Ionicons
            name="arrow-up"
            size={16}
            color={naturalInput.trim() ? NatureTheme.colors.background : NatureTheme.colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </NatureGlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleCol: {
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandText: {
    color: NatureTheme.colors.sage,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  title: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: NatureTheme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  badgeText: {
    color: NatureTheme.colors.sage,
    fontSize: 11,
    fontWeight: '700',
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: NatureTheme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  adviceIcon: {
    marginTop: 1,
  },
  adviceText: {
    flex: 1,
    color: NatureTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: NatureTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    color: NatureTheme.colors.textPrimary,
    fontSize: 13,
    paddingVertical: 8,
  },
  submitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: NatureTheme.colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

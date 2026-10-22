import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

interface DayClosureCardProps {
  completedCount: number;
  unfinishedCount: number;
  onSaveReflection: (text: string) => Promise<void>;
}

export const DayClosureCard: React.FC<DayClosureCardProps> = ({
  completedCount,
  unfinishedCount,
  onSaveReflection,
}) => {
  const [reflectionText, setReflectionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleCommit = async () => {
    const trimmed = reflectionText.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onSaveReflection(trimmed);
      setReflectionText('');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch {
      // error handled in caller
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <NatureGlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Day Closure & Reflection</Text>
          <Text style={styles.subtitle}>Calm evening review & sovereign memory vaulting</Text>
        </View>
        <Ionicons name="moon-outline" size={20} color={NatureTheme.colors.lavender} />
      </View>

      {/* Actual Stats Summary */}
      <View style={styles.summaryBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, unfinishedCount > 0 && { color: NatureTheme.colors.goldLight }]}>
            {unfinishedCount}
          </Text>
          <Text style={styles.statLabel}>Unfinished</Text>
        </View>
      </View>

      {/* Reflection Journal Text Area */}
      <Text style={styles.promptText}>
        What insights, learnings, or moments of peace did you experience today?
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Record today's breakthrough or quiet reflection into sovereign vault..."
        placeholderTextColor={NatureTheme.colors.textMuted}
        multiline
        numberOfLines={3}
        value={reflectionText}
        onChangeText={setReflectionText}
      />

      {saveSuccess && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color={NatureTheme.colors.emerald} />
          <Text style={styles.successBannerText}>Committed safely to Sovereign Vault</Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.saveBtn,
          (!reflectionText.trim() || isSaving) && styles.saveBtnDisabled,
        ]}
        onPress={handleCommit}
        disabled={!reflectionText.trim() || isSaving}
        accessibilityRole="button"
        accessibilityLabel="Save reflection to memory vault"
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={NatureTheme.colors.background} />
        ) : (
          <>
            <Ionicons name="shield-checkmark-outline" size={16} color={NatureTheme.colors.background} />
            <Text style={styles.saveBtnText}>Commit to Sovereign Memory</Text>
          </>
        )}
      </TouchableOpacity>
    </NatureGlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: NatureTheme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    color: NatureTheme.colors.emerald,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptText: {
    color: NatureTheme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: NatureTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    padding: 12,
    color: NatureTheme.colors.textPrimary,
    fontSize: 13,
    minHeight: 74,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: 8,
    borderRadius: NatureTheme.borderRadius.sm,
    marginBottom: 10,
  },
  successBannerText: {
    color: NatureTheme.colors.emerald,
    fontSize: 12,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: NatureTheme.colors.emerald,
    paddingVertical: 12,
    borderRadius: NatureTheme.borderRadius.md,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  saveBtnText: {
    color: NatureTheme.colors.background,
    fontSize: 13,
    fontWeight: '800',
  },
});

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
import type { StoredMemory } from '../services/storage';

interface AddMemoryScreenProps {
  navigation: ScreenNavProp<'AddMemory'>;
}

export const AddMemoryScreen: React.FC<AddMemoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { addMemory } = useApp();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<StoredMemory['category']>('preference');
  const [tier, setTier] = useState<StoredMemory['securityTier']>('medium');
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Please enter a memory fact.');
      return;
    }
    await addMemory(category, content.trim(), tier);
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
          <Text style={styles.headerTitle}>Add Memory Fact</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GlassCard style={styles.formCard}>
            <GlassInput
              label="Memory Content"
              placeholder="e.g. Prefers low-sodium breakfast options"
              value={content}
              onChangeText={(text) => {
                setContent(text);
                setError('');
              }}
              error={error}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />

            {/* Category Selector */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.pillsRow}>
              {(['preference', 'personal', 'study', 'work', 'health'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  onPress={() => setCategory(cat)}
                  style={[styles.pill, category === cat && styles.pillActive]}
                >
                  <Text style={[styles.pillText, category === cat && styles.pillTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Security Classification Tier */}
            <Text style={styles.fieldLabel}>Security Classification</Text>
            <View style={styles.pillsRow}>
              {(['low', 'medium', 'high', 'critical'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  onPress={() => setTier(t)}
                  style={[styles.pill, tier === t && styles.pillActive]}
                >
                  <Text style={[styles.pillText, tier === t && styles.pillTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              <GlassButton
                title="Save Memory to Vault"
                variant="primary"
                onPress={handleSave}
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
    marginTop: theme.spacing.md,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  pill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
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
    marginTop: theme.spacing.xl,
  },
});

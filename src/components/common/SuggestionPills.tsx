import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme';

export interface SuggestionItem {
  id: string;
  label: string;
  icon?: string;
  prompt: string;
}

interface SuggestionPillsProps {
  onSelect: (prompt: string) => void;
  items?: SuggestionItem[];
}

const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { id: '1', label: 'Study something new', icon: '🎓', prompt: 'I want to study something new today. What can you teach me?' },
  { id: '2', label: 'Plan my day', icon: '📅', prompt: 'Help me plan my day and organize my priority tasks.' },
  { id: '3', label: 'Get a recipe', icon: '🍳', prompt: 'Give me a simple, healthy recipe I can cook today.' },
  { id: '4', label: 'Help me with coding', icon: '💻', prompt: 'Help me design and write code for my project.' },
];

export const SuggestionPills: React.FC<SuggestionPillsProps> = ({
  onSelect,
  items = DEFAULT_SUGGESTIONS,
}) => {
  return (
    <View style={styles.container}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.75}
          onPress={() => onSelect(item.prompt)}
          style={styles.pill}
        >
          {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onSelect('Show me more options and capabilities')}
        style={[styles.pill, styles.morePill]}
      >
        <Text style={styles.moreLabel}>More options ↓</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginVertical: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(0, 229, 255, 0.22)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  morePill: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 14,
    marginRight: theme.spacing.xs,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  moreLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';

interface PersonalizationSettingsPageProps {
  onBack: () => void;
}

const RESPONSE_STYLES: Array<{
  id: 'concise' | 'balanced' | 'detailed' | 'empathetic';
  label: string;
  desc: string;
}> = [
  { id: 'concise', label: 'Concise', desc: 'Direct, brief answers without excess elaboration' },
  { id: 'balanced', label: 'Balanced', desc: 'Standard natural conversational depth and context' },
  { id: 'detailed', label: 'Detailed', desc: 'Thorough explanations, code breakdowns, and nuance' },
  { id: 'empathetic', label: 'Empathetic', desc: 'Warm, supportive tone focused on daily companion care' },
];

export const PersonalizationSettingsPage: React.FC<PersonalizationSettingsPageProps> = ({ onBack }) => {
  const { user, updateUserProfile, preferences, updatePreferences } = useApp();

  const [preferredName, setPreferredName] = useState(user?.name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const [responseStyle, setResponseStyle] = useState<'concise' | 'balanced' | 'detailed' | 'empathetic'>(
    preferences.responseStyle || 'balanced'
  );
  const [autoSendVoice, setAutoSendVoice] = useState<boolean>(preferences.autoSendVoice ?? true);
  const [requireConfirmations, setRequireConfirmations] = useState<boolean>(
    preferences.requireConfirmations ?? false
  );
  const [highContrast, setHighContrast] = useState<boolean>(preferences.highContrast ?? false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(preferences.reduceMotion ?? false);
  const [savedNotice, setSavedNotice] = useState<string>('');

  const handleSavePreferredName = async () => {
    const trimmed = preferredName.trim();
    if (!trimmed) {
      setSavedNotice('Name cannot be empty');
      setTimeout(() => setSavedNotice(''), 3000);
      return;
    }
    setIsSavingName(true);
    try {
      await updateUserProfile({ name: trimmed });
      setSavedNotice('Preferred name updated');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (e: any) {
      setSavedNotice(e.message || 'Error updating name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdate = async (patch: Partial<typeof preferences>) => {
    setSavedNotice('');
    try {
      await updatePreferences(patch);
      setSavedNotice('Preferences saved');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (err: any) {
      setSavedNotice(err.message || 'Failed to save preference');
    }
  };

  return (
    <ScrollView
      testID="settings-page-personalization"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {savedNotice ? (
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.bannerText}>{savedNotice}</Text>
        </View>
      ) : null}

      {/* Preferred Name Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="person-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Preferred Calling Name</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          The name NEXORA AI uses to address you during greetings and briefings
        </Text>

        <View style={styles.nameInputRow}>
          <TextInput
            style={styles.nameTextInput}
            value={preferredName}
            onChangeText={setPreferredName}
            placeholder="e.g. Alex"
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            accessibilityLabel="Preferred calling name input"
          />
          <TouchableOpacity
            style={styles.saveNameBtn}
            onPress={handleSavePreferredName}
            disabled={isSavingName}
            accessibilityRole="button"
            accessibilityLabel="Save preferred calling name"
          >
            {isSavingName ? (
              <ActivityIndicator size="small" color="#050B14" />
            ) : (
              <Text style={styles.saveNameBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Persona Cadence */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="sparkles-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>AI Response Style</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Adjust the conversational personality and verbosity of NEXORA AI
        </Text>

        <View style={styles.optionsList}>
          {RESPONSE_STYLES.map((styleOption) => {
            const isSelected = responseStyle === styleOption.id;
            return (
              <TouchableOpacity
                key={styleOption.id}
                style={[styles.styleOptionCard, isSelected && styles.styleOptionCardActive]}
                onPress={() => {
                  setResponseStyle(styleOption.id);
                  handleUpdate({ responseStyle: styleOption.id });
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${styleOption.label} style: ${styleOption.desc}`}
              >
                <View style={styles.styleOptionHeader}>
                  <Text style={[styles.styleOptionLabel, isSelected && styles.styleOptionLabelActive]}>
                    {styleOption.label}
                  </Text>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={isSelected ? '#00E5FF' : '#64748B'}
                  />
                </View>
                <Text style={styles.styleOptionDesc}>{styleOption.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Interaction Controls */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="options-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Interaction Flow</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Auto-Send Voice Queries</Text>
            <Text style={styles.toggleSubtitle}>
              Automatically submit queries once speech recognition finalizes
            </Text>
          </View>
          <Switch
            value={autoSendVoice}
            onValueChange={(val) => {
              setAutoSendVoice(val);
              handleUpdate({ autoSendVoice: val });
            }}
            thumbColor={autoSendVoice ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Require Action Confirmation</Text>
            <Text style={styles.toggleSubtitle}>
              Prompt before task creation, reminder deletion, or device controls
            </Text>
          </View>
          <Switch
            value={requireConfirmations}
            onValueChange={(val) => {
              setRequireConfirmations(val);
              handleUpdate({ requireConfirmations: val });
            }}
            thumbColor={requireConfirmations ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>
      </View>

      {/* Accessibility & Visual Comfort */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="eye-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Accessibility & Motion</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>High Contrast UI</Text>
            <Text style={styles.toggleSubtitle}>
              Enforces maximum contrast borders and pure white typography in supported views
            </Text>
          </View>
          <Switch
            value={highContrast}
            onValueChange={(val) => {
              setHighContrast(val);
              handleUpdate({ highContrast: val });
            }}
            thumbColor={highContrast ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Reduce Motion</Text>
            <Text style={styles.toggleSubtitle}>
              Disables orbital header motion and expands radial quick actions instantly
            </Text>
          </View>
          <Switch
            value={reduceMotion}
            onValueChange={(val) => {
              setReduceMotion(val);
              handleUpdate({ reduceMotion: val });
            }}
            thumbColor={reduceMotion ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  bannerText: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '600',
  },
  glassCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  nameInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  nameTextInput: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  saveNameBtn: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNameBtnText: {
    color: '#050B14',
    fontSize: 13,
    fontWeight: '700',
  },
  optionsList: {
    gap: 10,
  },
  styleOptionCard: {
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
  },
  styleOptionCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  styleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  styleOptionLabel: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '700',
  },
  styleOptionLabelActive: {
    color: '#00E5FF',
  },
  styleOptionDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 14,
  },
  toggleTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
});

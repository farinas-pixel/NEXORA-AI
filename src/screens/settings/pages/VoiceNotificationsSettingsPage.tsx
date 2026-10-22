import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useApp } from '../../../context/AppContext';
import { SpeechService } from '../../../services/voice/speechService';

interface VoiceNotificationsSettingsPageProps {
  onBack: () => void;
}

const VOICE_MODELS = [
  { id: 'en-US-Neural', name: 'NEX Core Neural', desc: 'Standard low-latency companion cadence' },
  { id: 'en-US-Studio-Warm', name: 'NEX Warm Studio', desc: 'Rich harmonics, empathetic conversational tone' },
  { id: 'en-US-Calm', name: 'NEX Calm Companion', desc: 'Gentle pacing ideal for evening check-ins' },
  { id: 'en-US-Analytical', name: 'NEX Analytical', desc: 'Focused, precise engineering delivery' },
];

const RATES = [0.75, 1.0, 1.25, 1.5];
const PITCHES = [0.8, 1.0, 1.2];
const QUIET_START_TIMES = ['20:00', '21:00', '22:00', '23:00'];
const QUIET_END_TIMES = ['06:00', '07:00', '08:00', '09:00'];

export const VoiceNotificationsSettingsPage: React.FC<VoiceNotificationsSettingsPageProps> = ({ onBack }) => {
  const { preferences, updatePreferences, appLanguage, t } = useApp();

  const [rate, setRate] = useState<number>(preferences.speechRate || 1.0);
  const [pitch, setPitch] = useState<number>(preferences.speechPitch || 1.0);
  const [voiceModel, setVoiceModel] = useState<string>(preferences.voiceModel || 'en-US-Neural');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(preferences.autoSpeak ?? true);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    preferences.notificationsEnabled ?? true
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(
    preferences.quietHoursEnabled ?? true
  );
  const [quietHoursStart, setQuietHoursStart] = useState<string>(
    preferences.quietHoursStart || '22:00'
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState<string>(
    preferences.quietHoursEnd || '07:00'
  );

  const quietStartTimes = useMemo(() => {
    const list = [...QUIET_START_TIMES];
    if (quietHoursStart && !list.includes(quietHoursStart)) {
      list.push(quietHoursStart);
      list.sort();
    }
    return list;
  }, [quietHoursStart]);

  const quietEndTimes = useMemo(() => {
    const list = [...QUIET_END_TIMES];
    if (quietHoursEnd && !list.includes(quietHoursEnd)) {
      list.push(quietHoursEnd);
      list.sort();
    }
    return list;
  }, [quietHoursEnd]);

  const [permissionStatus, setPermissionStatus] = useState<string>('Checking...');
  const [isTestingVoice, setIsTestingVoice] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status === 'granted' ? 'Active' : 'Disabled');
      } catch {
        setPermissionStatus('Unavailable');
      }
    })();
  }, []);

  const handleUpdate = async (patch: Partial<typeof preferences>) => {
    setSavedNotice('');
    try {
      await updatePreferences(patch);
      setSavedNotice('Settings updated');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (e: any) {
      setSavedNotice(e.message || 'Error saving voice preferences');
    }
  };

  const handleTestVoice = async () => {
    if (isTestingVoice) {
      await SpeechService.stop();
      setIsTestingVoice(false);
      return;
    }

    setIsTestingVoice(true);
    await SpeechService.speak('Hello, this is NEXORA AI. Your speech parameters are calibrated and active.', {
      rate,
      pitch,
      language: appLanguage,
      onDone: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false),
    });
  };

  return (
    <ScrollView
      testID="settings-page-voicenotifications"
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

      {/* Voice Cadence & Synthesis Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="mic-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Speech Synthesizer</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Native hardware speech synthesis calibrated for cadence, tone, and pitch. Voice models guide conversational persona.
        </Text>

        {/* Voice Persona Selector */}
        <Text style={styles.sectionLabel}>Voice Persona:</Text>
        <View style={styles.modelsList}>
          {VOICE_MODELS.map((model) => {
            const isSelected = voiceModel === model.id;
            return (
              <TouchableOpacity
                key={model.id}
                style={[styles.modelCard, isSelected && styles.modelCardActive]}
                onPress={() => {
                  setVoiceModel(model.id);
                  handleUpdate({ voiceModel: model.id });
                }}
                accessibilityRole="button"
                accessibilityLabel={`${model.name}: ${model.desc}`}
              >
                <View style={styles.modelHeader}>
                  <Text style={[styles.modelTitle, isSelected && styles.modelTitleActive]}>
                    {model.name}
                  </Text>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={isSelected ? '#00E5FF' : '#64748B'}
                  />
                </View>
                <Text style={styles.modelDesc}>{model.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rate Controls */}
        <Text style={styles.sectionLabel}>Speech Rate:</Text>
        <View style={styles.chipsRow}>
          {RATES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, rate === r && styles.chipActive]}
              onPress={() => {
                setRate(r);
                handleUpdate({ speechRate: r });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Speech rate ${r}x`}
            >
              <Text style={[styles.chipText, rate === r && styles.chipTextActive]}>{r}x</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pitch Controls */}
        <Text style={styles.sectionLabel}>Pitch Calibration:</Text>
        <View style={styles.chipsRow}>
          {PITCHES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.chip, pitch === p && styles.chipActive]}
              onPress={() => {
                setPitch(p);
                handleUpdate({ speechPitch: p });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Speech pitch ${p}`}
            >
              <Text style={[styles.chipText, pitch === p && styles.chipTextActive]}>
                {p === 1.0 ? 'Natural (1.0)' : p < 1.0 ? `Low (${p})` : `High (${p})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Auto Speak Toggle */}
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Auto-Speak Responses</Text>
            <Text style={styles.toggleSubtitle}>
              Automatically read answers aloud when initiated via voice
            </Text>
          </View>
          <Switch
            value={autoSpeak}
            onValueChange={(val) => {
              setAutoSpeak(val);
              handleUpdate({ autoSpeak: val });
            }}
            thumbColor={autoSpeak ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        {/* Test Voice Action */}
        <TouchableOpacity
          style={styles.testVoiceBtn}
          onPress={handleTestVoice}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Test speech playback"
        >
          <Ionicons name={isTestingVoice ? 'stop-circle' : 'volume-high'} size={18} color="#050B14" />
          <Text style={styles.testVoiceBtnText}>{isTestingVoice ? 'Stop Sample' : 'Test Speech Sample'}</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications & Quiet Hours Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="notifications-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Notifications & Quiet Hours</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>System Notifications</Text>
            <Text style={styles.toggleSubtitle}>
              Reminders, calendar alarms, and companion check-in alerts (Status: {permissionStatus})
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={(val) => {
              setNotificationsEnabled(val);
              handleUpdate({ notificationsEnabled: val });
            }}
            thumbColor={notificationsEnabled ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Quiet Hours Silence</Text>
            <Text style={styles.toggleSubtitle}>
              Mute all audible speech and non-critical companion pings during bedtime
            </Text>
          </View>
          <Switch
            value={quietHoursEnabled}
            onValueChange={(val) => {
              setQuietHoursEnabled(val);
              handleUpdate({ quietHoursEnabled: val });
            }}
            thumbColor={quietHoursEnabled ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        {quietHoursEnabled ? (
          <View style={styles.quietHoursSelectors}>
            <Text style={styles.sectionLabel}>Quiet Window Start Time:</Text>
            <View style={styles.chipsRow}>
              {quietStartTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.chip, quietHoursStart === time && styles.chipActive]}
                  onPress={() => {
                    setQuietHoursStart(time);
                    handleUpdate({ quietHoursStart: time });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quiet start at ${time}`}
                >
                  <Text style={[styles.chipText, quietHoursStart === time && styles.chipTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Quiet Window End Time:</Text>
            <View style={styles.chipsRow}>
              {quietEndTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.chip, quietHoursEnd === time && styles.chipActive]}
                  onPress={() => {
                    setQuietHoursEnd(time);
                    handleUpdate({ quietHoursEnd: time });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quiet end at ${time}`}
                >
                  <Text style={[styles.chipText, quietHoursEnd === time && styles.chipTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
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
  sectionLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
  },
  modelsList: {
    gap: 8,
    marginBottom: 6,
  },
  modelCard: {
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
  },
  modelCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  modelTitle: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  modelTitleActive: {
    color: '#00E5FF',
  },
  modelDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  chip: {
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chipActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#00E5FF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
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
  testVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  testVoiceBtnText: {
    color: '#050B14',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  quietHoursSelectors: {
    marginTop: 4,
  },
});

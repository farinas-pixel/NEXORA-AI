import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { AudioWaveformVisualizer } from '../components/common/AudioWaveformVisualizer';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { SpeechService } from '../services/voice/speechService';
import type { ScreenNavProp } from '../types/navigation';

interface VoicePreferencesScreenProps {
  navigation: ScreenNavProp<'VoicePreferences'>;
}

const VOICE_MODELS = [
  { id: 'en-US-Neural', name: 'NEX Core Neural', desc: 'Crisp, low latency, standard companion persona' },
  { id: 'en-US-Studio-Warm', name: 'NEX Warm Studio', desc: 'Rich harmonics, conversational, empathetic tone' },
  { id: 'en-US-Calm', name: 'NEX Calm Companion', desc: 'Gentle cadence, ideal for late evenings and study' },
  { id: 'en-US-Analytical', name: 'NEX Analytical', desc: 'Direct, focused, engineering and coding cadence' },
];

const RATES = [0.75, 1.0, 1.25, 1.5];
const PITCHES = [0.8, 1.0, 1.2];

export const VoicePreferencesScreen: React.FC<VoicePreferencesScreenProps> = ({
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences, appLanguage, setAppLanguage, t } = useApp();

  const [rate, setRate] = useState<number>(preferences.speechRate || 1.0);
  const [pitch, setPitch] = useState<number>(preferences.speechPitch || 1.0);
  const [voiceModel, setVoiceModel] = useState<string>(preferences.voiceModel || 'en-US-Neural');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(preferences.autoSpeak ?? true);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string>('');

  const handleTestVoice = async () => {
    if (isTesting) {
      await SpeechService.stop();
      setIsTesting(false);
      return;
    }

    setIsTesting(true);
    await SpeechService.speak(
      t('voice_test_sample'),
      {
        rate,
        pitch,
        onDone: () => setIsTesting(false),
        onError: () => setIsTesting(false),
      }
    );
  };

  const handleSave = async () => {
    await updatePreferences({
      speechRate: rate,
      speechPitch: pitch,
      voiceModel,
      autoSpeak,
    });
    setSavedNotice(t('voice_saved_toast'));
    setTimeout(() => setSavedNotice(''), 3000);
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
            <Text style={styles.headerTitle}>{t('voice_header_title')}</Text>
            <Text style={styles.headerSub}>{t('voice_header_sub')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Audio Visualizer Stage */}
          <GlassCard variant="highlight" style={styles.visualizerCard}>
            <Text style={styles.visualizerTitle}>Real-time Audio Spectrum</Text>
            <View style={styles.waveformContainer}>
              <AudioWaveformVisualizer
                isActive={isTesting}
                color={theme.colors.accent.primary}
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleTestVoice}
              style={[styles.testBtn, isTesting && styles.testingBtn]}
            >
              <Text style={styles.testBtnText}>
                {isTesting ? t('voice_test_stop') : t('voice_test_btn')}
              </Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Voice Model Selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('voice_section_model')}</Text>
          </View>

          <View style={styles.modelsList}>
            {VOICE_MODELS.map((m) => {
              const isSelected = voiceModel === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.8}
                  onPress={() => setVoiceModel(m.id)}
                >
                  <GlassCard
                    variant={isSelected ? 'highlight' : 'default'}
                    style={styles.modelCard}
                  >
                    <View style={styles.modelRow}>
                      <View style={styles.modelInfo}>
                        <Text style={styles.modelName}>{m.name}</Text>
                        <Text style={styles.modelDesc}>{m.desc}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Speech Rate Controls */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('voice_section_speed')}</Text>
            <Text style={styles.currentVal}>{rate}x</Text>
          </View>

          <GlassCard style={styles.sliderCard}>
            <View style={styles.pillsRow}>
              {RATES.map((r) => (
                <TouchableOpacity
                  key={r}
                  activeOpacity={0.7}
                  onPress={() => setRate(r)}
                  style={[
                    styles.pillBtn,
                    rate === r && styles.pillBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      rate === r && styles.pillTextActive,
                    ]}
                  >
                    {r}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Speech Pitch Controls */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('voice_section_pitch')}</Text>
            <Text style={styles.currentVal}>{pitch === 1.0 ? 'Default' : pitch < 1 ? 'Deep' : 'High'}</Text>
          </View>

          <GlassCard style={styles.sliderCard}>
            <View style={styles.pillsRow}>
              {PITCHES.map((p) => (
                <TouchableOpacity
                  key={p}
                  activeOpacity={0.7}
                  onPress={() => setPitch(p)}
                  style={[
                    styles.pillBtn,
                    pitch === p && styles.pillBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      pitch === p && styles.pillTextActive,
                    ]}
                  >
                    {p === 0.8 ? '0.8x Deep' : p === 1.0 ? '1.0x Balanced' : '1.2x High'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>

          {/* Auto Read Aloud Switch */}
          <GlassCard style={styles.switchCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>{t('voice_section_auto_speak')}</Text>
                <Text style={styles.switchSub}>
                  {t('voice_auto_speak_desc')}
                </Text>
              </View>
              <Switch
                value={autoSpeak}
                onValueChange={setAutoSpeak}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GlassCard>

          {/* Language Selection Quick Switch */}
          <GlassCard style={styles.switchCard}>
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>{t('language_current')}</Text>
                <Text style={styles.switchSub}>
                  {appLanguage === 'ta-IN' ? 'தமிழ் (Tamil)' : 'English (US)'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.langPillBtn}
                onPress={() => setAppLanguage(appLanguage === 'ta-IN' ? 'en-US' : 'ta-IN')}
                activeOpacity={0.8}
              >
                <Text style={styles.langPillText}>
                  {appLanguage === 'ta-IN' ? 'Switch to English' : 'தமிழுக்கு மாறவும்'}
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {savedNotice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>✓ {savedNotice}</Text>
            </View>
          ) : null}

          {/* Save Button */}
          <View style={styles.saveContainer}>
            <GlassButton
              title={t('voice_save_btn')}
              variant="primary"
              onPress={handleSave}
            />
          </View>
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
  visualizerCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  visualizerTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  waveformContainer: {
    height: 60,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  testBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  testingBtn: {
    backgroundColor: 'rgba(255, 23, 68, 0.2)',
    borderColor: '#FF1744',
  },
  testBtnText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentVal: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  modelsList: {
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  modelCard: {
    padding: theme.spacing.sm,
  },
  modelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modelInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  modelName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  modelDesc: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: theme.colors.accent.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.accent.primary,
  },
  sliderCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 6,
  },
  pillBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillBtnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  pillText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  pillTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  switchCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  switchLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  switchSub: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  noticeBox: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderColor: '#00E676',
    borderWidth: 1,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  noticeText: {
    fontSize: theme.typography.fontSize.xs,
    color: '#00E676',
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  saveContainer: {
    marginTop: theme.spacing.xs,
  },
  langPillBtn: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  langPillText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
});

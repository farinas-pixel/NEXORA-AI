import React, { useState, useMemo } from 'react';
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
import { useApp } from '../../../context/AppContext';
import { SoloModeService, DailyCareBriefing } from '../../../services/care/soloModeService';

interface SoloModeSettingsPageProps {
  onBack: () => void;
}

const SCHEDULE_TIMES = ['07:00', '08:00', '09:00', '12:00', '14:00', '17:00', '20:00'];

export const SoloModeSettingsPage: React.FC<SoloModeSettingsPageProps> = ({ onBack }) => {
  const { user, preferences, updatePreferences } = useApp();

  const [soloMode, setSoloMode] = useState<boolean>(preferences.soloMode ?? false);
  const [morningGreetingEnabled, setMorningGreetingEnabled] = useState<boolean>(
    preferences.morningGreetingEnabled ?? false
  );
  const [morningGreetingTime, setMorningGreetingTime] = useState<string>(
    preferences.morningGreetingTime || '08:00'
  );
  const [dailyCheckInEnabled, setDailyCheckInEnabled] = useState<boolean>(
    preferences.dailyCheckInEnabled ?? false
  );
  const [checkInTime, setCheckInTime] = useState<string>(preferences.checkInTime || '14:00');
  const [soloCareHealthIntegration, setSoloCareHealthIntegration] = useState<boolean>(
    preferences.soloCareHealthIntegration ?? true
  );
  const [allowSpokenHealthDetails, setAllowSpokenHealthDetails] = useState<boolean>(
    preferences.allowSpokenHealthDetails ?? false
  );

  const morningTimes = useMemo(() => {
    const list = [...SCHEDULE_TIMES];
    if (morningGreetingTime && !list.includes(morningGreetingTime)) {
      list.push(morningGreetingTime);
      list.sort();
    }
    return list;
  }, [morningGreetingTime]);

  const checkInTimes = useMemo(() => {
    const list = [...SCHEDULE_TIMES];
    if (checkInTime && !list.includes(checkInTime)) {
      list.push(checkInTime);
      list.sort();
    }
    return list;
  }, [checkInTime]);

  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewBriefing, setPreviewBriefing] = useState<DailyCareBriefing | null>(null);
  const [savedNotice, setSavedNotice] = useState('');

  const handleUpdate = async (patch: Partial<typeof preferences>) => {
    setSavedNotice('');
    try {
      await updatePreferences(patch);
      const nextPrefs = { ...preferences, ...patch };

      if (patch.soloMode !== undefined) {
        if (patch.soloMode) {
          await SoloModeService.scheduleSoloModeJobs(nextPrefs).catch(() => {});
        } else {
          await SoloModeService.cancelSoloModeJobs().catch(() => {});
        }
      }

      setSavedNotice('Solo Mode preferences updated');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (e: any) {
      setSavedNotice(e.message || 'Error updating Solo Mode');
    }
  };

  const handlePreviewBriefing = async () => {
    setIsLoadingPreview(true);
    setPreviewBriefing(null);
    try {
      const mockPrefs = {
        ...preferences,
        soloMode,
        morningGreetingEnabled,
        morningGreetingTime,
        dailyCheckInEnabled,
        checkInTime,
        soloCareHealthIntegration,
        allowSpokenHealthDetails,
      };
      const briefing = await SoloModeService.generateDailyCareBriefing(user, mockPrefs);
      setPreviewBriefing(briefing);

      if (briefing.isWithinQuietHours) {
        Alert.alert(
          'Quiet Hours Notice',
          'Current time falls within configured quiet hours. Audio briefings would remain silent.'
        );
      }
    } catch (err: any) {
      Alert.alert('Preview Notice', err.message || 'Unable to assemble preview briefing.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  return (
    <ScrollView
      testID="settings-page-solomode"
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

      {/* Master Toggle Card */}
      <View style={[styles.glassCard, soloMode && styles.glassCardActive]}>
        <View style={styles.masterRow}>
          <View style={styles.masterInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.masterTitle}>Solo Mode Master</Text>
              <View style={[styles.statusBadge, soloMode ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.statusText, soloMode ? styles.statusTextActive : styles.statusTextInactive]}>
                  {soloMode ? 'ACTIVE' : 'DISABLED'}
                </Text>
              </View>
            </View>
            <Text style={styles.masterDesc}>
              Personalized daily companion care, morning greetings, task agendas, and respectful check-ins
            </Text>
          </View>
          <Switch
            value={soloMode}
            onValueChange={(val) => {
              setSoloMode(val);
              handleUpdate({ soloMode: val });
            }}
            thumbColor={soloMode ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>
      </View>

      {/* Schedule Configuration (Active only when Solo Mode is on) */}
      <View style={[styles.glassCard, !soloMode && styles.glassCardDimmed]}>
        <View style={styles.headerRow}>
          <Ionicons name="sunny-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Morning Greeting</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Enable Morning Greeting</Text>
            <Text style={styles.toggleSubtitle}>
              Greets you with name and today's schedule at target morning hour
            </Text>
          </View>
          <Switch
            disabled={!soloMode}
            value={morningGreetingEnabled}
            onValueChange={(val) => {
              setMorningGreetingEnabled(val);
              handleUpdate({ morningGreetingEnabled: val });
            }}
            thumbColor={morningGreetingEnabled ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        {morningGreetingEnabled ? (
          <View style={styles.timeSelectorSection}>
            <Text style={styles.selectorLabel}>Greeting Time:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips}>
              {morningTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  disabled={!soloMode}
                  style={[styles.timeChip, morningGreetingTime === time && styles.timeChipActive]}
                  onPress={() => {
                    setMorningGreetingTime(time);
                    handleUpdate({ morningGreetingTime: time });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Morning greeting at ${time}`}
                >
                  <Text style={[styles.timeText, morningGreetingTime === time && styles.timeTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.divider} />

        <View style={styles.headerRow}>
          <Ionicons name="time-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Daily Check-In</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Enable Afternoon Check-In</Text>
            <Text style={styles.toggleSubtitle}>
              Midday companion check-in asking about progress and comfort
            </Text>
          </View>
          <Switch
            disabled={!soloMode}
            value={dailyCheckInEnabled}
            onValueChange={(val) => {
              setDailyCheckInEnabled(val);
              handleUpdate({ dailyCheckInEnabled: val });
            }}
            thumbColor={dailyCheckInEnabled ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>

        {dailyCheckInEnabled ? (
          <View style={styles.timeSelectorSection}>
            <Text style={styles.selectorLabel}>Check-In Time:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips}>
              {checkInTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  disabled={!soloMode}
                  style={[styles.timeChip, checkInTime === time && styles.timeChipActive]}
                  onPress={() => {
                    setCheckInTime(time);
                    handleUpdate({ checkInTime: time });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Afternoon check-in at ${time}`}
                >
                  <Text style={[styles.timeText, checkInTime === time && styles.timeTextActive]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* Health Privacy & Consent Section */}
      <View style={[styles.glassCard, !soloMode && styles.glassCardDimmed]}>
        <View style={styles.headerRow}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
          <Text style={styles.cardTitle}>Health Privacy & Consent</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Control whether sensitive health records and vitals are consulted during briefings
        </Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Consult Health Records</Text>
            <Text style={styles.toggleSubtitle}>
              Incorporate logged symptoms and medication schedule into agenda
            </Text>
          </View>
          <Switch
            disabled={!soloMode}
            value={soloCareHealthIntegration}
            onValueChange={(val) => {
              setSoloCareHealthIntegration(val);
              handleUpdate({ soloCareHealthIntegration: val });
            }}
            thumbColor={soloCareHealthIntegration ? '#10B981' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(16, 185, 129, 0.3)' }}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Allow Spoken Health Details</Text>
            <Text style={styles.toggleSubtitle}>
              Explicit consent required. When off, health notifications display text only and are never read aloud.
            </Text>
          </View>
          <Switch
            disabled={!soloMode}
            value={allowSpokenHealthDetails}
            onValueChange={(val) => {
              setAllowSpokenHealthDetails(val);
              handleUpdate({ allowSpokenHealthDetails: val });
            }}
            thumbColor={allowSpokenHealthDetails ? '#10B981' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(16, 185, 129, 0.3)' }}
          />
        </View>
      </View>

      {/* Interactive Preview Action */}
      <View style={styles.glassCard}>
        <Text style={styles.cardTitle}>Test Care Briefing</Text>
        <Text style={styles.cardSubtitle}>
          Generates a sample briefing based on your actual local tasks and current quiet-hours state
        </Text>

        <TouchableOpacity
          style={styles.previewBtn}
          onPress={handlePreviewBriefing}
          disabled={isLoadingPreview}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Generate briefing preview"
        >
          {isLoadingPreview ? (
            <ActivityIndicator size="small" color="#050B14" />
          ) : (
            <>
              <Ionicons name="play-outline" size={18} color="#050B14" />
              <Text style={styles.previewBtnText}>Generate Briefing Preview</Text>
            </>
          )}
        </TouchableOpacity>

        {previewBriefing ? (
          <View style={styles.previewResultBox}>
            <View style={styles.previewHeaderRow}>
              <Text style={styles.previewResultTitle}>Generated Briefing:</Text>
              <Text style={styles.previewMeta}>
                Tasks: {previewBriefing.tasksCount} | Reminders: {previewBriefing.remindersCount}
              </Text>
            </View>
            <Text style={styles.previewText}>{previewBriefing.spokenText}</Text>
            {previewBriefing.isWithinQuietHours ? (
              <View style={styles.quietHoursBadge}>
                <Ionicons name="moon-outline" size={14} color="#A78BFA" />
                <Text style={styles.quietHoursText}>Quiet Hours Active — Muted</Text>
              </View>
            ) : null}
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
  glassCardActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(13, 21, 44, 0.85)',
  },
  glassCardDimmed: {
    opacity: 0.5,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterInfo: {
    flex: 1,
    marginRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  masterTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: '#00E5FF',
  },
  badgeInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderColor: '#64748B',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusTextActive: {
    color: '#00E5FF',
  },
  statusTextInactive: {
    color: '#94A3B8',
  },
  masterDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 10,
  },
  timeSelectorSection: {
    marginTop: 8,
    marginBottom: 6,
  },
  selectorLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  timeChips: {
    gap: 8,
  },
  timeChip: {
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  timeChipActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  timeTextActive: {
    color: '#00E5FF',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  previewBtnText: {
    color: '#050B14',
    fontSize: 14,
    fontWeight: '700',
  },
  previewResultBox: {
    marginTop: 14,
    backgroundColor: 'rgba(5, 11, 25, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewResultTitle: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewMeta: {
    color: '#64748B',
    fontSize: 11,
  },
  previewText: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 18,
  },
  quietHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  quietHoursText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '600',
  },
});

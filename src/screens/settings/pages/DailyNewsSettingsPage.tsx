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
import { DailyNewsService, NewsHeadlineItem } from '../../../services/news/dailyNewsService';
import { SpeechService } from '../../../services/voice/speechService';

interface DailyNewsSettingsPageProps {
  onBack: () => void;
}

const NEWS_TOPICS: Array<{ id: 'top' | 'technology' | 'business' | 'science' | 'health'; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'top', label: 'Top World', icon: 'globe-outline' },
  { id: 'technology', label: 'Technology', icon: 'hardware-chip-outline' },
  { id: 'business', label: 'Business', icon: 'trending-up-outline' },
  { id: 'science', label: 'Science', icon: 'flask-outline' },
  { id: 'health', label: 'Health', icon: 'fitness-outline' },
];

const SCHEDULE_TIMES = ['06:00', '07:00', '08:00', '09:00', '18:00', '21:00'];

export const DailyNewsSettingsPage: React.FC<DailyNewsSettingsPageProps> = ({ onBack }) => {
  const { preferences, updatePreferences, isOnline, appLanguage } = useApp();

  const [dailyNewsEnabled, setDailyNewsEnabled] = useState<boolean>(preferences.dailyNewsEnabled ?? false);
  const [dailyNewsTime, setDailyNewsTime] = useState<string>(preferences.dailyNewsTime || '07:00');
  const [newsTopic, setNewsTopic] = useState<'top' | 'technology' | 'health' | 'science' | 'business'>(
    preferences.newsTopic || 'top'
  );
  const [newsReadAloud, setNewsReadAloud] = useState<boolean>(preferences.newsReadAloud ?? false);

  const newsTimes = useMemo(() => {
    const list = [...SCHEDULE_TIMES];
    if (dailyNewsTime && !list.includes(dailyNewsTime)) {
      list.push(dailyNewsTime);
      list.sort();
    }
    return list;
  }, [dailyNewsTime]);

  const [permissionStatus, setPermissionStatus] = useState<string>('Checking...');
  const [isFetchingPreview, setIsFetchingPreview] = useState<boolean>(false);
  const [previewHeadlines, setPreviewHeadlines] = useState<NewsHeadlineItem[] | null>(null);
  const [isSpeakingPreview, setIsSpeakingPreview] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<string>('');

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'Granted' : 'Not Granted');
    } catch {
      setPermissionStatus('Unavailable');
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'Granted' : 'Denied');
      if (status !== 'granted') {
        Alert.alert(
          'Notification Permission',
          'Notification permissions are required for scheduled morning delivery. You can enable them in Android App Settings.'
        );
      }
    } catch (e: any) {
      Alert.alert('Permission Notice', e.message || 'Unable to query permissions.');
    }
  };

  const handleUpdate = async (patch: Partial<typeof preferences>) => {
    setSavedNotice('');
    try {
      await updatePreferences(patch);
      const nextPrefs = { ...preferences, ...patch };

      if (patch.dailyNewsEnabled !== undefined || patch.dailyNewsTime !== undefined) {
        if (nextPrefs.dailyNewsEnabled) {
          await DailyNewsService.scheduleDailyNewsNotification(nextPrefs).catch(() => {});
        } else {
          await DailyNewsService.cancelDailyNewsSchedule().catch(() => {});
        }
      }

      setSavedNotice('Daily News preferences saved');
      setTimeout(() => setSavedNotice(''), 3000);
    } catch (e: any) {
      setSavedNotice(e.message || 'Error saving Daily News');
    }
  };

  const handleFetchPreview = async () => {
    if (!isOnline) {
      Alert.alert('Offline Notice', 'An active internet connection is required to fetch live headlines.');
      return;
    }

    setIsFetchingPreview(true);
    setPreviewHeadlines(null);
    try {
      const items = await DailyNewsService.fetchLiveHeadlines(newsTopic);
      setPreviewHeadlines(items);
    } catch (err: any) {
      Alert.alert('News Notice', err.message || 'Unable to retrieve live RSS feed.');
    } finally {
      setIsFetchingPreview(false);
    }
  };

  const handleTestReadAloud = async () => {
    if (!previewHeadlines || previewHeadlines.length === 0) return;
    if (isSpeakingPreview) {
      await SpeechService.stop();
      setIsSpeakingPreview(false);
      return;
    }

    setIsSpeakingPreview(true);
    const briefingText = `Here is your ${newsTopic} news briefing. First: ${previewHeadlines[0]?.title || ''}. Second: ${previewHeadlines[1]?.title || ''}.`;
    await SpeechService.speak(briefingText, {
      language: appLanguage,
      rate: preferences.speechRate || 1.0,
      pitch: preferences.speechPitch || 1.0,
      onDone: () => setIsSpeakingPreview(false),
      onError: () => setIsSpeakingPreview(false),
    });
  };

  return (
    <ScrollView
      testID="settings-page-dailynews"
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
      <View style={[styles.glassCard, dailyNewsEnabled && styles.glassCardActive]}>
        <View style={styles.masterRow}>
          <View style={styles.masterInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.masterTitle}>Daily News Briefing</Text>
              <View style={[styles.statusBadge, dailyNewsEnabled ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.statusText, dailyNewsEnabled ? styles.statusTextActive : styles.statusTextInactive]}>
                  {dailyNewsEnabled ? 'ACTIVE' : 'MUTED'}
                </Text>
              </View>
            </View>
            <Text style={styles.masterDesc}>
              Scheduled authentic world & technology headlines delivered daily at zero API cost
            </Text>
          </View>
          <Switch
            value={dailyNewsEnabled}
            onValueChange={(val) => {
              setDailyNewsEnabled(val);
              handleUpdate({ dailyNewsEnabled: val });
            }}
            thumbColor={dailyNewsEnabled ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>
      </View>

      {/* Topics Selection */}
      <View style={[styles.glassCard, !dailyNewsEnabled && styles.glassCardDimmed]}>
        <Text style={styles.cardTitle}>Headline Category</Text>
        <Text style={styles.cardSubtitle}>Select your primary news briefing topic</Text>

        <View style={styles.topicsGrid}>
          {NEWS_TOPICS.map((topic) => {
            const isSelected = newsTopic === topic.id;
            return (
              <TouchableOpacity
                key={topic.id}
                disabled={!dailyNewsEnabled}
                style={[styles.topicChip, isSelected && styles.topicChipActive]}
                onPress={() => {
                  setNewsTopic(topic.id);
                  handleUpdate({ newsTopic: topic.id });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Category ${topic.label}`}
              >
                <Ionicons
                  name={topic.icon}
                  size={16}
                  color={isSelected ? '#00E5FF' : '#94A3B8'}
                />
                <Text style={[styles.topicText, isSelected && styles.topicTextActive]}>
                  {topic.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Schedule & Timing */}
      <View style={[styles.glassCard, !dailyNewsEnabled && styles.glassCardDimmed]}>
        <Text style={styles.cardTitle}>Delivery Schedule</Text>
        <Text style={styles.cardSubtitle}>
          Suggested default: 07:00 AM (Delivered via local Android notification)
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChips}>
          {newsTimes.map((time) => (
            <TouchableOpacity
              key={time}
              disabled={!dailyNewsEnabled}
              style={[styles.timeChip, dailyNewsTime === time && styles.timeChipActive]}
              onPress={() => {
                setDailyNewsTime(time);
                handleUpdate({ dailyNewsTime: time });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Deliver at ${time}`}
            >
              <Text style={[styles.timeText, dailyNewsTime === time && styles.timeTextActive]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Voice Read-Aloud Consent */}
      <View style={[styles.glassCard, !dailyNewsEnabled && styles.glassCardDimmed]}>
        <View style={styles.headerRow}>
          <Ionicons name="volume-medium-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Spoken Read-Aloud Consent</Text>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>Read Headlines Aloud</Text>
            <Text style={styles.toggleSubtitle}>
              When enabled, prompts before speaking headlines aloud. When disabled, briefings remain silent text.
            </Text>
          </View>
          <Switch
            disabled={!dailyNewsEnabled}
            value={newsReadAloud}
            onValueChange={(val) => {
              setNewsReadAloud(val);
              handleUpdate({ newsReadAloud: val });
            }}
            thumbColor={newsReadAloud ? '#00E5FF' : '#94A3B8'}
            trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: 'rgba(0, 229, 255, 0.3)' }}
          />
        </View>
      </View>

      {/* Notification Permission Card */}
      <View style={styles.glassCard}>
        <View style={styles.permissionRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.cardTitle}>Android Notification Status</Text>
            <Text style={styles.cardSubtitle}>
              Required for scheduled morning headlines: {permissionStatus}
            </Text>
          </View>
          {permissionStatus !== 'Granted' ? (
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={handleRequestPermission}
              accessibilityRole="button"
              accessibilityLabel="Request notification permissions"
            >
              <Text style={styles.permissionBtnText}>Enable</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.grantedBadge}>
              <Ionicons name="checkmark-done" size={16} color="#10B981" />
              <Text style={styles.grantedText}>Ready</Text>
            </View>
          )}
        </View>
      </View>

      {/* Live RSS Feed Preview */}
      <View style={styles.glassCard}>
        <Text style={styles.cardTitle}>Live News Feed Test</Text>
        <Text style={styles.cardSubtitle}>
          Verifies real headlines from public BBC RSS at ₹0 cost
        </Text>

        <TouchableOpacity
          style={styles.previewBtn}
          onPress={handleFetchPreview}
          disabled={isFetchingPreview}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Fetch latest headlines"
        >
          {isFetchingPreview ? (
            <ActivityIndicator size="small" color="#050B14" />
          ) : (
            <>
              <Ionicons name="cloud-download-outline" size={18} color="#050B14" />
              <Text style={styles.previewBtnText}>Fetch Latest Headlines</Text>
            </>
          )}
        </TouchableOpacity>

        {previewHeadlines ? (
          <View style={styles.headlinesBox}>
            <View style={styles.previewMetaRow}>
              <Text style={styles.headlineCountText}>Retrieved {previewHeadlines.length} Live Items</Text>
              {newsReadAloud ? (
                <TouchableOpacity
                  style={styles.readAloudBtn}
                  onPress={handleTestReadAloud}
                  accessibilityRole="button"
                  accessibilityLabel="Read headlines aloud"
                >
                  <Ionicons name={isSpeakingPreview ? 'stop-circle' : 'volume-high'} size={14} color="#00E5FF" />
                  <Text style={styles.readAloudBtnText}>{isSpeakingPreview ? 'Stop' : 'Read Aloud'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {previewHeadlines.slice(0, 3).map((item, idx) => (
              <View key={item.id || idx} style={styles.headlineItem}>
                <Text style={styles.headlineBullet}>{idx + 1}.</Text>
                <View style={styles.headlineContent}>
                  <Text style={styles.headlineTitle}>{item.title}</Text>
                  <Text style={styles.headlineSource}>{item.source || 'Public RSS Feed'}</Text>
                </View>
              </View>
            ))}
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
    marginBottom: 12,
    lineHeight: 18,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topicChipActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
  },
  topicText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  topicTextActive: {
    color: '#00E5FF',
  },
  timeChips: {
    gap: 8,
  },
  timeChip: {
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    fontSize: 13,
    fontWeight: '600',
  },
  timeTextActive: {
    color: '#00E5FF',
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
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  permissionBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '700',
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  grantedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  previewBtnText: {
    color: '#050B14',
    fontSize: 14,
    fontWeight: '700',
  },
  headlinesBox: {
    marginTop: 14,
    backgroundColor: 'rgba(5, 11, 25, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headlineCountText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  readAloudBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  readAloudBtnText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '600',
  },
  headlineItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headlineBullet: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  headlineContent: {
    flex: 1,
  },
  headlineTitle: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  headlineSource: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { useApp } from '../context/AppContext';
import {
  NewsService,
  NewsArticle,
  NewsPreferences,
} from '../services/news/newsService';
import { DailyNewsService } from '../services/news/dailyNewsService';
import { StorageService } from '../services/storage';
import type { ScreenNavProp } from '../types/navigation';

interface NewsIntelligenceScreenProps {
  navigation: ScreenNavProp<'NewsIntelligence'>;
}

export const NewsIntelligenceScreen: React.FC<NewsIntelligenceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { preferences, updatePreferences, t } = useApp();
  const [feed, setFeed] = useState<NewsArticle[]>([]);
  const [breakingAlerts, setBreakingAlerts] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [prefs, setPrefs] = useState<NewsPreferences>({
    digestTime: '08:00 AM',
    enabledCategories: ['ai_tech', 'india', 'education', 'world', 'business'],
    breakingAlertsEnabled: true,
    maxDigestArticles: 5,
  });

  // Daily News Scheduling State
  const [dailyNewsEnabled, setDailyNewsEnabled] = useState(preferences.dailyNewsEnabled ?? true);
  const [dailyNewsTime, setDailyNewsTime] = useState(preferences.dailyNewsTime ?? '08:00');
  const [newsLanguage, setNewsLanguage] = useState<'en-US' | 'ta-IN' | 'hi-IN'>((preferences.newsLanguage as any) || 'en-US');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState(preferences.dailyNewsTime ?? '08:00');

  // Spoken News State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (targetLang?: 'en-US' | 'ta-IN' | 'hi-IN') => {
    const savedPrefs = await StorageService.getPreferences();
    const effectiveLang = targetLang || (savedPrefs.newsLanguage as any) || newsLanguage || 'en-US';

    const p = await NewsService.getPreferences();
    setPrefs(p);

    const digest = await NewsService.getCuratedDigest(effectiveLang);
    setFeed(digest.articles);
    setBreakingAlerts(digest.breakingAlerts);

    if (savedPrefs.dailyNewsEnabled !== undefined) setDailyNewsEnabled(savedPrefs.dailyNewsEnabled);
    if (savedPrefs.dailyNewsTime) {
      setDailyNewsTime(savedPrefs.dailyNewsTime);
      setCustomTimeInput(savedPrefs.dailyNewsTime);
    }
    if (savedPrefs.newsLanguage && !targetLang) setNewsLanguage(savedPrefs.newsLanguage as any);
  };

  const handleToggleSchedule = async (enabled: boolean) => {
    setDailyNewsEnabled(enabled);
    const updated = { ...preferences, dailyNewsEnabled: enabled, dailyNewsTime };
    await updatePreferences({ dailyNewsEnabled: enabled });
    if (enabled) {
      await DailyNewsService.scheduleDailyNewsNotification(updated);
    } else {
      await DailyNewsService.cancelDailyNewsSchedule();
    }
  };

  const handleSaveCustomTime = async (timeStr: string) => {
    const trimmed = timeStr.trim();
    if (!/^\d{2}:\d{2}$/.test(trimmed)) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.alert) window.alert('Please enter time in HH:MM 24-hour format (e.g. 08:30)');
      } else {
        Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g. 08:30)');
      }
      return;
    }
    setDailyNewsTime(trimmed);
    setIsEditingTime(false);
    const updated = { ...preferences, dailyNewsEnabled, dailyNewsTime: trimmed };
    await updatePreferences({ dailyNewsTime: trimmed });
    if (dailyNewsEnabled) {
      await DailyNewsService.scheduleDailyNewsNotification(updated);
    }
  };

  const handleSelectNewsLanguage = async (lang: 'en-US' | 'ta-IN' | 'hi-IN') => {
    if (isPlayingAudio) {
      await DailyNewsService.stopNewsAudio();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
    setNewsLanguage(lang);
    await updatePreferences({ newsLanguage: lang } as any);
    await loadNews(lang);
  };

  // Audio Spoken News Handlers
  const handlePlayAudio = async () => {
    if (filteredFeed.length === 0) return;
    setIsPlayingAudio(true);
    setIsPausedAudio(false);

    let speechText = '';
    if (newsLanguage === 'ta-IN') {
      speechText = 'இன்றைய செய்தித் தொகுப்பு. ';
    } else if (newsLanguage === 'hi-IN') {
      speechText = 'आज का समाचार बुलेटिन. ';
    } else {
      speechText = 'Here is your daily news briefing. ';
    }

    filteredFeed.slice(0, 5).forEach((item, index) => {
      speechText += `${index + 1}. ${item.title}. ${item.summary} `;
    });

    try {
      await DailyNewsService.playNewsAudio(speechText, newsLanguage, () => {
        setIsPlayingAudio(false);
        setIsPausedAudio(false);
      });
    } catch {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const handlePauseAudio = async () => {
    await DailyNewsService.pauseNewsAudio();
    setIsPausedAudio(true);
  };

  const handleResumeAudio = async () => {
    await DailyNewsService.resumeNewsAudio();
    setIsPausedAudio(false);
  };

  const handleStopAudio = async () => {
    await DailyNewsService.stopNewsAudio();
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'ai_tech', label: 'AI & Tech' },
    { id: 'education', label: 'Education' },
    { id: 'india', label: 'India' },
    { id: 'world', label: 'World' },
    { id: 'business', label: 'Business' },
  ];

  const filteredFeed =
    selectedCategory === 'all'
      ? feed
      : feed.filter((item) => item.category === selectedCategory);

  const breakingItem = breakingAlerts[0] || feed.find((i) => i.urgency === 'breaking');

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.eyebrow}>Verified Global Pulse</Text>
            <Text style={styles.title}>{t('news_title')}</Text>
          </View>
          <NexAvatar variant={breakingItem ? 'attention' : 'idle'} size="sm" />
        </View>

        {/* Breaking News Alert Banner */}
        {breakingItem && (
          <GlassCard style={styles.breakingCard}>
            <View style={styles.breakingBadge}>
              <Text style={styles.breakingBadgeText}>🚨 BREAKING INTELLIGENCE</Text>
            </View>
            <Text style={styles.breakingTitle}>{breakingItem.title}</Text>
            <Text style={styles.breakingSummary}>{breakingItem.summary}</Text>
            <Text style={styles.breakingMeta}>Source: {breakingItem.source}</Text>
          </GlassCard>
        )}

        {/* Scheduled Digest & Custom Time Picker Card */}
        <GlassCard style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleTitle}>{t('news_schedule_title')}</Text>
              <Text style={styles.scheduleSub}>
                {dailyNewsEnabled
                  ? `Scheduled daily at ${dailyNewsTime} (Local Time)`
                  : 'Daily scheduled briefing is disabled'}
              </Text>
            </View>
            <Switch
              value={dailyNewsEnabled}
              onValueChange={handleToggleSchedule}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
            />
          </View>

          {/* Time Selector Row */}
          {dailyNewsEnabled && (
            <View style={styles.timeSelectorRow}>
              <Text style={styles.timeLabel}>{t('news_custom_time')}:</Text>
              {['07:00', '08:00', '09:00', '18:00'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.timeChip, dailyNewsTime === preset && styles.timeChipActive]}
                  onPress={() => handleSaveCustomTime(preset)}
                >
                  <Text style={[styles.timeChipText, dailyNewsTime === preset && styles.timeChipTextActive]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.customTimeBtn}
                onPress={() => setIsEditingTime(!isEditingTime)}
              >
                <Ionicons name="time-outline" size={14} color={theme.colors.accent.primary} />
                <Text style={styles.customTimeBtnText}>Custom</Text>
              </TouchableOpacity>
            </View>
          )}

          {isEditingTime && (
            <View style={styles.customTimeInputBox}>
              <TextInput
                style={[
                  styles.timeInput,
                  Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as any) : undefined,
                ]}
                value={customTimeInput}
                onChangeText={setCustomTimeInput}
                placeholder="HH:MM (24h)"
                placeholderTextColor={theme.colors.text.tertiary}
                maxLength={5}
              />
              <TouchableOpacity
                style={styles.saveTimeBtn}
                onPress={() => handleSaveCustomTime(customTimeInput)}
              >
                <Text style={styles.saveTimeBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Independent News Language Selector */}
          <View style={styles.newsLangRow}>
            <Text style={styles.newsLangLabel}>{t('news_language_title')}:</Text>
            {(
              [
                { code: 'en-US', label: 'English' },
                { code: 'ta-IN', label: 'தமிழ்' },
                { code: 'hi-IN', label: 'हिन्दी' },
              ] as const
            ).map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[styles.langChip, newsLanguage === item.code && styles.langChipActive]}
                onPress={() => handleSelectNewsLanguage(item.code)}
              >
                <Text style={[styles.langChipText, newsLanguage === item.code && styles.langChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Spoken News / Listen Aloud Player Card */}
        <GlassCard style={styles.audioPlayerCard}>
          <View style={styles.audioHeader}>
            <View style={styles.audioIconBadge}>
              <Ionicons
                name={isPlayingAudio ? 'volume-high' : 'volume-medium-outline'}
                size={18}
                color={theme.colors.accent.primary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.audioTitle}>{t('news_listen_aloud')}</Text>
              <Text style={styles.audioSub}>
                {isPlayingAudio
                  ? isPausedAudio
                    ? 'Paused'
                    : 'Reading top verified headlines aloud...'
                  : 'High-clarity native speech narration'}
              </Text>
            </View>
            <View style={styles.audioControls}>
              {!isPlayingAudio ? (
                <TouchableOpacity style={styles.playBtn} onPress={handlePlayAudio}>
                  <Ionicons name="play" size={16} color="#050B14" />
                  <Text style={styles.playBtnText}>{t('news_play')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {isPausedAudio ? (
                    <TouchableOpacity style={styles.controlSmallBtn} onPress={handleResumeAudio}>
                      <Ionicons name="play" size={14} color={theme.colors.accent.primary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.controlSmallBtn} onPress={handlePauseAudio}>
                      <Ionicons name="pause" size={14} color={theme.colors.accent.primary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[styles.controlSmallBtn, styles.stopBtn]} onPress={handleStopAudio}>
                    <Ionicons name="stop" size={14} color={theme.colors.status.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Zero-Fake-News Transparency Guarantee */}
        <View style={styles.guaranteePill}>
          <Text style={styles.guaranteeText}>
            🛡️ Zero Fake News Pipeline: Importance &gt; Relevance &gt; Verified Sources Only
          </Text>
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isSelected && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filtered News Feed */}
        {filteredFeed.map((item) => (
          <GlassCard key={item.id} style={styles.newsCard}>
            <View style={styles.newsHeader}>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{item.category.toUpperCase()}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{item.importanceScore}% Importance</Text>
              </View>
            </View>

            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.newsSummary}>{item.summary}</Text>

            {item.keyInsights && item.keyInsights.length > 0 && (
              <View style={styles.insightsBox}>
                {item.keyInsights.map((ins, i) => (
                  <Text key={i} style={styles.insightText}>• {ins}</Text>
                ))}
              </View>
            )}

            <View style={styles.newsFooter}>
              <Text style={styles.sourceText}>📡 {item.source}</Text>
              <Text style={styles.relText}>Urgency: {item.urgency.toUpperCase()}</Text>
            </View>
          </GlassCard>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  backIcon: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  eyebrow: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontFamily: theme.typography.fontFamily.bold,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontFamily: theme.typography.fontFamily.bold,
  },
  breakingCard: {
    padding: theme.spacing.md,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  breakingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
  },
  breakingBadgeText: {
    color: '#EF4444',
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
  },
  breakingTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 4,
  },
  breakingSummary: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  breakingMeta: {
    color: theme.colors.text.muted,
    fontSize: 9,
    marginTop: 6,
  },
  scheduleCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  scheduleSub: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  timeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginRight: 4,
  },
  timeChip: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  timeChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  timeChipText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  timeChipTextActive: {
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  customTimeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
  },
  customTimeBtnText: {
    fontSize: 11,
    color: theme.colors.accent.primary,
  },
  customTimeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timeInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.accent.primary,
    color: theme.colors.text.primary,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 90,
  },
  saveTimeBtn: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  saveTimeBtnText: {
    color: '#050B14',
    fontSize: 11,
    fontWeight: '700',
  },
  newsLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  newsLangLabel: {
    fontSize: 11,
    color: theme.colors.text.muted,
    marginRight: 4,
  },
  langChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: theme.colors.accent.primary,
  },
  langChipText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  langChipTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: '700',
  },
  audioPlayerCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  audioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
  },
  audioTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
  },
  audioSub: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    marginTop: 1,
  },
  audioControls: {
    marginLeft: 8,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  playBtnText: {
    color: '#050B14',
    fontSize: 11,
    fontWeight: '700',
  },
  controlSmallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  stopBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  guaranteePill: {
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
    marginBottom: 12,
  },
  guaranteeText: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
  },
  catScroll: {
    marginBottom: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 8,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  catChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: theme.colors.accent.primary,
    borderWidth: 1,
  },
  catChipText: {
    color: theme.colors.text.muted,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
  },
  catChipTextActive: {
    color: theme.colors.accent.primary,
  },
  newsCard: {
    marginTop: 10,
    padding: theme.spacing.md,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  catBadgeText: {
    fontSize: 9,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  scoreBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  scoreText: {
    fontSize: 10,
    color: '#10B981',
    fontFamily: theme.typography.fontFamily.bold,
  },
  newsTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 8,
    lineHeight: 20,
  },
  newsSummary: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  insightsBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  insightText: {
    color: theme.colors.text.secondary,
    fontSize: 10,
    lineHeight: 16,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    marginTop: 10,
    paddingTop: 8,
  },
  sourceText: {
    color: theme.colors.text.muted,
    fontSize: 10,
  },
  relText: {
    color: theme.colors.text.muted,
    fontSize: 10,
  },
});

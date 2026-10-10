import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { GlassCard } from '../components/common/GlassCard';
import { NexAvatar } from '../components/avatar/NexAvatar';
import {
  NewsService,
  NewsArticle,
  NewsPreferences,
} from '../services/news/newsService';
import type { ScreenNavProp } from '../types/navigation';

interface NewsIntelligenceScreenProps {
  navigation: ScreenNavProp<'NewsIntelligence'>;
}

export const NewsIntelligenceScreen: React.FC<NewsIntelligenceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<NewsArticle[]>([]);
  const [breakingAlerts, setBreakingAlerts] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [prefs, setPrefs] = useState<NewsPreferences>({
    digestTime: '08:00 AM',
    enabledCategories: ['ai_tech', 'india', 'education', 'world', 'business'],
    breakingAlertsEnabled: true,
    maxDigestArticles: 5,
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    const preferences = await NewsService.getPreferences();
    setPrefs(preferences);
    const digest = await NewsService.getCuratedDigest();
    setFeed(digest.articles);
    setBreakingAlerts(digest.breakingAlerts);
  };

  const handleToggleBreakingAlerts = async (value: boolean) => {
    const updated = await NewsService.savePreferences({ breakingAlertsEnabled: value });
    setPrefs(updated);
    Alert.alert('Preferences Saved', value ? 'Breaking news alerts active.' : 'Breaking news alerts muted.');
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
            <Text style={styles.title}>News Intelligence</Text>
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

        {/* Scheduled Digest Preference Banner */}
        <GlassCard style={styles.scheduleCard}>
          <View style={styles.scheduleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleTitle}>Daily Scheduled Digest</Text>
              <Text style={styles.scheduleSub}>
                Delivered every morning at {prefs.digestTime}
              </Text>
            </View>
            <Switch
              value={prefs.breakingAlertsEnabled}
              onValueChange={handleToggleBreakingAlerts}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: theme.colors.accent.primary }}
            />
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: theme.colors.text.primary,
    fontSize: 18,
  },
  eyebrow: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  breakingCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  breakingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 6,
  },
  breakingBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 0.8,
  },
  breakingTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily.bold,
  },
  breakingSummary: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  breakingMeta: {
    color: theme.colors.text.muted,
    fontSize: 10,
    marginTop: 6,
  },
  scheduleCard: {
    padding: 12,
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
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  guaranteePill: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  guaranteeText: {
    color: theme.colors.accent.primary,
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
  },
  catScroll: {
    marginBottom: theme.spacing.md,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
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
    justifyContent: 'space-between',
    alignItems: 'center',
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

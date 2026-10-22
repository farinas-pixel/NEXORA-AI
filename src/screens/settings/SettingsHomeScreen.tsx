import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { GlassmorphicCategoryCard } from './components/GlassmorphicCategoryCard';

export type SettingsCategoryId =
  | 'profile'
  | 'personalization'
  | 'solomode'
  | 'dailynews'
  | 'privacymemory'
  | 'voicenotifications'
  | 'accountsecurity'
  | 'aboutnexora';

interface SettingsHomeScreenProps {
  onSelectCategory: (categoryId: SettingsCategoryId) => void;
  onExit: () => void;
}

interface CategoryDefinition {
  id: SettingsCategoryId;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'violet' | 'emerald' | 'amber';
  keywords: string[];
}

export const SettingsHomeScreen: React.FC<SettingsHomeScreenProps> = ({
  onSelectCategory,
  onExit,
}) => {
  const { user, preferences, memories } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const CATEGORIES: CategoryDefinition[] = useMemo(
    () => [
      {
        id: 'profile',
        title: 'My Profile',
        subtitle: 'Manage display identity, personal photo, and language',
        iconName: 'person-outline',
        iconColor: '#00E5FF',
        keywords: ['profile', 'name', 'birthday', 'avatar', 'picture', 'language', 'email'],
      },
      {
        id: 'personalization',
        title: 'Personalization',
        subtitle: 'AI conversational style, tone, and visual accessibility',
        iconName: 'sparkles-outline',
        iconColor: '#A78BFA',
        badge: preferences.responseStyle ? preferences.responseStyle.toUpperCase() : undefined,
        badgeVariant: 'violet',
        keywords: ['style', 'concise', 'detailed', 'contrast', 'motion', 'tone'],
      },
      {
        id: 'solomode',
        title: 'Solo Mode',
        subtitle: 'Personalized care briefings, morning greetings, and health consent',
        iconName: 'heart-half-outline',
        iconColor: '#F472B6',
        badge: preferences.soloMode ? 'ACTIVE' : undefined,
        badgeVariant: 'emerald',
        keywords: ['solo', 'care', 'greeting', 'checkin', 'quiet hours', 'health', 'briefing'],
      },
      {
        id: 'dailynews',
        title: 'Daily News',
        subtitle: 'Scheduled authentic world headlines, topics, and spoken consent',
        iconName: 'newspaper-outline',
        iconColor: '#38BDF8',
        badge: preferences.dailyNewsEnabled ? '07:00' : undefined,
        badgeVariant: 'cyan',
        keywords: ['news', 'briefing', 'headlines', 'read aloud', 'schedule', 'bbc'],
      },
      {
        id: 'privacymemory',
        title: 'Privacy & Memory',
        subtitle: 'Review sovereign memory vault, security tiers, and airgap limits',
        iconName: 'file-tray-full-outline',
        iconColor: '#34D399',
        badge: memories && memories.length > 0 ? `${memories.length} ITEMS` : undefined,
        badgeVariant: 'emerald',
        keywords: ['memory', 'privacy', 'vault', 'encryption', 'learning', 'clear'],
      },
      {
        id: 'voicenotifications',
        title: 'Voice & Notifications',
        subtitle: 'Speech synthesizer model, pitch/rate calibration, and quiet window',
        iconName: 'mic-outline',
        iconColor: '#00E5FF',
        keywords: ['voice', 'speech', 'synthesizer', 'rate', 'pitch', 'notifications', 'alarm'],
      },
      {
        id: 'accountsecurity',
        title: 'Account & Security',
        subtitle: 'Registered credentials, password reset, and session sign-out',
        iconName: 'shield-checkmark-outline',
        iconColor: '#FBBF24',
        badgeVariant: 'amber',
        keywords: ['account', 'security', 'password', 'logout', 'signout', 'session'],
      },
      {
        id: 'aboutnexora',
        title: 'About NEXORA',
        subtitle: 'Version 1.0.0, architecture specifications, and legal protocols',
        iconName: 'information-circle-outline',
        iconColor: '#94A3B8',
        badge: 'v1.0.0',
        badgeVariant: 'cyan',
        keywords: ['about', 'version', 'terms', 'privacy policy', 'license', 'architecture'],
      },
    ],
    [preferences, memories]
  );

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(
      (cat) =>
        cat.title.toLowerCase().includes(q) ||
        cat.subtitle.toLowerCase().includes(q) ||
        cat.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery, CATEGORIES]);

  return (
    <ScrollView
      testID="settings-home-screen"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Summary Card (Tapping opens My Profile) */}
      <TouchableOpacity
        testID="settings-profile-summary-card"
        style={styles.profileSummaryCard}
        onPress={() => onSelectCategory('profile')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`My Profile. ${user?.name || 'Authorized Member'}. ${user?.email || 'Authenticated Session'}. Tap to open profile settings`}
      >
        <View style={styles.profileSpecularHighlight} />

        <View style={styles.profileRow}>
          <View style={styles.avatarWrapper}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>{userInitials}</Text>
              </View>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {user?.name || 'Authorized Member'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email || 'Authenticated Session'}
            </Text>
            <View style={styles.securityTag}>
              <Ionicons name="shield-checkmark" size={11} color="#00E5FF" />
              <Text style={styles.securityTagText}>Sovereign Vault Active</Text>
            </View>
          </View>

          <View style={styles.profileChevron}>
            <Ionicons name="chevron-forward" size={20} color="#00E5FF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Real-time Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="rgba(0, 229, 255, 0.7)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search settings, voice, privacy..."
          placeholderTextColor="rgba(255, 255, 255, 0.4)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          accessibilityLabel="Search settings"
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
          >
            <Ionicons name="close-circle" size={16} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category List */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionHeader}>Preferences & Controls</Text>

        {filteredCategories.length === 0 ? (
          <View style={styles.noResultsBox}>
            <Ionicons name="search" size={28} color="#64748B" />
            <Text style={styles.noResultsText}>No settings matching "{searchQuery}"</Text>
          </View>
        ) : (
          filteredCategories.map((cat) => (
            <GlassmorphicCategoryCard
              key={cat.id}
              id={cat.id}
              title={cat.title}
              subtitle={cat.subtitle}
              iconName={cat.iconName}
              iconColor={cat.iconColor}
              badge={cat.badge}
              badgeVariant={cat.badgeVariant}
              onPress={() => onSelectCategory(cat.id)}
            />
          ))
        )}
      </View>

      {/* Footer Branding */}
      <View style={styles.footerContainer}>
        <Text style={styles.footerBrand}>NEXORA AI</Text>
        <Text style={styles.footerVersion}>Universal Android Release • v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSummaryCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.85)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.28)',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  profileSpecularHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(5, 11, 25, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  initialsAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#00E5FF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 6,
  },
  securityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  securityTagText: {
    color: '#00E5FF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profileChevron: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 21, 44, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },
  categoriesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  noResultsText: {
    color: '#64748B',
    fontSize: 14,
  },
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  footerBrand: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 2,
  },
  footerVersion: {
    color: 'rgba(148, 163, 184, 0.5)',
    fontSize: 11,
  },
});

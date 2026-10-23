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
import { GlassButton } from '../components/common/GlassButton';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import { StorageService } from '../services/storage';
import type { ScreenNavProp } from '../types/navigation';

interface LanguageScreenProps {
  navigation: ScreenNavProp<'Language'>;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  badge?: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English', nativeName: 'English', badge: 'Default' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்', badge: 'தமிழ்' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी', badge: 'हिन्दी' },
];

export const LanguageScreen: React.FC<LanguageScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, appLanguage, setAppLanguage, setAiLanguage, t } = useApp();
  const [selectedCode, setSelectedCode] = useState<string>(appLanguage);
  const [saving, setSaving] = useState<boolean>(false);

  const handleSelectLanguage = async (code: string) => {
    setSelectedCode(code);
    const targetLang: 'en-US' | 'ta-IN' | 'hi-IN' =
      code === 'ta-IN' ? 'ta-IN' : code === 'hi-IN' ? 'hi-IN' : 'en-US';
    await setAppLanguage(targetLang);
    // Align AI language default with the chosen language
    await setAiLanguage(code === 'ta-IN' ? 'ta' : code === 'hi-IN' ? 'hi' : 'en');
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const chosen = LANGUAGES.find((l) => l.code === selectedCode);
      const targetLang: 'en-US' | 'ta-IN' | 'hi-IN' =
        selectedCode === 'ta-IN' ? 'ta-IN' : selectedCode === 'hi-IN' ? 'hi-IN' : 'en-US';
      await setAppLanguage(targetLang);
      await setAiLanguage(selectedCode === 'ta-IN' ? 'ta' : selectedCode === 'hi-IN' ? 'hi' : 'en');

      if (user && chosen) {
        await StorageService.saveUserProfile({
          ...user,
          language: chosen.name,
        });
      }

      // If user is already authenticated and navigated here from within app, return to caller
      if (isAuthenticated && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // Unauthenticated onboarding must advance forward to Sign In
        navigation.replace('SignIn');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBackground style={styles.container}>
      <View style={[styles.inner, { paddingTop: insets.top + theme.spacing.md }]}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.iconText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{t('language_header_title')}</Text>
            <Text style={styles.headerSub}>{t('language_header_sub')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.avatarRow}>
          <NexAvatar variant="idle" size="sm" />
          <Text style={styles.avatarPrompt}>
            {t('language_avatar_prompt')}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        >
          <View style={styles.list}>
            {LANGUAGES.map((lang) => {
              const isSelected = selectedCode === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.8}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <GlassCard
                    variant={isSelected ? 'highlight' : 'default'}
                    style={styles.card}
                  >
                    <View style={styles.row}>
                      <View style={styles.info}>
                        <View style={styles.nameRow}>
                          <Text style={styles.langName}>{lang.name}</Text>
                          {lang.badge ? (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>{lang.badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.nativeName}>{lang.nativeName}</Text>
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
        </ScrollView>

        {/* Bottom Confirm Button */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + theme.spacing.md }]}>
          <GlassButton
            title={t('language_confirm_btn')}
            variant="primary"
            loading={saving}
            onPress={handleConfirm}
          />
        </View>
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
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0, 229, 255, 0.04)',
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    marginBottom: theme.spacing.md,
  },
  avatarPrompt: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  list: {
    gap: 8,
  },
  card: {
    padding: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
    color: theme.colors.text.primary,
  },
  nativeName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: 'rgba(5, 8, 20, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: theme.spacing.sm,
  },
});

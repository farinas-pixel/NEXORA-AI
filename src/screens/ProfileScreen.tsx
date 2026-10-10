// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { NexAvatar } from '../components/avatar/NexAvatar';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface ProfileScreenProps {
  navigation: ScreenNavProp<'Profile'>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, signOut, appLanguage, setAppLanguage, resetOnboarding, t } = useApp();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('profile_logout_dialog_title'),
      t('profile_logout_dialog_desc'),
      [
        { text: t('action_cancel'), style: 'cancel' },
        {
          text: t('action_log_out'),
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            } catch (e: any) {
              Alert.alert('Logout Error', e.message || 'Failed to complete logout.');
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleReplayOnboarding = async () => {
    await resetOnboarding();
    navigation.navigate('Welcome');
  };

  const formattedDate = user?.createdDate
    ? new Date(user.createdDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : t('profile_label_active_session');

  return (
    <AppBackground style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingBottom: insets.bottom + theme.spacing.md,
          },
        ]}
      >
        {/* Header with Back Navigation */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>{t('action_back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile_header')}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Avatar and Identity */}
          <View style={styles.avatarSection}>
            <NexAvatar variant="idle" size="lg" />
            <Text style={styles.userName}>{user?.name || t('profile_default_user')}</Text>
            <Text style={styles.userEmail}>{user?.email || t('profile_no_email')}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge label={t('profile_badge_vault')} status="success" />
              <StatusBadge label={t('profile_badge_airgap')} status="info" />
            </View>
          </View>

          {/* Account Details Card */}
          <GlassCard style={styles.detailsCard}>
            <Text style={styles.cardHeader}>{t('profile_section_identity')}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('profile_label_fullname')}</Text>
              <Text style={styles.detailValue}>{user?.name || '—'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('profile_label_email')}</Text>
              <Text style={styles.detailValue}>{user?.email || '—'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRowVertical}>
              <Text style={styles.detailLabel}>{t('profile_label_user_id')}</Text>
              <Text style={styles.detailCode} selectable>
                {user?.id || t('profile_label_unauthenticated')}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('profile_label_member_since')}</Text>
              <Text style={styles.detailValue}>{formattedDate}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('profile_label_app_language')}</Text>
              <Text style={styles.detailValue}>
                {appLanguage === 'ta-IN' ? 'தமிழ் (Tamil)' : 'English (US)'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('profile_label_timezone')}</Text>
              <Text style={styles.detailValue}>
                {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
              </Text>
            </View>
          </GlassCard>

          {/* Language Switcher Card */}
          <GlassCard style={styles.detailsCard}>
            <Text style={styles.cardHeader}>{t('profile_switch_language')}</Text>
            <View style={styles.langButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.langChoiceBtn,
                  appLanguage === 'en-US' && styles.langChoiceBtnActive,
                ]}
                onPress={() => setAppLanguage('en-US')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.langChoiceText,
                    appLanguage === 'en-US' && styles.langChoiceTextActive,
                  ]}
                >
                  English (US)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langChoiceBtn,
                  appLanguage === 'ta-IN' && styles.langChoiceBtnActive,
                ]}
                onPress={() => setAppLanguage('ta-IN')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.langChoiceText,
                    appLanguage === 'ta-IN' && styles.langChoiceTextActive,
                  ]}
                >
                  தமிழ் (Tamil)
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Onboarding Replay Walkthrough Card */}
          <GlassCard style={styles.detailsCard}>
            <Text style={styles.cardHeader}>{t('profile_replay_onboarding_title')}</Text>
            <GlassButton
              title={t('profile_replay_onboarding_btn')}
              variant="secondary"
              onPress={handleReplayOnboarding}
              style={styles.replayBtn}
            />
          </GlassCard>

          {/* Data Privacy Assurance Card */}
          <GlassCard style={styles.privacyCard}>
            <Text style={styles.privacyTitle}>{t('profile_privacy_title')}</Text>
            <Text style={styles.privacyBody}>
              {t('profile_privacy_body')}
            </Text>
          </GlassCard>

          {/* Logout Action */}
          <View style={styles.logoutSection}>
            <GlassButton
              title={t('action_log_out_account')}
              variant="secondary"
              loading={loggingOut}
              onPress={handleLogout}
              style={styles.logoutBtn}
              textStyle={styles.logoutBtnText}
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
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  backBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
  },
  backBtnText: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  headerPlaceholder: {
    width: 50,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  userName: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginTop: theme.spacing.sm,
  },
  userEmail: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  detailsCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  detailRowVertical: {
    paddingVertical: theme.spacing.xs,
    gap: 4,
  },
  detailLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  detailValue: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semiBold,
  },
  detailCode: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  privacyCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
  },
  privacyTitle: {
    color: theme.colors.accent.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: 4,
  },
  privacyBody: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    lineHeight: 18,
  },
  logoutSection: {
    marginTop: theme.spacing.xs,
  },
  logoutBtn: {
    borderColor: 'rgba(255, 82, 82, 0.4)',
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  logoutBtnText: {
    color: '#FF5252',
    fontWeight: theme.typography.fontWeight.bold,
  },
  langButtonsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  langChoiceBtn: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChoiceBtnActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  langChoiceText: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  langChoiceTextActive: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  replayBtn: {
    marginTop: theme.spacing.xs,
  },
});

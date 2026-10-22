// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '../components/common/AppBackground';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import { StatusBadge } from '../components/common/StatusBadge';
import { theme } from '../theme';
import { useApp } from '../context/AppContext';
import type { ScreenNavProp } from '../types/navigation';

interface ProfileScreenProps {
  navigation: ScreenNavProp<'Profile'>;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUserProfile, appLanguage, setAppLanguage, t } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [birthdayInput, setBirthdayInput] = useState(user?.birthday || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleStartEdit = () => {
    setNameInput(user?.name || '');
    setBirthdayInput(user?.birthday || '');
    setAvatarUrlInput(user?.avatarUrl || '');
    setStatusMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setStatusMessage(null);
  };

  const handleSaveProfile = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setStatusMessage({ text: 'Display name cannot be empty.', type: 'error' });
      return;
    }

    const trimmedBirthday = birthdayInput.trim();
    if (trimmedBirthday && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedBirthday)) {
      setStatusMessage({ text: 'Birthday must follow YYYY-MM-DD format (e.g., 1998-05-14).', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      await updateUserProfile({
        name: trimmedName,
        birthday: trimmedBirthday || undefined,
        avatarUrl: avatarUrlInput || undefined,
      });

      setIsEditing(false);
      setStatusMessage({ text: 'Profile changes saved and synced successfully.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarUrlInput('');
  };

  const handleSelectPresetAvatar = (url: string) => {
    setAvatarUrlInput(url);
  };

  const handleLogout = () => {
    if (loggingOut) return;

    Alert.alert(
      t('profile_logout_dialog_title'),
      t('profile_logout_dialog_desc'),
      [
        { text: t('action_cancel'), style: 'cancel' },
        {
          text: t('action_log_out'),
          style: 'destructive',
          onPress: async () => {
            if (loggingOut) return;
            setLoggingOut(true);
            try {
              await signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (e: any) {
              Alert.alert('Logout Notice', e.message || 'Local session cleared.');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const formattedMemberDate = user?.createdDate
    ? new Date(user.createdDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : t('profile_label_active_session');

  // Compute initials for professional fallback avatar
  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.accent.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile_header')}</Text>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editHeaderBtn}
              onPress={handleStartEdit}
              activeOpacity={0.7}
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
            >
              <Ionicons name="pencil-outline" size={18} color="#00E5FF" />
              <Text style={styles.editHeaderBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Status Alert Banner */}
          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError,
              ]}
            >
              <Ionicons
                name={statusMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={18}
                color={statusMessage.type === 'success' ? '#10B981' : '#EF4444'}
              />
              <Text style={styles.statusBannerText}>{statusMessage.text}</Text>
            </View>
          )}

          {/* User Profile Avatar Stage (Professional Human Profile, NOT the robot) */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarImageWrapper}>
              {user?.avatarUrl || avatarUrlInput ? (
                <Image
                  source={{ uri: isEditing ? avatarUrlInput || user?.avatarUrl : user?.avatarUrl }}
                  style={styles.userAvatarImage}
                />
              ) : (
                <View style={styles.userInitialsAvatar}>
                  <Text style={styles.userInitialsText}>{userInitials}</Text>
                </View>
              )}
            </View>

            {isEditing && (
              <View style={styles.avatarPickerRow}>
                <Text style={styles.avatarPickerLabel}>Choose Profile Picture:</Text>
                <View style={styles.presetRow}>
                  {AVATAR_PRESETS.map((pUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleSelectPresetAvatar(pUrl)}
                      style={[
                        styles.presetThumbWrap,
                        avatarUrlInput === pUrl && styles.presetThumbActive,
                      ]}
                    >
                      <Image source={{ uri: pUrl }} style={styles.presetThumb} />
                    </TouchableOpacity>
                  ))}
                  {avatarUrlInput ? (
                    <TouchableOpacity
                      onPress={handleRemoveAvatar}
                      style={styles.removeAvatarBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}

            {!isEditing && (
              <>
                <Text style={styles.userName}>{user?.name || t('profile_default_user')}</Text>
                <Text style={styles.userEmail}>{user?.email || t('profile_no_email')}</Text>
                <View style={styles.badgeRow}>
                  <StatusBadge label={t('profile_badge_vault')} status="success" />
                  <StatusBadge label={t('profile_badge_airgap')} status="info" />
                </View>
              </>
            )}
          </View>

          {/* Edit Form or Read-Only Card */}
          {isEditing ? (
            <GlassCard style={styles.editFormCard}>
              <Text style={styles.cardHeader}>Edit Personal Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name / Display Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Your Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Birthday (Optional - YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  value={birthdayInput}
                  onChangeText={setBirthdayInput}
                  placeholder="e.g. 1998-05-14"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.editActionsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleCancelEdit}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#050B14" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color="#050B14" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
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

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Birthday</Text>
                <Text style={styles.detailValue}>{user?.birthday || 'Not set'}</Text>
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
                <Text style={styles.detailValue}>{formattedMemberDate}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('profile_label_timezone')}</Text>
                <Text style={styles.detailValue}>
                  {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                </Text>
              </View>
            </GlassCard>
          )}

          {/* Language Selection Card */}
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

          {/* Privacy & Airgap Notice */}
          <GlassCard style={styles.privacyCard}>
            <View style={styles.privacyHeaderRow}>
              <Ionicons name="shield-checkmark" size={18} color="#00E5FF" />
              <Text style={styles.privacyTitle}>{t('profile_privacy_title')}</Text>
            </View>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  editHeaderBtnText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  statusBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  avatarImageWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#00E5FF',
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 20, 38, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  userAvatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  userInitialsAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitialsText: {
    color: '#00E5FF',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarPickerRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  avatarPickerLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presetThumbWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  presetThumbActive: {
    borderColor: '#00E5FF',
  },
  presetThumb: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  removeAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.muted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  detailsCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  editFormCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    borderWidth: 1.5,
  },
  cardHeader: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.accent.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 6,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtnText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#00E5FF',
  },
  saveBtnText: {
    color: '#050B14',
    fontSize: 13,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  detailRowVertical: {
    paddingVertical: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  detailCode: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.muted,
    fontFamily: theme.typography.fontFamily.mono,
    marginTop: theme.spacing.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.glass.border,
    marginVertical: 2,
  },
  langButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  langChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    alignItems: 'center',
  },
  langChoiceBtnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: '#00E5FF',
  },
  langChoiceText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  langChoiceTextActive: {
    color: '#00E5FF',
    fontWeight: '700',
  },
  privacyCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    borderWidth: 1,
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00E5FF',
  },
  privacyBody: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
  logoutSection: {
    marginTop: theme.spacing.md,
  },
  logoutBtn: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutBtnText: {
    color: '#EF4444',
  },
});

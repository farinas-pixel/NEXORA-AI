import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';
import { theme } from '../../../theme';

interface ProfileSettingsPageProps {
  onBack: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&h=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80',
];

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({ onBack }) => {
  const { user, updateUserProfile, appLanguage, setAppLanguage } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [birthdayInput, setBirthdayInput] = useState(user?.birthday || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const userInitials = (user?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleStartEdit = () => {
    setNameInput(user?.name || '');
    setBirthdayInput(user?.birthday || '');
    setAvatarUrlInput(user?.avatarUrl || '');
    setStatusMessage(null);
    setIsEditing(true);
  };

  const isDirty =
    nameInput !== (user?.name || '') ||
    birthdayInput !== (user?.birthday || '') ||
    avatarUrlInput !== (user?.avatarUrl || '');

  const handleCancelEdit = () => {
    if (isDirty) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved profile changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setIsEditing(false);
              setStatusMessage(null);
            },
          },
        ]
      );
    } else {
      setIsEditing(false);
      setStatusMessage(null);
    }
  };

  const handleSave = async () => {
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setStatusMessage({ text: 'Display name cannot be blank.', type: 'error' });
      return;
    }

    const trimmedBirthday = birthdayInput.trim();
    if (trimmedBirthday && !/^\d{4}-\d{2}-\d{2}$/.test(trimmedBirthday)) {
      setStatusMessage({
        text: 'Birthday must follow YYYY-MM-DD format (e.g., 1998-05-14).',
        type: 'error',
      });
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
      setStatusMessage({ text: 'Profile changes saved and synchronized successfully.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      testID="settings-page-profile"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Status Banner */}
      {statusMessage && (
        <View
          style={[
            styles.banner,
            statusMessage.type === 'success' ? styles.bannerSuccess : styles.bannerError,
          ]}
        >
          <Ionicons
            name={statusMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={statusMessage.type === 'success' ? '#10B981' : '#EF4444'}
          />
          <Text style={styles.bannerText}>{statusMessage.text}</Text>
        </View>
      )}

      {/* Avatar Stage */}
      <View style={styles.avatarCard}>
        <View style={styles.avatarGlowWrapper}>
          {avatarUrlInput || user?.avatarUrl ? (
            <Image
              source={{ uri: isEditing ? avatarUrlInput || user?.avatarUrl : user?.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>{userInitials}</Text>
            </View>
          )}
        </View>

        {isEditing ? (
          <View style={styles.avatarControls}>
            <Text style={styles.subheading}>Select Profile Picture</Text>
            <View style={styles.presetRow}>
              {AVATAR_PRESETS.map((pUrl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setAvatarUrlInput(pUrl)}
                  style={[
                    styles.presetThumbWrap,
                    avatarUrlInput === pUrl && styles.presetThumbActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Preset avatar ${idx + 1}`}
                >
                  <Image source={{ uri: pUrl }} style={styles.presetThumb} />
                </TouchableOpacity>
              ))}
              {avatarUrlInput ? (
                <TouchableOpacity
                  onPress={() => setAvatarUrlInput('')}
                  style={styles.removeAvatarBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo and use initials avatar"
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.avatarMeta}>
            <Text style={styles.profileName}>{user?.name || 'Authorized Member'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'Authenticated Session'}</Text>
          </View>
        )}
      </View>

      {/* Profile Fields Card */}
      <View style={styles.glassCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Identity Information</Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={handleStartEdit}
              style={styles.editBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Edit identity information"
            >
              <Ionicons name="pencil-outline" size={16} color="#00E5FF" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isEditing ? (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Display Name *</Text>
              <TextInput
                style={styles.textInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Full Name"
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Birthday (Optional - YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                value={birthdayInput}
                onChangeText={setBirthdayInput}
                placeholder="e.g. 1998-05-14"
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.cancelBtn}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Cancel edit"
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveBtn}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#050B14" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#050B14" />
                    <Text style={styles.saveBtnText}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.readOnlyContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Display Name</Text>
              <Text style={styles.infoValue}>{user?.name || '—'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Birthday</Text>
              <Text style={styles.infoValue}>{user?.birthday || 'Not configured'}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Registered Email</Text>
              <Text style={styles.infoValue}>{user?.email || '—'}</Text>
            </View>
            <Text style={styles.helperNote}>
              Note: Email changes require account security re-verification via the authentication provider.
            </Text>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account ID</Text>
              <Text style={styles.codeValue} selectable>
                {user?.id ? `${user.id.slice(0, 14)}...` : 'Local Isolated Session'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Language Preference Card */}
      <View style={styles.glassCard}>
        <Text style={styles.cardTitle}>App Language</Text>
        <Text style={styles.cardSubtitle}>Select your primary interface language</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[
              styles.langChip,
              appLanguage === 'en-US' && styles.langChipActive,
            ]}
            onPress={() => setAppLanguage('en-US')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Set English (US)"
          >
            <Ionicons
              name={appLanguage === 'en-US' ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={appLanguage === 'en-US' ? '#00E5FF' : '#94A3B8'}
            />
            <Text style={[styles.langText, appLanguage === 'en-US' && styles.langTextActive]}>
              English (US)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.langChip,
              appLanguage === 'ta-IN' && styles.langChipActive,
            ]}
            onPress={() => setAppLanguage('ta-IN')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Set Tamil (India)"
          >
            <Ionicons
              name={appLanguage === 'ta-IN' ? 'radio-button-on' : 'radio-button-off'}
              size={18}
              color={appLanguage === 'ta-IN' ? '#00E5FF' : '#94A3B8'}
            />
            <Text style={[styles.langText, appLanguage === 'ta-IN' && styles.langTextActive]}>
              தமிழ் (Tamil)
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  bannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  bannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  avatarCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.20)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarGlowWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(5, 11, 25, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  initialsAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#00E5FF',
    fontSize: 32,
    fontWeight: '800',
  },
  avatarMeta: {
    alignItems: 'center',
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 14,
  },
  avatarControls: {
    width: '100%',
    alignItems: 'center',
  },
  subheading: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 10,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  presetThumbWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  presetThumbActive: {
    borderColor: '#00E5FF',
    borderWidth: 2,
  },
  presetThumb: {
    width: 44,
    height: 44,
  },
  removeAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  editBtnText: {
    color: '#00E5FF',
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00E5FF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#050B14',
    fontSize: 14,
    fontWeight: '700',
  },
  readOnlyContainer: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  codeValue: {
    color: '#00E5FF',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  helperNote: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  langRow: {
    flexDirection: 'row',
    gap: 12,
  },
  langChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 11, 25, 0.7)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  langChipActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
  },
  langText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  langTextActive: {
    color: '#00E5FF',
  },
});

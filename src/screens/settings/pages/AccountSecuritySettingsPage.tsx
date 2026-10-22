import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../../context/AppContext';
import { resetPassword } from '../../../services/auth/authService';

interface AccountSecuritySettingsPageProps {
  onBack: () => void;
  onSignOutComplete?: () => void;
}

export const AccountSecuritySettingsPage: React.FC<AccountSecuritySettingsPageProps> = ({
  onBack,
  onSignOutComplete,
}) => {
  const { user, signOut } = useApp();

  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handlePasswordReset = () => {
    if (!user?.email) {
      Alert.alert('Notice', 'No registered email address found for the active session.');
      return;
    }

    Alert.alert(
      'Password Reset Confirmation',
      `Send a secure password reset link to:\n\n${user.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: async () => {
            setIsSendingReset(true);
            setStatusMessage(null);
            try {
              const res = await resetPassword(user.email);
              if (res.error) {
                setStatusMessage({ text: res.error, type: 'error' });
              } else {
                setStatusMessage({
                  text: 'Password reset link sent to your registered email.',
                  type: 'success',
                });
                setTimeout(() => setStatusMessage(null), 5000);
              }
            } catch (err: any) {
              setStatusMessage({ text: err.message || 'Failed to dispatch reset request.', type: 'error' });
            } finally {
              setIsSendingReset(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out Confirmation',
      'Are you sure you want to log out of NEXORA AI? Your local offline data is safely quarantined to this device and will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              await signOut();
              if (onSignOutComplete) {
                onSignOutComplete();
              }
            } catch (err: any) {
              Alert.alert('Sign Out Notice', err.message || 'Local session cleared.');
              if (onSignOutComplete) {
                onSignOutComplete();
              }
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const formattedCreatedDate = user?.createdDate
    ? new Date(user.createdDate).toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Companion Session';

  return (
    <ScrollView
      testID="settings-page-accountsecurity"
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

      {/* Account Identity Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="person-circle-outline" size={22} color="#00E5FF" />
          <Text style={styles.cardTitle}>Account Identity</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Registered Email</Text>
          <Text style={styles.infoValue}>{user?.email || '—'}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>{formattedCreatedDate}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Storage Isolation</Text>
          <View style={styles.vaultBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.vaultBadgeText}>User-Scoped Vault</Text>
          </View>
        </View>
      </View>

      {/* Security Actions Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="key-outline" size={20} color="#00E5FF" />
          <Text style={styles.cardTitle}>Authentication Security</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          {user?.email
            ? `Dispatch a secure password reset link to ${user.email}`
            : 'No registered email address found for the active session'}
        </Text>

        <TouchableOpacity
          style={[styles.resetBtn, (!user?.email || isSendingReset) && { opacity: 0.5 }]}
          onPress={handlePasswordReset}
          disabled={isSendingReset || !user?.email}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Request password reset"
        >
          {isSendingReset ? (
            <ActivityIndicator size="small" color="#00E5FF" />
          ) : (
            <>
              <Ionicons name="mail-unread-outline" size={18} color="#00E5FF" />
              <Text style={styles.resetBtnText}>Send Password Reset Email</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign-out Action Card */}
      <View style={styles.glassCard}>
        <View style={styles.headerRow}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.cardTitle}>Session Lifecycle</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          End the current session on this device. Local unsynced records remain safely partitioned.
        </Text>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          disabled={isSigningOut}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Sign out of account"
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="power-outline" size={18} color="#FFFFFF" />
              <Text style={styles.signOutBtnText}>Log Out of Account</Text>
            </>
          )}
        </TouchableOpacity>
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
  glassCard: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 14,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
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
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  vaultBadgeText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '700',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  signOutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

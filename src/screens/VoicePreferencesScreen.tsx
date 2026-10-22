/**
 * NEXORA AI — Settings Master & Voice Preferences Hub
 *
 * Provides a modular, crystal-clear 3D Glassmorphic Settings architecture:
 * Section 1. Profile & Personal Details (My Profile)
 * Section 2. AI Assistant Preferences (Personalization)
 * Section 3. Solo Mode & Daily Care (Solo Mode)
 * Section 4. News & Scheduled Voice (Daily News)
 * Section 5. Notifications & Reminders (Voice & Notifications)
 * Section 6. Privacy, Security & Data (Privacy & Memory, Account & Security)
 * Section 7. App Preferences & Connectivity (About NEXORA)
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SettingsMasterScreen } from './settings/SettingsMasterScreen';
import type { ScreenNavProp } from '../types/navigation';

export interface VoicePreferencesScreenProps {
  navigation: ScreenNavProp<'VoicePreferences'>;
}

export const VoicePreferencesScreen: React.FC<VoicePreferencesScreenProps> = ({
  navigation,
}) => {
  return <SettingsMasterScreen navigation={navigation} />;
};

export default VoicePreferencesScreen;

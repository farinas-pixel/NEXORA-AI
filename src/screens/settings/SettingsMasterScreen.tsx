import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppBackground } from '../../components/common/AppBackground';
import { SettingsHomeScreen, SettingsCategoryId } from './SettingsHomeScreen';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { PersonalizationSettingsPage } from './pages/PersonalizationSettingsPage';
import { SoloModeSettingsPage } from './pages/SoloModeSettingsPage';
import { DailyNewsSettingsPage } from './pages/DailyNewsSettingsPage';
import { PrivacyMemorySettingsPage } from './pages/PrivacyMemorySettingsPage';
import { VoiceNotificationsSettingsPage } from './pages/VoiceNotificationsSettingsPage';
import { AccountSecuritySettingsPage } from './pages/AccountSecuritySettingsPage';
import { AboutNexoraPage } from './pages/AboutNexoraPage';
import { theme } from '../../theme';
import type { ScreenNavProp } from '../../types/navigation';

export interface SettingsMasterScreenProps {
  navigation: ScreenNavProp<'VoicePreferences'>;
  initialCategory?: SettingsCategoryId;
}

const CATEGORY_TITLES: Record<SettingsCategoryId, string> = {
  profile: 'My Profile',
  personalization: 'Personalization',
  solomode: 'Solo Mode',
  dailynews: 'Daily News',
  privacymemory: 'Privacy & Memory',
  voicenotifications: 'Voice & Notifications',
  accountsecurity: 'Account & Security',
  aboutnexora: 'About NEXORA',
};

export const SettingsMasterScreen: React.FC<SettingsMasterScreenProps> = ({
  navigation,
  initialCategory,
}) => {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<SettingsCategoryId | null>(
    initialCategory || null
  );

  const handleBack = useCallback(() => {
    if (activeCategory !== null) {
      setActiveCategory(null);
      return true;
    }
    navigation.goBack();
    return true;
  }, [activeCategory, navigation]);

  // Android hardware back handler
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeCategory !== null) {
        setActiveCategory(null);
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [activeCategory]);

  const handleSignOutComplete = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const renderActiveContent = () => {
    switch (activeCategory) {
      case 'profile':
        return <ProfileSettingsPage onBack={() => setActiveCategory(null)} />;
      case 'personalization':
        return <PersonalizationSettingsPage onBack={() => setActiveCategory(null)} />;
      case 'solomode':
        return <SoloModeSettingsPage onBack={() => setActiveCategory(null)} />;
      case 'dailynews':
        return <DailyNewsSettingsPage onBack={() => setActiveCategory(null)} />;
      case 'privacymemory':
        return <PrivacyMemorySettingsPage onBack={() => setActiveCategory(null)} />;
      case 'voicenotifications':
        return <VoiceNotificationsSettingsPage onBack={() => setActiveCategory(null)} />;
      case 'accountsecurity':
        return (
          <AccountSecuritySettingsPage
            onBack={() => setActiveCategory(null)}
            onSignOutComplete={handleSignOutComplete}
          />
        );
      case 'aboutnexora':
        return <AboutNexoraPage onBack={() => setActiveCategory(null)} />;
      default:
        return (
          <SettingsHomeScreen
            onSelectCategory={(catId) => setActiveCategory(catId)}
            onExit={() => navigation.goBack()}
          />
        );
    }
  };

  const pageTitle = activeCategory ? CATEGORY_TITLES[activeCategory] : 'Settings';

  return (
    <AppBackground style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Universal Glass Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            testID="settings-header-back-btn"
            style={styles.backBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={activeCategory ? 'Back to Settings Home' : 'Exit Settings'}
          >
            <Ionicons name="arrow-back" size={22} color="#00E5FF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {pageTitle}
          </Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Dynamic Content Feed */}
        <View style={styles.innerBody}>{renderActiveContent()}</View>
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
    paddingHorizontal: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(5, 11, 25, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerPlaceholder: {
    width: 40,
  },
  innerBody: {
    flex: 1,
  },
});

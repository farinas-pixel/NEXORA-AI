import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RadialQuickActionMenu, RadialActionKey } from './RadialQuickActionMenu';

export type TabName =
  | 'Home'
  | 'Plan'
  | 'Chat'
  | 'Friends'
  | 'Profile'
  | 'Memory'
  | 'Explore'
  | 'MyDay'
  | 'MyLife';

interface BottomNavBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  onDoubleTapChat?: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
  onDoubleTapChat,
}) => {
  const { t } = useApp();

  const handleRadialNavigate = (actionKey: RadialActionKey) => {
    if (actionKey === 'Home') onTabPress('Home');
    else if (actionKey === 'MyDay') onTabPress('MyDay');
    else if (actionKey === 'MyLife') onTabPress('MyLife');
    else if (actionKey === 'Friends') onTabPress('Friends');
    else if (actionKey === 'Memory') onTabPress('Memory');
  };

  const isHomeActive = activeTab === 'Home';
  const isMyDayActive = activeTab === 'Plan' || activeTab === 'MyDay';
  const isFriendsActive = activeTab === 'Friends';
  const isMyLifeActive = activeTab === 'Profile' || activeTab === 'MyLife';

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      {/* Central Reusable Radial Quick-Action Menu with 5-Action Arc */}
      <RadialQuickActionMenu
        activeTab={activeTab}
        onNavigate={handleRadialNavigate}
        onDoubleTapChat={() => {
          if (onDoubleTapChat) onDoubleTapChat();
          else onTabPress('Chat');
        }}
        bottomOffset={18}
      />

      {/* Main Bottom Dock Bar with Professional Vector Icons */}
      <View style={styles.dock}>
        {/* Left Side: Home & My Day */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('Home')}
          style={styles.tabButton}
          accessibilityLabel={t('nav_home')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isHomeActive }}
        >
          <Ionicons
            name={isHomeActive ? 'home' : 'home-outline'}
            size={22}
            color={isHomeActive ? theme.colors.accent.primary : 'rgba(255, 255, 255, 0.45)'}
          />
          <Text style={[styles.tabLabel, isHomeActive && styles.activeTabLabel]}>
            {t('nav_home')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('MyDay')}
          style={styles.tabButton}
          accessibilityLabel={t('nav_my_day')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isMyDayActive }}
        >
          <Ionicons
            name={isMyDayActive ? 'calendar' : 'calendar-outline'}
            size={22}
            color={isMyDayActive ? theme.colors.accent.primary : 'rgba(255, 255, 255, 0.45)'}
          />
          <Text style={[styles.tabLabel, isMyDayActive && styles.activeTabLabel]}>
            {t('nav_my_day')}
          </Text>
        </TouchableOpacity>

        {/* Center Space for Radial Button */}
        <View style={styles.centerSpacer} pointerEvents="none" />

        {/* Right Side: Friends & My Life */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('Friends')}
          style={styles.tabButton}
          accessibilityLabel={t('nav_friends')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isFriendsActive }}
        >
          <Ionicons
            name={isFriendsActive ? 'people' : 'people-outline'}
            size={22}
            color={isFriendsActive ? theme.colors.accent.primary : 'rgba(255, 255, 255, 0.45)'}
          />
          <Text style={[styles.tabLabel, isFriendsActive && styles.activeTabLabel]}>
            {t('nav_friends')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onTabPress('MyLife')}
          style={styles.tabButton}
          accessibilityLabel={t('nav_my_life')}
          accessibilityRole="tab"
          accessibilityState={{ selected: isMyLifeActive }}
        >
          <Ionicons
            name={isMyLifeActive ? 'sparkles' : 'sparkles-outline'}
            size={22}
            color={isMyLifeActive ? theme.colors.accent.primary : 'rgba(255, 255, 255, 0.45)'}
          />
          <Text style={[styles.tabLabel, isMyLifeActive && styles.activeTabLabel]}>
            {t('nav_my_life')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    position: 'relative',
    alignItems: 'center',
    width: '100%',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(11, 18, 36, 0.94)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 8,
    paddingHorizontal: theme.spacing.sm,
    width: '100%',
    zIndex: 20,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.medium,
  },
  activeTabLabel: {
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  centerSpacer: {
    width: 64,
  },
});

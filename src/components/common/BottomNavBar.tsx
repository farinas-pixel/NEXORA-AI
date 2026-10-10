import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme';
import { useApp } from '../../context/AppContext';
import { TranslationKey } from '../../i18n';

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
}

interface TabItemConfig {
  name: TabName;
  key: TranslationKey;
  icon: string;
}

const TABS: TabItemConfig[] = [
  { name: 'Home', key: 'nav_home', icon: '🏠' },
  { name: 'Plan', key: 'nav_my_day', icon: '📅' },
  { name: 'Chat', key: 'nav_chat', icon: '💬' },
  { name: 'Friends', key: 'nav_friends', icon: '👥' },
  { name: 'Profile', key: 'nav_my_life', icon: '🌟' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  const { t } = useApp();

  return (
    <View style={styles.dockContainer}>
      <View style={styles.dock}>
        {TABS.map((tab) => {
          const isActive =
            activeTab === tab.name ||
            (tab.name === 'Plan' && activeTab === 'MyDay') ||
            (tab.name === 'Profile' && activeTab === 'MyLife');

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={() => onTabPress(tab.name)}
              style={styles.tabButton}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {t(tab.key)}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(11, 18, 36, 0.90)',
    borderColor: 'rgba(0, 229, 255, 0.25)',
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.sm,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 2,
    fontWeight: theme.typography.fontWeight.medium,
  },
  activeTabLabel: {
    color: theme.colors.accent.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent.primary,
    marginTop: 3,
  },
});

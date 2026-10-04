import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../../theme';

export type TabName = 'Chat' | 'Plan' | 'Memory' | 'Explore' | 'Profile';

interface BottomNavBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabItem {
  name: TabName;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { name: 'Chat', label: 'Chat', icon: '💬' },
  { name: 'Plan', label: 'Plan', icon: '📋' },
  { name: 'Memory', label: 'Memory', icon: '🧠' },
  { name: 'Explore', label: 'Explore', icon: '✨' },
  { name: 'Profile', label: 'Profile', icon: '⚙️' },
];

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabPress,
}) => {
  return (
    <View style={styles.dockContainer}>
      <View style={styles.dock}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
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
                {tab.label}
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
    backgroundColor: 'rgba(11, 18, 36, 0.85)',
    borderColor: 'rgba(0, 229, 255, 0.22)',
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

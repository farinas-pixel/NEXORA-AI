import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useApp } from '../../context/AppContext';

export type RadialActionKey = 'SoloMode' | 'DailyNews' | 'Memory' | 'AIAssistant';

export interface RadialQuickActionMenuProps {
  activeTab?: string;
  onNavigate: (actionKey: RadialActionKey) => void;
  onDoubleTapChat: () => void;
  bottomOffset?: number;
}

interface ActionItemConfig {
  key: RadialActionKey;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}

const RADIAL_ACTIONS: ActionItemConfig[] = [
  { key: 'SoloMode', label: 'Solo Mode', iconName: 'heart-half-outline', accessibilityLabel: 'Navigate to Solo Mode' },
  { key: 'DailyNews', label: 'Daily News', iconName: 'newspaper-outline', accessibilityLabel: 'Navigate to Daily News' },
  { key: 'Memory', label: 'Memory', iconName: 'file-tray-full-outline', accessibilityLabel: 'Navigate to Sovereign Memory Vault' },
  { key: 'AIAssistant', label: 'AI Assistant', iconName: 'chatbubbles-outline', accessibilityLabel: 'Navigate to AI Assistant Chat' },
];

export const RadialQuickActionMenu: React.FC<RadialQuickActionMenuProps> = ({
  activeTab = 'Home',
  onNavigate,
  onDoubleTapChat,
  bottomOffset = 0,
}) => {
  const { preferences } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const animValue = useRef(new Animated.Value(0)).current;

  // Single-vs-double-tap timing strategy
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapTimeRef = useRef<number>(0);
  const isNavigatingRef = useRef<boolean>(false);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    if (preferences?.reduceMotion) {
      animValue.setValue(1);
      return;
    }
    Animated.spring(animValue, {
      toValue: 1,
      friction: 6,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [animValue, preferences?.reduceMotion]);

  const closeMenu = useCallback((onFinished?: () => void) => {
    Animated.timing(animValue, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
      if (onFinished) onFinished();
    });
  }, [animValue]);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isOpen, openMenu, closeMenu]);

  const handleCenterButtonPress = () => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD_MS = 280;

    if (now - lastTapTimeRef.current < DOUBLE_TAP_THRESHOLD_MS) {
      // Double tap confirmed: Cancel scheduled single-tap menu toggle
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      if (isOpen) {
        closeMenu();
      }
      onDoubleTapChat();
    } else {
      // First tap: register timestamp and schedule single tap action
      lastTapTimeRef.current = now;
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
      tapTimeoutRef.current = setTimeout(() => {
        toggleMenu();
        lastTapTimeRef.current = 0;
        tapTimeoutRef.current = null;
      }, DOUBLE_TAP_THRESHOLD_MS);
    }
  };

  const handleActionSelect = (key: RadialActionKey) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    closeMenu(() => {
      onNavigate(key);
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 400);
    });
  };

  return (
    <View style={[styles.rootContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      {/* Dimmed backdrop when radial menu is open (tap outside to close) */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={() => closeMenu()} accessibilityLabel="Close quick actions menu">
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Semicircle action buttons */}
      {isOpen && (
        <View style={styles.arcContainer} pointerEvents="box-none">
          {RADIAL_ACTIONS.map((action, index) => {
            const count = RADIAL_ACTIONS.length;
            const startAngleDeg = -76;
            const endAngleDeg = 76;
            const stepDeg = (endAngleDeg - startAngleDeg) / (count - 1);
            const angleDeg = startAngleDeg + index * stepDeg;
            const angleRad = (angleDeg * Math.PI) / 180;
            const radius = 98; // Radius of upper semicircle in pixels

            const targetX = Math.sin(angleRad) * radius;
            const targetY = -Math.cos(angleRad) * radius;

            const translateX = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetX],
            });

            const translateY = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0, targetY],
            });

            const scale = animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.2, 1],
            });

            const opacity = animValue.interpolate({
              inputRange: [0, 0.35, 1],
              outputRange: [0, 0.4, 1],
            });

            const isActive =
              activeTab === action.key ||
              (action.key === 'Memory' && activeTab === 'Memory') ||
              (action.key === 'AIAssistant' && (activeTab === 'Chat' || activeTab === 'AIAssistant')) ||
              (action.key === 'SoloMode' && activeTab === 'SoloMode') ||
              (action.key === 'DailyNews' && activeTab === 'DailyNews');

            return (
              <Animated.View
                key={action.key}
                style={[
                  styles.actionButtonWrapper,
                  {
                    transform: [{ translateX }, { translateY }, { scale }],
                    opacity,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.circularActionButton, isActive && styles.circularActionButtonActive]}
                  activeOpacity={0.75}
                  onPress={() => handleActionSelect(action.key)}
                  accessibilityLabel={action.accessibilityLabel}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={action.iconName}
                    size={20}
                    color={isActive ? theme.colors.accent.primary : theme.colors.text.primary}
                  />
                  <Text
                    style={[styles.actionLabel, isActive && styles.actionLabelActive]}
                    numberOfLines={1}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Central Robot Head Button */}
      <View style={styles.centerButtonContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleCenterButtonPress}
          style={[styles.robotButton, isOpen && styles.robotButtonOpen]}
          accessibilityLabel="NEXORA Assistant Quick Actions: Single tap to open five-action radial menu, double tap to open AI chat"
          accessibilityRole="button"
          accessibilityHint="Expands radial action menu on single tap or opens chat on double tap"
        >
          <View style={styles.robotImageWrapper}>
            <Image
              source={require('../../../assets/robot/state_idle_head.png')}
              style={styles.robotHeadImage}
              resizeMode="contain"
            />
          </View>
          {isOpen && <View style={styles.openIndicatorDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  backdrop: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: 'rgba(5, 10, 24, 0.55)',
    bottom: -100,
    zIndex: 900,
  },
  arcContainer: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 950,
  },
  actionButtonWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 960,
  },
  circularActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(14, 12, 38, 0.96)',
    borderColor: 'rgba(167, 139, 250, 0.35)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  circularActionButtonActive: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    shadowOpacity: 0.6,
  },
  actionLabel: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    position: 'absolute',
    bottom: -16,
    width: 70,
    textAlign: 'center',
  },
  actionLabelActive: {
    color: theme.colors.accent.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  centerButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  robotButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(18, 14, 44, 0.98)',
    borderColor: 'rgba(168, 85, 247, 0.65)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 10,
  },
  robotButtonOpen: {
    borderColor: '#A855F7',
    backgroundColor: 'rgba(139, 92, 246, 0.28)',
    shadowRadius: 12,
  },
  robotImageWrapper: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotHeadImage: {
    width: 36,
    height: 36,
  },
  openIndicatorDot: {
    position: 'absolute',
    top: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00E5FF',
  },
});

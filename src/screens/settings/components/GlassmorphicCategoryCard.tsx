import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../theme';

export interface GlassmorphicCategoryCardProps {
  id: string;
  title: string;
  subtitle: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badge?: string;
  badgeVariant?: 'cyan' | 'violet' | 'emerald' | 'amber';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const GlassmorphicCategoryCard: React.FC<GlassmorphicCategoryCardProps> = ({
  id,
  title,
  subtitle,
  iconName,
  iconColor = '#00E5FF',
  badge,
  badgeVariant = 'cyan',
  onPress,
  style,
  testID,
}) => {
  const getBadgeStyle = () => {
    switch (badgeVariant) {
      case 'violet':
        return styles.badgeViolet;
      case 'emerald':
        return styles.badgeEmerald;
      case 'amber':
        return styles.badgeAmber;
      case 'cyan':
      default:
        return styles.badgeCyan;
    }
  };

  const getBadgeTextStyle = () => {
    switch (badgeVariant) {
      case 'violet':
        return styles.badgeTextViolet;
      case 'emerald':
        return styles.badgeTextEmerald;
      case 'amber':
        return styles.badgeTextAmber;
      case 'cyan':
      default:
        return styles.badgeTextCyan;
    }
  };

  return (
    <TouchableOpacity
      testID={testID || `settings-card-${id}`}
      style={[styles.cardOuter, style]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      accessibilityHint={`Opens ${title} settings`}
    >
      {/* Specular top hairline reflection */}
      <View style={styles.topHighlightLine} />

      <View style={styles.contentRow}>
        {/* 3D Glass Icon Pod with ambient glow */}
        <View style={[styles.iconPod, { borderColor: `${iconColor}40` }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        {/* Text Container */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {badge ? (
              <View style={[styles.badgeBase, getBadgeStyle()]}>
                <Text style={[styles.badgeTextBase, getBadgeTextStyle()]}>
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>

        {/* Chevron Indicator */}
        <View style={styles.chevronWrapper}>
          <Ionicons name="chevron-forward" size={18} color="rgba(0, 229, 255, 0.6)" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    backgroundColor: 'rgba(13, 21, 44, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.18)',
    marginBottom: 12,
    padding: 14,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  topHighlightLine: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPod: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(5, 11, 25, 0.85)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  chevronWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBase: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
  },
  badgeTextBase: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeCyan: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.4)',
  },
  badgeTextCyan: {
    color: '#00E5FF',
  },
  badgeViolet: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  badgeTextViolet: {
    color: '#A78BFA',
  },
  badgeEmerald: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeTextEmerald: {
    color: '#34D399',
  },
  badgeAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  badgeTextAmber: {
    color: '#FBBF24',
  },
});

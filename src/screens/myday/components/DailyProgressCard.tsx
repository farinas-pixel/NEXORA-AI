import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NatureTheme } from '../theme';
import { NatureGlassCard } from './NatureGlassCard';

interface DailyProgressCardProps {
  completedCount: number;
  totalCount: number;
}

export const DailyProgressCard: React.FC<DailyProgressCardProps> = ({
  completedCount,
  totalCount,
}) => {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const remainingCount = Math.max(0, totalCount - completedCount);

  let motivationalNote = 'Aligning your daily focus targets ✨';
  if (percentage === 100 && totalCount > 0) motivationalNote = 'All scheduled priorities achieved today ⚡';
  else if (percentage >= 75) motivationalNote = 'Superb momentum, nearly all milestones complete ✨';
  else if (percentage >= 50) motivationalNote = 'Steady flow across today\'s priorities 💫';
  else if (percentage > 0) motivationalNote = 'Active progress underway 🚀';

  // Circular Neon Progress Ring math (0..1)
  const normProgress = Math.max(0, Math.min(1, percentage / 100));
  const rightProgress = Math.min(1, normProgress * 2);
  const rightAngle = -180 + rightProgress * 180;
  const leftProgress = Math.max(0, (normProgress - 0.5) * 2);
  const leftAngle = -180 + leftProgress * 180;

  return (
    <NatureGlassCard style={styles.card}>
      <View style={styles.contentRow}>
        {/* Circular Neon Progress Indicator */}
        <View style={styles.ringWrapper}>
          {/* Base Track */}
          <View style={styles.ringBaseTrack} />

          {/* Right Semi-circle Progress */}
          <View style={styles.halfMaskRight}>
            <View
              style={[
                styles.halfCircle,
                {
                  transform: [
                    { rotate: `${rightAngle}deg` },
                  ],
                },
              ]}
            />
          </View>

          {/* Left Semi-circle Progress (active after 50%) */}
          <View style={styles.halfMaskLeft}>
            <View
              style={[
                styles.halfCircleLeft,
                {
                  transform: [
                    { rotate: `${leftAngle}deg` },
                  ],
                },
              ]}
            />
          </View>

          {/* Center Hub with Percentage */}
          <View style={styles.ringCenterHub}>
            <Text style={styles.percentText}>{percentage}%</Text>
          </View>
        </View>

        {/* Right Details Column */}
        <View style={styles.detailsCol}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Daily Progress</Text>
            <View style={styles.percentBadge}>
              <Text style={styles.badgeText}>
                {completedCount}/{totalCount} Done
              </Text>
            </View>
          </View>
          <Text style={styles.subtitle} numberOfLines={1}>
            {motivationalNote}
          </Text>

          {/* Horizontal Progress Track for test compatibility & multi-indicator visual depth */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, Math.max(4, percentage))}%` },
              ]}
            />
          </View>

          {/* Stats Counter Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={14} color={NatureTheme.colors.cyan} />
              <Text style={styles.statLabel}>Done:</Text>
              <Text style={styles.statValue}>{completedCount}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={NatureTheme.colors.violet} />
              <Text style={styles.statLabel}>Left:</Text>
              <Text style={styles.statValue}>{remainingCount}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Ionicons name="list-outline" size={14} color={NatureTheme.colors.sage} />
              <Text style={styles.statLabel}>Total:</Text>
              <Text style={styles.statValue}>{totalCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </NatureGlassCard>
  );
};

const RING_SIZE = 68;
const RING_THICKNESS = 6;

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    padding: 14,
    borderColor: 'rgba(0, 229, 255, 0.22)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  // Circular Progress Ring
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBaseTrack: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  halfMaskRight: {
    position: 'absolute',
    top: 0,
    left: RING_SIZE / 2,
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    left: -RING_SIZE / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: 'transparent',
    borderTopColor: NatureTheme.colors.cyan,
    borderRightColor: NatureTheme.colors.cyan,
    borderBottomColor: NatureTheme.colors.cyan,
  },
  halfMaskLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RING_SIZE / 2,
    height: RING_SIZE,
    overflow: 'hidden',
  },
  halfCircleLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_THICKNESS,
    borderColor: 'transparent',
    borderTopColor: NatureTheme.colors.violet,
    borderLeftColor: NatureTheme.colors.violet,
    borderBottomColor: NatureTheme.colors.violet,
  },
  ringCenterHub: {
    width: RING_SIZE - RING_THICKNESS * 2 - 4,
    height: RING_SIZE - RING_THICKNESS * 2 - 4,
    borderRadius: (RING_SIZE - RING_THICKNESS * 2 - 4) / 2,
    backgroundColor: 'rgba(5, 8, 20, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.15)',
  },
  percentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  // Details Column
  detailsCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  percentBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: NatureTheme.borderRadius.full,
  },
  badgeText: {
    color: NatureTheme.colors.cyan,
    fontSize: 10,
    fontWeight: '700',
  },
  subtitle: {
    color: NatureTheme.colors.textMuted,
    fontSize: 11,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: NatureTheme.colors.cyan,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    color: NatureTheme.colors.textSubtle,
    fontSize: 11,
  },
  statValue: {
    color: NatureTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

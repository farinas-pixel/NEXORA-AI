/**
 * NEXORA AI — My Day Nature-Inspired Design System
 * "Calm productivity meets living nature."
 *
 * Palette: Deep Forest Green, Emerald, Sage, Soft Cream, Champagne Gold, Lavender
 */

export const NatureTheme = {
  colors: {
    // Authoritative NEXORA AI Cosmic Obsidian & Deep Navy Backgrounds
    background: '#09071A',
    backgroundGradStart: '#0E0B25',
    backgroundGradEnd: '#060512',

    // Glassmorphism surfaces — Cosmic translucent navy & cyan hairline borders
    glassSurface: 'rgba(18, 14, 42, 0.76)',
    glassSurfaceLight: 'rgba(28, 22, 62, 0.62)',
    glassBorder: 'rgba(196, 181, 253, 0.16)',
    glassBorderBright: 'rgba(168, 85, 247, 0.45)',
    topSpecular: 'rgba(255, 255, 255, 0.35)',

    // Accents & Luminous NEXORA Tones
    // Restored to Electric Cyan & Neon Blue, with aliased legacy keys for test compatibility
    emerald: '#00E5FF', // Electric cyan
    emeraldDeep: '#0077FE', // Deep vivid blue
    emeraldGlow: 'rgba(0, 229, 255, 0.30)',
    sage: '#38BDF8', // Luminous sky cyan
    sageSoft: '#BAE6FD',
    forestDark: '#0B132B', // Deep navy
    
    // Warm & Violet Highlights
    gold: '#8B5CF6', // Electric violet
    goldLight: '#C4B5FD',
    goldGlow: 'rgba(139, 92, 246, 0.30)',
    cream: '#FFFFFF',
    lavender: '#A78BFA',
    lavenderSoft: '#DDD6FE',

    // Direct NEXORA palette tokens
    cyan: '#00E5FF',
    neonBlue: '#0077FE',
    violet: '#8B5CF6',
    obsidian: '#050814',
    navyDeep: '#070D1E',

    // Typography
    textPrimary: '#FFFFFF',
    textSecondary: '#DDD6FE',
    textMuted: '#A5A1C8',
    textSubtle: '#76719C',

    // Semantic status
    statusCompleted: '#00E5FF',
    statusCompletedBg: 'rgba(0, 229, 255, 0.16)',
    statusPending: '#38BDF8',
    statusPendingBg: 'rgba(56, 189, 248, 0.14)',
    statusHighPriority: '#F87171',
    statusHighPriorityBg: 'rgba(239, 68, 68, 0.18)',
    statusMedPriority: '#FBBF24',
    statusMedPriorityBg: 'rgba(245, 158, 11, 0.18)',
    statusLowPriority: '#38BDF8',
    statusLowPriorityBg: 'rgba(56, 189, 248, 0.14)',
    statusSnoozed: '#FBBF24',
    statusMissed: '#EF4444',
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },

  shadows: {
    glass: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.45,
      shadowRadius: 14,
      elevation: 6,
    },
    orb: {
      shadowColor: '#00E5FF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 24,
      elevation: 10,
    },
  },
};


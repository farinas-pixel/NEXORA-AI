/**
 * NEXORA AI — Design Token Foundations: Colors
 * Premium Futuristic Visual Theme inspired by Obsidian Indigo & Luminous Violet Reference
 */

export const colors = {
  // Backgrounds: Deep Midnight Obsidian with rich violet & dark indigo depth
  background: {
    primary: '#09071A', // Deep midnight obsidian-indigo background
    secondary: '#0E0C26', // Elevated dark indigo panel
    tertiary: '#151236', // Higher elevation frosted surface
    surface: 'rgba(20, 16, 48, 0.72)', // Primary glassmorphic panel base
    cardHighlight: 'rgba(99, 45, 248, 0.18)', // Luminous violet frosted glass card
  },

  // Glassmorphic translucent layers & frosted borders
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    panel: 'rgba(18, 14, 42, 0.70)',
    border: 'rgba(196, 181, 253, 0.16)', // Hairline lavender-frosted border
    borderSubtle: 'rgba(255, 255, 255, 0.09)', // Whisper-thin white boundary
    borderActive: 'rgba(147, 51, 234, 0.55)', // Radiant electric violet border
    borderViolet: 'rgba(168, 85, 247, 0.40)', // Rich lavender-violet highlight
    borderCyan: 'rgba(56, 189, 248, 0.30)', // Restrained cyan highlight
    highlight: 'rgba(255, 255, 255, 0.12)', // Subtle specular top highlight
    glow: 'rgba(124, 58, 237, 0.22)', // Restrained ambient violet glow
  },

  // Primary Accent & Neon Energy
  accent: {
    primary: '#8B5CF6', // Electric violet primary
    primaryGradientStart: '#632DF8', // Deep royal violet
    primaryGradientEnd: '#8B5CF6', // Luminous electric purple
    primaryGlow: 'rgba(139, 92, 246, 0.35)',
    secondary: '#38BDF8', // Restrained electric cyan / sky highlight
    secondaryGradientStart: '#38BDF8',
    secondaryGradientEnd: '#6366F1',
    secondaryGlow: 'rgba(56, 189, 248, 0.25)',
    violet: '#8B5CF6',
    magenta: '#C084FC', // Soft lavender-magenta tone
    cyan: '#00E5FF', // High-contrast cyber cyan
  },

  // State Machine Colors
  status: {
    idle: '#8B5CF6', // Atmospheric violet
    listening: '#7C3AED', // Vivid electric purple
    processing: '#A855F7', // Deep neon magenta-violet
    responding: '#60A5FA', // Luminous blue voice pulse
    error: '#F87171', // Refined rose crimson
    success: '#34D399', // Emerald mint
  },

  // Typography Colors
  text: {
    primary: '#FFFFFF', // Pure white headers
    secondary: '#DDD6FE', // High-clarity soft lavender
    muted: '#A5A1C8', // Elegant lavender-slate metadata
    tertiary: '#76719C', // Low emphasis timestamps
    accent: '#A78BFA', // Violet highlights
    inverse: '#FFFFFF', // Crisp white on violet buttons
  },

  // Borders & Dividers
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(167, 139, 250, 0.22)',
    focus: '#8B5CF6',
  },
} as const;

export type Colors = typeof colors;

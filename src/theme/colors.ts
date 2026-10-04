/**
 * NEXORA AI — Design Token Foundations: Colors
 * Tuned to Authoritative 88-Screen & Robot Interaction Reference
 */

export const colors = {
  // Backgrounds: Deep Cosmic Obsidian with dark navy gradients
  background: {
    primary: '#050814', // Authoritative deep cosmic background
    secondary: '#0B1224', // Elevated dark navy panel
    tertiary: '#111C38', // Higher elevation
    surface: 'rgba(13, 21, 44, 0.70)', // Primary glassmorphic panel base
    cardHighlight: 'rgba(23, 37, 84, 0.45)', // Highlighted glass card
  },

  // Glassmorphic translucent layers
  glass: {
    background: 'rgba(255, 255, 255, 0.04)',
    panel: 'rgba(13, 21, 44, 0.68)',
    border: 'rgba(0, 229, 255, 0.18)', // Reference-matched hairline cyan border
    borderSubtle: 'rgba(255, 255, 255, 0.10)',
    borderActive: 'rgba(0, 229, 255, 0.55)',
    borderViolet: 'rgba(139, 92, 246, 0.40)',
    highlight: 'rgba(255, 255, 255, 0.08)',
  },

  // Primary Accent & Neon Energy
  accent: {
    primary: '#00E5FF', // Electric cyan
    primaryGradientStart: '#00E5FF',
    primaryGradientEnd: '#0077FE', // Deep vivid blue
    primaryGlow: 'rgba(0, 229, 255, 0.28)',
    secondary: '#8B5CF6', // Electric violet (Processing state)
    secondaryGlow: 'rgba(139, 92, 246, 0.28)',
  },

  // State Machine Colors
  status: {
    idle: '#00E5FF', // Calm cyan glow
    listening: '#00F0FF', // Vivid radiant cyan
    processing: '#8B5CF6', // Deep neon violet
    responding: '#38BDF8', // Cyan-blue voice pulse
    error: '#EF4444', // Warning crimson
    success: '#10B981', // Emerald green
  },

  // Typography Colors
  text: {
    primary: '#FFFFFF', // Pure white headers
    secondary: '#CBD5E1', // High-clarity secondary
    muted: '#94A3B8', // Slate metadata
    tertiary: '#64748B', // Low emphasis timestamps
    accent: '#00E5FF', // Cyan highlights
    inverse: '#050814', // Obsidian text on cyan buttons
  },

  // Borders & Dividers
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(0, 229, 255, 0.20)',
    focus: '#00E5FF',
  },
} as const;

export type Colors = typeof colors;

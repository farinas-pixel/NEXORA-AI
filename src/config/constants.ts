/**
 * NEXORA AI — Application Constants
 * Core configuration and runtime status definitions
 */

export const APP_CONFIG = {
  name: 'NEXORA AI',
  version: '1.0.0-alpha',
  codename: 'Sovereign Companion',
  budgetConstraint: '₹0 Personal Investment',
  architecture: 'Mobile-First Dual-Loop',
} as const;

export const AVATAR_STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  RESPONDING: 'responding',
  ERROR: 'error',
} as const;

export type AvatarState = typeof AVATAR_STATES[keyof typeof AVATAR_STATES];

export const SECURITY_TIERS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type SecurityTier = typeof SECURITY_TIERS[keyof typeof SECURITY_TIERS];

/**
 * NEXORA AI — Design Token Foundations: Spacing & Layout
 * Consistent 4pt / 8pt mobile grid scale
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;

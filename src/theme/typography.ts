/**
 * NEXORA AI — Design Token Foundations: Typography
 * System fonts optimized for mobile readability and hierarchy
 */

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },

  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    xxl: 32,
    display: 40,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
} as const;

export type Typography = typeof typography;

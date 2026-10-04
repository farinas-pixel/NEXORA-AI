/**
 * NEXORA AI — Design Token Foundations: Unified Theme Export
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
} as const;

export type Theme = typeof theme;

export { colors, typography, spacing, borderRadius };

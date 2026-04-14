import type { BPCategory } from './index';

// ─── Typography Scale ────────────────────────────────────────────────────────

/** Base font sizes (normal mode). All values are in logical pixels. */
export const TYPOGRAPHY_BASE = {
  xs: 12,    // Smallest: chart labels, decorators, units
  sm: 14,    // Small: captions, timestamps, secondary info
  md: 16,    // Base body text → 22px in senior mode (meets 22pt for 65+)
  lg: 18,    // Section headers, card titles
  xl: 22,    // Prominent values (pulse badge, category label)
  '2xl': 28, // Statistics display values, large headings
  '3xl': 36, // Entry form input display
  hero: 56,  // Main BP reading hero display
} as const;

export type TypographyScale = { [K in keyof typeof TYPOGRAPHY_BASE]: number };

/** Scale multiplier applied in Senior Mode. 16 × 1.4 = 22.4 → 22px (rounds). */
export const SENIOR_SCALE = 1.4;

/**
 * Returns a TypographyScale with sizes multiplied by SENIOR_SCALE when seniorMode is true.
 * All sizes are rounded to whole pixels.
 */
export function computeTypographyScale(seniorMode: boolean): TypographyScale {
  const scale = seniorMode ? SENIOR_SCALE : 1.0;
  return {
    xs:    Math.round(TYPOGRAPHY_BASE.xs    * scale),
    sm:    Math.round(TYPOGRAPHY_BASE.sm    * scale),
    md:    Math.round(TYPOGRAPHY_BASE.md    * scale),
    lg:    Math.round(TYPOGRAPHY_BASE.lg    * scale),
    xl:    Math.round(TYPOGRAPHY_BASE.xl    * scale),
    '2xl': Math.round(TYPOGRAPHY_BASE['2xl'] * scale),
    '3xl': Math.round(TYPOGRAPHY_BASE['3xl'] * scale),
    hero:  Math.round(TYPOGRAPHY_BASE.hero  * scale),
  };
}

// Nunito font family mapping
// On Android, fontFamily alone selects the weight.
// On iOS, use fontFamily + fontWeight together for safety.
export const FONTS = {
  regular: 'Nunito-Regular',      // 400
  medium: 'Nunito-Medium',        // 500
  semiBold: 'Nunito-SemiBold',    // 600
  bold: 'Nunito-Bold',            // 700
  extraBold: 'Nunito-ExtraBold',  // 800
};

export interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceSecondary: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // Accent
  accent: string;

  // Borders
  border: string;
  borderLight: string;

  // Semantic
  error: string;
  errorBackground: string;

  // Gradient card
  gradientStart: string;
  gradientEnd: string;

  // Tab bar
  tabBarBackground: string;
  tabBarBorder: string;

  // Numpad
  numpadKey: string;
  numpadKeyText: string;
  numpadKeyBorder: string;
  numpadClearBg: string;
  numpadBackspaceBg: string;

  // Chart
  chartLine: string;
  chartDot: string;
  chartLabel: string;
  chartLineDiastolic: string;
  chartZoneNormal: string;
  chartZoneElevated: string;
  chartZoneHigh: string;

  // Toggle / Switch
  toggleTrackActive: string;
  toggleTrackInactive: string;
  toggleThumb: string;

  // Settings card icons
  iconCircleBg: string;

  // Semantic status
  successText: string;
  successBg: string;

  // Info
  infoBg: string;
  infoColor: string;

  // Warning
  warningBg: string;
  warningText: string;
  warningBorder: string;

  // Crisis
  crisisRed: string;
  crisisBorder: string;

  // Derived metrics
  ppColor: string;
  mapColor: string;

  // Morning surge
  surgeColor: string;
  surgeBg: string;

  // Overlay
  overlay: string;

  // Shadows
  shadow: string;
  shadowOpacity: number;

  borderWidth: number;
}

export const lightColors: ThemeColors = {
  background: '#F5F5F5',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',

  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  accent: '#2563EB',

  border: '#e5e7eb',
  borderLight: '#f1f5f9',

  error: '#dc2626',
  errorBackground: '#fef2f2',

  gradientStart: '#1D4ED8',
  gradientEnd: '#2563EB',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#f1f5f9',

  numpadKey: '#ffffff',
  numpadKeyText: '#1f2937',
  numpadKeyBorder: 'rgba(0,0,0,0.05)',
  numpadClearBg: '#fef2f2',
  numpadBackspaceBg: '#f0f9ff',

  chartLine: '#003B49',
  chartDot: '#ffffff',
  chartLabel: '#374151',
  chartLineDiastolic: '#007A78',
  chartZoneNormal: '#dcfce7',
  chartZoneElevated: '#fef9c3',
  chartZoneHigh: '#fecaca',

  toggleTrackActive: '#2563EB',
  toggleTrackInactive: '#d1d5db',
  toggleThumb: '#ffffff',
  iconCircleBg: 'rgba(37,99,235,0.12)',
  successText: '#16a34a',
  successBg: '#f0fdf4',

  infoBg: '#eff6ff',
  infoColor: '#3b82f6',

  warningBg: '#fef3c7',
  warningText: '#92400e',
  warningBorder: '#fde68a',

  crisisRed: '#dc2626',
  crisisBorder: '#fca5a5',

  ppColor: '#f59e0b',
  mapColor: '#6366f1',

  surgeColor: '#f97316',
  surgeBg: '#fff7ed',

  overlay: 'rgba(0,0,0,0.3)',

  shadow: '#000000',
  shadowOpacity: 0.08,

  borderWidth: 1,
};

export const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceSecondary: '#2C2C2C',

  textPrimary: 'rgba(255,255,255,0.87)',
  textSecondary: 'rgba(255,255,255,0.60)',
  textTertiary: 'rgba(255,255,255,0.38)',

  accent: '#60A5FA',

  border: '#334155',
  borderLight: '#1E1E1E',

  error: '#f87171',
  errorBackground: '#451a1a',

  gradientStart: '#1D4ED8',
  gradientEnd: '#2563EB',

  tabBarBackground: '#1E1E1E',
  tabBarBorder: '#334155',

  numpadKey: '#2C2C2C',
  numpadKeyText: 'rgba(255,255,255,0.87)',
  numpadKeyBorder: 'rgba(255,255,255,0.06)',
  numpadClearBg: '#3b1c1c',
  numpadBackspaceBg: '#1c2d3b',

  chartLine: '#60A5FA',
  chartDot: '#1E1E1E',
  chartLabel: 'rgba(255,255,255,0.60)',
  chartLineDiastolic: '#34D399',
  chartZoneNormal: '#14532d',
  chartZoneElevated: '#422006',
  chartZoneHigh: '#450a0a',

  toggleTrackActive: '#60A5FA',
  toggleTrackInactive: '#4b5563',
  toggleThumb: 'rgba(255,255,255,0.87)',
  iconCircleBg: 'rgba(96,165,250,0.15)',
  successText: '#86EFAC',
  successBg: '#14532d',

  infoBg: '#1e3a5f',
  infoColor: '#60a5fa',

  warningBg: '#422006',
  warningText: '#fbbf24',
  warningBorder: '#d97706',

  crisisRed: '#FCA5A5',
  crisisBorder: '#FCA5A5',

  ppColor: '#fbbf24',
  mapColor: '#818cf8',

  surgeColor: '#fb923c',
  surgeBg: '#431407',

  overlay: 'rgba(0,0,0,0.6)',

  shadow: '#000000',
  shadowOpacity: 0.3,

  borderWidth: 1,
};

export const highContrastColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',

  textPrimary: '#000000',
  textSecondary: '#000000',
  textTertiary: '#4A4A4A',

  accent: '#1D4ED8',

  border: '#000000',
  borderLight: '#CCCCCC',

  error: '#CC0000',
  errorBackground: '#FFE6E6',

  gradientStart: '#1D4ED8',
  gradientEnd: '#1D4ED8',

  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#000000',

  numpadKey: '#FFFFFF',
  numpadKeyText: '#000000',
  numpadKeyBorder: '#000000',
  numpadClearBg: '#FFE6E6',
  numpadBackspaceBg: '#E6F3FF',

  chartLine: '#1D4ED8',
  chartDot: '#000000',
  chartLabel: '#000000',
  chartLineDiastolic: '#007A78',
  chartZoneNormal: '#E8F5E9',
  chartZoneElevated: '#FFF9C4',
  chartZoneHigh: '#FFEBEE',

  toggleTrackActive: '#1D4ED8',
  toggleTrackInactive: '#CCCCCC',
  toggleThumb: '#ffffff',
  iconCircleBg: '#E6E6E6',
  successText: '#006600',
  successBg: '#E8F5E9',

  infoBg: '#E3F2FD',
  infoColor: '#1565C0',

  warningBg: '#FFF9C4',
  warningText: '#5D4037',
  warningBorder: '#FFD54F',

  crisisRed: '#CC0000',
  crisisBorder: '#CC0000',

  ppColor: '#d97706',
  mapColor: '#4338CA',

  surgeColor: '#E65100',
  surgeBg: '#FFF3E0',

  overlay: 'rgba(0,0,0,0.5)',

  shadow: '#000000',
  shadowOpacity: 0,

  borderWidth: 3,
};

// BP category colors per theme
export const BP_COLORS_LIGHT: Record<BPCategory, string> = {
  normal: '#22c55e',
  elevated: '#eab308',
  stage_1: '#f97316',
  stage_2: '#ef4444',
  crisis: '#dc2626',
};

export const BP_COLORS_DARK: Record<BPCategory, string> = {
  normal: '#86EFAC',
  elevated: '#FDE68A',
  stage_1: '#FDBA74',
  stage_2: '#FECACA',
  crisis: '#FCA5A5',
};

// ─── Generic Metric Category Colors ─────────────────────────────────────────

import type { MetricCategory } from './metric-types';

/**
 * Returns a lookup map of category id → color for a given set of categories.
 * Reads colorLight/colorDark from each MetricCategory definition so colors are
 * defined once in the config — not duplicated here.
 */
export function getMetricCategoryColors(
  categories: ReadonlyArray<MetricCategory>,
  isDark: boolean,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const cat of categories) {
    result[cat.id] = isDark ? cat.colorDark : cat.colorLight;
  }
  return result;
}

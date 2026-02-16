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
}

export const lightColors: ThemeColors = {
  background: '#EDF5F0',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',

  textPrimary: '#1a1a2e',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',

  accent: '#0D9488',

  border: '#e5e7eb',
  borderLight: '#f1f5f9',

  error: '#dc2626',
  errorBackground: '#fef2f2',

  gradientStart: '#0D9488',
  gradientEnd: '#14B8A6',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#f1f5f9',

  numpadKey: '#ffffff',
  numpadKeyText: '#1f2937',
  numpadKeyBorder: 'rgba(0,0,0,0.05)',
  numpadClearBg: '#fef2f2',
  numpadBackspaceBg: '#f0f9ff',

  chartLine: '#0D9488',
  chartDot: '#ffffff',
  chartLabel: '#475569',
  chartLineDiastolic: '#5EEAD4',
  chartZoneNormal: '#dcfce7',
  chartZoneElevated: '#fef9c3',
  chartZoneHigh: '#fecaca',

  toggleTrackActive: '#0D9488',
  toggleTrackInactive: '#d1d5db',
  toggleThumb: '#ffffff',
  iconCircleBg: 'rgba(13,148,136,0.12)',
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
};

export const darkColors: ThemeColors = {
  background: '#0f172a',
  surface: '#1e293b',
  surfaceSecondary: '#2a3441',

  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',

  accent: '#14B8A6',

  border: '#334155',
  borderLight: '#1e293b',

  error: '#f87171',
  errorBackground: '#451a1a',

  gradientStart: '#0D9488',
  gradientEnd: '#115E59',

  tabBarBackground: '#1e293b',
  tabBarBorder: '#334155',

  numpadKey: '#2a3441',
  numpadKeyText: '#f8fafc',
  numpadKeyBorder: 'rgba(255,255,255,0.06)',
  numpadClearBg: '#3b1c1c',
  numpadBackspaceBg: '#1c2d3b',

  chartLine: '#14B8A6',
  chartDot: '#1e293b',
  chartLabel: '#94a3b8',
  chartLineDiastolic: '#2DD4BF',
  chartZoneNormal: '#14532d',
  chartZoneElevated: '#422006',
  chartZoneHigh: '#450a0a',

  toggleTrackActive: '#14B8A6',
  toggleTrackInactive: '#4b5563',
  toggleThumb: '#f8fafc',
  iconCircleBg: 'rgba(20,184,166,0.15)',
  successText: '#4ade80',
  successBg: '#14532d',

  infoBg: '#1e3a5f',
  infoColor: '#60a5fa',

  warningBg: '#422006',
  warningText: '#fbbf24',
  warningBorder: '#d97706',

  crisisRed: '#f87171',
  crisisBorder: '#f87171',

  ppColor: '#fbbf24',
  mapColor: '#818cf8',

  surgeColor: '#fb923c',
  surgeBg: '#431407',

  overlay: 'rgba(0,0,0,0.6)',

  shadow: '#000000',
  shadowOpacity: 0.3,
};

export const highContrastColors: ThemeColors = {
  // Pure white/black base
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F5F5F5',

  // Maximum contrast text
  textPrimary: '#000000',
  textSecondary: '#000000',
  textTertiary: '#4A4A4A',

  // Solid accent (no gradient)
  accent: '#0D9488',

  // Bold borders (no subtle grays)
  border: '#000000',
  borderLight: '#CCCCCC',

  // High-contrast errors
  error: '#CC0000',
  errorBackground: '#FFE6E6',

  // Solid colors (no gradients - same color for both)
  gradientStart: '#0D9488',
  gradientEnd: '#0D9488', // Same = solid color

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#000000',

  // Numpad - high contrast
  numpadKey: '#FFFFFF',
  numpadKeyText: '#000000',
  numpadKeyBorder: '#000000',
  numpadClearBg: '#FFE6E6',
  numpadBackspaceBg: '#E6F3FF',

  // Charts - solid colors, high contrast
  chartLine: '#0D9488',
  chartDot: '#000000',
  chartLabel: '#000000',
  chartLineDiastolic: '#14B8A6',
  chartZoneNormal: '#E8F5E9',
  chartZoneElevated: '#FFF9C4',
  chartZoneHigh: '#FFEBEE',

  // Toggle
  toggleTrackActive: '#0D9488',
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

  // No shadows in high contrast
  shadow: '#000000',
  shadowOpacity: 0,
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
  normal: '#4ade80',
  elevated: '#fbbf24',
  stage_1: '#fb923c',
  stage_2: '#f87171',
  crisis: '#ef4444',
};

import type { BPCategory } from './index';

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

  accent: '#4EB8A0',

  border: '#e5e7eb',
  borderLight: '#f1f5f9',

  error: '#dc2626',
  errorBackground: '#fef2f2',

  gradientStart: '#5CBDA5',
  gradientEnd: '#7FCFBC',

  tabBarBackground: '#ffffff',
  tabBarBorder: '#f1f5f9',

  numpadKey: '#ffffff',
  numpadKeyText: '#1f2937',
  numpadKeyBorder: 'rgba(0,0,0,0.05)',
  numpadClearBg: '#fef2f2',
  numpadBackspaceBg: '#f0f9ff',

  chartLine: '#4EB8A0',
  chartDot: '#ffffff',
  chartLabel: '#475569',

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

  accent: '#4EB8A0',

  border: '#334155',
  borderLight: '#1e293b',

  error: '#f87171',
  errorBackground: '#451a1a',

  gradientStart: '#14b8a6',
  gradientEnd: '#0d9488',

  tabBarBackground: '#1e293b',
  tabBarBorder: '#334155',

  numpadKey: '#2a3441',
  numpadKeyText: '#f8fafc',
  numpadKeyBorder: 'rgba(255,255,255,0.06)',
  numpadClearBg: '#3b1c1c',
  numpadBackspaceBg: '#1c2d3b',

  chartLine: '#4EB8A0',
  chartDot: '#1e293b',
  chartLabel: '#94a3b8',

  overlay: 'rgba(0,0,0,0.6)',

  shadow: '#000000',
  shadowOpacity: 0.3,
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

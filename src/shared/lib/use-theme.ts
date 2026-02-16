import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settings-store';
import {
  lightColors,
  darkColors,
  highContrastColors,
  computeTypographyScale,
  SENIOR_SCALE,
  type ThemeColors,
  type TypographyScale,
} from '../config/theme';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
  fontScale: number;
  highContrast: boolean;
  typography: TypographyScale;
}

export function useTheme(): UseThemeResult {
  const { theme, highContrast, seniorMode } = useSettingsStore();
  const systemColorScheme = useColorScheme();

  // High Contrast forces Light Mode
  const effectiveTheme = highContrast ? 'light' : theme;

  // Determine actual theme (resolve 'system')
  const actualTheme =
    effectiveTheme === 'system'
      ? systemColorScheme || 'light'
      : effectiveTheme;

  const isDark = actualTheme === 'dark';

  // Use high-contrast palette if enabled, otherwise normal theme colors
  const colors = highContrast
    ? highContrastColors
    : (isDark ? darkColors : lightColors);

  // Font scale multiplier for Senior Mode
  const fontScale = seniorMode ? SENIOR_SCALE : 1.0;

  // Pre-computed typography scale (use these in components instead of raw fontScale math)
  const typography = computeTypographyScale(seniorMode);

  return { colors, isDark, fontScale, highContrast, typography };
}

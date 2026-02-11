import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settings-store';
import { lightColors, darkColors, highContrastColors, type ThemeColors } from '../config/theme';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
  fontScale: number;
  highContrast: boolean;
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
  const fontScale = seniorMode ? 1.2 : 1.0;

  return { colors, isDark, fontScale, highContrast };
}

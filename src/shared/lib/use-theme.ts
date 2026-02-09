import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settings-store';
import { lightColors, darkColors, type ThemeColors } from '../config/theme';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
}

export function useTheme(): UseThemeResult {
  const { theme } = useSettingsStore();
  const systemScheme = useColorScheme();

  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}

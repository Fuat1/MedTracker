import { useTheme } from '../../shared/lib/use-theme';
import { BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../shared/config/theme';
import { validateBPValues, classifyBP, getBPCategoryLabel } from './lib';
import type { BPGuideline } from '../../shared/config/settings';

export function useBPClassification(
  systolic: string,
  diastolic: string,
  pulse: string,
  guideline: BPGuideline,
) {
  const { colors, isDark } = useTheme();
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const systolicNum = systolic ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic ? parseInt(diastolic, 10) : null;
  const pulseNum = pulse ? parseInt(pulse, 10) : null;

  const validation = validateBPValues(systolicNum, diastolicNum, pulseNum);
  const category =
    systolicNum && diastolicNum ? classifyBP(systolicNum, diastolicNum, guideline) : null;
  const categoryColor = category ? bpColors[category] : colors.textTertiary;
  const categoryLabel = category ? getBPCategoryLabel(category) : '';

  return { systolicNum, diastolicNum, pulseNum, validation, category, categoryColor, categoryLabel };
}

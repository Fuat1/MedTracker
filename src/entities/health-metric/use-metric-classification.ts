/**
 * Generic Metric Classification Hook
 *
 * Wraps config.classify() + config.categories color lookup.
 * Reads the active guideline from the settings store and resolves
 * the category color for the current theme (light / dark / high-contrast).
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 3
 */

import i18n from '../../shared/lib/i18n';
import { useTheme } from '../../shared/lib/use-theme';
import { useSettingsStore } from '../../shared/lib/settings-store';
import type { MetricCategory, MetricConfig } from '../../shared/config/metric-types';

export interface MetricClassificationResult {
  categoryId: string | null;
  category: MetricCategory | null;
  /** Resolved hex color for the current theme */
  categoryColor: string;
  /** Translated category label (empty string when no category) */
  categoryLabel: string;
}

/**
 * Classifies a partial set of field values using the given MetricConfig.
 *
 * Returns null category when:
 * - `values` is null/undefined
 * - Any required field value is missing
 */
export function useMetricClassification<TValues extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<any, TValues>,
  values: Partial<TValues> | null | undefined,
): MetricClassificationResult {
  const { colors, isDark, highContrast } = useTheme();
  const settingsGuideline = useSettingsStore(state => state.guideline);

  // Resolve guideline: prefer settings store value if it matches a guideline in
  // this config, otherwise fall back to the config's default or first guideline.
  const guidelineId =
    config.guidelines.find(g => g.id === settingsGuideline)?.id ??
    config.guidelines.find(g => g.isDefault)?.id ??
    config.guidelines[0]?.id ??
    settingsGuideline;

  if (!values) {
    return {
      categoryId: null,
      category: null,
      categoryColor: colors.textTertiary,
      categoryLabel: '',
    };
  }

  // All required fields must be present before classifying
  const hasAllRequired = config.fields
    .filter(f => f.required !== false)
    .every(f => {
      const v = values[f.key as keyof TValues];
      return v !== undefined && v !== null;
    });

  if (!hasAllRequired) {
    return {
      categoryId: null,
      category: null,
      categoryColor: colors.textTertiary,
      categoryLabel: '',
    };
  }

  const categoryId = config.classify(values as TValues, guidelineId);
  const category = config.categories.find(c => c.id === categoryId) ?? null;

  const categoryColor = category
    ? (highContrast
        ? category.colorHighContrast
        : isDark
          ? category.colorDark
          : category.colorLight)
    : colors.textTertiary;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryLabel = category ? String(i18n.t(category.labelKey as any)) : '';

  return { categoryId, category, categoryColor, categoryLabel };
}

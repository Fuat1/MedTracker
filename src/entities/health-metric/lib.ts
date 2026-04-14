/**
 * Generic Metric Validation
 *
 * Reads field definitions and cross-field rules from MetricConfig to perform
 * range checks and logical validation on any health metric's input values.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 3
 */

import type { MetricConfig } from '../../shared/config/metric-types';
import i18n from '../../shared/lib/i18n';

export interface MetricValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate field values against a MetricConfig.
 *
 * Checks:
 * 1. Required fields are present
 * 2. Numeric fields are within [min, max]
 * 3. All cross-field rules pass
 *
 * Returns `{ isValid: true, errors: [] }` when all checks pass.
 */
export function validateMetricValues<TValues extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<any, TValues>,
  values: Partial<TValues>,
): MetricValidationResult {
  const errors: string[] = [];

  // Per-field range + required checks
  for (const field of config.fields) {
    const value = values[field.key as keyof TValues];
    const isPresent = value !== undefined && value !== null;

    if (field.required !== false && !isPresent) {
      const errorKey = field.requiredErrorKey ?? 'validation:errors.required';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      errors.push(i18n.t(errorKey as any, { field: i18n.t(field.labelKey as any) }));
      continue;
    }

    if (isPresent && typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        const errorKey = field.rangeErrorKey ?? 'validation:errors.outOfRange';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errors.push(i18n.t(errorKey as any, { min: field.min, max: field.max ?? '∞' }));
      } else if (field.max !== undefined && value > field.max) {
        const errorKey = field.rangeErrorKey ?? 'validation:errors.outOfRange';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errors.push(i18n.t(errorKey as any, { min: field.min ?? '-∞', max: field.max }));
      }
    }
  }

  // Cross-field rules (e.g., systolic > diastolic)
  if (config.crossFieldRules) {
    for (const rule of config.crossFieldRules) {
      if (!rule.validate(values)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        errors.push(i18n.t(rule.errorKey as any));
      }
    }
  }

  return { isValid: errors.length === 0, errors };
}

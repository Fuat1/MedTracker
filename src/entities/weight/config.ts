/**
 * Weight MetricConfig instance — Phase 9 smoke test.
 *
 * Demonstrates that a new metric can be created with minimal code:
 * - Single field (value in kg)
 * - 4 generic categories (underweight/normal/overweight/obese)
 * - No circadian analysis, no crisis detection, no derived metrics
 * - No custom UI components — all generic widgets/pages used
 *
 * Note: Category thresholds are approximate weight ranges for adults.
 * A production implementation would use BMI (weight / height²) instead.
 *
 * RULES:
 *   - NO React imports (pure data config, no component overrides)
 */

import type { MetricConfig } from '../../shared/config/metric-types';

/** Weight record domain type. */
export interface WeightRecord {
  id: string;
  value: number;           // kg
  timestamp: number;       // Unix seconds
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
}

/** Weight field values for classification. */
export interface WeightValues extends Record<string, unknown> {
  value: number;
}

export const weightConfig: MetricConfig<WeightRecord, WeightValues> = {
  // ── Identity ──────────────────────────────────────────────────────────────
  id: 'weight',
  nameKey: 'medical:metrics.weight',
  shortNameKey: 'medical:metrics.weightShort',
  iconName: 'scale-outline',
  queryKey: ['weight-records'],

  // ── Fields ────────────────────────────────────────────────────────────────
  fields: [
    {
      key: 'value',
      labelKey: 'medical:weight.fields.value',
      unit: 'kg',
      type: 'float',
      min: 20,
      max: 500,
      required: true,
      rangeErrorKey: 'medical:weight.errors.valueOutOfRange',
    },
  ],

  // ── Categories ────────────────────────────────────────────────────────────
  categories: [
    {
      id: 'underweight',
      labelKey: 'medical:weight.categories.underweight',
      colorLight: '#60a5fa',
      colorDark: '#93c5fd',
      colorHighContrast: '#1d4ed8',
      severity: 'caution',
    },
    {
      id: 'normal',
      labelKey: 'medical:weight.categories.normal',
      colorLight: '#22c55e',
      colorDark: '#86efac',
      colorHighContrast: '#15803d',
      severity: 'safe',
    },
    {
      id: 'overweight',
      labelKey: 'medical:weight.categories.overweight',
      colorLight: '#f97316',
      colorDark: '#fdba74',
      colorHighContrast: '#c2410c',
      severity: 'warning',
    },
    {
      id: 'obese',
      labelKey: 'medical:weight.categories.obese',
      colorLight: '#ef4444',
      colorDark: '#fca5a5',
      colorHighContrast: '#b91c1c',
      severity: 'danger',
    },
  ],

  // ── Guidelines ────────────────────────────────────────────────────────────
  // Single generic guideline — weight tracking doesn't use multiple guidelines
  guidelines: [
    {
      id: 'who',
      nameKey: 'medical:weight.guideline.name',
      year: 1995,
      isDefault: true,
    },
  ],

  // ── Classification ────────────────────────────────────────────────────────
  // Simple weight-range classification (placeholder — production would use BMI)
  classify: (values: WeightValues): string => {
    const { value } = values;
    if (value < 50) return 'underweight';
    if (value <= 90) return 'normal';
    if (value <= 120) return 'overweight';
    return 'obese';
  },

  // ── Database Schema ───────────────────────────────────────────────────────
  db: {
    tableName: 'weight_records',
    columns: [
      { name: 'value',  type: 'REAL',    notNull: true,  check: 'value BETWEEN 20 AND 500' },
      { name: 'notes',  type: 'TEXT',    notNull: false },
    ],
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_weight_records_timestamp ON weight_records(timestamp DESC)',
    ],
  },

  // ── Row → Domain mapping ──────────────────────────────────────────────────
  rowToDomain: (row): WeightRecord => ({
    id:        row.id as string,
    value:     row.value as number,
    timestamp: row.timestamp as number,
    notes:     (row.notes as string | null) ?? null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    isSynced:  (row.is_synced as number) === 1,
  }),

  domainToFieldValues: (record: WeightRecord): WeightValues => ({
    value: record.value,
  }),
};

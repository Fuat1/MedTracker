/**
 * Blood Pressure MetricConfig instance.
 *
 * This is the BP metric expressed as a MetricConfig<BPRecord, BPValues>.
 * Generic screens, widgets, and repositories read from this config.
 *
 * RULES:
 *   - NO React imports (pure data — component overrides live in components.ts)
 *   - NO hardcoded BP thresholds — all must come from bp-guidelines.ts
 *   - See docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 1
 */

import {
  BP_LIMITS,
  BP_THRESHOLDS,
  BP_GUIDELINES,
  BP_CATEGORIES,
} from '../../shared/config';
import { BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../shared/config/theme';
import type { BPCategory, MeasurementLocation, MeasurementPosture } from '../../shared/config';
import type { MetricConfig } from '../../shared/config/metric-types';
import {
  classifyBP,
  calculatePulsePressure,
  calculateMAP,
  interpretPulsePressure,
  interpretMAP,
} from './lib';
import type { BPRecord } from '../../shared/api/bp-repository';

/**
 * The "field values" type used for classification and validation.
 * Subset of BPRecord containing only the measured values.
 */
export interface BPValues extends Record<string, unknown> {
  systolic: number;
  diastolic: number;
  pulse?: number | null;
}

/**
 * BP MetricConfig instance.
 *
 * Registered at app startup via:
 *   registerMetric({ ...bpConfig, components: bpComponents })
 * in src/app/providers/
 */
export const bpConfig: MetricConfig<BPRecord, BPValues> = {
  // ── Identity ──────────────────────────────────────────────────────────────
  id: 'blood-pressure',
  nameKey: 'medical:metrics.bloodPressure',
  shortNameKey: 'medical:metrics.bloodPressureShort',
  iconName: 'heart',
  queryKey: ['bp-records'],

  // ── Fields ────────────────────────────────────────────────────────────────
  fields: [
    {
      key: 'systolic',
      labelKey: 'medical:fields.systolic',
      unit: 'mmHg',
      unitKey: 'medical:units.mmhg',
      type: 'integer',
      min: BP_LIMITS.systolic.min,
      max: BP_LIMITS.systolic.max,
      required: true,
      rangeErrorKey: 'validation:errors.systolicRange',
      requiredErrorKey: 'validation:errors.systolicRequired',
    },
    {
      key: 'diastolic',
      labelKey: 'medical:fields.diastolic',
      unit: 'mmHg',
      unitKey: 'medical:units.mmhg',
      type: 'integer',
      min: BP_LIMITS.diastolic.min,
      max: BP_LIMITS.diastolic.max,
      required: true,
      rangeErrorKey: 'validation:errors.diastolicRange',
      requiredErrorKey: 'validation:errors.diastolicRequired',
    },
    {
      key: 'pulse',
      labelKey: 'medical:fields.pulse',
      unit: 'BPM',
      unitKey: 'medical:units.bpm',
      type: 'integer',
      min: BP_LIMITS.pulse.min,
      max: BP_LIMITS.pulse.max,
      required: false,
      rangeErrorKey: 'validation:errors.pulseRange',
    },
  ],

  crossFieldRules: [
    {
      errorKey: 'validation:errors.systolicGreater',
      validate: (values) => {
        const { systolic, diastolic } = values as Partial<BPValues>;
        if (systolic == null || diastolic == null) return true; // skip if not both present
        return systolic > diastolic;
      },
    },
  ],

  contextFields: [
    {
      key: 'location',
      labelKey: 'bpEntry.location',
      dbType: 'TEXT',
      defaultValue: 'left_arm',
      options: [
        { value: 'left_arm',    labelKey: 'medical:locations.leftArm',    iconName: 'body' },
        { value: 'right_arm',   labelKey: 'medical:locations.rightArm',   iconName: 'body' },
        { value: 'left_wrist',  labelKey: 'medical:locations.leftWrist',  iconName: 'watch' },
        { value: 'right_wrist', labelKey: 'medical:locations.rightWrist', iconName: 'watch' },
      ],
    },
    {
      key: 'posture',
      labelKey: 'bpEntry.posture',
      dbType: 'TEXT',
      defaultValue: 'sitting',
      options: [
        { value: 'sitting',    labelKey: 'medical:postures.sitting',   iconName: 'person' },
        { value: 'standing',   labelKey: 'medical:postures.standing',  iconName: 'walk' },
        { value: 'lying',      labelKey: 'medical:postures.lying',     iconName: 'bed' },
      ],
    },
  ],

  // ── Classification ────────────────────────────────────────────────────────
  categories: [
    {
      id: BP_CATEGORIES.NORMAL,
      labelKey: 'medical:categories.normal',
      colorLight: BP_COLORS_LIGHT[BP_CATEGORIES.NORMAL],
      colorDark: BP_COLORS_DARK[BP_CATEGORIES.NORMAL],
      colorHighContrast: '#00c853',
      severity: 'safe',
    },
    {
      id: BP_CATEGORIES.ELEVATED,
      labelKey: 'medical:categories.elevated',
      colorLight: BP_COLORS_LIGHT[BP_CATEGORIES.ELEVATED],
      colorDark: BP_COLORS_DARK[BP_CATEGORIES.ELEVATED],
      colorHighContrast: '#ffd600',
      severity: 'caution',
    },
    {
      id: BP_CATEGORIES.STAGE_1,
      labelKey: 'medical:categories.stage1',
      colorLight: BP_COLORS_LIGHT[BP_CATEGORIES.STAGE_1],
      colorDark: BP_COLORS_DARK[BP_CATEGORIES.STAGE_1],
      colorHighContrast: '#ff6d00',
      severity: 'warning',
    },
    {
      id: BP_CATEGORIES.STAGE_2,
      labelKey: 'medical:categories.stage2',
      colorLight: BP_COLORS_LIGHT[BP_CATEGORIES.STAGE_2],
      colorDark: BP_COLORS_DARK[BP_CATEGORIES.STAGE_2],
      colorHighContrast: '#dd2c00',
      severity: 'danger',
    },
    {
      id: BP_CATEGORIES.CRISIS,
      labelKey: 'medical:categories.crisis',
      colorLight: BP_COLORS_LIGHT[BP_CATEGORIES.CRISIS],
      colorDark: BP_COLORS_DARK[BP_CATEGORIES.CRISIS],
      colorHighContrast: '#b71c1c',
      severity: 'critical',
    },
  ],

  guidelines: [
    {
      id: BP_GUIDELINES.AHA_ACC,
      nameKey: 'settings:guidelines.ahaAcc.name',
      descriptionKey: 'settings:guidelines.ahaAcc.description',
      year: 2025,
      isDefault: true,
    },
    {
      id: BP_GUIDELINES.ESC_ESH,
      nameKey: 'settings:guidelines.escEsh.name',
      descriptionKey: 'settings:guidelines.escEsh.description',
      year: 2018,
    },
    {
      id: BP_GUIDELINES.JSH,
      nameKey: 'settings:guidelines.jsh.name',
      descriptionKey: 'settings:guidelines.jsh.description',
      year: 2025,
    },
    {
      id: BP_GUIDELINES.WHO,
      nameKey: 'settings:guidelines.who.name',
      descriptionKey: 'settings:guidelines.who.description',
      year: 1999,
    },
  ],

  // Delegates to the existing pure classifyBP() function
  classify: (values: BPValues, guidelineId: string) =>
    classifyBP(values.systolic, values.diastolic, guidelineId as typeof BP_GUIDELINES[keyof typeof BP_GUIDELINES]),

  // ── Crisis ────────────────────────────────────────────────────────────────
  crisis: {
    crisisCategoryId: BP_CATEGORIES.CRISIS,
    isCrisis: (values: BPValues, guidelineId: string) => {
      const t = BP_THRESHOLDS[guidelineId] ?? BP_THRESHOLDS[BP_GUIDELINES.AHA_ACC];
      return values.systolic >= t.crisis.systolic || values.diastolic >= t.crisis.diastolic;
    },
    alertTitleKey: 'crisis:alert.title',
    alertBodyKey: 'crisis:alert.body',
  },

  // ── Derived Metrics ───────────────────────────────────────────────────────
  derived: [
    {
      key: 'pulsePressure',
      labelKey: 'medical:derived.pulsePressure',
      unit: 'mmHg',
      compute: (values: BPValues) => calculatePulsePressure(values.systolic, values.diastolic),
      interpret: interpretPulsePressure,
      interpretLowKey: 'medical:derived.pp.low',
      interpretNormalKey: 'medical:derived.pp.normal',
      interpretHighKey: 'medical:derived.pp.high',
    },
    {
      key: 'map',
      labelKey: 'medical:derived.map',
      unit: 'mmHg',
      compute: (values: BPValues) => calculateMAP(values.systolic, values.diastolic),
      interpret: interpretMAP,
      interpretLowKey: 'medical:derived.map.low',
      interpretNormalKey: 'medical:derived.map.normal',
      interpretHighKey: 'medical:derived.map.high',
    },
  ],

  // ── Circadian Analysis ────────────────────────────────────────────────────
  circadian: {
    enabled: true,
    primaryFieldKeys: ['systolic', 'diastolic'],
    morningSurgeThreshold: 20,
    morningSurgeLabelKey: 'medical:circadian.morningSurge',
  },

  // ── Database Schema ───────────────────────────────────────────────────────
  db: {
    tableName: 'bp_records',
    tagsTableName: 'bp_tags',
    columns: [
      // Measurement fields
      { name: 'systolic',        type: 'INTEGER', notNull: true,  check: `systolic BETWEEN ${BP_LIMITS.systolic.min} AND ${BP_LIMITS.systolic.max}` },
      { name: 'diastolic',       type: 'INTEGER', notNull: true,  check: `diastolic BETWEEN ${BP_LIMITS.diastolic.min} AND ${BP_LIMITS.diastolic.max}` },
      { name: 'pulse',           type: 'INTEGER', notNull: false, check: `pulse BETWEEN ${BP_LIMITS.pulse.min} AND ${BP_LIMITS.pulse.max}` },
      // Context fields
      { name: 'timezone_offset', type: 'INTEGER', notNull: false, default: '0' },
      { name: 'location',        type: 'TEXT',    notNull: false, default: "'left_arm'" },
      { name: 'posture',         type: 'TEXT',    notNull: false, default: "'sitting'" },
      { name: 'notes',           type: 'TEXT',    notNull: false },
      // Extended fields (added via migrations)
      { name: 'weight',          type: 'REAL',    notNull: false, check: 'weight IS NULL OR weight BETWEEN 20 AND 500' },
      { name: 'owner_uid',       type: 'TEXT',    notNull: false },
    ],
    tableChecks: ['systolic > diastolic'],
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_bp_records_timestamp ON bp_records(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_bp_tags_record_id ON bp_tags(record_id)',
      'CREATE INDEX IF NOT EXISTS idx_bp_tags_tag ON bp_tags(tag)',
    ],
  },

  // ── Row → Domain mapping ──────────────────────────────────────────────────
  rowToDomain: (row): BPRecord => ({
    id:             row.id as string,
    systolic:       row.systolic as number,
    diastolic:      row.diastolic as number,
    pulse:          row.pulse as number | null ?? null,
    timestamp:      row.timestamp as number,
    timezoneOffset: (row.timezone_offset as number) ?? 0,
    location:       (row.location as MeasurementLocation) ?? 'left_arm',
    posture:        (row.posture as MeasurementPosture) ?? 'sitting',
    notes:          (row.notes as string | null) ?? null,
    weight:         (row.weight as number | null) ?? null,
    createdAt:      row.created_at as number,
    updatedAt:      row.updated_at as number,
    isSynced:       (row.is_synced as number) === 1,
    ownerUid:       (row.owner_uid as string | null) ?? null,
  }),

  domainToFieldValues: (record: BPRecord): BPValues => ({
    systolic:  record.systolic,
    diastolic: record.diastolic,
    pulse:     record.pulse,
  }),

  // ── i18n ──────────────────────────────────────────────────────────────────
  i18nNamespaces: ['medical', 'validation', 'settings', 'crisis'],

  // ── Export ────────────────────────────────────────────────────────────────
  export: {
    reportTitleKey: 'export:report.bpTitle',
    tableColumns: [
      { fieldKey: 'systolic',  headerKey: 'medical:fields.systolic',  unit: 'mmHg' },
      { fieldKey: 'diastolic', headerKey: 'medical:fields.diastolic', unit: 'mmHg' },
      { fieldKey: 'pulse',     headerKey: 'medical:fields.pulse',     unit: 'BPM'  },
    ],
  },
};

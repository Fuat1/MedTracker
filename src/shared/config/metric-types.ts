/**
 * MetricConfig<T> — Config-first health metric template.
 *
 * This file defines the TypeScript interfaces that describe everything about
 * a health metric: fields, validation, classification, DB schema, i18n, and
 * optional custom UI component overrides.
 *
 * Usage:
 *   - Type definitions live in `shared/config` (no FSD violation)
 *   - Config *instances* live in `entities/<metric>/config.ts`
 *   - Component overrides live in `entities/<metric>/components.ts`
 *   - Registration (config + components merged) happens in `app/providers/`
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md
 */

import type React from 'react';

// ─── Field Definitions ────────────────────────────────────────────────────────

/** The primitive types a metric field can hold. */
export type MetricFieldType = 'integer' | 'float' | 'text' | 'boolean';

/**
 * Definition of a single measurement field (e.g., systolic, diastolic, glucose).
 *
 * `key` must match the DB column name exactly.
 */
export interface MetricFieldDef {
  /** Unique key — must match the SQLite column name */
  readonly key: string;
  /** i18n key for the field label shown in UI */
  readonly labelKey: string;
  /** i18n key for the unit label (e.g., "mmHg", "mg/dL") */
  readonly unitKey?: string;
  /** Plain unit string for cases without i18n (e.g., "mmHg") */
  readonly unit?: string;
  readonly type: MetricFieldType;
  /** Minimum valid value (inclusive) — undefined = no lower bound */
  readonly min?: number;
  /** Maximum valid value (inclusive) — undefined = no upper bound */
  readonly max?: number;
  /** Whether this field is required. Defaults to true. */
  readonly required?: boolean;
  /** i18n key for the "out of range" error message */
  readonly rangeErrorKey?: string;
  /** i18n key for the "required" error message */
  readonly requiredErrorKey?: string;
}

/**
 * A cross-field validation rule (e.g., systolic must be > diastolic).
 */
export interface CrossFieldRule<T extends Record<string, unknown>> {
  /** i18n key for the error message shown when this rule fails */
  readonly errorKey: string;
  /** Pure function that returns true when the values are VALID */
  readonly validate: (values: Partial<T>) => boolean;
}

// ─── Context Fields ───────────────────────────────────────────────────────────

/**
 * An optional context dimension for measurements (location, posture, meal
 * timing, etc.). These become additional columns in the DB table.
 */
export interface ContextFieldDef {
  /** Unique key — must match the SQLite column name */
  readonly key: string;
  /** i18n key for the label */
  readonly labelKey: string;
  /** Allowed string values */
  readonly options: ReadonlyArray<{
    readonly value: string;
    readonly labelKey: string;
    readonly iconName?: string;
  }>;
  /** Default value when user hasn't selected one */
  readonly defaultValue: string;
  /** SQLite type — always TEXT for enum-like context fields */
  readonly dbType: 'TEXT' | 'INTEGER' | 'REAL';
  /** Whether this field is required. Defaults to false. */
  readonly required?: boolean;
}

// ─── Classification ───────────────────────────────────────────────────────────

/**
 * A classification category (e.g., "normal", "stage_1").
 *
 * Colors are per-theme so the UI can switch between light/dark/high-contrast.
 */
export interface MetricCategory {
  /** Unique identifier for this category (e.g., 'normal', 'stage_1') */
  readonly id: string;
  /** i18n key for the human-readable label */
  readonly labelKey: string;
  /** Hex color for light theme */
  readonly colorLight: string;
  /** Hex color for dark theme */
  readonly colorDark: string;
  /** Hex color for high-contrast mode */
  readonly colorHighContrast: string;
  /** Reanimated accessible contrast compliant (WCAG AA) with both themes */
  readonly severity: 'safe' | 'caution' | 'warning' | 'danger' | 'critical';
}

/**
 * Definition of a clinical guideline (e.g., AHA/ACC, ESC/ESH).
 * Most metrics have one guideline; BP has four.
 */
export interface ClassificationGuideline {
  /** Short ID (e.g., 'aha_acc') used as settings store value */
  readonly id: string;
  /** i18n key for the display name */
  readonly nameKey: string;
  /** i18n key for the short description shown in settings */
  readonly descriptionKey?: string;
  /** Year the guideline was published */
  readonly year?: number;
  /** Whether this is the default guideline for this metric */
  readonly isDefault?: boolean;
}

/**
 * Function signature for classifying a set of field values into a category.
 *
 * - `values`: the raw measurement values (e.g., { systolic: 130, diastolic: 85 })
 * - `guidelineId`: the currently selected guideline
 * - Returns a category `id` string matching one of `MetricConfig.categories`
 */
export type ClassifyFn<T extends Record<string, unknown>> = (
  values: T,
  guidelineId: string,
) => string;

// ─── Crisis / Alert ───────────────────────────────────────────────────────────

/**
 * Optional crisis detection configuration.
 * When defined, the record-metric feature hook calls `isCrisis` after every
 * insert and shows an alert if it returns true.
 */
export interface CrisisConfig<T extends Record<string, unknown>> {
  /** Category ID that is considered "crisis" */
  readonly crisisCategoryId: string;
  /** Pure function — returns true if values represent a crisis reading */
  readonly isCrisis: (values: T, guidelineId: string) => boolean;
  /** i18n key for the crisis modal title */
  readonly alertTitleKey: string;
  /** i18n key for the crisis modal body (emergency instructions) */
  readonly alertBodyKey: string;
}

// ─── Derived Metrics ─────────────────────────────────────────────────────────

/**
 * An optional derived/calculated metric (e.g., Pulse Pressure, MAP for BP).
 *
 * Derived metrics are computed from raw field values and displayed alongside
 * the main reading in analytics, but not stored in the DB.
 */
export interface DerivedMetricDef<T extends Record<string, unknown>> {
  readonly key: string;
  /** i18n key for the label */
  readonly labelKey: string;
  readonly unit?: string;
  readonly unitKey?: string;
  /** Pure function that computes the derived value */
  readonly compute: (values: T) => number | null;
  /** Optional interpretation of the result ('low' | 'normal' | 'high') */
  readonly interpret?: (value: number) => 'low' | 'normal' | 'high';
  /** i18n key for the "low" interpretation label */
  readonly interpretLowKey?: string;
  /** i18n key for the "normal" interpretation label */
  readonly interpretNormalKey?: string;
  /** i18n key for the "high" interpretation label */
  readonly interpretHighKey?: string;
}

// ─── Database Schema ──────────────────────────────────────────────────────────

/** Column definition for the generated CREATE TABLE SQL. */
export interface MetricDBColumnDef {
  /** SQLite column name */
  readonly name: string;
  /** SQLite type (TEXT, INTEGER, REAL) */
  readonly type: 'TEXT' | 'INTEGER' | 'REAL';
  /** Whether the column is NOT NULL */
  readonly notNull?: boolean;
  /** DEFAULT clause value (e.g., '0', "'left_arm'") — raw SQL */
  readonly default?: string;
  /** CHECK constraint expression (e.g., 'systolic BETWEEN 40 AND 300') */
  readonly check?: string;
  /** Whether this column is part of the PRIMARY KEY */
  readonly primaryKey?: boolean;
}

/**
 * DB schema definition for a metric.
 *
 * The generic repository uses `tableName`, `columns`, and `indexes` to
 * generate CREATE TABLE and CREATE INDEX SQL at init time.
 * The `tagsTableName` drives the generic tags repository.
 */
export interface MetricDBSchema {
  /** Main records table name (e.g., 'bp_records') */
  readonly tableName: string;
  /** Tags join table name (e.g., 'bp_tags') — omit if metric has no tags */
  readonly tagsTableName?: string;
  /** Column definitions (excluding the standard id/created_at/updated_at/is_synced columns) */
  readonly columns: ReadonlyArray<MetricDBColumnDef>;
  /** Additional CHECK constraints at the table level (e.g., 'systolic > diastolic') */
  readonly tableChecks?: ReadonlyArray<string>;
  /** Additional CREATE INDEX SQL statements */
  readonly indexes?: ReadonlyArray<string>;
}

// ─── Circadian Config ─────────────────────────────────────────────────────────

/**
 * Optional circadian (time-of-day) analysis configuration.
 * When enabled, the CircadianCard widget shows morning/afternoon/evening/night
 * breakdowns and surge detection.
 */
export interface CircadianConfig {
  readonly enabled: boolean;
  /**
   * Keys of the fields to use for circadian tracking (primary value per period).
   * For BP: ['systolic', 'diastolic']. For weight: ['value'].
   */
  readonly primaryFieldKeys: ReadonlyArray<string>;
  /**
   * Morning surge threshold in the primary field unit.
   * Surge = morning avg − nocturnal avg > threshold.
   * For BP: 20 mmHg.
   */
  readonly morningSurgeThreshold?: number;
  /** i18n key for "morning surge detected" label */
  readonly morningSurgeLabelKey?: string;
}

// ─── Component Override Slots ─────────────────────────────────────────────────

/**
 * Optional custom React components that override the generic defaults.
 *
 * FSD note: These are typed as `React.ComponentType<any>` here (shared/ layer)
 * so that the interface itself is importable without referencing any widget/page.
 * The actual component references are provided only in `app/providers/` after
 * merging config + components.
 *
 * @see src/entities/blood-pressure/components.ts
 * @see src/app/providers/index.tsx
 */
export interface ComponentOverrides {
  /** Replaces GenericEntryForm — use for metrics with a custom input UI (e.g., BP dual numpad) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  EntryForm?: React.ComponentType<any>;
  /** Replaces GenericRecordCard */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  RecordCard?: React.ComponentType<any>;
  /** Replaces GenericTrendChart */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TrendChart?: React.ComponentType<any>;
  /** Replaces GenericAnalyticsView — use for metrics with complex analytics (BP circadian, PP/MAP) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AnalyticsView?: React.ComponentType<any>;
  /** Replaces the default crisis modal */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CrisisModal?: React.ComponentType<any>;
}

// ─── Export Config ────────────────────────────────────────────────────────────

/**
 * PDF export template configuration for this metric.
 */
export interface ExportConfig<T = Record<string, unknown>> {
  /** i18n key for the report title */
  readonly reportTitleKey: string;
  /** Fields to include as columns in the data table, in order */
  readonly tableColumns: ReadonlyArray<{
    readonly fieldKey: string;
    readonly headerKey: string;
    readonly unit?: string;
  }>;
  /**
   * Optional function to format a single record row for the PDF table.
   * Receives the domain record and returns an array of cell strings.
   */
  readonly formatRow?: (record: T) => string[];
}

// ─── Main MetricConfig<T> Interface ──────────────────────────────────────────

/**
 * Central config interface for a health metric.
 *
 * `T` is the domain record type for this metric (e.g., `BPRecord`).
 * `TValues` is the "raw field values" type used for classification and
 * validation (e.g., `{ systolic: number; diastolic: number; pulse?: number }`).
 *
 * Generic screens and widgets read from this config. Custom behavior is
 * provided via optional `crisis`, `derived`, `circadian`, and `components`
 * fields.
 */
export interface MetricConfig<
  // TRecord intentionally has no extends constraint so plain TS interfaces
  // (like BPRecord) can be used without adding an index signature.
  TRecord = Record<string, unknown>,
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  // ── Identity ────────────────────────────────────────────────────────────────

  /** Unique metric identifier (e.g., 'blood-pressure', 'glucose', 'weight') */
  readonly id: string;
  /** i18n key for the metric name (e.g., 'medical:metrics.bloodPressure') */
  readonly nameKey: string;
  /** i18n key for the short name / abbreviation (e.g., 'BP') */
  readonly shortNameKey?: string;
  /** Ionicons icon name for this metric */
  readonly iconName: string;
  /** TanStack Query key prefix (e.g., ['bp-records']) */
  readonly queryKey: ReadonlyArray<string>;

  // ── Fields ──────────────────────────────────────────────────────────────────

  /** Primary measurement fields, in display order */
  readonly fields: ReadonlyArray<MetricFieldDef>;
  /** Optional cross-field validation rules */
  readonly crossFieldRules?: ReadonlyArray<CrossFieldRule<TValues>>;
  /** Optional contextual metadata fields (location, posture, meal timing) */
  readonly contextFields?: ReadonlyArray<ContextFieldDef>;

  // ── Classification ──────────────────────────────────────────────────────────

  /** All possible classification categories, in severity order (safe → critical) */
  readonly categories: ReadonlyArray<MetricCategory>;
  /** Supported clinical guidelines */
  readonly guidelines: ReadonlyArray<ClassificationGuideline>;
  /**
   * Core classification function — maps field values + guideline → category ID.
   * Must be a pure function (no side effects, no React dependencies).
   */
  readonly classify: ClassifyFn<TValues>;

  // ── Optional Capabilities ───────────────────────────────────────────────────

  /** Optional crisis alert detection. Undefined = no crisis alerts for this metric. */
  readonly crisis?: CrisisConfig<TValues>;
  /** Optional derived/calculated values (PP, MAP for BP). */
  readonly derived?: ReadonlyArray<DerivedMetricDef<TValues>>;
  /** Optional circadian time-of-day analysis. */
  readonly circadian?: CircadianConfig;

  // ── Database ────────────────────────────────────────────────────────────────

  /** Database schema used by the generic repository to create tables */
  readonly db: MetricDBSchema;

  /**
   * Convert a raw DB row to the domain record type.
   * Called by the generic repository after SELECT.
   */
  readonly rowToDomain: (row: Record<string, unknown>) => TRecord;

  /**
   * Extract the field values subset from a domain record (for classification,
   * derived metrics, and validation).
   */
  readonly domainToFieldValues: (record: TRecord) => TValues;

  // ── i18n / Export ───────────────────────────────────────────────────────────

  /** i18n namespace(s) used by this metric (e.g., ['medical', 'validation']) */
  readonly i18nNamespaces?: ReadonlyArray<string>;
  /** Optional PDF export configuration */
  readonly export?: ExportConfig<TRecord>;

  // ── UI Component Overrides ──────────────────────────────────────────────────

  /**
   * Optional custom UI component overrides.
   *
   * FSD note: This field is intentionally optional and added only when
   * `registerMetric()` is called from `app/providers/`, not in the config
   * instance defined in `entities/`.
   */
  readonly components?: ComponentOverrides;
}

// ─── Utility Types ────────────────────────────────────────────────────────────

/** Extract the record type from a MetricConfig */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MetricRecord<C> = C extends MetricConfig<infer R, any> ? R : never;

/** Extract the values type from a MetricConfig */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MetricValues<C> = C extends MetricConfig<any, infer V> ? V : never;

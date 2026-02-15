/**
 * Centralized BP classification thresholds for all supported guidelines.
 *
 * SAFETY: All classification logic MUST reference these constants.
 * Never hardcode threshold values inline.
 *
 * Source: docs/bp-classification-guidelines.md
 */

export interface BPThresholdPair {
  readonly systolic: number;
  readonly diastolic: number;
}

export interface AHAElevatedRule {
  /** SBP must be >= this value */
  readonly systolicMin: number;
  /** DBP must be < this value */
  readonly diastolicBelow: number;
}

export interface RangeElevatedRule {
  /** SBP must be >= this value */
  readonly systolicMin: number;
  /** SBP must be < this value (only for WHO which uses AND logic) */
  readonly systolicBelow?: number;
  /** DBP must be >= this value */
  readonly diastolicMin: number;
  /** DBP must be < this value */
  readonly diastolicBelow: number;
}

export interface GuidelineThresholds {
  readonly crisis: BPThresholdPair;
  readonly stage_2: BPThresholdPair;
  readonly stage_1: BPThresholdPair;
  readonly elevated: AHAElevatedRule | RangeElevatedRule;
  readonly normalBelow: BPThresholdPair;
}

/** AHA/ACC 2025 — USA standard */
const AHA_ACC: GuidelineThresholds = {
  crisis:   { systolic: 180, diastolic: 120 },
  stage_2:  { systolic: 140, diastolic: 90 },
  stage_1:  { systolic: 130, diastolic: 80 },
  elevated: { systolicMin: 120, diastolicBelow: 80 } as AHAElevatedRule,
  normalBelow: { systolic: 120, diastolic: 80 },
};

/** ESC/ESH 2018 — European standard */
const ESC_ESH: GuidelineThresholds = {
  crisis:   { systolic: 180, diastolic: 110 },
  stage_2:  { systolic: 160, diastolic: 100 },
  stage_1:  { systolic: 140, diastolic: 90 },
  elevated: { systolicMin: 130, diastolicMin: 85, diastolicBelow: 90 } as RangeElevatedRule,
  normalBelow: { systolic: 130, diastolic: 85 },
};

/** JSH 2025 — Japan standard (DBP 80, not 85 like ESC) */
const JSH: GuidelineThresholds = {
  crisis:   { systolic: 180, diastolic: 110 },
  stage_2:  { systolic: 160, diastolic: 100 },
  stage_1:  { systolic: 140, diastolic: 90 },
  elevated: { systolicMin: 130, diastolicMin: 80, diastolicBelow: 90 } as RangeElevatedRule,
  normalBelow: { systolic: 130, diastolic: 80 },
};

/** WHO/ISH 1999 — International standard */
const WHO: GuidelineThresholds = {
  crisis:   { systolic: 180, diastolic: 110 },
  stage_2:  { systolic: 160, diastolic: 100 },
  stage_1:  { systolic: 140, diastolic: 90 },
  elevated: { systolicMin: 130, systolicBelow: 140, diastolicMin: 85, diastolicBelow: 90 } as RangeElevatedRule,
  normalBelow: { systolic: 130, diastolic: 85 },
};

/** Lookup by guideline ID string */
export const BP_THRESHOLDS: Record<string, GuidelineThresholds> = {
  aha_acc: AHA_ACC,
  esc_esh: ESC_ESH,
  jsh: JSH,
  who: WHO,
};

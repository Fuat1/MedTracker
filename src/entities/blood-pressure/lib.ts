import {
  BP_LIMITS,
  BP_CATEGORIES,
  BP_CATEGORY_COLORS,
  BP_THRESHOLDS,
  type BPCategory,
} from '../../shared/config';
import type { RangeElevatedRule } from '../../shared/config/bp-guidelines';
import { BP_GUIDELINES, type BPGuideline } from '../../shared/config/settings';
import i18n from '../../shared/lib/i18n';

// Validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Classify BP reading per selected guidelines
export function classifyBP(
  systolic: number,
  diastolic: number,
  guideline: BPGuideline = BP_GUIDELINES.AHA_ACC,
): BPCategory {
  const t = BP_THRESHOLDS[guideline];

  // Unknown guideline → fall back to AHA/ACC
  if (!t) {
    return classifyBP(systolic, diastolic, BP_GUIDELINES.AHA_ACC);
  }

  // Crisis
  if (systolic >= t.crisis.systolic || diastolic >= t.crisis.diastolic) {
    return BP_CATEGORIES.CRISIS;
  }
  // Stage 2
  if (systolic >= t.stage_2.systolic || diastolic >= t.stage_2.diastolic) {
    return BP_CATEGORIES.STAGE_2;
  }
  // Stage 1
  if (systolic >= t.stage_1.systolic || diastolic >= t.stage_1.diastolic) {
    return BP_CATEGORIES.STAGE_1;
  }

  // Elevated — logic varies by guideline type
  const elev = t.elevated;
  if ('diastolicMin' in elev) {
    // Range-based elevated (ESC/ESH, JSH, WHO)
    const rule = elev as RangeElevatedRule;
    if (rule.systolicBelow !== undefined) {
      // WHO: uses OR logic — SBP in range (130-139) OR DBP in range (85-89)
      if (
        (systolic >= rule.systolicMin && systolic < rule.systolicBelow) ||
        (diastolic >= rule.diastolicMin && diastolic < rule.diastolicBelow)
      ) {
        return BP_CATEGORIES.ELEVATED;
      }
    } else {
      // ESC/ESH, JSH: SBP >= min OR DBP in range
      if (
        systolic >= rule.systolicMin ||
        (diastolic >= rule.diastolicMin && diastolic < rule.diastolicBelow)
      ) {
        return BP_CATEGORIES.ELEVATED;
      }
    }
  } else {
    // AHA/ACC: SBP >= min AND DBP < threshold
    if (systolic >= elev.systolicMin && diastolic < elev.diastolicBelow) {
      return BP_CATEGORIES.ELEVATED;
    }
  }

  return BP_CATEGORIES.NORMAL;
}

// Get color for BP category
export function getBPCategoryColor(category: BPCategory): string {
  return BP_CATEGORY_COLORS[category];
}

// Get human-readable label for category
export function getBPCategoryLabel(category: BPCategory): string {
  switch (category) {
    case BP_CATEGORIES.NORMAL:
      return i18n.t('medical:categories.normal');
    case BP_CATEGORIES.ELEVATED:
      return i18n.t('medical:categories.elevated');
    case BP_CATEGORIES.STAGE_1:
      return i18n.t('medical:categories.stage1');
    case BP_CATEGORIES.STAGE_2:
      return i18n.t('medical:categories.stage2');
    case BP_CATEGORIES.CRISIS:
      return i18n.t('medical:categories.crisis');
    default:
      return i18n.t('medical:categories.unknown');
  }
}

// Validate BP values
export function validateBPValues(
  systolic: number | null | undefined,
  diastolic: number | null | undefined,
  pulse?: number | null,
): ValidationResult {
  const errors: string[] = [];

  // Check systolic
  if (systolic === null || systolic === undefined) {
    errors.push(i18n.t('validation:errors.systolicRequired'));
  } else if (
    systolic < BP_LIMITS.systolic.min ||
    systolic > BP_LIMITS.systolic.max
  ) {
    errors.push(
      i18n.t('validation:errors.systolicRange', {
        min: BP_LIMITS.systolic.min,
        max: BP_LIMITS.systolic.max,
      }),
    );
  }

  // Check diastolic
  if (diastolic === null || diastolic === undefined) {
    errors.push(i18n.t('validation:errors.diastolicRequired'));
  } else if (
    diastolic < BP_LIMITS.diastolic.min ||
    diastolic > BP_LIMITS.diastolic.max
  ) {
    errors.push(
      i18n.t('validation:errors.diastolicRange', {
        min: BP_LIMITS.diastolic.min,
        max: BP_LIMITS.diastolic.max,
      }),
    );
  }

  // Check systolic > diastolic
  if (
    systolic !== null &&
    systolic !== undefined &&
    diastolic !== null &&
    diastolic !== undefined &&
    systolic <= diastolic
  ) {
    errors.push(i18n.t('validation:errors.systolicGreater'));
  }

  // Check pulse (optional)
  if (pulse !== null && pulse !== undefined) {
    if (pulse < BP_LIMITS.pulse.min || pulse > BP_LIMITS.pulse.max) {
      errors.push(
        i18n.t('validation:errors.pulseRange', {
          min: BP_LIMITS.pulse.min,
          max: BP_LIMITS.pulse.max,
        }),
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Check if reading indicates crisis (guideline-aware: AHA uses ≥180/120, others use ≥180/110)
export function isCrisisReading(
  systolic: number,
  diastolic: number,
  guideline: BPGuideline = BP_GUIDELINES.AHA_ACC,
): boolean {
  return classifyBP(systolic, diastolic, guideline) === BP_CATEGORIES.CRISIS;
}

/**
 * Calculate Pulse Pressure (PP)
 * PP = Systolic - Diastolic
 * Normal: ~40 mmHg | High: >60 mmHg (cardiovascular risk)
 */
export function calculatePulsePressure(
  systolic: number,
  diastolic: number,
): number {
  return systolic - diastolic;
}

/**
 * Calculate Mean Arterial Pressure (MAP)
 * MAP = (Systolic + 2×Diastolic) / 3
 * Normal: 70-100 mmHg | Clinical use: Organ perfusion pressure
 */
export function calculateMAP(
  systolic: number,
  diastolic: number,
): number {
  return Math.round((systolic + 2 * diastolic) / 3);
}

/**
 * Interpret Pulse Pressure value
 * Low (Narrow) PP: <40 mmHg — May indicate heart failure, blood loss, aortic stenosis
 * Normal PP: 40-60 mmHg — Healthy cardiovascular function
 * High (Wide) PP: >60 mmHg — May indicate arterial stiffness, increased CV risk
 *
 * Source: StatPearls, Cleveland Clinic — Normal PP ≈ 40 mmHg
 * Returns clinical category: 'low' | 'normal' | 'high'
 */
export function interpretPulsePressure(pp: number): 'low' | 'normal' | 'high' {
  if (pp < 40) return 'low';
  if (pp <= 60) return 'normal';
  return 'high';
}

/**
 * Interpret MAP value
 * Returns clinical category: 'low' | 'normal' | 'high'
 */
export function interpretMAP(map: number): 'low' | 'normal' | 'high' {
  if (map < 70) return 'low';
  if (map <= 100) return 'normal';
  return 'high';
}

import {
  BP_LIMITS,
  BP_CATEGORIES,
  BP_CATEGORY_COLORS,
  type BPCategory,
} from '../../shared/config';
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
  // AHA/ACC Guidelines (USA) - 2025 Official Guidelines
  if (guideline === BP_GUIDELINES.AHA_ACC) {
    if (systolic >= 180 || diastolic >= 120) {
      return BP_CATEGORIES.CRISIS;
    }
    if (systolic >= 140 || diastolic >= 90) {
      return BP_CATEGORIES.STAGE_2;
    }
    if (systolic >= 130 || diastolic >= 80) {
      return BP_CATEGORIES.STAGE_1;
    }
    if (systolic >= 120 && diastolic < 80) {
      return BP_CATEGORIES.ELEVATED;
    }
    return BP_CATEGORIES.NORMAL;
  }

  // ESC/ESH Guidelines (Europe) - 2018 framework
  // Note: ESC 2024 uses 3-category system with DBP 70 boundary (not yet implemented)
  if (guideline === BP_GUIDELINES.ESC_ESH) {
    if (systolic >= 180 || diastolic >= 110) {
      return BP_CATEGORIES.CRISIS;
    }
    if (systolic >= 160 || diastolic >= 100) {
      return BP_CATEGORIES.STAGE_2;
    }
    if (systolic >= 140 || diastolic >= 90) {
      return BP_CATEGORIES.STAGE_1;
    }
    // High Normal (Elevated): SBP 130-139 OR DBP 85-89
    // Uses OR logic to prevent classification gap (e.g., 125/87 would be unclassified with AND)
    if (systolic >= 130 || (diastolic >= 85 && diastolic < 90)) {
      return BP_CATEGORIES.ELEVATED;
    }
    // Normal: SBP <130 AND DBP <85
    if (systolic < 130 && diastolic < 85) {
      return BP_CATEGORIES.NORMAL;
    }
    return BP_CATEGORIES.NORMAL; // fallback
  }

  // JSH Guidelines (Japan) - 2025
  // Key difference from ESC/ESH: DBP boundary is 80 mmHg (not 85)
  if (guideline === BP_GUIDELINES.JSH) {
    if (systolic >= 180 || diastolic >= 110) {
      return BP_CATEGORIES.CRISIS;
    }
    if (systolic >= 160 || diastolic >= 100) {
      return BP_CATEGORIES.STAGE_2;
    }
    if (systolic >= 140 || diastolic >= 90) {
      return BP_CATEGORIES.STAGE_1;
    }
    // Elevated BP: SBP 130-139 OR DBP 80-89
    // JSH uses DBP 80 (not 85 like ESC/ESH)
    // Uses OR logic to prevent classification gap (e.g., 125/82 would be unclassified with AND)
    if (systolic >= 130 || (diastolic >= 80 && diastolic < 90)) {
      return BP_CATEGORIES.ELEVATED;
    }
    // Normal BP: SBP <130 AND DBP <80
    if (systolic < 130 && diastolic < 80) {
      return BP_CATEGORIES.NORMAL;
    }
    return BP_CATEGORIES.NORMAL; // fallback
  }

  // WHO/ISH Guidelines (World Health Organization / International Society of Hypertension) - 1999
  // Note: WHO 2021 guideline (WHO/UCN/NCD/20.07) contains no BP classification table
  // These thresholds are from the WHO/ISH 1999 classification system
  // Source: Nugroho et al., Annals of Medicine, 2022
  if (guideline === BP_GUIDELINES.WHO) {
    // WHO uses 180/110 as crisis threshold (similar to ESC/ESH)
    if (systolic >= 180 || diastolic >= 110) {
      return BP_CATEGORIES.CRISIS;
    }
    // WHO defines hypertension as ≥140/≥90 but uses similar staging
    if (systolic >= 160 || diastolic >= 100) {
      return BP_CATEGORIES.STAGE_2;
    }
    if (systolic >= 140 || diastolic >= 90) {
      return BP_CATEGORIES.STAGE_1;
    }
    // WHO considers 130-139/85-89 as high normal (elevated)
    if ((systolic >= 130 && systolic < 140) || (diastolic >= 85 && diastolic < 90)) {
      return BP_CATEGORIES.ELEVATED;
    }
    return BP_CATEGORIES.NORMAL;
  }

  // Default to AHA guidelines
  return classifyBP(systolic, diastolic, BP_GUIDELINES.AHA_ACC);
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
      return 'Unknown';
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

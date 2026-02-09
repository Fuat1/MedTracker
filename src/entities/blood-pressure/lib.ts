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

  // ESC/ESH Guidelines (Europe)
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
    if (systolic >= 130 && diastolic < 85) {
      return BP_CATEGORIES.ELEVATED;
    }
    return BP_CATEGORIES.NORMAL;
  }

  // JSH Guidelines (Japan)
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
    if (systolic >= 130 && diastolic < 85) {
      return BP_CATEGORIES.ELEVATED;
    }
    return BP_CATEGORIES.NORMAL;
  }

  // WHO Guidelines (World Health Organization) - 2021
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

// Check if reading indicates crisis
export function isCrisisReading(systolic: number, diastolic: number): boolean {
  return classifyBP(systolic, diastolic) === BP_CATEGORIES.CRISIS;
}

import {
  BP_LIMITS,
  BP_CATEGORIES,
  BP_CATEGORY_COLORS,
  type BPCategory,
} from '../../shared/config';
import { BP_GUIDELINES, type BPGuideline } from '../../shared/config/settings';

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
  // AHA/ACC Guidelines (USA)
  if (guideline === BP_GUIDELINES.AHA_ACC) {
    if (systolic > 180 || diastolic > 120) {
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
      return 'Normal';
    case BP_CATEGORIES.ELEVATED:
      return 'Elevated';
    case BP_CATEGORIES.STAGE_1:
      return 'High BP Stage 1';
    case BP_CATEGORIES.STAGE_2:
      return 'High BP Stage 2';
    case BP_CATEGORIES.CRISIS:
      return 'Hypertensive Crisis';
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
    errors.push('Systolic value is required');
  } else if (
    systolic < BP_LIMITS.systolic.min ||
    systolic > BP_LIMITS.systolic.max
  ) {
    errors.push(
      `Systolic must be between ${BP_LIMITS.systolic.min} and ${BP_LIMITS.systolic.max}`,
    );
  }

  // Check diastolic
  if (diastolic === null || diastolic === undefined) {
    errors.push('Diastolic value is required');
  } else if (
    diastolic < BP_LIMITS.diastolic.min ||
    diastolic > BP_LIMITS.diastolic.max
  ) {
    errors.push(
      `Diastolic must be between ${BP_LIMITS.diastolic.min} and ${BP_LIMITS.diastolic.max}`,
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
    errors.push('Systolic must be greater than diastolic');
  }

  // Check pulse (optional)
  if (pulse !== null && pulse !== undefined) {
    if (pulse < BP_LIMITS.pulse.min || pulse > BP_LIMITS.pulse.max) {
      errors.push(
        `Pulse must be between ${BP_LIMITS.pulse.min} and ${BP_LIMITS.pulse.max}`,
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

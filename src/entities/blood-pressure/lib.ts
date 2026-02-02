import {BP_CATEGORIES, BP_LIMITS} from '@shared/config';
import type {BPCategory} from './types';

/**
 * Classify blood pressure reading according to AHA guidelines
 */
export function classifyBP(systolic: number, diastolic: number): BPCategory {
  // Crisis: >180 systolic and/or >120 diastolic
  if (systolic > 180 || diastolic > 120) {
    return BP_CATEGORIES.CRISIS;
  }

  // Stage 2: ≥140 systolic or ≥90 diastolic
  if (systolic >= 140 || diastolic >= 90) {
    return BP_CATEGORIES.STAGE_2;
  }

  // Stage 1: 130-139 systolic or 80-89 diastolic
  if (systolic >= 130 || diastolic >= 80) {
    return BP_CATEGORIES.STAGE_1;
  }

  // Elevated: 120-129 systolic and <80 diastolic
  if (systolic >= 120 && diastolic < 80) {
    return BP_CATEGORIES.ELEVATED;
  }

  // Normal: <120 systolic and <80 diastolic
  return BP_CATEGORIES.NORMAL;
}

/**
 * Validate blood pressure values against medical limits
 */
export function validateBPValues(
  systolic: number,
  diastolic: number,
  pulse?: number,
): {valid: boolean; errors: string[]} {
  const errors: string[] = [];

  if (
    systolic < BP_LIMITS.systolic.min ||
    systolic > BP_LIMITS.systolic.max
  ) {
    errors.push(
      `Systolic must be between ${BP_LIMITS.systolic.min} and ${BP_LIMITS.systolic.max}`,
    );
  }

  if (
    diastolic < BP_LIMITS.diastolic.min ||
    diastolic > BP_LIMITS.diastolic.max
  ) {
    errors.push(
      `Diastolic must be between ${BP_LIMITS.diastolic.min} and ${BP_LIMITS.diastolic.max}`,
    );
  }

  if (systolic <= diastolic) {
    errors.push('Systolic must be greater than diastolic');
  }

  if (
    pulse !== undefined &&
    (pulse < BP_LIMITS.pulse.min || pulse > BP_LIMITS.pulse.max)
  ) {
    errors.push(
      `Pulse must be between ${BP_LIMITS.pulse.min} and ${BP_LIMITS.pulse.max}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get color for BP category (AHA guidelines)
 */
export function getBPCategoryColor(category: BPCategory): string {
  const colors: Record<BPCategory, string> = {
    normal: '#22c55e', // Green
    elevated: '#eab308', // Yellow
    stage_1: '#f97316', // Orange
    stage_2: '#ef4444', // Red
    crisis: '#dc2626', // Dark Red
  };
  return colors[category];
}

import {
  WEIGHT_LIMITS,
  HEIGHT_LIMITS,
  BMI_THRESHOLDS,
} from '../../shared/config/profile-constants';
import type { BMICategory, WeightUnit, HeightUnit } from './types';

const KG_TO_LBS = 2.20462;
const CM_TO_INCHES = 0.393701;

/**
 * Calculate BMI from weight (kg) and height (cm).
 * BMI = weight(kg) / height(m)^2
 * Returns null if either input is null/undefined/invalid.
 */
export function calculateBMI(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (
    weightKg == null ||
    heightCm == null ||
    weightKg <= 0 ||
    heightCm <= 0
  ) {
    return null;
  }
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

/**
 * Get BMI category.
 * Underweight: <18.5, Normal: 18.5-24.9, Overweight: 25-29.9, Obese: >=30
 */
export function getBMICategory(bmi: number): BMICategory {
  if (bmi < BMI_THRESHOLDS.underweight) return 'underweight';
  if (bmi < BMI_THRESHOLDS.normal) return 'normal';
  if (bmi < BMI_THRESHOLDS.overweight) return 'overweight';
  return 'obese';
}

/**
 * Calculate age in years from date of birth ISO string.
 * Returns null if dateOfBirth is null/invalid.
 */
export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age < 0 || age > 150) return null;

  return age;
}

/**
 * Convert weight between units.
 * 1 kg = 2.20462 lbs
 */
export function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  if (from === to) return value;
  if (from === 'kg' && to === 'lbs') {
    return Math.round(value * KG_TO_LBS * 10) / 10;
  }
  // lbs to kg
  return Math.round((value / KG_TO_LBS) * 10) / 10;
}

/**
 * Convert height in cm to the target unit display string.
 * Returns "175 cm" or "5'9\"" format.
 */
export function convertHeight(valueCm: number, to: HeightUnit): string {
  if (to === 'cm') {
    return `${Math.round(valueCm)}`;
  }
  const totalInches = valueCm * CM_TO_INCHES;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

/**
 * Format weight with unit for display: "75.2 kg" or "165.8 lbs"
 */
export function formatWeight(weightKg: number, unit: WeightUnit): string {
  const value = unit === 'kg' ? weightKg : convertWeight(weightKg, 'kg', 'lbs');
  return `${Math.round(value * 10) / 10} ${unit}`;
}

/**
 * Format height with unit for display: "175 cm" or "5'9\""
 */
export function formatHeight(heightCm: number, unit: HeightUnit): string {
  if (unit === 'cm') {
    return `${Math.round(heightCm)} cm`;
  }
  return convertHeight(heightCm, 'ft');
}

/**
 * Validate weight value (in kg). Returns errors array.
 */
export function validateWeight(weightKg: number | null | undefined): string[] {
  const errors: string[] = [];
  if (weightKg == null) return errors; // weight is optional
  if (weightKg < WEIGHT_LIMITS.min || weightKg > WEIGHT_LIMITS.max) {
    errors.push(
      `Weight must be between ${WEIGHT_LIMITS.min} and ${WEIGHT_LIMITS.max} kg`,
    );
  }
  return errors;
}

/**
 * Validate height value (in cm). Returns errors array.
 */
export function validateHeight(heightCm: number | null | undefined): string[] {
  const errors: string[] = [];
  if (heightCm == null) return errors; // height is optional
  if (heightCm < HEIGHT_LIMITS.min || heightCm > HEIGHT_LIMITS.max) {
    errors.push(
      `Height must be between ${HEIGHT_LIMITS.min} and ${HEIGHT_LIMITS.max} cm`,
    );
  }
  return errors;
}

/**
 * Validate date of birth. Must be a valid past date, age 1-150.
 */
export function validateDateOfBirth(
  dateOfBirth: string | null | undefined,
): string[] {
  const errors: string[] = [];
  if (!dateOfBirth) return errors; // DOB is optional

  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    errors.push('Invalid date format');
    return errors;
  }

  const age = calculateAge(dateOfBirth);
  if (age === null || age < 1 || age > 150) {
    errors.push('Date of birth must result in age between 1 and 150');
  }

  return errors;
}

/**
 * Parse weight input from display unit to kg for storage.
 */
export function parseWeightToKg(
  value: number,
  unit: WeightUnit,
): number {
  if (unit === 'kg') return value;
  return convertWeight(value, 'lbs', 'kg');
}

/**
 * Parse height input from display unit to cm for storage.
 */
export function parseHeightToCm(
  value: number,
  unit: HeightUnit,
): number {
  if (unit === 'cm') return value;
  // value is in feet (decimal), convert to cm
  return Math.round(value / CM_TO_INCHES * 12); // This is for total inches → cm
}

/**
 * Get weight display value from kg.
 */
export function getWeightDisplayValue(
  weightKg: number,
  unit: WeightUnit,
): number {
  if (unit === 'kg') return Math.round(weightKg * 10) / 10;
  return convertWeight(weightKg, 'kg', 'lbs');
}

/**
 * Get height display value from cm.
 */
export function getHeightDisplayValue(
  heightCm: number,
  unit: HeightUnit,
): number {
  if (unit === 'cm') return Math.round(heightCm);
  // Return total inches for input purposes
  return Math.round(heightCm * CM_TO_INCHES * 10) / 10;
}

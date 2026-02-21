// Unit types for user profile — defined here in shared layer so settings-store can use them
export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'cm' | 'ft';
export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type Gender = 'male' | 'female' | 'other';

export const GENDERS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
} as const;

export const WEIGHT_LIMITS = {
  min: 20, // kg
  max: 500, // kg
} as const;

export const HEIGHT_LIMITS = {
  min: 50, // cm
  max: 280, // cm
} as const;

export const BMI_THRESHOLDS = {
  underweight: 18.5,
  normal: 25.0,
  overweight: 30.0,
} as const;

export const BMI_CATEGORIES = {
  UNDERWEIGHT: 'underweight',
  NORMAL: 'normal',
  OVERWEIGHT: 'overweight',
  OBESE: 'obese',
} as const;

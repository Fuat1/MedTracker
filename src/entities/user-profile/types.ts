// Re-export types from shared config (canonical source — FSD compliant)
export type { WeightUnit, HeightUnit, BMICategory, Gender } from '../../shared/config/profile-constants';

export interface UserProfile {
  dateOfBirth: string | null; // ISO 8601 date string 'YYYY-MM-DD'
  gender: 'male' | 'female' | 'other' | null;
  height: number | null; // Always stored in cm internally
  heightUnit: 'cm' | 'ft';
  defaultWeight: number | null; // Always stored in kg internally
  weightUnit: 'kg' | 'lbs';
}

// BP validation limits per medical standards and consumer device precedent
// SBP min 60: Values <60 mmHg incompatible with consciousness in consumer context
//             (Huawei Watch BP ISO 81060-2:2018 uses 60-230 mmHg)
// DBP min 40: Values <40 mmHg near-impossible for self-measuring consumer
//             (AHA hypotension definition: <90/60)
// Upper bounds accommodate extreme values (e.g., resistance exercise can exceed 300 SBP)
export const BP_LIMITS = {
  systolic: { min: 60, max: 300 },
  diastolic: { min: 40, max: 200 },
  pulse: { min: 30, max: 250 }, // Athletes can have resting HR in low 30s
} as const;

// BP categories per AHA guidelines
export const BP_CATEGORIES = {
  NORMAL: 'normal',
  ELEVATED: 'elevated',
  STAGE_1: 'stage_1',
  STAGE_2: 'stage_2',
  CRISIS: 'crisis',
} as const;

export type BPCategory = (typeof BP_CATEGORIES)[keyof typeof BP_CATEGORIES];

// AHA guideline colors
export const BP_CATEGORY_COLORS: Record<BPCategory, string> = {
  [BP_CATEGORIES.NORMAL]: '#22c55e', // Green
  [BP_CATEGORIES.ELEVATED]: '#eab308', // Yellow
  [BP_CATEGORIES.STAGE_1]: '#f97316', // Orange
  [BP_CATEGORIES.STAGE_2]: '#ef4444', // Red
  [BP_CATEGORIES.CRISIS]: '#dc2626', // Dark Red
} as const;

// Measurement locations
export const MEASUREMENT_LOCATIONS = {
  LEFT_ARM: 'left_arm',
  RIGHT_ARM: 'right_arm',
  LEFT_WRIST: 'left_wrist',
  RIGHT_WRIST: 'right_wrist',
} as const;

export type MeasurementLocation =
  (typeof MEASUREMENT_LOCATIONS)[keyof typeof MEASUREMENT_LOCATIONS];

// Measurement postures
export const MEASUREMENT_POSTURES = {
  SITTING: 'sitting',
  STANDING: 'standing',
  LYING: 'lying',
} as const;

export type MeasurementPosture =
  (typeof MEASUREMENT_POSTURES)[keyof typeof MEASUREMENT_POSTURES];

// Database config
export const DB_CONFIG = {
  name: 'medtracker.db',
} as const;

// Settings
export * from './settings';

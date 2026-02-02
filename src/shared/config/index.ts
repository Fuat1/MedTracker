// App configuration
// Constants, environment variables, etc.

export const BP_LIMITS = {
  systolic: { min: 40, max: 300 },
  diastolic: { min: 30, max: 200 },
  pulse: { min: 30, max: 250 },
} as const;

export const BP_CATEGORIES = {
  NORMAL: 'normal',
  ELEVATED: 'elevated',
  STAGE_1: 'stage_1',
  STAGE_2: 'stage_2',
  CRISIS: 'crisis',
} as const;

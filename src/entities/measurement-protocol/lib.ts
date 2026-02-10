/**
 * Blood Pressure Measurement Protocol
 * Based on AHA/ACC 2025 Proper Measurement Technique Guidelines
 * Source: CLAUDE.md Section 9
 */

export interface MeasurementStep {
  id: string;
  iconName: string;
  translationKey: string;
  important: boolean;
}

/**
 * AHA/ACC Official Pre-Measurement Checklist
 * These steps must be followed for accurate BP readings
 */
export const MEASUREMENT_CHECKLIST: MeasurementStep[] = [
  {
    id: 'rest',
    iconName: 'time-outline',
    translationKey: 'preMeasurement.checklist.rest',
    important: true,
  },
  {
    id: 'posture',
    iconName: 'body-outline',
    translationKey: 'preMeasurement.checklist.posture',
    important: true,
  },
  {
    id: 'arm',
    iconName: 'hand-left-outline',
    translationKey: 'preMeasurement.checklist.arm',
    important: true,
  },
  {
    id: 'feet',
    iconName: 'footsteps-outline',
    translationKey: 'preMeasurement.checklist.feet',
    important: false,
  },
  {
    id: 'quiet',
    iconName: 'volume-mute-outline',
    translationKey: 'preMeasurement.checklist.quiet',
    important: false,
  },
];

/**
 * Recommended rest duration before measurement (in seconds)
 * AHA recommends 5 minutes of rest
 */
export const RECOMMENDED_REST_DURATION = 300; // 5 minutes

/**
 * Minimum rest duration (in seconds)
 * For users who want to skip
 */
export const MINIMUM_REST_DURATION = 60; // 1 minute

/**
 * 4-7-8 Breathing Technique Parameters
 * Used to calm anxiety before measurement
 */
export const BREATHING_TECHNIQUE = {
  inhale: 4, // seconds
  hold: 7, // seconds
  exhale: 8, // seconds
  cycles: 3, // number of repetitions
};

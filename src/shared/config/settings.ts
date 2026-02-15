// Blood pressure measurement units
export const BP_UNITS = {
  MMHG: 'mmHg',
  KPA: 'kPa',
} as const;

export type BPUnit = (typeof BP_UNITS)[keyof typeof BP_UNITS];

// Regional classification guidelines
export const BP_GUIDELINES = {
  AHA_ACC: 'aha_acc', // American Heart Association / American College of Cardiology (2025)
  ESC_ESH: 'esc_esh', // European Society of Cardiology / European Society of Hypertension (2024)
  JSH: 'jsh', // Japanese Society of Hypertension (2025)
  WHO: 'who', // World Health Organization / International Society of Hypertension (1999)
                // Note: WHO 2021 guideline has no BP classification; this uses WHO/ISH 1999
} as const;

export type BPGuideline = (typeof BP_GUIDELINES)[keyof typeof BP_GUIDELINES];

// Unit conversion
export function convertBPUnit(
  value: number,
  fromUnit: BPUnit,
  toUnit: BPUnit,
): number {
  if (fromUnit === toUnit) return value;

  // Convert mmHg to kPa: divide by 7.5
  // Convert kPa to mmHg: multiply by 7.5
  if (fromUnit === BP_UNITS.MMHG && toUnit === BP_UNITS.KPA) {
    return Math.round((value / 7.5) * 10) / 10; // Round to 1 decimal
  }
  if (fromUnit === BP_UNITS.KPA && toUnit === BP_UNITS.MMHG) {
    return Math.round(value * 7.5);
  }

  return value;
}

// Format BP value with unit
export function formatBPValue(value: number, unit: BPUnit): string {
  if (unit === BP_UNITS.KPA) {
    return `${value.toFixed(1)} ${unit}`;
  }
  return `${Math.round(value)} ${unit}`;
}

// Default settings
export const DEFAULT_SETTINGS = {
  unit: BP_UNITS.MMHG,
  guideline: BP_GUIDELINES.AHA_ACC,
  language: 'en',
  dateFormat: '24h',
} as const;

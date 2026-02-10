import { BP_GUIDELINES, BP_UNITS, type BPGuideline, type BPUnit } from '../config/settings';

export type RegionSettings = {
  guideline: BPGuideline;
  unit: BPUnit;
};

const EUROPEAN_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'GB', 'NO', 'IS', 'LI', 'CH', 'AL', 'BA', 'ME', 'MK',
  'RS', 'XK', 'MD', 'UA', 'BY', 'TR',
]);

const AMERICAS_COUNTRIES = new Set([
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY',
  'UY', 'GY', 'SR', 'PA', 'CR', 'GT', 'HN', 'SV', 'NI', 'BZ', 'CU', 'DO',
  'HT', 'JM', 'TT', 'PR',
]);

/**
 * Maps an ISO 3166-1 alpha-2 country code to the recommended
 * BP classification guideline and measurement unit.
 */
export function getSettingsForRegion(countryCode: string): RegionSettings {
  const code = countryCode.toUpperCase();

  // Japan → JSH guideline
  if (code === 'JP') {
    return { guideline: BP_GUIDELINES.JSH, unit: BP_UNITS.MMHG };
  }

  // Europe & nearby → ESC/ESH guideline
  if (EUROPEAN_COUNTRIES.has(code)) {
    return { guideline: BP_GUIDELINES.ESC_ESH, unit: BP_UNITS.MMHG };
  }

  // Americas → AHA/ACC guideline
  if (AMERICAS_COUNTRIES.has(code)) {
    return { guideline: BP_GUIDELINES.AHA_ACC, unit: BP_UNITS.MMHG };
  }

  // Rest of world → AHA/ACC (most widely referenced)
  return { guideline: BP_GUIDELINES.AHA_ACC, unit: BP_UNITS.MMHG };
}

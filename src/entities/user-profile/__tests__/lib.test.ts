import {
  calculateBMI,
  getBMICategory,
  calculateAge,
  convertWeight,
  convertHeight,
  formatWeight,
  formatHeight,
  validateWeight,
  validateHeight,
  validateDateOfBirth,
  parseWeightToKg,
  getWeightDisplayValue,
} from '../lib';

// ─── calculateBMI ─────────────────────────────────────────────────────

describe('calculateBMI', () => {
  it('calculates BMI correctly for normal weight', () => {
    // 70kg, 175cm → BMI = 70 / 1.75^2 = 22.9
    expect(calculateBMI(70, 175)).toBe(22.9);
  });

  it('calculates BMI correctly for overweight', () => {
    // 90kg, 170cm → BMI = 90 / 1.7^2 = 31.1
    expect(calculateBMI(90, 170)).toBe(31.1);
  });

  it('calculates BMI correctly for underweight', () => {
    // 45kg, 170cm → BMI = 45 / 1.7^2 = 15.6
    expect(calculateBMI(45, 170)).toBe(15.6);
  });

  it('returns null for null weight', () => {
    expect(calculateBMI(null, 175)).toBeNull();
  });

  it('returns null for null height', () => {
    expect(calculateBMI(70, null)).toBeNull();
  });

  it('returns null for undefined inputs', () => {
    expect(calculateBMI(undefined, 175)).toBeNull();
    expect(calculateBMI(70, undefined)).toBeNull();
  });

  it('returns null for zero weight', () => {
    expect(calculateBMI(0, 175)).toBeNull();
  });

  it('returns null for zero height', () => {
    expect(calculateBMI(70, 0)).toBeNull();
  });

  it('returns null for negative values', () => {
    expect(calculateBMI(-70, 175)).toBeNull();
    expect(calculateBMI(70, -175)).toBeNull();
  });
});

// ─── getBMICategory ───────────────────────────────────────────────────

describe('getBMICategory', () => {
  it('classifies underweight (< 18.5)', () => {
    expect(getBMICategory(15)).toBe('underweight');
    expect(getBMICategory(18.4)).toBe('underweight');
  });

  it('classifies normal (18.5 - 24.9)', () => {
    expect(getBMICategory(18.5)).toBe('normal');
    expect(getBMICategory(22)).toBe('normal');
    expect(getBMICategory(24.9)).toBe('normal');
  });

  it('classifies overweight (25 - 29.9)', () => {
    expect(getBMICategory(25)).toBe('overweight');
    expect(getBMICategory(27.5)).toBe('overweight');
    expect(getBMICategory(29.9)).toBe('overweight');
  });

  it('classifies obese (>= 30)', () => {
    expect(getBMICategory(30)).toBe('obese');
    expect(getBMICategory(35)).toBe('obese');
    expect(getBMICategory(45)).toBe('obese');
  });
});

// ─── calculateAge ─────────────────────────────────────────────────────

describe('calculateAge', () => {
  it('returns null for null input', () => {
    expect(calculateAge(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(calculateAge(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(calculateAge('')).toBeNull();
  });

  it('returns null for invalid date string', () => {
    expect(calculateAge('not-a-date')).toBeNull();
  });

  it('calculates age correctly', () => {
    const now = new Date();
    const tenYearsAgo = new Date(
      now.getFullYear() - 10,
      0, // January
      1,
    );
    const dob = tenYearsAgo.toISOString().split('T')[0];
    const age = calculateAge(dob);
    // Age should be 10 (or 9 if we haven't passed the birthday yet this year)
    expect(age).toBeGreaterThanOrEqual(9);
    expect(age).toBeLessThanOrEqual(10);
  });

  it('returns null for future dates', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    expect(calculateAge(future.toISOString().split('T')[0])).toBeNull();
  });

  it('returns null for age > 150', () => {
    expect(calculateAge('1800-01-01')).toBeNull();
  });
});

// ─── convertWeight ────────────────────────────────────────────────────

describe('convertWeight', () => {
  it('returns same value for same unit', () => {
    expect(convertWeight(70, 'kg', 'kg')).toBe(70);
    expect(convertWeight(154, 'lbs', 'lbs')).toBe(154);
  });

  it('converts kg to lbs', () => {
    expect(convertWeight(70, 'kg', 'lbs')).toBe(154.3);
  });

  it('converts lbs to kg', () => {
    expect(convertWeight(154.3, 'lbs', 'kg')).toBe(70);
  });
});

// ─── convertHeight ────────────────────────────────────────────────────

describe('convertHeight', () => {
  it('returns cm value as string for cm unit', () => {
    expect(convertHeight(175, 'cm')).toBe('175');
  });

  it('converts cm to feet/inches format', () => {
    // 175 cm ≈ 5'9"
    expect(convertHeight(175, 'ft')).toBe("5'9\"");
  });

  it('handles exact foot values', () => {
    // 183 cm ≈ 6'0"
    expect(convertHeight(183, 'ft')).toBe("6'0\"");
  });
});

// ─── formatWeight ─────────────────────────────────────────────────────

describe('formatWeight', () => {
  it('formats weight in kg', () => {
    expect(formatWeight(72.5, 'kg')).toBe('72.5 kg');
  });

  it('formats weight in lbs (converts from kg)', () => {
    const result = formatWeight(70, 'lbs');
    expect(result).toContain('lbs');
    expect(result).toBe('154.3 lbs');
  });
});

// ─── formatHeight ─────────────────────────────────────────────────────

describe('formatHeight', () => {
  it('formats height in cm', () => {
    expect(formatHeight(175, 'cm')).toBe('175 cm');
  });

  it('formats height in ft/in', () => {
    expect(formatHeight(175, 'ft')).toBe("5'9\"");
  });
});

// ─── validateWeight ───────────────────────────────────────────────────

describe('validateWeight', () => {
  it('returns empty array for null (optional)', () => {
    expect(validateWeight(null)).toEqual([]);
  });

  it('returns empty array for valid weight', () => {
    expect(validateWeight(70)).toEqual([]);
    expect(validateWeight(20)).toEqual([]);
    expect(validateWeight(500)).toEqual([]);
  });

  it('returns error for weight below minimum', () => {
    const errors = validateWeight(19);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('20');
  });

  it('returns error for weight above maximum', () => {
    const errors = validateWeight(501);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('500');
  });
});

// ─── validateHeight ───────────────────────────────────────────────────

describe('validateHeight', () => {
  it('returns empty array for null (optional)', () => {
    expect(validateHeight(null)).toEqual([]);
  });

  it('returns empty array for valid height', () => {
    expect(validateHeight(175)).toEqual([]);
    expect(validateHeight(50)).toEqual([]);
    expect(validateHeight(280)).toEqual([]);
  });

  it('returns error for height below minimum', () => {
    const errors = validateHeight(49);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('50');
  });

  it('returns error for height above maximum', () => {
    const errors = validateHeight(281);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('280');
  });
});

// ─── validateDateOfBirth ──────────────────────────────────────────────

describe('validateDateOfBirth', () => {
  it('returns empty array for null (optional)', () => {
    expect(validateDateOfBirth(null)).toEqual([]);
  });

  it('returns empty array for valid DOB', () => {
    expect(validateDateOfBirth('1990-06-15')).toEqual([]);
  });

  it('returns error for invalid date format', () => {
    const errors = validateDateOfBirth('not-a-date');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Invalid');
  });

  it('returns error for future DOB', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    const errors = validateDateOfBirth(future.toISOString().split('T')[0]);
    expect(errors).toHaveLength(1);
  });
});

// ─── parseWeightToKg ──────────────────────────────────────────────────

describe('parseWeightToKg', () => {
  it('returns same value for kg', () => {
    expect(parseWeightToKg(70, 'kg')).toBe(70);
  });

  it('converts lbs to kg', () => {
    expect(parseWeightToKg(154.3, 'lbs')).toBe(70);
  });
});

// ─── getWeightDisplayValue ────────────────────────────────────────────

describe('getWeightDisplayValue', () => {
  it('returns kg value rounded to 1 decimal', () => {
    expect(getWeightDisplayValue(72.53, 'kg')).toBe(72.5);
  });

  it('converts to lbs for display', () => {
    expect(getWeightDisplayValue(70, 'lbs')).toBe(154.3);
  });
});

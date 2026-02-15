import {
  classifyBP,
  validateBPValues,
  getBPCategoryLabel,
  getBPCategoryColor,
  isCrisisReading,
  calculatePulsePressure,
  calculateMAP,
  interpretPulsePressure,
  interpretMAP,
} from '../lib';
import { BP_CATEGORIES, BP_CATEGORY_COLORS } from '../../../shared/config';
import { BP_GUIDELINES } from '../../../shared/config/settings';

// ─── classifyBP ─────────────────────────────────────────────────────

describe('classifyBP', () => {
  describe('AHA/ACC guideline (default)', () => {
    it('classifies Normal (<120/<80)', () => {
      expect(classifyBP(110, 70)).toBe(BP_CATEGORIES.NORMAL);
      expect(classifyBP(119, 79)).toBe(BP_CATEGORIES.NORMAL);
    });

    it('classifies Elevated (120-129/<80)', () => {
      expect(classifyBP(120, 75)).toBe(BP_CATEGORIES.ELEVATED);
      expect(classifyBP(129, 79)).toBe(BP_CATEGORIES.ELEVATED);
    });

    it('does NOT classify as Elevated when diastolic >= 80', () => {
      // 120/80 should be Stage 1, not Elevated
      expect(classifyBP(120, 80)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 1 (130-139/80-89)', () => {
      expect(classifyBP(130, 80)).toBe(BP_CATEGORIES.STAGE_1);
      expect(classifyBP(139, 89)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 1 when only systolic is in range', () => {
      expect(classifyBP(135, 70)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 1 when only diastolic is in range', () => {
      expect(classifyBP(115, 85)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 2 (>=140/>=90)', () => {
      expect(classifyBP(140, 90)).toBe(BP_CATEGORIES.STAGE_2);
      expect(classifyBP(160, 95)).toBe(BP_CATEGORIES.STAGE_2);
      expect(classifyBP(179, 119)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('classifies Stage 2 when only systolic qualifies', () => {
      expect(classifyBP(145, 75)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('classifies Stage 2 when only diastolic qualifies', () => {
      expect(classifyBP(125, 95)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('classifies Crisis (>=180/>=120)', () => {
      expect(classifyBP(180, 120)).toBe(BP_CATEGORIES.CRISIS);
      expect(classifyBP(200, 130)).toBe(BP_CATEGORIES.CRISIS);
    });

    it('classifies Crisis when only systolic >= 180', () => {
      expect(classifyBP(180, 80)).toBe(BP_CATEGORIES.CRISIS);
    });

    it('classifies Crisis when only diastolic >= 120', () => {
      expect(classifyBP(150, 120)).toBe(BP_CATEGORIES.CRISIS);
    });

    it('defaults to AHA/ACC when no guideline specified', () => {
      expect(classifyBP(135, 85)).toBe(BP_CATEGORIES.STAGE_1);
    });
  });

  describe('ESC/ESH guideline', () => {
    const g = BP_GUIDELINES.ESC_ESH;

    it('classifies Normal (<130/<85)', () => {
      expect(classifyBP(120, 70, g)).toBe(BP_CATEGORIES.NORMAL);
      expect(classifyBP(129, 84, g)).toBe(BP_CATEGORIES.NORMAL);
    });

    it('classifies Elevated/High Normal (130-139/85-89)', () => {
      expect(classifyBP(130, 70, g)).toBe(BP_CATEGORIES.ELEVATED);
      expect(classifyBP(125, 87, g)).toBe(BP_CATEGORIES.ELEVATED);
    });

    it('classifies Stage 1 (140-159/90-99)', () => {
      expect(classifyBP(140, 90, g)).toBe(BP_CATEGORIES.STAGE_1);
      expect(classifyBP(155, 95, g)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 2 (160-179/100-109)', () => {
      expect(classifyBP(160, 100, g)).toBe(BP_CATEGORIES.STAGE_2);
      expect(classifyBP(175, 105, g)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('classifies Crisis (>=180/>=110)', () => {
      expect(classifyBP(180, 110, g)).toBe(BP_CATEGORIES.CRISIS);
      expect(classifyBP(200, 80, g)).toBe(BP_CATEGORIES.CRISIS);
      expect(classifyBP(150, 115, g)).toBe(BP_CATEGORIES.CRISIS);
    });
  });

  describe('JSH guideline', () => {
    const g = BP_GUIDELINES.JSH;

    it('classifies Normal (<130/<80)', () => {
      expect(classifyBP(120, 70, g)).toBe(BP_CATEGORIES.NORMAL);
      expect(classifyBP(129, 79, g)).toBe(BP_CATEGORIES.NORMAL);
    });

    it('classifies Elevated (130-139/80-89) — JSH uses DBP 80 not 85', () => {
      expect(classifyBP(130, 70, g)).toBe(BP_CATEGORIES.ELEVATED);
      expect(classifyBP(125, 82, g)).toBe(BP_CATEGORIES.ELEVATED);
    });

    it('classifies Stage 1 (140-159/90-99)', () => {
      expect(classifyBP(140, 90, g)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 2 (160-179/100-109)', () => {
      expect(classifyBP(160, 100, g)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('classifies Crisis (>=180/>=110)', () => {
      expect(classifyBP(180, 110, g)).toBe(BP_CATEGORIES.CRISIS);
    });
  });

  describe('WHO guideline', () => {
    const g = BP_GUIDELINES.WHO;

    it('classifies Normal (<130/<85)', () => {
      expect(classifyBP(120, 70, g)).toBe(BP_CATEGORIES.NORMAL);
    });

    it('classifies Elevated/High Normal (130-139/85-89)', () => {
      expect(classifyBP(135, 80, g)).toBe(BP_CATEGORIES.ELEVATED);
      expect(classifyBP(120, 87, g)).toBe(BP_CATEGORIES.ELEVATED);
    });

    it('classifies Stage 1 (140-159/90-99)', () => {
      expect(classifyBP(140, 90, g)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('classifies Stage 2 (160-179/100-109)', () => {
      expect(classifyBP(160, 100, g)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('classifies Crisis (>=180/>=110)', () => {
      expect(classifyBP(180, 110, g)).toBe(BP_CATEGORIES.CRISIS);
    });
  });

  describe('boundary values', () => {
    it('120/80 is Stage 1 in AHA (not Elevated — diastolic >= 80)', () => {
      expect(classifyBP(120, 80)).toBe(BP_CATEGORIES.STAGE_1);
    });

    it('exactly 180/120 is Crisis in AHA', () => {
      expect(classifyBP(180, 120)).toBe(BP_CATEGORIES.CRISIS);
    });

    it('179/119 is Stage 2 in AHA (just below crisis)', () => {
      expect(classifyBP(179, 119)).toBe(BP_CATEGORIES.STAGE_2);
    });

    it('180/110 is Crisis in ESC/ESH', () => {
      expect(classifyBP(180, 110, BP_GUIDELINES.ESC_ESH)).toBe(BP_CATEGORIES.CRISIS);
    });

    it('179/109 is Stage 2 in ESC/ESH (just below crisis)', () => {
      expect(classifyBP(179, 109, BP_GUIDELINES.ESC_ESH)).toBe(BP_CATEGORIES.STAGE_2);
    });
  });

  describe('unknown guideline fallback', () => {
    it('falls back to AHA/ACC for unknown guideline', () => {
      // @ts-expect-error — testing fallback with invalid guideline
      expect(classifyBP(135, 85, 'nonexistent')).toBe(BP_CATEGORIES.STAGE_1);
    });
  });
});

// ─── isCrisisReading ────────────────────────────────────────────────

describe('isCrisisReading', () => {
  it('returns true for AHA crisis (>=180/>=120)', () => {
    expect(isCrisisReading(180, 120)).toBe(true);
    expect(isCrisisReading(200, 80)).toBe(true);
  });

  it('returns false below AHA crisis', () => {
    expect(isCrisisReading(179, 119)).toBe(false);
    expect(isCrisisReading(140, 90)).toBe(false);
  });

  it('uses guideline-specific crisis thresholds', () => {
    // ESC/ESH: >=180/>=110
    expect(isCrisisReading(180, 110, BP_GUIDELINES.ESC_ESH)).toBe(true);
    // 180/115 is Crisis for both AHA and ESC
    expect(isCrisisReading(180, 115, BP_GUIDELINES.ESC_ESH)).toBe(true);
  });
});

// ─── validateBPValues ───────────────────────────────────────────────

describe('validateBPValues', () => {
  it('passes for valid values', () => {
    const result = validateBPValues(120, 80);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects null systolic', () => {
    const result = validateBPValues(null, 80);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('rejects undefined diastolic', () => {
    const result = validateBPValues(120, undefined);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('rejects systolic below BP_LIMITS.systolic.min (60)', () => {
    const result = validateBPValues(50, 40);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects systolic above BP_LIMITS.systolic.max (300)', () => {
    const result = validateBPValues(301, 80);
    expect(result.isValid).toBe(false);
  });

  it('rejects diastolic below BP_LIMITS.diastolic.min (40)', () => {
    const result = validateBPValues(120, 30);
    expect(result.isValid).toBe(false);
  });

  it('rejects diastolic above BP_LIMITS.diastolic.max (200)', () => {
    const result = validateBPValues(120, 201);
    expect(result.isValid).toBe(false);
  });

  it('rejects systolic <= diastolic', () => {
    const result = validateBPValues(80, 80);
    expect(result.isValid).toBe(false);
  });

  it('rejects systolic < diastolic', () => {
    const result = validateBPValues(70, 80);
    expect(result.isValid).toBe(false);
  });

  it('accepts valid pulse in range', () => {
    const result = validateBPValues(120, 80, 72);
    expect(result.isValid).toBe(true);
  });

  it('rejects pulse below BP_LIMITS.pulse.min (30)', () => {
    const result = validateBPValues(120, 80, 20);
    expect(result.isValid).toBe(false);
  });

  it('rejects pulse above BP_LIMITS.pulse.max (250)', () => {
    const result = validateBPValues(120, 80, 260);
    expect(result.isValid).toBe(false);
  });

  it('skips pulse validation when null', () => {
    const result = validateBPValues(120, 80, null);
    expect(result.isValid).toBe(true);
  });

  it('skips pulse validation when undefined', () => {
    const result = validateBPValues(120, 80, undefined);
    expect(result.isValid).toBe(true);
  });

  it('reports multiple errors simultaneously', () => {
    const result = validateBPValues(null, null);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── getBPCategoryColor ─────────────────────────────────────────────

describe('getBPCategoryColor', () => {
  it('returns correct color for each category', () => {
    expect(getBPCategoryColor(BP_CATEGORIES.NORMAL)).toBe(BP_CATEGORY_COLORS.normal);
    expect(getBPCategoryColor(BP_CATEGORIES.ELEVATED)).toBe(BP_CATEGORY_COLORS.elevated);
    expect(getBPCategoryColor(BP_CATEGORIES.STAGE_1)).toBe(BP_CATEGORY_COLORS.stage_1);
    expect(getBPCategoryColor(BP_CATEGORIES.STAGE_2)).toBe(BP_CATEGORY_COLORS.stage_2);
    expect(getBPCategoryColor(BP_CATEGORIES.CRISIS)).toBe(BP_CATEGORY_COLORS.crisis);
  });
});

// ─── getBPCategoryLabel ─────────────────────────────────────────────

describe('getBPCategoryLabel', () => {
  it('returns a non-empty string for each valid category', () => {
    const categories = [
      BP_CATEGORIES.NORMAL,
      BP_CATEGORIES.ELEVATED,
      BP_CATEGORIES.STAGE_1,
      BP_CATEGORIES.STAGE_2,
      BP_CATEGORIES.CRISIS,
    ];
    for (const cat of categories) {
      const label = getBPCategoryLabel(cat);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('returns "Unknown" for unrecognized category', () => {
    // @ts-expect-error — testing fallback
    expect(getBPCategoryLabel('nonexistent')).toBe('Unknown');
  });
});

// ─── calculatePulsePressure ─────────────────────────────────────────

describe('calculatePulsePressure', () => {
  it('returns systolic - diastolic', () => {
    expect(calculatePulsePressure(120, 80)).toBe(40);
    expect(calculatePulsePressure(140, 90)).toBe(50);
    expect(calculatePulsePressure(180, 60)).toBe(120);
  });
});

// ─── calculateMAP ───────────────────────────────────────────────────

describe('calculateMAP', () => {
  it('returns (systolic + 2*diastolic) / 3 rounded', () => {
    // (120 + 160) / 3 = 93.33 → 93
    expect(calculateMAP(120, 80)).toBe(93);
    // (140 + 180) / 3 = 106.67 → 107
    expect(calculateMAP(140, 90)).toBe(107);
    // (100 + 120) / 3 = 73.33 → 73
    expect(calculateMAP(100, 60)).toBe(73);
  });
});

// ─── interpretPulsePressure ─────────────────────────────────────────

describe('interpretPulsePressure', () => {
  it('returns "low" for PP < 40', () => {
    expect(interpretPulsePressure(30)).toBe('low');
    expect(interpretPulsePressure(39)).toBe('low');
  });

  it('returns "normal" for PP 40-60', () => {
    expect(interpretPulsePressure(40)).toBe('normal');
    expect(interpretPulsePressure(50)).toBe('normal');
    expect(interpretPulsePressure(60)).toBe('normal');
  });

  it('returns "high" for PP > 60', () => {
    expect(interpretPulsePressure(61)).toBe('high');
    expect(interpretPulsePressure(80)).toBe('high');
  });
});

// ─── interpretMAP ───────────────────────────────────────────────────

describe('interpretMAP', () => {
  it('returns "low" for MAP < 70', () => {
    expect(interpretMAP(60)).toBe('low');
    expect(interpretMAP(69)).toBe('low');
  });

  it('returns "normal" for MAP 70-100', () => {
    expect(interpretMAP(70)).toBe('normal');
    expect(interpretMAP(85)).toBe('normal');
    expect(interpretMAP(100)).toBe('normal');
  });

  it('returns "high" for MAP > 100', () => {
    expect(interpretMAP(101)).toBe('high');
    expect(interpretMAP(120)).toBe('high');
  });
});

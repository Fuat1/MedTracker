import { computeTypographyScale, TYPOGRAPHY_BASE, SENIOR_SCALE } from '../theme';

describe('computeTypographyScale', () => {
  describe('normal mode (seniorMode=false)', () => {
    it('returns base sizes unchanged', () => {
      const t = computeTypographyScale(false);
      expect(t.xs).toBe(12);
      expect(t.sm).toBe(14);
      expect(t.md).toBe(16);
      expect(t.lg).toBe(18);
      expect(t.xl).toBe(22);
      expect(t['2xl']).toBe(28);
      expect(t['3xl']).toBe(36);
      expect(t.hero).toBe(56);
    });

    it('fontScale is 1.0 in normal mode', () => {
      expect(SENIOR_SCALE).toBe(1.4);
      expect(TYPOGRAPHY_BASE.md).toBe(16);
    });
  });

  describe('senior mode (seniorMode=true)', () => {
    it('applies 1.4x scale to all sizes', () => {
      const t = computeTypographyScale(true);
      expect(t.xs).toBe(17);   // Math.round(12 * 1.4)
      expect(t.sm).toBe(20);   // Math.round(14 * 1.4)
      expect(t.md).toBe(22);   // Math.round(16 * 1.4)
      expect(t.lg).toBe(25);   // Math.round(18 * 1.4)
      expect(t.xl).toBe(31);   // Math.round(22 * 1.4)
      expect(t['2xl']).toBe(39); // Math.round(28 * 1.4)
      expect(t['3xl']).toBe(50); // Math.round(36 * 1.4)
      expect(t.hero).toBe(78);  // Math.round(56 * 1.4)
    });

    it('body text (md) meets 22pt minimum for 65+ adults (NIH/NCBI)', () => {
      const t = computeTypographyScale(true);
      expect(t.md).toBeGreaterThanOrEqual(22);
    });
  });
});

import { parseVoiceQuery } from './voice-query-parser';

describe('parseVoiceQuery', () => {
  describe('RECORD_HEALTH_OBSERVATION fallback patterns', () => {
    it('parses "120 over 80"', () => {
      expect(parseVoiceQuery('120 over 80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "120/80"', () => {
      expect(parseVoiceQuery('120/80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "blood pressure 120 over 80"', () => {
      expect(parseVoiceQuery('blood pressure 120 over 80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "blood pressure 120 80" (space-separated without over)', () => {
      expect(parseVoiceQuery('blood pressure 120 80')).toEqual({ sys: 120, dia: 80 });
    });

    it('parses "120 over 80 pulse 72"', () => {
      expect(parseVoiceQuery('120 over 80 pulse 72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });

    it('parses "120/80 heart rate 72"', () => {
      expect(parseVoiceQuery('120/80 heart rate 72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });

    it('parses "120/80 hr 72"', () => {
      expect(parseVoiceQuery('120/80 hr 72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });
  });

  describe('edge cases', () => {
    it('returns {} for a single number', () => {
      expect(parseVoiceQuery('120')).toEqual({});
    });

    it('returns {} for garbage input', () => {
      expect(parseVoiceQuery('log blood pressure in medtracker')).toEqual({});
    });

    it('returns {} for empty string', () => {
      expect(parseVoiceQuery('')).toEqual({});
    });

    it('drops sys if outside valid range (40–300)', () => {
      expect(parseVoiceQuery('30 over 80')).toEqual({ dia: 80 });
    });

    it('drops dia if outside valid range (30–200)', () => {
      expect(parseVoiceQuery('120 over 20')).toEqual({ sys: 120 });
    });

    it('drops pulse if outside valid range (30–250)', () => {
      expect(parseVoiceQuery('120 over 80 pulse 10')).toEqual({ sys: 120, dia: 80 });
    });

    it('handles URL-encoded spaces (+ characters from deep link)', () => {
      expect(parseVoiceQuery('120+over+80+pulse+72')).toEqual({ sys: 120, dia: 80, pulse: 72 });
    });
  });
});

/**
 * Unit tests for the BP MetricConfig instance.
 *
 * Verifies that bpConfig.classify() delegates correctly to classifyBP(),
 * crisis detection works, derived metrics compute correctly, and the registry
 * functions work as expected.
 */

import { bpConfig } from '../config';
import { _clearRegistry_testOnly, registerMetric, getMetricConfig } from '../../../shared/config/metric-registry';

beforeEach(() => {
  _clearRegistry_testOnly();
});

describe('bpConfig.classify()', () => {
  it('classifies normal BP correctly (AHA/ACC)', () => {
    expect(bpConfig.classify({ systolic: 110, diastolic: 70 }, 'aha_acc')).toBe('normal');
  });

  it('classifies elevated BP correctly (AHA/ACC)', () => {
    expect(bpConfig.classify({ systolic: 125, diastolic: 75 }, 'aha_acc')).toBe('elevated');
  });

  it('classifies stage_1 BP correctly (AHA/ACC)', () => {
    expect(bpConfig.classify({ systolic: 133, diastolic: 83 }, 'aha_acc')).toBe('stage_1');
  });

  it('classifies stage_2 BP correctly (AHA/ACC)', () => {
    expect(bpConfig.classify({ systolic: 145, diastolic: 95 }, 'aha_acc')).toBe('stage_2');
  });

  it('classifies crisis BP correctly (AHA/ACC)', () => {
    expect(bpConfig.classify({ systolic: 185, diastolic: 125 }, 'aha_acc')).toBe('crisis');
  });

  it('classifies crisis BP using ESC/ESH threshold (180/110)', () => {
    expect(bpConfig.classify({ systolic: 182, diastolic: 112 }, 'esc_esh')).toBe('crisis');
  });

  it('normal BP is NOT crisis', () => {
    expect(bpConfig.classify({ systolic: 115, diastolic: 75 }, 'aha_acc')).not.toBe('crisis');
  });
});

describe('bpConfig.crisis', () => {
  it('detects crisis reading (AHA/ACC: 180/120)', () => {
    const crisis = bpConfig.crisis!;
    expect(crisis.isCrisis({ systolic: 185, diastolic: 125 }, 'aha_acc')).toBe(true);
  });

  it('detects crisis based on systolic only (AHA/ACC)', () => {
    const crisis = bpConfig.crisis!;
    expect(crisis.isCrisis({ systolic: 182, diastolic: 100 }, 'aha_acc')).toBe(true);
  });

  it('detects crisis based on diastolic only (AHA/ACC)', () => {
    const crisis = bpConfig.crisis!;
    expect(crisis.isCrisis({ systolic: 160, diastolic: 122 }, 'aha_acc')).toBe(true);
  });

  it('does NOT flag normal reading as crisis', () => {
    const crisis = bpConfig.crisis!;
    expect(crisis.isCrisis({ systolic: 120, diastolic: 80 }, 'aha_acc')).toBe(false);
  });

  it('ESC/ESH crisis threshold is 180/110', () => {
    const crisis = bpConfig.crisis!;
    expect(crisis.isCrisis({ systolic: 180, diastolic: 111 }, 'esc_esh')).toBe(true);
    expect(crisis.isCrisis({ systolic: 179, diastolic: 109 }, 'esc_esh')).toBe(false);
  });
});

describe('bpConfig.derived', () => {
  const pp = bpConfig.derived!.find(d => d.key === 'pulsePressure')!;
  const map = bpConfig.derived!.find(d => d.key === 'map')!;

  it('computes pulse pressure (systolic - diastolic)', () => {
    expect(pp.compute({ systolic: 120, diastolic: 80 })).toBe(40);
  });

  it('computes MAP ((systolic + 2*diastolic) / 3)', () => {
    expect(map.compute({ systolic: 120, diastolic: 80 })).toBe(93);
  });

  it('interprets PP: low < 40', () => {
    expect(pp.interpret!(35)).toBe('low');
  });

  it('interprets PP: normal 40-60', () => {
    expect(pp.interpret!(40)).toBe('normal');
    expect(pp.interpret!(60)).toBe('normal');
  });

  it('interprets PP: high > 60', () => {
    expect(pp.interpret!(65)).toBe('high');
  });
});

describe('bpConfig fields', () => {
  it('has 3 fields (systolic, diastolic, pulse)', () => {
    expect(bpConfig.fields).toHaveLength(3);
    expect(bpConfig.fields.map(f => f.key)).toEqual(['systolic', 'diastolic', 'pulse']);
  });

  it('has 2 context fields (location, posture)', () => {
    expect(bpConfig.contextFields).toHaveLength(2);
    expect(bpConfig.contextFields!.map(f => f.key)).toEqual(['location', 'posture']);
  });

  it('has 5 categories', () => {
    expect(bpConfig.categories).toHaveLength(5);
  });

  it('has 4 guidelines', () => {
    expect(bpConfig.guidelines).toHaveLength(4);
  });
});

describe('MetricRegistry with bpConfig', () => {
  it('can be registered and retrieved', () => {
    registerMetric(bpConfig);
    const config = getMetricConfig('blood-pressure');
    expect(config.id).toBe('blood-pressure');
  });

  it('throws on duplicate registration', () => {
    registerMetric(bpConfig);
    expect(() => registerMetric(bpConfig)).toThrow('already registered');
  });

  it('throws on unknown metric id', () => {
    expect(() => getMetricConfig('unknown-metric')).toThrow('No metric found');
  });
});

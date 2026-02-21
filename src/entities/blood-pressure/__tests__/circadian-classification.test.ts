import { computeTimeInRange } from '../circadian-classification';
import { BP_GUIDELINES } from '../../../shared/config/settings';
import type { BPRecord } from '../../../shared/api/bp-repository';

// Helper — timestamp at specific hour today
function atHour(h: number): number {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

function makeRecord(
  systolic: number,
  diastolic: number,
  timestamp: number,
): BPRecord {
  return {
    id: `${timestamp}`,
    systolic,
    diastolic,
    pulse: null,
    timestamp,
    timezoneOffset: 0,
    location: 'left_arm',
    posture: 'sitting',
    notes: null,
    weight: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    isSynced: false,
  };
}

describe('computeTimeInRange', () => {
  it('returns all zeros for empty records', () => {
    const result = computeTimeInRange([], BP_GUIDELINES.AHA_ACC);
    expect(result.overall.normal).toBe(0);
  });

  it('correctly classifies and computes percentages (AHA/ACC)', () => {
    const records = [
      makeRecord(115, 75, atHour(7)),  // normal
      makeRecord(115, 75, atHour(8)),  // normal
      makeRecord(125, 79, atHour(9)),  // elevated
      makeRecord(145, 92, atHour(10)), // stage2
    ];
    const result = computeTimeInRange(records, BP_GUIDELINES.AHA_ACC);
    expect(result.overall.normal).toBe(50);
    expect(result.overall.elevated).toBe(25);
    expect(result.overall.stage2).toBe(25);
  });
});

import { computeReportStats } from '../lib/compute-report-stats';
import { BP_GUIDELINES } from '../../../shared/config/settings';
import type { BPRecord } from '../../../entities/blood-pressure';

const makeRecord = (
  systolic: number,
  diastolic: number,
  pulse: number | null,
  timestamp: number,
): BPRecord => ({
  id: `${timestamp}`,
  systolic,
  diastolic,
  pulse,
  timestamp,
  timezoneOffset: 0,
  location: 'left_arm',
  posture: 'sitting',
  notes: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  isSynced: false,
});

const NOW = Math.floor(Date.now() / 1000);

describe('computeReportStats', () => {
  it('returns zero stats for empty array', () => {
    const stats = computeReportStats([], BP_GUIDELINES.AHA_ACC);
    expect(stats.total).toBe(0);
    expect(stats.avgSystolic).toBe(0);
    expect(stats.avgDiastolic).toBe(0);
  });

  it('computes correct averages and min/max', () => {
    const records = [
      makeRecord(120, 80, 70, NOW - 100),
      makeRecord(140, 90, 80, NOW - 200),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    expect(stats.total).toBe(2);
    expect(stats.avgSystolic).toBe(130);
    expect(stats.avgDiastolic).toBe(85);
    expect(stats.minSystolic).toBe(120);
    expect(stats.maxSystolic).toBe(140);
  });

  it('excludes null pulse from pulse average', () => {
    const records = [
      makeRecord(120, 80, 70, NOW - 100),
      makeRecord(120, 80, null, NOW - 200),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    expect(stats.avgPulse).toBe(70);
  });

  it('counts categories correctly for AHA/ACC', () => {
    const records = [
      makeRecord(115, 75, null, NOW),
      makeRecord(125, 78, null, NOW),
      makeRecord(135, 85, null, NOW),
      makeRecord(145, 92, null, NOW),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    const total = stats.categoryBreakdown.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(4);
    const normal = stats.categoryBreakdown.find(c => c.key === 'normal');
    expect(normal?.count).toBe(1);
    expect(normal?.percent).toBe(25);
  });
});

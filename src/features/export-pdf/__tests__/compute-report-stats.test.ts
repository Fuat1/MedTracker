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

  it('computes avgPP and avgMAP correctly', () => {
    const records = [
      makeRecord(120, 80, 70, NOW - 100),
      makeRecord(140, 90, 80, NOW - 200),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    // PP: (120-80)=40, (140-90)=50, avg=45
    expect(stats.avgPP).toBe(45);
    // MAP: (120+160)/3=93, (140+180)/3=107, avg=100
    expect(stats.avgMAP).toBe(100);
  });

  it('classifies records with ESC/ESH guideline', () => {
    const records = [
      makeRecord(135, 85, null, NOW),
      makeRecord(145, 92, null, NOW),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.ESC_ESH);
    // 135/85: ESC Elevated (High Normal)
    const elevated = stats.categoryBreakdown.find(c => c.key === 'elevated');
    expect(elevated?.count).toBe(1);
    // 145/92: ESC Stage 1
    const stage1 = stats.categoryBreakdown.find(c => c.key === 'stage_1');
    expect(stage1?.count).toBe(1);
  });

  it('includes crisis category for extreme readings', () => {
    const records = [
      makeRecord(185, 125, null, NOW),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    const crisis = stats.categoryBreakdown.find(c => c.key === 'crisis');
    expect(crisis?.count).toBe(1);
    expect(crisis?.percent).toBe(100);
  });

  it('computes minDiastolic and maxDiastolic', () => {
    const records = [
      makeRecord(120, 70, null, NOW - 100),
      makeRecord(140, 95, null, NOW - 200),
    ];
    const stats = computeReportStats(records, BP_GUIDELINES.AHA_ACC);
    expect(stats.minDiastolic).toBe(70);
    expect(stats.maxDiastolic).toBe(95);
  });
});

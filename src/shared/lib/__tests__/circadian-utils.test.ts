import {
  getTimeWindow,
  computeCircadianBreakdown,
  detectMorningSurge,
} from '../circadian-utils';
import type { BPRecord } from '../../api/bp-repository';

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
    createdAt: timestamp,
    updatedAt: timestamp,
    isSynced: false,
  };
}

describe('getTimeWindow', () => {
  it('classifies 6am as morning', () => {
    expect(getTimeWindow(atHour(6))).toBe('morning');
  });
  it('classifies 9:59am as morning', () => {
    const d = new Date();
    d.setHours(9, 59, 0, 0);
    expect(getTimeWindow(Math.floor(d.getTime() / 1000))).toBe('morning');
  });
  it('classifies 10am as day', () => {
    expect(getTimeWindow(atHour(10))).toBe('day');
  });
  it('classifies 18pm as evening', () => {
    expect(getTimeWindow(atHour(18))).toBe('evening');
  });
  it('classifies 22pm as night', () => {
    expect(getTimeWindow(atHour(22))).toBe('night');
  });
  it('classifies midnight (0) as night', () => {
    expect(getTimeWindow(atHour(0))).toBe('night');
  });
});

describe('computeCircadianBreakdown', () => {
  it('returns empty arrays for no records', () => {
    const result = computeCircadianBreakdown([]);
    expect(result.morning.length).toBe(0);
    expect(result.day.length).toBe(0);
    expect(result.evening.length).toBe(0);
    expect(result.night.length).toBe(0);
  });

  it('groups records into correct windows', () => {
    const records = [
      makeRecord(120, 80, atHour(7)),  // morning
      makeRecord(125, 82, atHour(14)), // day
      makeRecord(130, 85, atHour(20)), // evening
      makeRecord(118, 78, atHour(23)), // night
    ];
    const result = computeCircadianBreakdown(records);
    expect(result.morning.length).toBe(1);
    expect(result.day.length).toBe(1);
    expect(result.evening.length).toBe(1);
    expect(result.night.length).toBe(1);
  });

  it('computes correct averages per window', () => {
    const records = [
      makeRecord(120, 80, atHour(7)),
      makeRecord(140, 90, atHour(8)),
    ];
    const result = computeCircadianBreakdown(records);
    expect(result.morning.length).toBe(2);
    expect(result.morningAvg!.systolic).toBe(130);
    expect(result.morningAvg!.diastolic).toBe(85);
  });
});

describe('detectMorningSurge', () => {
  it('returns no surge when fewer than 2 readings', () => {
    const records = [makeRecord(120, 80, atHour(7))];
    expect(detectMorningSurge(records).hasSurge).toBe(false);
  });

  it('detects surge when morning is >=20 mmHg above prior night avg', () => {
    // Prior night reading
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 0, 0, 0);
    const nightTs = Math.floor(yesterday.getTime() / 1000);

    const records = [
      makeRecord(100, 70, nightTs),           // night avg = 100
      makeRecord(125, 80, atHour(7)),          // morning = 125, delta = 25 >= 20
    ];
    const result = detectMorningSurge(records);
    expect(result.hasSurge).toBe(true);
    expect(result.delta).toBeGreaterThanOrEqual(20);
  });

  it('returns no surge when delta is below threshold', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 0, 0, 0);
    const nightTs = Math.floor(yesterday.getTime() / 1000);

    const records = [
      makeRecord(115, 75, nightTs),
      makeRecord(125, 80, atHour(7)), // delta = 10 < 20
    ];
    const result = detectMorningSurge(records);
    expect(result.hasSurge).toBe(false);
  });
});


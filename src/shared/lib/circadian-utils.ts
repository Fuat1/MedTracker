import type { BPRecord } from '../api/bp-repository';

export type TimeWindow = 'morning' | 'day' | 'evening' | 'night';

export interface CircadianAvg {
  systolic: number;
  diastolic: number;
  count: number;
}

export interface CircadianBreakdown {
  morning: BPRecord[];
  day: BPRecord[];
  evening: BPRecord[];
  night: BPRecord[];
  morningAvg: CircadianAvg | null;
  dayAvg: CircadianAvg | null;
  eveningAvg: CircadianAvg | null;
  nightAvg: CircadianAvg | null;
}

export interface MorningSurgeResult {
  hasSurge: boolean;
  delta: number;
  surgeRecordId: string | null;
}

export interface TimeInRangeWindow {
  normal: number;
  elevated: number;
  stage1: number;
  stage2: number;
  crisis: number;
}

export interface TimeInRangeResult {
  overall: TimeInRangeWindow;
  morning: TimeInRangeWindow;
  day: TimeInRangeWindow;
  evening: TimeInRangeWindow;
  night: TimeInRangeWindow;
}

/** Returns time window for a Unix epoch timestamp */
export function getTimeWindow(timestamp: number): TimeWindow {
  const hour = new Date(timestamp * 1000).getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function avgWindow(records: BPRecord[]): CircadianAvg | null {
  if (records.length === 0) return null;
  return {
    systolic: Math.round(records.reduce((s, r) => s + r.systolic, 0) / records.length),
    diastolic: Math.round(records.reduce((s, r) => s + r.diastolic, 0) / records.length),
    count: records.length,
  };
}

/** Groups records into the 4 time windows, computes averages */
export function computeCircadianBreakdown(records: BPRecord[]): CircadianBreakdown {
  const morning: BPRecord[] = [];
  const day: BPRecord[] = [];
  const evening: BPRecord[] = [];
  const night: BPRecord[] = [];

  for (const r of records) {
    switch (getTimeWindow(r.timestamp)) {
      case 'morning': morning.push(r); break;
      case 'day':     day.push(r);     break;
      case 'evening': evening.push(r); break;
      case 'night':   night.push(r);   break;
    }
  }

  return {
    morning, day, evening, night,
    morningAvg: avgWindow(morning),
    dayAvg:     avgWindow(day),
    eveningAvg: avgWindow(evening),
    nightAvg:   avgWindow(night),
  };
}

/** Threshold (mmHg systolic rise from prior-night avg) for morning surge */
const SURGE_THRESHOLD = 20;

/**
 * Detects morning surge: first morning reading's systolic >= SURGE_THRESHOLD
 * above the average of yesterday's night readings.
 */
export function detectMorningSurge(records: BPRecord[]): MorningSurgeResult {
  const NO_SURGE: MorningSurgeResult = { hasSurge: false, delta: 0, surgeRecordId: null };

  // Get today's first morning reading (smallest timestamp in today's morning window)
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayStartTs = Math.floor(todayStart.getTime() / 1000);

  const todayMorning = records
    .filter(r => r.timestamp >= todayStartTs && getTimeWindow(r.timestamp) === 'morning')
    .sort((a, b) => a.timestamp - b.timestamp);

  if (todayMorning.length === 0) return NO_SURGE;
  const firstMorning = todayMorning[0];

  // Get prior night readings (yesterday 22:00 -> today 05:59)
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  yesterdayStart.setHours(22, 0, 0, 0);
  const yesterdayStartTs = Math.floor(yesterdayStart.getTime() / 1000);
  const todayMorningStart = todayStartTs + 6 * 3600; // 06:00 today

  const priorNight = records.filter(
    r => r.timestamp >= yesterdayStartTs && r.timestamp < todayMorningStart && getTimeWindow(r.timestamp) === 'night',
  );

  if (priorNight.length === 0) return NO_SURGE;

  const nightAvgSystolic = priorNight.reduce((s, r) => s + r.systolic, 0) / priorNight.length;
  const delta = Math.round(firstMorning.systolic - nightAvgSystolic);

  if (delta >= SURGE_THRESHOLD) {
    return { hasSurge: true, delta, surgeRecordId: firstMorning.id };
  }
  return NO_SURGE;
}


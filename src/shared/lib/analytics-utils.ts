import type { BPRecord } from '../api/bp-repository';

export interface WeeklyAverage {
  systolic: number;
  diastolic: number;
  hasData: boolean;
}

export interface AmPmComparison {
  am: { systolic: number; diastolic: number };
  pm: { systolic: number; diastolic: number };
  hasAmData: boolean;
  hasPmData: boolean;
}

/**
 * Compute average systolic/diastolic from records in the last 7 days.
 */
export function computeWeeklyAverage(records: BPRecord[]): WeeklyAverage {
  const now = Date.now() / 1000;
  const sevenDaysAgo = now - 7 * 86400;

  const recent = records.filter(r => r.timestamp >= sevenDaysAgo);

  if (recent.length === 0) {
    return { systolic: 0, diastolic: 0, hasData: false };
  }

  const sumSys = recent.reduce((acc, r) => acc + r.systolic, 0);
  const sumDia = recent.reduce((acc, r) => acc + r.diastolic, 0);

  return {
    systolic: Math.round(sumSys / recent.length),
    diastolic: Math.round(sumDia / recent.length),
    hasData: true,
  };
}

/**
 * Split records into AM (hour < 12) and PM (hour >= 12), compute averages.
 */
export interface WeightTrend {
  avgWeight: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  recordsWithWeight: number;
  hasData: boolean;
}

export interface WeightBPCorrelation {
  /** Pearson correlation coefficient between weight and systolic BP (-1 to 1) */
  systolicCorrelation: number | null;
  /** Pearson correlation coefficient between weight and diastolic BP (-1 to 1) */
  diastolicCorrelation: number | null;
  hasData: boolean;
}

/**
 * Compute weight statistics from records that have weight data.
 */
export function computeWeightTrend(records: BPRecord[]): WeightTrend {
  const withWeight = records.filter(
    (r): r is BPRecord & { weight: number } => r.weight != null,
  );

  if (withWeight.length === 0) {
    return { avgWeight: null, minWeight: null, maxWeight: null, recordsWithWeight: 0, hasData: false };
  }

  const weights = withWeight.map(r => r.weight);
  const sum = weights.reduce((a, b) => a + b, 0);

  return {
    avgWeight: Math.round((sum / weights.length) * 10) / 10,
    minWeight: Math.min(...weights),
    maxWeight: Math.max(...weights),
    recordsWithWeight: withWeight.length,
    hasData: true,
  };
}

/**
 * Compute Pearson correlation between weight and BP values.
 * Requires at least 3 records with weight data for meaningful correlation.
 */
export function computeWeightBPCorrelation(records: BPRecord[]): WeightBPCorrelation {
  const withWeight = records.filter(
    (r): r is BPRecord & { weight: number } => r.weight != null,
  );

  if (withWeight.length < 3) {
    return { systolicCorrelation: null, diastolicCorrelation: null, hasData: false };
  }

  const pearson = (xs: number[], ys: number[]): number => {
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const sumY2 = ys.reduce((a, y) => a + y * y, 0);

    const denom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denom === 0) return 0;
    return Math.round(((n * sumXY - sumX * sumY) / denom) * 100) / 100;
  };

  const weights = withWeight.map(r => r.weight);
  const systolics = withWeight.map(r => r.systolic);
  const diastolics = withWeight.map(r => r.diastolic);

  return {
    systolicCorrelation: pearson(weights, systolics),
    diastolicCorrelation: pearson(weights, diastolics),
    hasData: true,
  };
}

/**
 * Split records into AM (hour < 12) and PM (hour >= 12), compute averages.
 */
export function computeAmPmComparison(records: BPRecord[]): AmPmComparison {
  const am: BPRecord[] = [];
  const pm: BPRecord[] = [];

  for (const r of records) {
    const hour = new Date(r.timestamp * 1000).getHours();
    if (hour < 12) {
      am.push(r);
    } else {
      pm.push(r);
    }
  }

  const avg = (arr: BPRecord[], key: 'systolic' | 'diastolic') =>
    arr.length > 0 ? Math.round(arr.reduce((s, r) => s + r[key], 0) / arr.length) : 0;

  return {
    am: { systolic: avg(am, 'systolic'), diastolic: avg(am, 'diastolic') },
    pm: { systolic: avg(pm, 'systolic'), diastolic: avg(pm, 'diastolic') },
    hasAmData: am.length > 0,
    hasPmData: pm.length > 0,
  };
}

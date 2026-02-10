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

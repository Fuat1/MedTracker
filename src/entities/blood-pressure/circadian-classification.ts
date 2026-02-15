import { classifyBP } from './lib';
import { computeCircadianBreakdown } from '../../shared/lib/circadian-utils';
import type { BPRecord } from '../../shared/api/bp-repository';
import type { BPGuideline } from '../../shared/config/settings';
import type { TimeInRangeWindow, TimeInRangeResult } from '../../shared/lib/circadian-utils';

function emptyWindow(): TimeInRangeWindow {
  return { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 };
}

function computeWindowPercents(windowRecords: BPRecord[], guideline: BPGuideline): TimeInRangeWindow {
  if (windowRecords.length === 0) return emptyWindow();
  const counts = { normal: 0, elevated: 0, stage1: 0, stage2: 0, crisis: 0 };
  for (const r of windowRecords) {
    const cat = classifyBP(r.systolic, r.diastolic, guideline);
    if (cat === 'normal') counts.normal++;
    else if (cat === 'elevated') counts.elevated++;
    else if (cat === 'stage_1') counts.stage1++;
    else if (cat === 'stage_2') counts.stage2++;
    else if (cat === 'crisis') counts.crisis++;
  }
  const total = windowRecords.length;
  return {
    normal:   Math.round((counts.normal   / total) * 100),
    elevated: Math.round((counts.elevated / total) * 100),
    stage1:   Math.round((counts.stage1   / total) * 100),
    stage2:   Math.round((counts.stage2   / total) * 100),
    crisis:   Math.round((counts.crisis   / total) * 100),
  };
}

/** Computes time-in-range percentages overall and per window */
export function computeTimeInRange(records: BPRecord[], guideline: BPGuideline): TimeInRangeResult {
  const bd = computeCircadianBreakdown(records);
  return {
    overall:  computeWindowPercents(records,    guideline),
    morning:  computeWindowPercents(bd.morning, guideline),
    day:      computeWindowPercents(bd.day,     guideline),
    evening:  computeWindowPercents(bd.evening, guideline),
    night:    computeWindowPercents(bd.night,   guideline),
  };
}

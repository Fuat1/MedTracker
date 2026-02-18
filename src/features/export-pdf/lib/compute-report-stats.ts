import { classifyBP, getBPCategoryLabel, calculatePulsePressure, calculateMAP } from '../../../entities/blood-pressure/lib';
import type { BPRecord } from '../../../shared/api/bp-repository';
import type { BPGuideline } from '../../../shared/config/settings';
import { BP_GUIDELINES } from '../../../shared/config/settings';
import type { BPCategory } from '../../../shared/config';

export interface CategoryStat {
  key: string;
  label: string;
  range: string;
  count: number;
  percent: number;
  /** Hex color for use in HTML report */
  color: string;
}

export interface ReportStats {
  total: number;
  avgSystolic: number;
  avgDiastolic: number;
  avgPulse: number;
  avgPP: number;
  avgMAP: number;
  minSystolic: number;
  maxSystolic: number;
  minDiastolic: number;
  maxDiastolic: number;
  categoryBreakdown: CategoryStat[];
}

/** Range description per guideline + category */
function getCategoryRange(key: BPCategory, guideline: BPGuideline): string {
  const guidelineRanges: Record<string, Record<BPCategory, string>> = {
    [BP_GUIDELINES.AHA_ACC]: {
      normal: '<120 / <80 mmHg',
      elevated: '120–129 / <80 mmHg',
      stage_1: '130–139 / 80–89 mmHg',
      stage_2: '≥140 / ≥90 mmHg',
      crisis: '≥180 / ≥120 mmHg',
    },
    [BP_GUIDELINES.JSH]: {
      normal: '<130 / <80 mmHg',
      elevated: '130–139 / 80–89 mmHg',
      stage_1: '140–159 / 90–99 mmHg',
      stage_2: '160–179 / 100–109 mmHg',
      crisis: '≥180 / ≥110 mmHg',
    },
    [BP_GUIDELINES.ESC_ESH]: {
      normal: '<130 / <85 mmHg',
      elevated: '130–139 / 85–89 mmHg',
      stage_1: '140–159 / 90–99 mmHg',
      stage_2: '160–179 / 100–109 mmHg',
      crisis: '≥180 / ≥110 mmHg',
    },
    [BP_GUIDELINES.WHO]: {
      normal: '<130 / <85 mmHg',
      elevated: '130–139 / 85–89 mmHg',
      stage_1: '140–159 / 90–99 mmHg',
      stage_2: '160–179 / 100–109 mmHg',
      crisis: '≥180 / ≥110 mmHg',
    },
  };
  const ranges = guidelineRanges[guideline] ?? guidelineRanges[BP_GUIDELINES.AHA_ACC];
  return ranges[key] ?? '–';
}

const CATEGORY_COLORS: Record<BPCategory, string> = {
  normal: '#22c55e',
  elevated: '#eab308',
  stage_1: '#f97316',
  stage_2: '#ef4444',
  crisis: '#dc2626',
};

const CATEGORY_ORDER: BPCategory[] = [
  'normal',
  'elevated',
  'stage_1',
  'stage_2',
  'crisis',
];

export function computeReportStats(
  records: BPRecord[],
  guideline: BPGuideline,
): ReportStats {
  if (records.length === 0) {
    return {
      total: 0,
      avgSystolic: 0,
      avgDiastolic: 0,
      avgPulse: 0,
      avgPP: 0,
      avgMAP: 0,
      minSystolic: 0,
      maxSystolic: 0,
      minDiastolic: 0,
      maxDiastolic: 0,
      categoryBreakdown: [],
    };
  }

  const systolics = records.map(r => r.systolic);
  const diastolics = records.map(r => r.diastolic);
  const pulses = records
    .map(r => r.pulse)
    .filter((p): p is number => p !== null);
  const pps = records.map(r => calculatePulsePressure(r.systolic, r.diastolic));
  const maps = records.map(r => calculateMAP(r.systolic, r.diastolic));

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const round = (n: number) => Math.round(n);

  const counts: Partial<Record<BPCategory, number>> = {};
  records.forEach(r => {
    const cat = classifyBP(r.systolic, r.diastolic, guideline);
    counts[cat] = (counts[cat] ?? 0) + 1;
  });

  const categoryBreakdown: CategoryStat[] = CATEGORY_ORDER.filter(
    key => counts[key] !== undefined,
  ).map(key => ({
    key,
    label: getBPCategoryLabel(key),
    range: getCategoryRange(key, guideline),
    count: counts[key] as number,
    percent: Math.round(((counts[key] as number) / records.length) * 100),
    color: CATEGORY_COLORS[key],
  }));

  return {
    total: records.length,
    avgSystolic: round(sum(systolics) / systolics.length),
    avgDiastolic: round(sum(diastolics) / diastolics.length),
    avgPulse: pulses.length > 0 ? round(sum(pulses) / pulses.length) : 0,
    avgPP: round(sum(pps) / pps.length),
    avgMAP: round(sum(maps) / maps.length),
    minSystolic: Math.min(...systolics),
    maxSystolic: Math.max(...systolics),
    minDiastolic: Math.min(...diastolics),
    maxDiastolic: Math.max(...diastolics),
    categoryBreakdown,
  };
}

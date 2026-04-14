/**
 * Generic Circadian Classification
 *
 * Computes time-in-range percentages per category for each time-of-day window,
 * using config.domainToFieldValues + config.classify for classification.
 *
 * Works with any metric whose domain records include a `timestamp` field.
 * BP-specific circadian-classification.ts delegates here via bpConfig.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 3
 */

import type { MetricConfig } from '../../shared/config/metric-types';

type TimeWindow = 'morning' | 'day' | 'evening' | 'night';

/** Returns the circadian window for a Unix epoch (seconds) timestamp. */
function getTimeWindow(timestamp: number): TimeWindow {
  const hour = new Date(timestamp * 1000).getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

/**
 * Category-ID → percentage map for a set of records in one time window.
 * Keys match config.categories[*].id.
 */
export interface MetricTimeInRangeWindow {
  [categoryId: string]: number;
}

/** Time-in-range results broken down by circadian window. */
export interface MetricTimeInRangeResult {
  overall: MetricTimeInRangeWindow;
  morning: MetricTimeInRangeWindow;
  day: MetricTimeInRangeWindow;
  evening: MetricTimeInRangeWindow;
  night: MetricTimeInRangeWindow;
}

function emptyWindow(categoryIds: readonly string[]): MetricTimeInRangeWindow {
  return Object.fromEntries(categoryIds.map(id => [id, 0]));
}

function computeWindowPercents<TRecord>(
  records: TRecord[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  guidelineId: string,
): MetricTimeInRangeWindow {
  const categoryIds = config.categories.map(c => c.id);
  if (records.length === 0) return emptyWindow(categoryIds);

  const counts = emptyWindow(categoryIds);
  for (const record of records) {
    const values = config.domainToFieldValues(record);
    const catId = config.classify(values, guidelineId);
    if (catId in counts) {
      counts[catId]++;
    }
  }

  const total = records.length;
  const result: MetricTimeInRangeWindow = {};
  for (const id of categoryIds) {
    result[id] = Math.round(((counts[id] ?? 0) / total) * 100);
  }
  return result;
}

/**
 * Computes time-in-range percentages per category for each circadian window.
 *
 * @param records   Domain records (must have a `timestamp: number` field)
 * @param config    MetricConfig for this metric
 * @param guidelineId  Active guideline ID (from settings store)
 */
export function computeMetricTimeInRange<TRecord extends { timestamp: number }>(
  records: TRecord[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  guidelineId: string,
): MetricTimeInRangeResult {
  const morning: TRecord[] = [];
  const day: TRecord[] = [];
  const evening: TRecord[] = [];
  const night: TRecord[] = [];

  for (const record of records) {
    switch (getTimeWindow(record.timestamp)) {
      case 'morning': morning.push(record); break;
      case 'day':     day.push(record);     break;
      case 'evening': evening.push(record); break;
      case 'night':   night.push(record);   break;
    }
  }

  return {
    overall: computeWindowPercents(records, config, guidelineId),
    morning: computeWindowPercents(morning, config, guidelineId),
    day:     computeWindowPercents(day,     config, guidelineId),
    evening: computeWindowPercents(evening, config, guidelineId),
    night:   computeWindowPercents(night,   config, guidelineId),
  };
}

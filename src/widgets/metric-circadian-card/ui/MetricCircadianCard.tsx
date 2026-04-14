/**
 * MetricCircadianCard
 *
 * Renders a circadian card only when config.circadian.enabled is true.
 * If the metric config registers a custom CircadianCard component, it renders
 * that. Otherwise renders nothing (no generic circadian view yet).
 *
 * Props passed to the override:
 *   - records: period-filtered records (for breakdown + time-in-range)
 *   - allRecords: all unfiltered records (for morning surge detection)
 */

import React from 'react';
import type { MetricConfig } from '../../../shared/config/metric-types';

interface MetricCircadianCardProps<TRecord> {
  records: TRecord[];
  allRecords: TRecord[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>;
}

export function MetricCircadianCard<TRecord extends { id: string; timestamp: number }>({
  records,
  allRecords,
  config,
}: MetricCircadianCardProps<TRecord>) {
  if (!config.circadian?.enabled) return null;

  const Override = config.components?.CircadianCard;
  if (!Override) return null;

  return <Override records={records} allRecords={allRecords} />;
}

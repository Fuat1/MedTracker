/**
 * MetricTrendChart
 *
 * Override-aware trend chart. If the metric config registers a custom TrendChart
 * component, it renders that. Otherwise falls back to the shared BPTrendChart
 * (which will be replaced with a GenericTrendChart in a future phase).
 */

import React from 'react';
import type { MetricConfig } from '../../../shared/config/metric-types';

interface MetricTrendChartProps<TRecord> {
  records: TRecord[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>;
  /** Any extra props forwarded to the override component */
  [key: string]: unknown;
}

export function MetricTrendChart<TRecord extends { id: string; timestamp: number }>({
  records,
  config,
  ...rest
}: MetricTrendChartProps<TRecord>) {
  const Override = config.components?.TrendChart;

  if (Override) {
    return <Override records={records} config={config} {...rest} />;
  }

  // No generic trend chart yet — override required for now
  return null;
}

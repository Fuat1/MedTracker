/**
 * Generic Metric Records Query Hook
 *
 * TanStack Query wrapper around getMetricRecords(config, limit).
 * Query key is derived from config.queryKey so each metric has its own cache.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 3
 */

import { useQuery } from '@tanstack/react-query';
import { getMetricRecords } from '../../shared/api/metric-repository';
import type { MetricConfig } from '../../shared/config/metric-types';

/**
 * Fetches all records for a metric, optionally limited to `limit` most recent.
 *
 * Returns a standard TanStack Query result object.
 */
export function useMetricRecords<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  limit?: number,
) {
  return useQuery({
    queryKey: [...config.queryKey, ...(limit !== undefined ? [limit] : [])],
    queryFn: () => getMetricRecords<TRecord>(config, limit),
  });
}

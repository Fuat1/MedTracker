/**
 * Generic Delete Metric Mutation
 *
 * Deletes a metric record and invalidates the query cache.
 * Tags cascade-delete automatically via FK ON DELETE CASCADE.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 4
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteMetricRecord } from '../../../shared/api/metric-repository';
import type { MetricConfig } from '../../../shared/config/metric-types';

/**
 * Generic mutation hook for deleting a metric reading by ID.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDeleteMetric(config: MetricConfig<any, any>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const success = await deleteMetricRecord(config, id);
      if (!success) {
        throw new Error('Delete failed');
      }
      return id;
    },
    onSuccess: () => {
      // Record rows cascade-delete tags via FK ON DELETE CASCADE
      queryClient.invalidateQueries({ queryKey: config.queryKey as string[] });
      if (config.db.tagsTableName) {
        queryClient.invalidateQueries({ queryKey: [config.db.tagsTableName] });
      }
    },
  });
}

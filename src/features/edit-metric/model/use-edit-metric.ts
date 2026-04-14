/**
 * Generic Edit Metric Mutation
 *
 * Handles the core update pipeline for any MetricConfig:
 *   1. Validate updated field values via validateMetricValues
 *   2. Update record via updateMetricRecord
 *   3. Replace tags (if metric has a tags table)
 *   4. Invalidate query cache
 *   5. Call optional onAfterUpdate callback (for metric-specific side effects)
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 4
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMetricRecord } from '../../../shared/api/metric-repository';
import { saveTagsForMetricRecord } from '../../../shared/api/metric-tags-repository';
import { validateMetricValues } from '../../../entities/health-metric';
import type { MetricConfig } from '../../../shared/config/metric-types';

export interface EditMetricInput {
  /** ID of the record to update */
  id: string;
  /**
   * Partial field values to update (column-name keys).
   * Only columns in config.db.columns + 'timestamp' + 'is_synced' are updated.
   */
  updates: Record<string, unknown>;
  /** Replacement tag list — replaces ALL existing tags */
  tags?: string[];
  /** Whether to skip validation (used when only updating metadata like tags) */
  skipValidation?: boolean;
}

export interface EditMetricCallbacks<TRecord> {
  /**
   * Called after successful update + tag replacement, inside onSuccess.
   * Use for side effects such as Firestore sync.
   */
  onAfterUpdate?: (record: TRecord | null) => void;
}

/**
 * Generic mutation hook for editing an existing metric reading.
 */
export function useEditMetric<TRecord extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  callbacks?: EditMetricCallbacks<TRecord>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditMetricInput) => {
      const { id, updates, tags, skipValidation } = input;

      if (!skipValidation) {
        const validation = validateMetricValues(config, updates);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }
      }

      const updated = await updateMetricRecord<TRecord>(config, id, updates);

      // Replace all tags if metric has a tags table
      if (config.db.tagsTableName) {
        await saveTagsForMetricRecord(config, id, tags ?? []);
      }

      return updated;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: config.queryKey as string[] });
      if (config.db.tagsTableName) {
        queryClient.invalidateQueries({ queryKey: [config.db.tagsTableName] });
      }
      callbacks?.onAfterUpdate?.(updated);
    },
  });
}

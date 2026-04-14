/**
 * Generic Record Metric Mutation
 *
 * Handles the core insert pipeline for any MetricConfig:
 *   1. Validate field values via validateMetricValues
 *   2. Insert record via insertMetricRecord
 *   3. Save tags (if metric has a tags table)
 *   4. Invalidate query cache
 *   5. Call optional onAfterInsert callback (for metric-specific side effects
 *      such as weather fetch, Firestore sync, or crisis alerts)
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 4
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertMetricRecord } from '../../../shared/api/metric-repository';
import { saveTagsForMetricRecord } from '../../../shared/api/metric-tags-repository';
import { validateMetricValues } from '../../../entities/health-metric';
import type { MetricConfig } from '../../../shared/config/metric-types';

export interface RecordMetricInput {
  /** Raw field values (column-name keys) to pass to insertMetricRecord */
  fieldValues: Record<string, unknown>;
  /** Tags to save after insert (requires config.db.tagsTableName) */
  tags?: string[];
}

export interface RecordMetricCallbacks<TRecord> {
  /**
   * Called after successful insert + tag save, inside onSuccess.
   * Use for side effects that must not block the insert:
   *   weather fetch, Firestore sync, crisis alerts.
   */
  onAfterInsert?: (record: TRecord) => void;
}

/**
 * Generic mutation hook for recording a new metric reading.
 *
 * TRecord must extend `{ id: string }` because tags are saved via record.id.
 */
export function useRecordMetric<TRecord extends { id: string }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  callbacks?: RecordMetricCallbacks<TRecord>,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordMetricInput) => {
      const { fieldValues, tags } = input;

      // Generic validation (range checks + cross-field rules)
      const validation = validateMetricValues(config, fieldValues);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const record = await insertMetricRecord<TRecord>(config, fieldValues);

      // Save tags if metric has a tags table and tags were provided
      if (config.db.tagsTableName && tags && tags.length > 0) {
        await saveTagsForMetricRecord(config, record.id, tags);
      }

      return record;
    },
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: config.queryKey as string[] });
      if (config.db.tagsTableName) {
        queryClient.invalidateQueries({ queryKey: [config.db.tagsTableName] });
      }
      callbacks?.onAfterInsert?.(record);
    },
  });
}

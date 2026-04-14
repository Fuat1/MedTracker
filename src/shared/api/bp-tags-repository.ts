/**
 * BP Tags Repository
 *
 * Thin delegate that preserves the existing public API while delegating
 * to the generic MetricTagsRepository via bpConfig.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 2
 */

import {
  getTagsForMetricRecord,
  saveTagsForMetricRecord,
  getTagsForMetricRecords,
} from './metric-tags-repository';
import { bpConfig } from '../../entities/blood-pressure/config';

/** A tag key is either a built-in LifestyleTag or a "custom:<uuid>" string */
export type { TagKey } from './metric-tags-repository';

/** Returns all tags for a single record */
export async function getTagsForRecord(recordId: string): Promise<string[]> {
  return getTagsForMetricRecord(bpConfig, recordId);
}

/** Replaces all tags for a record (delete + insert) */
export async function saveTagsForRecord(
  recordId: string,
  tags: string[],
): Promise<void> {
  return saveTagsForMetricRecord(bpConfig, recordId, tags);
}

/** Returns a map of recordId → tag[] for a set of record IDs */
export async function getTagsForRecords(
  recordIds: string[],
): Promise<Record<string, string[]>> {
  return getTagsForMetricRecords(bpConfig, recordIds);
}

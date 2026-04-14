/**
 * Generic Metric Tags Repository
 *
 * Provides tag CRUD operations parameterized by metric config.
 * The tags table name comes from config.db.tagsTableName.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 2
 */

import { getDatabase } from './db';
import { generateUUID, getCurrentTimestamp } from '../lib';
import type { MetricConfig } from '../config/metric-types';

/** A tag key is either a built-in LifestyleTag or a "custom:<uuid>" string */
export type TagKey = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfig = MetricConfig<any, any>;

function requireTagsTable(config: AnyConfig): string {
  if (!config.db.tagsTableName) {
    throw new Error(
      `[MetricTagsRepository] Metric "${config.id}" has no tagsTableName defined in its db schema.`,
    );
  }
  return config.db.tagsTableName;
}

/** Returns all tags for a single record */
export async function getTagsForMetricRecord(
  config: AnyConfig,
  recordId: string,
): Promise<TagKey[]> {
  const tagsTable = requireTagsTable(config);
  const db = getDatabase();
  const result = await db.execute(
    `SELECT tag FROM ${tagsTable} WHERE record_id = ? ORDER BY created_at ASC`,
    [recordId],
  );
  const rows = (result.rows ?? []) as Array<{ tag: string }>;
  return rows.map(r => r.tag);
}

/** Replaces all tags for a record (delete + insert) */
export async function saveTagsForMetricRecord(
  config: AnyConfig,
  recordId: string,
  tags: TagKey[],
): Promise<void> {
  const tagsTable = requireTagsTable(config);
  const db = getDatabase();
  const now = getCurrentTimestamp();

  await db.execute(`DELETE FROM ${tagsTable} WHERE record_id = ?`, [recordId]);

  for (const tag of tags) {
    await db.execute(
      `INSERT INTO ${tagsTable} (id, record_id, tag, created_at) VALUES (?, ?, ?, ?)`,
      [generateUUID(), recordId, tag, now],
    );
  }
}

/** Returns a map of recordId → tag[] for a set of record IDs */
export async function getTagsForMetricRecords(
  config: AnyConfig,
  recordIds: string[],
): Promise<Record<string, TagKey[]>> {
  if (recordIds.length === 0) return {};
  const tagsTable = requireTagsTable(config);
  const db = getDatabase();

  const placeholders = recordIds.map(() => '?').join(',');
  const result = await db.execute(
    `SELECT record_id, tag FROM ${tagsTable} WHERE record_id IN (${placeholders}) ORDER BY created_at ASC`,
    recordIds,
  );

  const rows = (result.rows ?? []) as Array<{ record_id: string; tag: string }>;
  const map: Record<string, TagKey[]> = {};
  for (const row of rows) {
    if (!map[row.record_id]) map[row.record_id] = [];
    map[row.record_id].push(row.tag);
  }
  return map;
}

/** Delete all tags for a record */
export async function deleteTagsForMetricRecord(
  config: AnyConfig,
  recordId: string,
): Promise<void> {
  const tagsTable = requireTagsTable(config);
  const db = getDatabase();
  await db.execute(`DELETE FROM ${tagsTable} WHERE record_id = ?`, [recordId]);
}

/**
 * Generic Metric Repository
 *
 * Provides parameterized CRUD operations driven by MetricConfig.db.
 * All values are parameterized — no string interpolation of user data.
 *
 * Column names and table names in SQL are derived from MetricConfig
 * (compile-time constants) so no injection risk.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 2
 */

import { getDatabase } from './db';
import { generateUUID, getCurrentTimestamp } from '../lib';
import type { MetricConfig } from '../config/metric-types';

// Re-export builders so callers can import from a single place
export { buildCreateTableSQL, buildCreateTagsTableSQL } from './metric-sql-builder';

// ─── Generic CRUD ─────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfig = MetricConfig<any, any>;

/**
 * Insert a new metric record.
 *
 * `input` must contain values for all required columns. The function
 * fills in id, timestamp, created_at, updated_at, is_synced automatically.
 *
 * Returns the full domain record via config.rowToDomain.
 */
export async function insertMetricRecord<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  input: AnyRecord,
): Promise<TRecord> {
  const db = getDatabase();
  const now = getCurrentTimestamp();
  const id = generateUUID();

  const columnNames: string[] = ['id', 'timestamp'];
  const placeholders: string[] = ['?', '?'];
  const values: (string | number | null)[] = [
    id,
    (input.timestamp as number | undefined) ?? now,
  ];

  for (const col of config.db.columns) {
    // Skip columns with no input value — let SQLite use its DEFAULT clause.
    // Only include if explicitly provided (even as null).
    if (input[col.name] === undefined) continue;
    columnNames.push(col.name);
    placeholders.push('?');
    values.push(input[col.name] as string | number | null);
  }

  columnNames.push('created_at', 'updated_at', 'is_synced');
  placeholders.push('?', '?', '?');
  values.push(now, now, (input.isSynced as boolean | undefined) ? 1 : 0);

  await db.execute(
    `INSERT INTO ${config.db.tableName} (${columnNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values,
  );

  const inserted = await getMetricRecordById(config, id);
  if (!inserted) {
    throw new Error(`[MetricRepository] Insert succeeded but record ${id} not found`);
  }
  return inserted;
}

/**
 * Get all records for a metric, ordered by timestamp DESC.
 */
export async function getMetricRecords<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  limit?: number,
): Promise<TRecord[]> {
  const db = getDatabase();
  const query = limit
    ? `SELECT * FROM ${config.db.tableName} ORDER BY timestamp DESC LIMIT ?`
    : `SELECT * FROM ${config.db.tableName} ORDER BY timestamp DESC`;

  const result = limit
    ? await db.execute(query, [limit])
    : await db.execute(query);

  const rows = (result.rows ?? []) as AnyRecord[];
  return rows.map(row => config.rowToDomain(row));
}

/**
 * Get a single record by ID.
 */
export async function getMetricRecordById<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  id: string,
): Promise<TRecord | null> {
  const db = getDatabase();
  const result = await db.execute(
    `SELECT * FROM ${config.db.tableName} WHERE id = ?`,
    [id],
  );
  const rows = (result.rows ?? []) as AnyRecord[];
  return rows.length > 0 ? config.rowToDomain(rows[0]) : null;
}

/**
 * Get the latest record (by timestamp).
 */
export async function getLatestMetricRecord<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
): Promise<TRecord | null> {
  const records = await getMetricRecords(config, 1);
  return records[0] ?? null;
}

/**
 * Update a metric record.
 * Only updates the columns present in `updates` (partial update).
 */
export async function updateMetricRecord<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  id: string,
  updates: Partial<AnyRecord>,
): Promise<TRecord | null> {
  const db = getDatabase();
  const now = getCurrentTimestamp();

  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  // Only update columns that exist in the config schema
  const allowedColumns = new Set([
    'timestamp',
    'is_synced',
    ...config.db.columns.map(c => c.name),
  ]);

  for (const [key, value] of Object.entries(updates)) {
    if (!allowedColumns.has(key)) continue;
    setClauses.push(`${key} = ?`);
    values.push(value as string | number | null);
  }

  if (setClauses.length === 0) {
    return getMetricRecordById(config, id);
  }

  setClauses.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.execute(
    `UPDATE ${config.db.tableName} SET ${setClauses.join(', ')} WHERE id = ?`,
    values,
  );

  return getMetricRecordById(config, id);
}

/**
 * Delete a metric record (tags cascade via FK).
 */
export async function deleteMetricRecord(
  config: AnyConfig,
  id: string,
): Promise<boolean> {
  const db = getDatabase();
  const result = await db.execute(
    `DELETE FROM ${config.db.tableName} WHERE id = ?`,
    [id],
  );
  return (result.rowsAffected ?? 0) > 0;
}

/**
 * Mark a record as synced (is_synced = 1).
 */
export async function markMetricRecordSynced(
  config: AnyConfig,
  id: string,
): Promise<void> {
  const db = getDatabase();
  await db.execute(
    `UPDATE ${config.db.tableName} SET is_synced = 1 WHERE id = ?`,
    [id],
  );
}

/**
 * Get record count for a metric.
 */
export async function getMetricRecordCount(config: AnyConfig): Promise<number> {
  const db = getDatabase();
  const result = await db.execute(
    `SELECT COUNT(*) as count FROM ${config.db.tableName}`,
  );
  const rows = (result.rows ?? []) as Array<{ count: number }>;
  return rows[0]?.count ?? 0;
}

/**
 * Get records filtered by owner UID (for family sharing).
 * NULL ownerUid = current user's own records.
 *
 * Only works for metrics whose schema includes an owner_uid column.
 */
export async function getMetricRecordsByOwner<TRecord>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>,
  ownerUid: string | null,
): Promise<TRecord[]> {
  const db = getDatabase();
  const hasOwnerCol = config.db.columns.some(c => c.name === 'owner_uid');
  if (!hasOwnerCol) {
    return getMetricRecords(config);
  }

  const query = ownerUid === null
    ? `SELECT * FROM ${config.db.tableName} WHERE owner_uid IS NULL ORDER BY timestamp DESC`
    : `SELECT * FROM ${config.db.tableName} WHERE owner_uid = ? ORDER BY timestamp DESC`;

  const result = ownerUid === null
    ? await db.execute(query)
    : await db.execute(query, [ownerUid]);

  const rows = (result.rows ?? []) as AnyRecord[];
  return rows.map(row => config.rowToDomain(row));
}

/**
 * Delete all records by owner UID (called on linked-user revocation).
 */
export async function deleteMetricRecordsByOwner(
  config: AnyConfig,
  ownerUid: string,
): Promise<void> {
  const db = getDatabase();
  const hasOwnerCol = config.db.columns.some(c => c.name === 'owner_uid');
  if (!hasOwnerCol) return;
  await db.execute(
    `DELETE FROM ${config.db.tableName} WHERE owner_uid = ?`,
    [ownerUid],
  );
}


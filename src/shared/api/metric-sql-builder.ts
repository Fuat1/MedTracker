/**
 * SQL Builder for MetricConfig schemas.
 *
 * Isolated from metric-repository.ts so that db.ts can import the builders
 * without creating a circular dependency (db ↔ metric-repository).
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 2
 */

import type { MetricConfig, MetricDBColumnDef } from '../config/metric-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyConfig = MetricConfig<any, any>;

/**
 * Generate CREATE TABLE SQL for a metric.
 *
 * Standard columns always generated:
 *   id TEXT PRIMARY KEY NOT NULL
 *   timestamp INTEGER NOT NULL
 *   created_at INTEGER NOT NULL
 *   updated_at INTEGER NOT NULL
 *   is_synced INTEGER DEFAULT 0
 *
 * Plus all columns from config.db.columns, plus any tableChecks.
 */
export function buildCreateTableSQL(config: AnyConfig): string {
  const { tableName, columns, tableChecks } = config.db;

  const parts: string[] = [
    'id TEXT PRIMARY KEY NOT NULL',
    'timestamp INTEGER NOT NULL',
  ];

  for (const col of columns) {
    parts.push(columnDefToSQL(col));
  }

  parts.push('created_at INTEGER NOT NULL');
  parts.push('updated_at INTEGER NOT NULL');
  parts.push('is_synced INTEGER DEFAULT 0');

  if (tableChecks) {
    for (const check of tableChecks) {
      parts.push(`CHECK(${check})`);
    }
  }

  return `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${parts.join(',\n  ')}\n);`;
}

/**
 * Generate CREATE TABLE SQL for the tags table (if config.db.tagsTableName is set).
 */
export function buildCreateTagsTableSQL(config: AnyConfig): string | null {
  const { tableName, tagsTableName } = config.db;
  if (!tagsTableName) return null;

  return `CREATE TABLE IF NOT EXISTS ${tagsTableName} (
  id         TEXT PRIMARY KEY NOT NULL,
  record_id  TEXT NOT NULL,
  tag        TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (record_id) REFERENCES ${tableName}(id) ON DELETE CASCADE
);`;
}

function columnDefToSQL(col: MetricDBColumnDef): string {
  const parts: string[] = [col.name, col.type];

  if (col.notNull) parts.push('NOT NULL');
  if (col.default !== undefined) parts.push(`DEFAULT ${col.default}`);
  if (col.check) parts.push(`CHECK(${col.check})`);

  return parts.join(' ');
}

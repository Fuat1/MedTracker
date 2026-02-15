import { getDatabase } from './db';
import { generateUUID, getCurrentTimestamp } from '../lib';
import type { LifestyleTag } from '../types/lifestyle-tag';

interface BPTagRow {
  id: string;
  record_id: string;
  tag: string;
  created_at: number;
}

/** Returns all tags for a single record */
export async function getTagsForRecord(recordId: string): Promise<LifestyleTag[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT tag FROM bp_tags WHERE record_id = ? ORDER BY created_at ASC',
    [recordId],
  );
  const rows = (result.rows ?? []) as Array<{ tag: string }>;
  return rows.map(r => r.tag as LifestyleTag);
}

/** Replaces all tags for a record (delete + insert) */
export async function saveTagsForRecord(
  recordId: string,
  tags: LifestyleTag[],
): Promise<void> {
  const db = getDatabase();
  const now = getCurrentTimestamp();

  await db.execute('DELETE FROM bp_tags WHERE record_id = ?', [recordId]);

  for (const tag of tags) {
    await db.execute(
      'INSERT INTO bp_tags (id, record_id, tag, created_at) VALUES (?, ?, ?, ?)',
      [generateUUID(), recordId, tag, now],
    );
  }
}

/** Returns a map of recordId → tag[] for a set of record IDs */
export async function getTagsForRecords(
  recordIds: string[],
): Promise<Record<string, LifestyleTag[]>> {
  if (recordIds.length === 0) return {};
  const db = getDatabase();

  const placeholders = recordIds.map(() => '?').join(',');
  const result = await db.execute(
    `SELECT record_id, tag FROM bp_tags WHERE record_id IN (${placeholders}) ORDER BY created_at ASC`,
    recordIds,
  );

  const rows = (result.rows ?? []) as unknown as BPTagRow[];
  const map: Record<string, LifestyleTag[]> = {};
  for (const row of rows) {
    if (!map[row.record_id]) map[row.record_id] = [];
    map[row.record_id].push(row.tag as LifestyleTag);
  }
  return map;
}

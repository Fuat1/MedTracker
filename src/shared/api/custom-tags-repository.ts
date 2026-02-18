import { getDatabase } from './db';
import { generateUUID, getCurrentTimestamp } from '../lib';
import type { CustomTag } from '../types/custom-tag';
import { makeCustomTagKey } from '../types/custom-tag';

interface CustomTagRow {
  id: string;
  label: string;
  icon: string;
  created_at: number;
}

function rowToCustomTag(row: CustomTagRow): CustomTag {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
    createdAt: row.created_at,
  };
}

/** Returns all user-created custom tags, ordered by creation date */
export async function getCustomTags(): Promise<CustomTag[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT id, label, icon, created_at FROM custom_tags ORDER BY created_at ASC',
  );
  const rows = (result.rows ?? []) as unknown as CustomTagRow[];
  return rows.map(rowToCustomTag);
}

/** Creates a new custom tag and returns it */
export async function createCustomTag(label: string, icon: string): Promise<CustomTag> {
  const db = getDatabase();
  const id = generateUUID();
  const now = getCurrentTimestamp();

  await db.execute(
    'INSERT INTO custom_tags (id, label, icon, created_at) VALUES (?, ?, ?, ?)',
    [id, label.trim(), icon, now],
  );

  return { id, label: label.trim(), icon, createdAt: now };
}

/**
 * Deletes a custom tag and cleans up any bp_tags rows that reference it.
 * Uses "custom:<id>" prefix matching to find related bp_tags entries.
 */
export async function deleteCustomTag(id: string): Promise<void> {
  const db = getDatabase();
  const tagKey = makeCustomTagKey(id);

  // Clean up all readings tagged with this custom tag first
  await db.execute('DELETE FROM bp_tags WHERE tag = ?', [tagKey]);
  await db.execute('DELETE FROM custom_tags WHERE id = ?', [id]);
}

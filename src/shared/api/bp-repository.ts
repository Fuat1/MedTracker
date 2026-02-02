import {v4 as uuidv4} from 'uuid';
import {getDatabase} from './db';
import type {BPRecord, BPRecordInput} from '@entities/blood-pressure';

type RawRow = Record<string, unknown>;

function rowToBPRecord(row: RawRow): BPRecord {
  return {
    id: row.id as string,
    systolic: row.systolic as number,
    diastolic: row.diastolic as number,
    pulse: row.pulse as number | null,
    timestamp: row.timestamp as number,
    timezoneOffset: row.timezone_offset as number,
    location: row.location as BPRecord['location'],
    posture: row.posture as BPRecord['posture'],
    notes: row.notes as string | null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    isSynced: (row.is_synced as number) === 1,
  };
}

export async function insertBPRecord(input: BPRecordInput): Promise<BPRecord> {
  const db = getDatabase();
  const now = Date.now();
  const id = uuidv4();

  const record: BPRecord = {
    id,
    systolic: input.systolic,
    diastolic: input.diastolic,
    pulse: input.pulse ?? null,
    timestamp: input.timestamp ?? now,
    timezoneOffset: new Date().getTimezoneOffset(),
    location: input.location ?? 'left_arm',
    posture: input.posture ?? 'sitting',
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
    isSynced: false,
  };

  await db.execute(
    `INSERT INTO bp_records (
      id, systolic, diastolic, pulse, timestamp, timezone_offset,
      location, posture, notes, created_at, updated_at, is_synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.systolic,
      record.diastolic,
      record.pulse,
      record.timestamp,
      record.timezoneOffset,
      record.location,
      record.posture,
      record.notes,
      record.createdAt,
      record.updatedAt,
      record.isSynced ? 1 : 0,
    ],
  );

  return record;
}

export async function getBPRecords(
  limit = 100,
  offset = 0,
): Promise<BPRecord[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM bp_records ORDER BY timestamp DESC LIMIT ? OFFSET ?',
    [limit, offset],
  );

  const rows = (result.rows as unknown as RawRow[]) ?? [];
  return rows.map(rowToBPRecord);
}

export async function getBPRecordById(id: string): Promise<BPRecord | null> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM bp_records WHERE id = ?', [
    id,
  ]);

  const rows = (result.rows as unknown as RawRow[]) ?? [];
  if (rows.length === 0) {
    return null;
  }

  return rowToBPRecord(rows[0]);
}

export async function updateBPRecord(
  id: string,
  input: Partial<BPRecordInput>,
): Promise<BPRecord | null> {
  const db = getDatabase();
  const existing = await getBPRecordById(id);

  if (!existing) {
    return null;
  }

  const now = Date.now();
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.systolic !== undefined) {
    updates.push('systolic = ?');
    values.push(input.systolic);
  }
  if (input.diastolic !== undefined) {
    updates.push('diastolic = ?');
    values.push(input.diastolic);
  }
  if (input.pulse !== undefined) {
    updates.push('pulse = ?');
    values.push(input.pulse);
  }
  if (input.location !== undefined) {
    updates.push('location = ?');
    values.push(input.location);
  }
  if (input.posture !== undefined) {
    updates.push('posture = ?');
    values.push(input.posture);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    values.push(input.notes);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);

  await db.execute(
    `UPDATE bp_records SET ${updates.join(', ')} WHERE id = ?`,
    values,
  );

  return getBPRecordById(id);
}

export async function deleteBPRecord(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.execute('DELETE FROM bp_records WHERE id = ?', [id]);
  return (result.rowsAffected ?? 0) > 0;
}

export async function getBPRecordsByDateRange(
  startTimestamp: number,
  endTimestamp: number,
): Promise<BPRecord[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM bp_records WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
    [startTimestamp, endTimestamp],
  );

  const rows = (result.rows as unknown as RawRow[]) ?? [];
  return rows.map(rowToBPRecord);
}

import { getDatabase } from './db';
import {
  generateUUID,
  getCurrentTimestamp,
  getTimezoneOffset,
} from '../lib';
import type { MeasurementLocation, MeasurementPosture } from '../config';

// Database row type
export interface BPRecordRow {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  timestamp: number;
  timezone_offset: number;
  location: string;
  posture: string;
  notes: string | null;
  weight: number | null;
  created_at: number;
  updated_at: number;
  is_synced: number;
}

// Domain type
export interface BPRecord {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  timestamp: number;
  timezoneOffset: number;
  location: MeasurementLocation;
  posture: MeasurementPosture;
  notes: string | null;
  weight: number | null;
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
}

// Input type for creating new records
export interface BPRecordInput {
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  timestamp?: number;
  location?: MeasurementLocation;
  posture?: MeasurementPosture;
  notes?: string | null;
  weight?: number | null;
}

// Convert database row to domain object
function rowToRecord(row: BPRecordRow): BPRecord {
  return {
    id: row.id,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    timestamp: row.timestamp,
    timezoneOffset: row.timezone_offset,
    location: row.location as MeasurementLocation,
    posture: row.posture as MeasurementPosture,
    notes: row.notes,
    weight: row.weight ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isSynced: row.is_synced === 1,
  };
}

// Insert a new BP record
export async function insertBPRecord(input: BPRecordInput): Promise<BPRecord> {
  const db = getDatabase();
  const now = getCurrentTimestamp();

  const record: BPRecord = {
    id: generateUUID(),
    systolic: input.systolic,
    diastolic: input.diastolic,
    pulse: input.pulse ?? null,
    timestamp: input.timestamp ?? now,
    timezoneOffset: getTimezoneOffset(),
    location: input.location ?? 'left_arm',
    posture: input.posture ?? 'sitting',
    notes: input.notes ?? null,
    weight: input.weight ?? null,
    createdAt: now,
    updatedAt: now,
    isSynced: false,
  };

  await db.execute(
    `INSERT INTO bp_records (
      id, systolic, diastolic, pulse, timestamp, timezone_offset,
      location, posture, notes, weight, created_at, updated_at, is_synced
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      record.weight,
      record.createdAt,
      record.updatedAt,
      record.isSynced ? 1 : 0,
    ],
  );

  return record;
}

// Get all BP records, ordered by timestamp descending
export async function getBPRecords(limit?: number): Promise<BPRecord[]> {
  const db = getDatabase();

  const query = limit
    ? 'SELECT * FROM bp_records ORDER BY timestamp DESC LIMIT ?'
    : 'SELECT * FROM bp_records ORDER BY timestamp DESC';

  const result = limit
    ? await db.execute(query, [limit])
    : await db.execute(query);

  const rows = (result.rows ?? []) as unknown as BPRecordRow[];
  return rows.map(rowToRecord);
}

// Get a single BP record by ID
export async function getBPRecordById(id: string): Promise<BPRecord | null> {
  const db = getDatabase();

  const result = await db.execute(
    'SELECT * FROM bp_records WHERE id = ?',
    [id],
  );

  const rows = (result.rows ?? []) as unknown as BPRecordRow[];
  return rows.length > 0 ? rowToRecord(rows[0]) : null;
}

// Update a BP record
export async function updateBPRecord(
  id: string,
  input: Partial<BPRecordInput>,
): Promise<BPRecord | null> {
  const db = getDatabase();
  const now = getCurrentTimestamp();

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
  if (input.timestamp !== undefined) {
    updates.push('timestamp = ?');
    values.push(input.timestamp);
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
  if (input.weight !== undefined) {
    updates.push('weight = ?');
    values.push(input.weight);
  }

  if (updates.length === 0) {
    return getBPRecordById(id);
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

// Delete a BP record
export async function deleteBPRecord(id: string): Promise<boolean> {
  const db = getDatabase();

  const result = await db.execute(
    'DELETE FROM bp_records WHERE id = ?',
    [id],
  );

  return (result.rowsAffected ?? 0) > 0;
}

// Get record count
export async function getBPRecordCount(): Promise<number> {
  const db = getDatabase();

  const result = await db.execute('SELECT COUNT(*) as count FROM bp_records');
  const rows = (result.rows ?? []) as Array<{ count: number }>;

  return rows[0]?.count ?? 0;
}

// Get latest record
export async function getLatestBPRecord(): Promise<BPRecord | null> {
  const records = await getBPRecords(1);
  return records[0] ?? null;
}

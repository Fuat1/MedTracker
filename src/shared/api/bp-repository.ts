/**
 * BP Repository
 *
 * Thin delegate layer that preserves the existing public API
 * (`insertBPRecord`, `getBPRecords`, etc.) while delegating all
 * CRUD operations to the generic MetricRepository via bpConfig.
 *
 * The linked-users and upsertLinkedRecord functions stay here
 * because they are app-level concerns, not metric-specific.
 *
 * See: docs/superpowers/specs/2026-04-14-metric-template-refactor.md Phase 2
 */

import { getDatabase } from './db';
import {
  insertMetricRecord,
  getMetricRecords,
  getMetricRecordById,
  getLatestMetricRecord,
  updateMetricRecord,
  deleteMetricRecord,
  getMetricRecordCount,
  getMetricRecordsByOwner,
  deleteMetricRecordsByOwner,
  markMetricRecordSynced,
} from './metric-repository';
import { bpConfig } from '../../entities/blood-pressure/config';
import { getCurrentTimestamp, getTimezoneOffset } from '../lib';
import type { MeasurementLocation, MeasurementPosture } from '../config';

// ─── Types (kept for downstream consumers) ────────────────────────────────────

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
  /** NULL = this user's own record; non-null = linked user's UID */
  owner_uid: string | null;
}

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
  /** NULL = this user's own record; non-null = linked user's UID */
  ownerUid: string | null;
}

export interface BPRecordInput {
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  timestamp?: number;
  location?: MeasurementLocation;
  posture?: MeasurementPosture;
  notes?: string | null;
  weight?: number | null;
  isSynced?: boolean;
  ownerUid?: string | null;
}

// ─── CRUD Delegates ───────────────────────────────────────────────────────────

export async function insertBPRecord(input: BPRecordInput): Promise<BPRecord> {
  return insertMetricRecord<BPRecord>(bpConfig, {
    systolic:         input.systolic,
    diastolic:        input.diastolic,
    pulse:            input.pulse ?? null,
    timestamp:        input.timestamp,
    timezone_offset:  getTimezoneOffset(),
    location:         input.location ?? 'left_arm',
    posture:          input.posture ?? 'sitting',
    notes:            input.notes ?? null,
    weight:           input.weight ?? null,
    isSynced:         input.isSynced ?? false,
    owner_uid:        input.ownerUid ?? null,
  });
}

export async function getBPRecords(limit?: number): Promise<BPRecord[]> {
  return getMetricRecords<BPRecord>(bpConfig, limit);
}

export async function getBPRecordById(id: string): Promise<BPRecord | null> {
  return getMetricRecordById<BPRecord>(bpConfig, id);
}

export async function getLatestBPRecord(): Promise<BPRecord | null> {
  return getLatestMetricRecord<BPRecord>(bpConfig);
}

export async function updateBPRecord(
  id: string,
  input: Partial<BPRecordInput>,
): Promise<BPRecord | null> {
  const updates: Record<string, unknown> = {};

  if (input.systolic !== undefined)   updates.systolic = input.systolic;
  if (input.diastolic !== undefined)  updates.diastolic = input.diastolic;
  if (input.pulse !== undefined)      updates.pulse = input.pulse;
  if (input.timestamp !== undefined)  updates.timestamp = input.timestamp;
  if (input.location !== undefined)   updates.location = input.location;
  if (input.posture !== undefined)    updates.posture = input.posture;
  if (input.notes !== undefined)      updates.notes = input.notes;
  if (input.weight !== undefined)     updates.weight = input.weight;
  if (input.isSynced !== undefined)   updates.is_synced = input.isSynced ? 1 : 0;

  return updateMetricRecord<BPRecord>(bpConfig, id, updates);
}

export async function deleteBPRecord(id: string): Promise<boolean> {
  return deleteMetricRecord(bpConfig, id);
}

export async function getBPRecordCount(): Promise<number> {
  return getMetricRecordCount(bpConfig);
}

export async function getBPRecordsByOwner(ownerUid: string | null): Promise<BPRecord[]> {
  return getMetricRecordsByOwner<BPRecord>(bpConfig, ownerUid);
}

export async function deleteBPRecordsByOwner(ownerUid: string): Promise<void> {
  return deleteMetricRecordsByOwner(bpConfig, ownerUid);
}

export async function markRecordSynced(id: string): Promise<void> {
  return markMetricRecordSynced(bpConfig, id);
}

// ─── Linked Users ────────────────────────────────────────────────────────────
// These are app-level concerns, not metric-specific, so they remain here.

export interface LinkedUserRow {
  uid: string;
  display_name: string;
  last_synced_at: number;
  relationship_id: string;
  created_at: number;
}

export async function upsertLinkedUser(
  uid: string,
  displayName: string,
  relationshipId: string,
): Promise<void> {
  const db = getDatabase();
  const now = getCurrentTimestamp();
  await db.execute(
    `INSERT INTO linked_users (uid, display_name, last_synced_at, relationship_id, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(uid) DO UPDATE SET display_name = ?, relationship_id = ?`,
    [uid, displayName, 0, relationshipId, now, displayName, relationshipId],
  );
}

export async function getLinkedUsers(): Promise<LinkedUserRow[]> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM linked_users ORDER BY display_name');
  return (result.rows ?? []) as unknown as LinkedUserRow[];
}

export async function deleteLinkedUser(uid: string): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM linked_users WHERE uid = ?', [uid]);
}

export async function getLinkedUserDisplayName(uid: string): Promise<string | null> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT display_name FROM linked_users WHERE uid = ?',
    [uid],
  );
  const rows = (result.rows ?? []) as unknown as Array<{ display_name: string }>;
  return rows[0]?.display_name ?? null;
}

// Upsert a linked user's record (used by download sync)
export async function upsertLinkedRecord(
  firestoreId: string,
  input: BPRecordInput & { ownerUid: string; updatedAt: number },
): Promise<void> {
  const db = getDatabase();
  const existing = await getBPRecordById(firestoreId);
  if (existing) {
    await db.execute(
      `UPDATE bp_records SET
        systolic = ?, diastolic = ?, pulse = ?, weight = ?, notes = ?,
        location = ?, posture = ?, timestamp = ?, updated_at = ?, is_synced = 1
       WHERE id = ?`,
      [
        input.systolic, input.diastolic, input.pulse ?? null,
        input.weight ?? null, input.notes ?? null,
        input.location ?? 'left_arm', input.posture ?? 'sitting',
        input.timestamp ?? 0, input.updatedAt, firestoreId,
      ],
    );
  } else {
    const now = Math.floor(Date.now() / 1000);
    await db.execute(
      `INSERT INTO bp_records (
        id, systolic, diastolic, pulse, timestamp, timezone_offset,
        location, posture, notes, weight, created_at, updated_at, is_synced, owner_uid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        firestoreId,
        input.systolic, input.diastolic, input.pulse ?? null,
        input.timestamp ?? now, 0,
        input.location ?? 'left_arm', input.posture ?? 'sitting',
        input.notes ?? null, input.weight ?? null,
        now, input.updatedAt, input.ownerUid,
      ],
    );
  }
}

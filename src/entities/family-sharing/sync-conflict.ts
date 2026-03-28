/**
 * Pure functions for Firestore ↔ local SQLite conflict resolution.
 *
 * Rule: updatedAt (Firestore Timestamp as Unix seconds) wins — newer overwrites.
 * Soft deletes propagate when Firestore record has `deleted: true`.
 */

export interface LocalRecordSnapshot {
  id: string;
  systolic: number;
  diastolic: number;
  /** Unix seconds */
  updatedAt: number;
}

export interface FirestoreSnapshot {
  /** Unix seconds */
  updatedAt: number;
  deleted: boolean;
}

export type ConflictAction = 'insert' | 'overwrite' | 'delete' | 'skip';

export interface ConflictResolution {
  action: ConflictAction;
}

/**
 * Returns true if the Firestore record should overwrite the local record.
 * Equality = no-op (already in sync).
 */
export function shouldOverwriteLocal(
  localUpdatedAt: number,
  firestoreSnapshot: FirestoreSnapshot,
): boolean {
  return firestoreSnapshot.updatedAt > localUpdatedAt;
}

/**
 * Determine the sync action for a given (local, firestore) pair.
 *
 * - local = null → Firestore has a record we don't have locally
 * - firestoreSnapshot.deleted = true + newer → delete local
 * - firestoreSnapshot newer + not deleted → overwrite local
 * - local is newer → skip (local wins)
 */
export function resolveConflict(
  local: LocalRecordSnapshot | null,
  firestoreSnapshot: FirestoreSnapshot,
): ConflictResolution {
  if (local === null) {
    // No local record
    if (firestoreSnapshot.deleted) {
      return { action: 'skip' }; // Nothing to delete locally
    }
    return { action: 'insert' };
  }

  const firestoreIsNewer = firestoreSnapshot.updatedAt > local.updatedAt;

  if (!firestoreIsNewer) {
    return { action: 'skip' }; // Local is same age or newer — trust local
  }

  if (firestoreSnapshot.deleted) {
    return { action: 'delete' };
  }

  return { action: 'overwrite' };
}

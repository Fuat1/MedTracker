/**
 * Tests for sync conflict resolution logic.
 *
 * Rule: Firestore `updatedAt` timestamp wins — newer record overwrites local.
 * Soft deletes propagate: if Firestore record has deleted=true, the local record is removed.
 */

import {
  resolveConflict,
  shouldOverwriteLocal,
  type LocalRecordSnapshot,
  type FirestoreSnapshot,
} from '../sync-conflict';

describe('conflict resolution: updatedAt wins', () => {
  const base: LocalRecordSnapshot = {
    id: 'rec_001',
    systolic: 120,
    diastolic: 80,
    updatedAt: 1000,
  };

  it('overwrites local when Firestore is newer', () => {
    const firestore: FirestoreSnapshot = { updatedAt: 2000, deleted: false };
    expect(shouldOverwriteLocal(base.updatedAt, firestore)).toBe(true);
  });

  it('keeps local when it is newer than Firestore', () => {
    const firestore: FirestoreSnapshot = { updatedAt: 500, deleted: false };
    expect(shouldOverwriteLocal(base.updatedAt, firestore)).toBe(false);
  });

  it('keeps local on equal timestamps (no-op — already in sync)', () => {
    const firestore: FirestoreSnapshot = { updatedAt: 1000, deleted: false };
    expect(shouldOverwriteLocal(base.updatedAt, firestore)).toBe(false);
  });
});

describe('conflict resolution: soft delete propagation', () => {
  it('resolveConflict returns DELETE action when Firestore record is deleted', () => {
    const local: LocalRecordSnapshot = { id: 'rec_del', systolic: 130, diastolic: 85, updatedAt: 1000 };
    const firestore: FirestoreSnapshot = { updatedAt: 2000, deleted: true };
    const result = resolveConflict(local, firestore);
    expect(result.action).toBe('delete');
  });

  it('resolveConflict returns OVERWRITE action when Firestore is newer and not deleted', () => {
    const local: LocalRecordSnapshot = { id: 'rec_upd', systolic: 120, diastolic: 80, updatedAt: 1000 };
    const firestore: FirestoreSnapshot = { updatedAt: 2000, deleted: false };
    const result = resolveConflict(local, firestore);
    expect(result.action).toBe('overwrite');
  });

  it('resolveConflict returns SKIP action when local is newer', () => {
    const local: LocalRecordSnapshot = { id: 'rec_new', systolic: 125, diastolic: 82, updatedAt: 3000 };
    const firestore: FirestoreSnapshot = { updatedAt: 1000, deleted: false };
    const result = resolveConflict(local, firestore);
    expect(result.action).toBe('skip');
  });

  it('resolveConflict returns SKIP on deleted remote when local is newer', () => {
    // If local is newer, we trust local — don't delete even if Firestore says deleted
    // (could happen if a deletion was synced before a local edit)
    const local: LocalRecordSnapshot = { id: 'rec_conflict', systolic: 120, diastolic: 80, updatedAt: 5000 };
    const firestore: FirestoreSnapshot = { updatedAt: 1000, deleted: true };
    const result = resolveConflict(local, firestore);
    expect(result.action).toBe('skip');
  });
});

describe('conflict resolution: new record from Firestore', () => {
  it('resolveConflict returns INSERT when no local record exists', () => {
    const firestore: FirestoreSnapshot = { updatedAt: 2000, deleted: false };
    const result = resolveConflict(null, firestore);
    expect(result.action).toBe('insert');
  });

  it('resolveConflict returns SKIP for deleted record that does not exist locally', () => {
    const firestore: FirestoreSnapshot = { updatedAt: 2000, deleted: true };
    const result = resolveConflict(null, firestore);
    expect(result.action).toBe('skip');
  });
});

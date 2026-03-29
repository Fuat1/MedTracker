/**
 * useDownloadRecords — downloads linked users' BP records from Firestore.
 *
 * Triggered on:
 *   - Sign-in
 *   - App becomes active (AppState change)
 *
 * Per linked user:
 *   1. Fetch Firestore records where updatedAt > lastSyncedAt
 *   2. Decrypt with the relationship read key from Keychain
 *   3. Resolve conflicts (resolveConflict from entities/family-sharing)
 *   4. Upsert to local SQLite with owner_uid = linkedUserUid
 *   5. Update lastSyncedAt in sync store
 *
 * Also handles soft deletes and revocation cleanup.
 */

import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { getFirebaseUser } from '@/shared/lib/safe-firebase-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRelationships } from '@/entities/family-sharing';
import { loadReadKey, loadMasterKey, storeReadKey, removeReadKey } from '@/shared/lib/keychain-keys';
import {
  decryptBPRecord,
  resolveConflict,
  deriveReadKey,
  type FirestoreBPRecord,
} from '@/entities/family-sharing';
import {
  upsertLinkedRecord,
  deleteBPRecord,
  deleteBPRecordsByOwner,
  getBPRecordById,
} from '@/shared/api/bp-repository';
import { FIRESTORE_COLLECTIONS, RELATIONSHIP_STATUS } from '@/shared/config';
import { useSyncStore } from './sync-store';
import { BP_RECORDS_QUERY_KEY } from '@/shared/config';

export function useDownloadRecords() {
  const { relationships } = useRelationships();
  const queryClient = useQueryClient();
  const { lastSyncedAt, setLastSyncedAt } = useSyncStore();

  const downloadForUser = useCallback(
    async (linkedUid: string, _relationshipId: string): Promise<void> => {
      let readKey = await loadReadKey(linkedUid);
      if (!readKey) {
        // First download — derive and store read key via HKDF
        const masterKey = await loadMasterKey();
        if (!masterKey) return;
        readKey = await deriveReadKey(masterKey, linkedUid);
        await storeReadKey(linkedUid, readKey);
      }

      const since = lastSyncedAt[linkedUid] ?? 0;

      const snapshot = await firestore()
        .collection(FIRESTORE_COLLECTIONS.records(linkedUid))
        .where('updatedAt', '>', since)
        .get();

      if (snapshot.empty) {
        return;
      }

      let didChange = false;

      for (const doc of snapshot.docs) {
        const firestoreRecord = doc.data() as FirestoreBPRecord;

        const localRecord = await getBPRecordById(doc.id);
        const localSnapshot = localRecord
          ? { id: localRecord.id, systolic: localRecord.systolic, diastolic: localRecord.diastolic, updatedAt: localRecord.updatedAt }
          : null;

        const resolution = resolveConflict(localSnapshot, {
          updatedAt: firestoreRecord.updatedAt,
          deleted: firestoreRecord.deleted,
        });

        if (resolution.action === 'skip') {
          continue;
        }

        if (resolution.action === 'delete') {
          await deleteBPRecord(doc.id);
          didChange = true;
          continue;
        }

        const decrypted = await decryptBPRecord(firestoreRecord, readKey);
        if (!decrypted) {
          continue; // Decryption failed — skip
        }

        if (resolution.action === 'insert' || resolution.action === 'overwrite') {
          await upsertLinkedRecord(doc.id, {
            systolic: decrypted.systolic,
            diastolic: decrypted.diastolic,
            pulse: decrypted.pulse,
            weight: decrypted.weight,
            notes: decrypted.notes,
            location: decrypted.location as never,
            posture: decrypted.posture as never,
            timestamp: decrypted.timestamp,
            ownerUid: linkedUid,
            updatedAt: decrypted.updatedAt,
          });
          didChange = true;
        }
      }

      const latestUpdatedAt = Math.max(
        ...snapshot.docs.map((d) => (d.data() as FirestoreBPRecord).updatedAt),
      );
      setLastSyncedAt(linkedUid, latestUpdatedAt);

      if (didChange) {
        queryClient.invalidateQueries({ queryKey: BP_RECORDS_QUERY_KEY });
      }
    },
    [lastSyncedAt, setLastSyncedAt, queryClient],
  );

  const downloadAll = useCallback(async (): Promise<void> => {
    const currentUid = getFirebaseUser()?.uid;
    if (!currentUid) {
      return;
    }

    const active = relationships.filter((r) => r.status === RELATIONSHIP_STATUS.active);
    await Promise.allSettled(
      active.map((r) => {
        // Pick the OTHER person's UID
        const linkedUid = r.initiatorUid === currentUid ? r.recipientUid! : r.initiatorUid;
        return downloadForUser(linkedUid, r.id);
      }),
    );
  }, [relationships, downloadForUser]);

  // Dedicated Firestore listener for revocation — useRelationships() filters these out
  useEffect(() => {
    const currentUid = getFirebaseUser()?.uid;
    if (!currentUid) {
      return;
    }

    const unsubInitiator = firestore()
      .collection(FIRESTORE_COLLECTIONS.relationships)
      .where('initiatorUid', '==', currentUid)
      .where('status', '==', RELATIONSHIP_STATUS.revoked)
      .onSnapshot((snapshot) => {
        for (const doc of snapshot.docs) {
          const rel = doc.data() as { recipientUid: string | null };
          if (rel.recipientUid) {
            void deleteBPRecordsByOwner(rel.recipientUid);
            void removeReadKey(rel.recipientUid);
          }
        }
      });

    const unsubRecipient = firestore()
      .collection(FIRESTORE_COLLECTIONS.relationships)
      .where('recipientUid', '==', currentUid)
      .where('status', '==', RELATIONSHIP_STATUS.revoked)
      .onSnapshot((snapshot) => {
        for (const doc of snapshot.docs) {
          const rel = doc.data() as { initiatorUid: string };
          void deleteBPRecordsByOwner(rel.initiatorUid);
          void removeReadKey(rel.initiatorUid);
        }
      });

    return () => {
      unsubInitiator();
      unsubRecipient();
    };
  }, []);

  // Trigger download on app foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void downloadAll();
      }
    });
    return () => subscription.remove();
  }, [downloadAll]);

  return { downloadAll, downloadForUser };
}

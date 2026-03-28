/**
 * useUploadRecord — fire-and-forget sync: local BP record → Firestore.
 *
 * Called from useRecordBP / useEditBP onSuccess. Never blocks BP save.
 * On failure, adds to retry queue for background retry.
 */

import { useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { getBPRecordById, markRecordSynced } from '@/shared/api/bp-repository';
import { loadMasterKey } from '@/features/auth';
import { encryptBPRecord } from '@/entities/family-sharing';
import { FIRESTORE_COLLECTIONS } from '@/shared/config';
import { useSyncStore } from './sync-store';
import { useRelationshipForCurrentUser } from './use-relationship-for-current-user';

export function useUploadRecord() {
  const addToRetryQueue = useSyncStore((s) => s.addToRetryQueue);
  const removeFromRetryQueue = useSyncStore((s) => s.removeFromRetryQueue);
  const { getSharingConfig } = useRelationshipForCurrentUser();

  const uploadRecord = useCallback(
    async (recordId: string): Promise<void> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return; // Not signed in — no sync
      }

      try {
        const record = await getBPRecordById(recordId);
        if (!record) {
          return;
        }

        const masterKey = await loadMasterKey();
        if (!masterKey) {
          return; // No master key — skip silently
        }

        const sharingConfig = getSharingConfig();
        const encrypted = await encryptBPRecord(record, masterKey, sharingConfig);

        await firestore()
          .collection(FIRESTORE_COLLECTIONS.records(currentUser.uid))
          .doc(recordId)
          .set(encrypted);

        await markRecordSynced(recordId);
        removeFromRetryQueue(recordId);
      } catch {
        addToRetryQueue({ recordId, ownerUid: auth().currentUser?.uid ?? '' });
      }
    },
    [addToRetryQueue, removeFromRetryQueue, getSharingConfig],
  );

  return { uploadRecord };
}

/** Retry all items in the upload queue. Called on foreground transition. */
export function useRetryUploadQueue() {
  const retryQueue = useSyncStore((s) => s.retryQueue);
  const incrementRetryCount = useSyncStore((s) => s.incrementRetryCount);
  const removeFromRetryQueue = useSyncStore((s) => s.removeFromRetryQueue);
  const { getSharingConfig } = useRelationshipForCurrentUser();

  const retryAll = useCallback(async (): Promise<void> => {
    const currentUser = auth().currentUser;
    if (!currentUser || retryQueue.length === 0) {
      return;
    }

    const masterKey = await loadMasterKey();
    if (!masterKey) {
      return;
    }

    const sharingConfig = getSharingConfig();

    for (const item of retryQueue) {
      try {
        const record = await getBPRecordById(item.recordId);
        if (!record) {
          removeFromRetryQueue(item.recordId);
          continue;
        }

        const encrypted = await encryptBPRecord(record, masterKey, sharingConfig);
        await firestore()
          .collection(FIRESTORE_COLLECTIONS.records(currentUser.uid))
          .doc(item.recordId)
          .set(encrypted);

        await markRecordSynced(item.recordId);
        removeFromRetryQueue(item.recordId);
      } catch {
        incrementRetryCount(item.recordId);
      }
    }
  }, [retryQueue, incrementRetryCount, removeFromRetryQueue, getSharingConfig]);

  return { retryAll };
}

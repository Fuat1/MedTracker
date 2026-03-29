/**
 * Utility hook that provides the sharing config for the current user.
 *
 * Reads the active relationships from Firestore to determine what the
 * current user has agreed to share with linked people.
 *
 * For upload purposes, we use the most permissive config (if ANY relationship
 * shares weight, we encrypt weight). This ensures we don't have to re-upload
 * per-relationship.
 */

import { useCallback } from 'react';
import { useRelationships } from '@/entities/family-sharing';
import { type SharingConfig, DEFAULT_SHARING_CONFIG } from '@/entities/family-sharing';
import { getFirebaseUser } from '@/shared/lib/safe-firebase-auth';

export function useRelationshipForCurrentUser() {
  const { relationships } = useRelationships();
  const currentUserUid = getFirebaseUser()?.uid;

  const getSharingConfig = useCallback((): SharingConfig => {
    const active = relationships.filter((r) => r.status === 'active');
    if (active.length === 0) {
      return { ...DEFAULT_SHARING_CONFIG };
    }

    // Merge: if any active relationship shares a field, include it in the upload
    return {
      shareWeight: active.some((r) =>
        r.initiatorUid === currentUserUid
          ? r.initiatorSharing.shareWeight
          : r.recipientSharing.shareWeight,
      ),
      shareNotes: active.some((r) =>
        r.initiatorUid === currentUserUid
          ? r.initiatorSharing.shareNotes
          : r.recipientSharing.shareNotes,
      ),
      shareMedications: active.some((r) =>
        r.initiatorUid === currentUserUid
          ? r.initiatorSharing.shareMedications
          : r.recipientSharing.shareMedications,
      ),
      shareTags: active.some((r) =>
        r.initiatorUid === currentUserUid
          ? r.initiatorSharing.shareTags
          : r.recipientSharing.shareTags,
      ),
      crisisAlertsEnabled: active.some((r) =>
        r.initiatorUid === currentUserUid
          ? r.initiatorSharing.crisisAlertsEnabled
          : r.recipientSharing.crisisAlertsEnabled,
      ),
    };
  }, [relationships, currentUserUid]);

  return { getSharingConfig };
}

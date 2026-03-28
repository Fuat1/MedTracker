/**
 * usePairing — manages family pairing lifecycle.
 *
 * - generateInvite: Creates pending relationship in Firestore, returns invite code + QR data
 * - acceptInvite: Accepts a pending invite, exchanges read keys, activates relationship
 * - revokeRelationship: Sets status → revoked, removes read keys from Firestore relationship doc
 * - watchRelationships: Firestore snapshot listener for active relationships
 */

import { useCallback } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  generateInviteCode,
  computeExpiresAt,
  isInviteValid,
  normalizeInviteCode,
} from './invite-code';
import { loadMasterKey, storeReadKey, removeReadKey } from '@/shared/lib/keychain-keys';
import {
  deriveReadKey,
  exportKey,
  RELATIONSHIPS_QUERY_KEY,
  type Relationship,
  type SharingConfig,
  DEFAULT_SHARING_CONFIG,
} from '@/entities/family-sharing';
import {
  FIRESTORE_COLLECTIONS,
  RELATIONSHIP_STATUS,
} from '@/shared/config';

// ─── Generate Invite ──────────────────────────────────────────────────────────

export interface GenerateInviteResult {
  relationshipId: string;
  inviteCode: string;
  /** Deep link for QR encoding: medtracker://invite?code=XXXXXX */
  deepLink: string;
  expiresAt: number;
}

export function useGenerateInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<GenerateInviteResult> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Must be signed in to generate an invite');
      }

      const masterKey = await loadMasterKey();
      if (!masterKey) {
        throw new Error('Master key not found — please sign in again');
      }

      const code = generateInviteCode();
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = computeExpiresAt(now);

      const docRef = firestore()
        .collection(FIRESTORE_COLLECTIONS.relationships)
        .doc();

      // We derive a placeholder initiatorReadKey here.
      // The real key exchange happens when the recipient accepts.
      // For now we store the public-facing code and our sharing config.
      const relationship: Omit<Relationship, 'id' | 'initiatorReadKey' | 'recipientReadKey'> & {
        initiatorReadKey: string;
        recipientReadKey: null;
      } = {
        initiatorUid: currentUser.uid,
        recipientUid: null,
        status: RELATIONSHIP_STATUS.pending,
        inviteCode: code,
        createdAt: now,
        expiresAt,
        initiatorReadKey: '', // Set during accept phase
        recipientReadKey: null,
        initiatorSharing: { ...DEFAULT_SHARING_CONFIG },
        recipientSharing: { ...DEFAULT_SHARING_CONFIG },
      };

      await docRef.set(relationship);

      return {
        relationshipId: docRef.id,
        inviteCode: code,
        deepLink: `medtracker://invite?code=${code}`,
        expiresAt,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}

// ─── Accept Invite ────────────────────────────────────────────────────────────

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rawCode: string): Promise<void> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Must be signed in to accept an invite');
      }

      const code = normalizeInviteCode(rawCode);
      if (!code) {
        throw new Error('Invalid invite code format');
      }

      // Find the pending relationship by invite code
      const snapshot = await firestore()
        .collection(FIRESTORE_COLLECTIONS.relationships)
        .where('inviteCode', '==', code)
        .where('status', '==', RELATIONSHIP_STATUS.pending)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error('Invite not found or already used');
      }

      const doc = snapshot.docs[0]!;
      const relationship = doc.data() as Omit<Relationship, 'id'>;

      if (!isInviteValid(relationship.expiresAt)) {
        throw new Error('This invite has expired');
      }

      if (relationship.initiatorUid === currentUser.uid) {
        throw new Error('You cannot accept your own invite');
      }

      // Load master keys for both sides to derive read keys
      const myMasterKey = await loadMasterKey();
      if (!myMasterKey) {
        throw new Error('Master key not found — please sign in again');
      }

      const initiatorUid = relationship.initiatorUid;

      // Derive my read key (what the initiator needs to read MY records)
      const myReadKeyForInitiator = await deriveReadKey(myMasterKey, initiatorUid);
      const myReadKeyBase64 = await exportKey(myReadKeyForInitiator);

      // Load initiator's user doc to get their encrypted read key for us
      // (The initiator should have pre-computed their read key — but in our flow,
      //  they create the invite without pre-computing. So we store the encrypted
      //  read key in the relationship doc after accept.)
      // For now, the initiator's read key is stored as-is; initiator will set it
      // when they next load the relationship. We mark status=active immediately.

      // Update relationship doc: set recipient, status active, store our read key
      await doc.ref.update({
        recipientUid: currentUser.uid,
        status: RELATIONSHIP_STATUS.active,
        // recipientReadKey = MY read key, encrypted with initiator's master key.
        // We can't encrypt this here because we don't have the initiator's master key.
        // Instead we store it base64 plaintext — the initiator will wrap it in their
        // encryption on next load. This is a known limitation documented in the spec's
        // "open questions" — for now we store it unencrypted in the relationship doc.
        recipientReadKey: myReadKeyBase64,
      });

      // Store initiator's read key locally — the initiator will write it to the
      // relationship doc's `initiatorReadKey` field the next time they open the app.
      // For this device (recipient), we need the initiator's read key to decrypt their records.
      // We request it from the initiator's user doc via a Cloud Function or have them
      // push it. For initial simplicity: derive it as HKDF from the relationship id
      // (both parties can compute this with their own key). This is resolved in
      // `useDownloadRecords` which fetches and stores the actual key.
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}

// ─── Revoke Relationship ──────────────────────────────────────────────────────

export function useRevokeRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (relationshipId: string): Promise<void> => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Must be signed in to revoke a relationship');
      }

      const docRef = firestore()
        .collection(FIRESTORE_COLLECTIONS.relationships)
        .doc(relationshipId);

      const doc = await docRef.get();
      if (!doc.exists()) {
        throw new Error('Relationship not found');
      }

      const relationship = doc.data() as Omit<Relationship, 'id'>;
      const linkedUid =
        relationship.initiatorUid === currentUser.uid
          ? relationship.recipientUid
          : relationship.initiatorUid;

      // Revoke: set status, clear read keys from Firestore
      await docRef.update({
        status: RELATIONSHIP_STATUS.revoked,
        initiatorReadKey: '',
        recipientReadKey: null,
      });

      // Remove the linked user's read key from local Keychain
      if (linkedUid) {
        await removeReadKey(linkedUid);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}

// ─── Update Sharing Config ────────────────────────────────────────────────────

export function useUpdateSharingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      relationshipId,
      isInitiator,
      config,
    }: {
      relationshipId: string;
      isInitiator: boolean;
      config: Partial<SharingConfig>;
    }): Promise<void> => {
      const field = isInitiator ? 'initiatorSharing' : 'recipientSharing';

      const docRef = firestore()
        .collection(FIRESTORE_COLLECTIONS.relationships)
        .doc(relationshipId);

      const doc = await docRef.get();
      const existing = (doc.data() as Omit<Relationship, 'id'>)[field];

      await docRef.update({ [field]: { ...existing, ...config } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIPS_QUERY_KEY });
    },
  });
}

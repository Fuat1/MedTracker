/**
 * useRelationships — read-only Firestore snapshot listener for relationships.
 *
 * Lives in entities/ because it's a pure read hook with no mutations.
 * Mutation hooks (useGenerateInvite, useAcceptInvite, etc.) stay in features/pairing.
 */

import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import type { Relationship } from './types';
import { FIRESTORE_COLLECTIONS, RELATIONSHIP_STATUS } from '@/shared/config';

export const RELATIONSHIPS_QUERY_KEY = ['relationships'] as const;

export interface UseRelationshipsResult {
  relationships: Relationship[];
  isLoading: boolean;
}

export function useRelationships(): UseRelationshipsResult {
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = auth().currentUser;

  useEffect(() => {
    if (!currentUser) {
      setRelationships([]);
      setIsLoading(false);
      return;
    }

    const uid = currentUser.uid;

    // Listen to relationships where this user is initiator or recipient
    const unsubInitiator = firestore()
      .collection(FIRESTORE_COLLECTIONS.relationships)
      .where('initiatorUid', '==', uid)
      .where('status', 'in', [RELATIONSHIP_STATUS.pending, RELATIONSHIP_STATUS.active])
      .onSnapshot((snapshot) => {
        const initiatorRels = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Relationship, 'id'>),
        }));
        setRelationships((prev) => {
          const recipientRels = prev.filter((r) => r.recipientUid === uid);
          return [...initiatorRels, ...recipientRels];
        });
        setIsLoading(false);
      });

    const unsubRecipient = firestore()
      .collection(FIRESTORE_COLLECTIONS.relationships)
      .where('recipientUid', '==', uid)
      .where('status', '==', RELATIONSHIP_STATUS.active)
      .onSnapshot((snapshot) => {
        const recipientRels = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Relationship, 'id'>),
        }));
        setRelationships((prev) => {
          const initiatorRels = prev.filter((r) => r.initiatorUid === uid);
          return [...initiatorRels, ...recipientRels];
        });
        setIsLoading(false);
      });

    return () => {
      unsubInitiator();
      unsubRecipient();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

  return { relationships, isLoading };
}

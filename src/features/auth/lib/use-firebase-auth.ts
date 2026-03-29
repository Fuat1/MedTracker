/// <reference lib="dom" />
/**
 * Firebase Auth hook — wraps Google Sign-In and Email/Password.
 *
 * Manages:
 *   - Auth state listener
 *   - Google Sign-In flow
 *   - Email/Password sign-up and sign-in
 *   - Sign-out
 *   - Account deletion
 *   - Master key provisioning (generate on first sign-in, recover on subsequent sign-ins)
 *
 * NOTE: Requires Firebase packages installed and native config complete.
 * See docs/firebase-native-config.md.
 */

import { useEffect, useState, useCallback } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import DeviceInfo from 'react-native-device-info';
import {
  generateMasterKey,
  encryptMasterKeyForBackup,
  decryptMasterKeyFromBackup,
} from '@/entities/family-sharing';
import {
  GOOGLE_SIGN_IN_WEB_CLIENT_ID,
  FIRESTORE_COLLECTIONS,
  RELATIONSHIP_STATUS,
} from '@/shared/config';
import { loadMasterKey, storeMasterKey, removeMasterKey } from '@/shared/lib/keychain-keys';

export interface FirebaseUser {
  uid: string;
  displayName: string | null;
  email: string | null;
}

export interface UseFirebaseAuthResult {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export function useFirebaseAuth(): UseFirebaseAuthResult {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configure Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({ webClientId: GOOGLE_SIGN_IN_WEB_CLIENT_ID });
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
        });
        await ensureMasterKey(firebaseUser.uid);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID token');
      }
      const credential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(credential);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google Sign-In failed');
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setError(null);
    if (!appleAuth.isSupported) {
      return;
    }
    try {
      const appleAuthResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      const credentialState = await appleAuth.getCredentialStateForUser(
        appleAuthResponse.user,
      );
      if (credentialState !== appleAuth.State.AUTHORIZED) {
        throw new Error('Apple credential not authorized');
      }

      const { identityToken, nonce, fullName } = appleAuthResponse;
      if (!identityToken) {
        throw new Error('Apple Sign-In did not return an identity token');
      }

      const credential = auth.AppleAuthProvider.credential(identityToken, nonce);
      const { user: firebaseUser } = await auth().signInWithCredential(credential);

      // Apple only sends name on first sign-in — capture it if present
      const givenName = fullName?.givenName ?? '';
      const familyName = fullName?.familyName ?? '';
      const displayName = [givenName, familyName].filter(Boolean).join(' ');
      if (displayName && !firebaseUser.displayName) {
        await firebaseUser.updateProfile({ displayName });
      }
    } catch (e: unknown) {
      // Silently ignore user cancellation
      if (
        e instanceof Error &&
        'code' in e &&
        (e as { code: string }).code === '1000'
      ) {
        return;
      }
      setError(e instanceof Error ? e.message : 'Apple Sign-In failed');
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName: string) => {
      setError(null);
      try {
        const { user: newUser } = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );
        await newUser.updateProfile({ displayName });
        await newUser.sendEmailVerification();
        // Master key will be created by ensureMasterKey via onAuthStateChanged
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-up failed');
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await GoogleSignin.signOut().catch(() => {}); // No-op if not signed in with Google
      await auth().signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-out failed');
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setError(null);
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return;
    }
    try {
      const uid = currentUser.uid;

      // 1. Revoke all active relationships
      const [initiatorSnap, recipientSnap] = await Promise.all([
        firestore()
          .collection(FIRESTORE_COLLECTIONS.relationships)
          .where('initiatorUid', '==', uid)
          .where('status', 'in', [RELATIONSHIP_STATUS.pending, RELATIONSHIP_STATUS.active])
          .get(),
        firestore()
          .collection(FIRESTORE_COLLECTIONS.relationships)
          .where('recipientUid', '==', uid)
          .where('status', '==', RELATIONSHIP_STATUS.active)
          .get(),
      ]);

      const batch = firestore().batch();
      for (const doc of [...initiatorSnap.docs, ...recipientSnap.docs]) {
        batch.update(doc.ref, {
          status: RELATIONSHIP_STATUS.revoked,
          initiatorReadKey: '',
          recipientReadKey: null,
        });
      }
      await batch.commit();

      // 2. Delete all BP records in Firestore sub-collection
      const recordsSnap = await firestore()
        .collection(FIRESTORE_COLLECTIONS.records(uid))
        .get();
      const recordBatch = firestore().batch();
      for (const doc of recordsSnap.docs) {
        recordBatch.delete(doc.ref);
      }
      if (recordsSnap.docs.length > 0) {
        await recordBatch.commit();
      }

      // 3. Delete Firestore user document
      await firestore().collection(FIRESTORE_COLLECTIONS.users).doc(uid).delete();

      // 4. Remove master key from Keychain
      await removeMasterKey();

      // 5. Delete Firebase Auth account
      await currentUser.delete();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Account deletion failed');
    }
  }, []);

  return { user, isLoading, error, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, signOut, deleteAccount };
}

// ─── Master Key Management ────────────────────────────────────────────────────

/**
 * Ensure the user has a master key in Keychain.
 * - First sign-in: generate a new key, back it up to Firestore.
 * - Subsequent sign-ins: load from Keychain if present, or recover from Firestore backup.
 */
async function ensureMasterKey(uid: string): Promise<void> {
  // Try loading from Keychain first
  const existing = await loadMasterKey();
  if (existing) {
    return; // Already have a key in Keychain
  }

  const deviceId = await DeviceInfo.getUniqueId();
  const userDoc = await firestore()
    .collection(FIRESTORE_COLLECTIONS.users)
    .doc(uid)
    .get();

  let masterKey: CryptoKey;

  if (userDoc.exists() && userDoc.data()?.encryptedMasterKey) {
    // Recover from Firestore backup
    try {
      masterKey = await decryptMasterKeyFromBackup(
        userDoc.data()!.encryptedMasterKey,
        uid,
        deviceId,
      );
    } catch {
      // Backup decryption failed — generate a new key (fresh device / different device ID)
      masterKey = await generateMasterKey();
    }
  } else {
    // First sign-in — generate new master key
    masterKey = await generateMasterKey();
  }

  // Store in Keychain
  await storeMasterKey(uid, masterKey);

  // Backup to Firestore (also creates/updates user document)
  const encryptedMasterKey = await encryptMasterKeyForBackup(masterKey, uid, deviceId);
  const fcmToken = await getFcmToken();

  await firestore()
    .collection(FIRESTORE_COLLECTIONS.users)
    .doc(uid)
    .set(
      {
        displayName: auth().currentUser?.displayName ?? '',
        email: auth().currentUser?.email ?? null,
        encryptedMasterKey,
        fcmToken,
        createdAt: firestore.FieldValue.serverTimestamp(),
        lastActiveAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}

async function getFcmToken(): Promise<string> {
  try {
    const messaging = (await import('@react-native-firebase/messaging')).default;
    return (await messaging().getToken()) ?? '';
  } catch {
    return '';
  }
}


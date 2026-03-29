/**
 * safe-firebase-auth — guards Firebase Auth calls for offline-first usage.
 *
 * The app MUST be fully usable without Firebase. These helpers wrap auth()
 * in try-catch so that calling code never crashes when the Firebase app
 * hasn't been initialized or when the user isn't signed in.
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

/**
 * Safely get the current Firebase user without crashing.
 * Returns null if Firebase isn't initialized or user isn't signed in.
 */
export function getFirebaseUser(): FirebaseAuthTypes.User | null {
  try {
    const authModule = require('@react-native-firebase/auth').default;
    return authModule().currentUser;
  } catch {
    return null;
  }
}

/**
 * Check whether Firebase Auth is available (native module initialized).
 */
export function isFirebaseAvailable(): boolean {
  try {
    const authModule = require('@react-native-firebase/auth').default;
    authModule();
    return true;
  } catch {
    return false;
  }
}

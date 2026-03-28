/**
 * Firebase configuration constants.
 *
 * IMPORTANT: After completing the Firebase Console setup (see docs/firebase-setup.md),
 * replace GOOGLE_SIGN_IN_WEB_CLIENT_ID with the Web Client ID from:
 *   Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
 *
 * The google-services.json and GoogleService-Info.plist files (placed at
 * android/app/ and ios/MedTracker/ respectively) contain the full Firebase
 * project config — these constants are supplemental app-level values.
 */

/** Web Client ID for Google Sign-In (from Firebase Console Auth → Google provider) */
export const GOOGLE_SIGN_IN_WEB_CLIENT_ID =
  'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

/** Firestore collection paths */
export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  records: (uid: string) => `records/${uid}/bp`,
  relationships: 'relationships',
} as const;

/** Firestore relationship status values */
export const RELATIONSHIP_STATUS = {
  pending: 'pending',
  active: 'active',
  revoked: 'revoked',
} as const;

/** Invite code length and expiry */
export const INVITE_CODE_LENGTH = 6;
export const INVITE_EXPIRY_HOURS = 24;

/** Crisis alert Cloud Function name */
export const CRISIS_ALERT_FUNCTION_NAME = 'sendCrisisAlert';

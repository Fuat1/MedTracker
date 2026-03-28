/**
 * Family Sharing domain types.
 * Firestore schema mirrors these types — see docs/superpowers/specs/2026-03-28-family-sharing-design.md
 */

// ─── Sharing Config ───────────────────────────────────────────────────────────

export interface SharingConfig {
  shareWeight: boolean;
  shareNotes: boolean;
  shareMedications: boolean;
  shareTags: boolean;
  /** Controlled by the SHARER — do I send crisis alerts to this person? */
  crisisAlertsEnabled: boolean;
}

export const DEFAULT_SHARING_CONFIG: SharingConfig = {
  shareWeight: false,
  shareNotes: false,
  shareMedications: false,
  shareTags: false,
  crisisAlertsEnabled: false,
};

// ─── Relationship ─────────────────────────────────────────────────────────────

export type RelationshipStatus = 'pending' | 'active' | 'revoked';

export interface Relationship {
  id: string;
  initiatorUid: string;
  /** Null until accepted */
  recipientUid: string | null;
  status: RelationshipStatus;
  inviteCode: string;
  inviteEmail?: string;
  /** Unix seconds */
  createdAt: number;
  /** Unix seconds — 24h after creation */
  expiresAt: number;
  /** Recipient's read key for initiator's records, encrypted with recipient's master key */
  initiatorReadKey: string;
  /** Initiator's read key for recipient's records, encrypted — null until accepted */
  recipientReadKey: string | null;
  initiatorSharing: SharingConfig;
  recipientSharing: SharingConfig;
}

// Lightweight version used in lists
export interface RelationshipSummary {
  id: string;
  linkedUid: string;
  linkedDisplayName: string;
  status: RelationshipStatus;
  /** Are we the initiator? (determines which SharingConfig to use) */
  isInitiator: boolean;
  sharingConfig: SharingConfig;
}

// ─── Firebase User Document ───────────────────────────────────────────────────

export interface FirestoreUserDoc {
  displayName: string;
  email?: string;
  /** Master key encrypted with SHA-256(firebaseUID + deviceId), base64 */
  encryptedMasterKey: string;
  /** Updated on each launch */
  fcmToken: string;
  /** Firestore Timestamp (stored as number for simplicity in types) */
  createdAt: number;
  lastActiveAt: number;
}

// ─── Firestore BP Record ──────────────────────────────────────────────────────

/** Shape written to Firestore — sensitive fields are AES-GCM encrypted base64 */
export interface FirestoreBPRecord {
  systolic_enc: string;
  diastolic_enc: string;
  pulse_enc: string | null;
  weight_enc: string | null;
  notes_enc: string | null;
  tags_enc: string; // encrypted JSON array
  /** Plaintext — needed for Firestore ordering */
  timestamp: number;
  /** Plaintext — needed for filtering */
  location: string;
  posture: string;
  /** Firestore Timestamp */
  updatedAt: number;
  /** Soft delete for sync propagation */
  deleted: boolean;
}

// ─── Encryption Types ─────────────────────────────────────────────────────────

/** Serialised form stored in Keychain (JSON-stringified) */
export interface SerializedKey {
  keyBase64: string;
}

/** AES-GCM ciphertext in a transport-friendly format */
export interface EncryptedValue {
  /** Base64-encoded ciphertext + authentication tag */
  ciphertext: string;
  /** Base64-encoded 12-byte IV */
  iv: string;
}

// ─── Local linked-user record ─────────────────────────────────────────────────

/**
 * Stored in `linked_users` SQLite table.
 * Tracks the people whose records we've downloaded.
 */
export interface LinkedUser {
  uid: string;
  displayName: string;
  /** Unix seconds of last successful sync */
  lastSyncedAt: number;
  relationshipId: string;
}

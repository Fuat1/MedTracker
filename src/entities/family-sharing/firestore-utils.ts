/**
 * Utilities for converting between local BPRecord ↔ FirestoreBPRecord.
 *
 * Encryption/decryption is applied here before writing to / after reading from Firestore.
 * Fields that are safe to store in plaintext (timestamp, location, posture) are passed through.
 */

import type { BPRecord } from '@/entities/blood-pressure';
import {
  encrypt,
  decrypt,
  encryptedValueToString,
  encryptedValueFromString,
} from './encryption';
import type { FirestoreBPRecord, SharingConfig } from './types';

// ─── Local → Firestore ────────────────────────────────────────────────────────

/**
 * Encrypt a local BPRecord into a FirestoreBPRecord.
 * `sharingConfig` determines which optional fields to include;
 * excluded fields are stored as null.
 */
export async function encryptBPRecord(
  record: BPRecord,
  masterKey: CryptoKey,
  sharingConfig: SharingConfig,
): Promise<FirestoreBPRecord> {
  const [systolicEnc, diastolicEnc] = await Promise.all([
    encrypt(String(record.systolic), masterKey),
    encrypt(String(record.diastolic), masterKey),
  ]);

  const pulseEnc =
    record.pulse != null
      ? encryptedValueToString(await encrypt(String(record.pulse), masterKey))
      : null;

  const weightEnc =
    record.weight != null && sharingConfig.shareWeight
      ? encryptedValueToString(await encrypt(String(record.weight), masterKey))
      : null;

  const notesEnc =
    record.notes && sharingConfig.shareNotes
      ? encryptedValueToString(await encrypt(record.notes, masterKey))
      : null;

  // Tags: always encrypted if present, but only included if shareNotes is on
  // (tags are personal annotations — sharing controlled separately by shareTags)
  const tagsEnc = sharingConfig.shareTags
    ? encryptedValueToString(
        await encrypt(
          JSON.stringify((record as BPRecord & { tags?: string[] }).tags ?? []),
          masterKey,
        ),
      )
    : encryptedValueToString(await encrypt('[]', masterKey));

  return {
    systolic_enc: encryptedValueToString(systolicEnc),
    diastolic_enc: encryptedValueToString(diastolicEnc),
    pulse_enc: pulseEnc,
    weight_enc: weightEnc,
    notes_enc: notesEnc,
    tags_enc: tagsEnc,
    timestamp: record.timestamp,
    location: record.location,
    posture: record.posture,
    updatedAt: record.updatedAt,
    deleted: false,
  };
}

// ─── Firestore → Local ────────────────────────────────────────────────────────

export interface DecryptedFirestoreRecord {
  systolic: number;
  diastolic: number;
  pulse: number | null;
  weight: number | null;
  notes: string | null;
  tags: string[];
  timestamp: number;
  location: string;
  posture: string;
  updatedAt: number;
  deleted: boolean;
}

/**
 * Decrypt a FirestoreBPRecord using the read key for the record owner.
 * Returns null if decryption fails (e.g., key mismatch after revocation).
 */
export async function decryptBPRecord(
  firestoreRecord: FirestoreBPRecord,
  readKey: CryptoKey,
): Promise<DecryptedFirestoreRecord | null> {
  try {
    const [systolicStr, diastolicStr] = await Promise.all([
      decrypt(encryptedValueFromString(firestoreRecord.systolic_enc), readKey),
      decrypt(encryptedValueFromString(firestoreRecord.diastolic_enc), readKey),
    ]);

    const pulse =
      firestoreRecord.pulse_enc != null
        ? Number(
            await decrypt(encryptedValueFromString(firestoreRecord.pulse_enc), readKey),
          )
        : null;

    const weight =
      firestoreRecord.weight_enc != null
        ? Number(
            await decrypt(encryptedValueFromString(firestoreRecord.weight_enc), readKey),
          )
        : null;

    const notes =
      firestoreRecord.notes_enc != null
        ? await decrypt(encryptedValueFromString(firestoreRecord.notes_enc), readKey)
        : null;

    const tagsJson = await decrypt(
      encryptedValueFromString(firestoreRecord.tags_enc),
      readKey,
    );
    const tags: string[] = JSON.parse(tagsJson);

    return {
      systolic: Number(systolicStr),
      diastolic: Number(diastolicStr),
      pulse,
      weight,
      notes,
      tags,
      timestamp: firestoreRecord.timestamp,
      location: firestoreRecord.location,
      posture: firestoreRecord.posture,
      updatedAt: firestoreRecord.updatedAt,
      deleted: firestoreRecord.deleted,
    };
  } catch {
    return null;
  }
}

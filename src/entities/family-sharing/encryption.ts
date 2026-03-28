/// <reference lib="dom" />
/**
 * AES-256-GCM encryption/decryption using Hermes SubtleCrypto.
 *
 * React Native 0.76+ exposes the Web Crypto API via Hermes.
 * `react-native-get-random-values` (already installed) polyfills `getRandomValues`.
 *
 * All keys are CryptoKey objects internally; we import/export as raw bytes
 * for Keychain storage (base64-encoded).
 */

import type { EncryptedValue, SerializedKey } from './types';

const subtle = crypto.subtle;

// ─── Key Generation ───────────────────────────────────────────────────────────

/** Generate a new AES-256-GCM master key */
export async function generateMasterKey(): Promise<CryptoKey> {
  return subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // extractable
    ['encrypt', 'decrypt'],
  );
}

/** Export CryptoKey → base64 string for Keychain storage */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await subtle.exportKey('raw', key);
  return bufferToBase64(raw);
}

/** Import base64 string from Keychain → CryptoKey */
export async function importKey(base64: string): Promise<CryptoKey> {
  const raw = base64ToBuffer(base64);
  return subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/** Serialize key to Keychain-storable format */
export async function serializeKey(key: CryptoKey): Promise<SerializedKey> {
  return { keyBase64: await exportKey(key) };
}

/** Deserialize key from Keychain */
export async function deserializeKey(serialized: SerializedKey): Promise<CryptoKey> {
  return importKey(serialized.keyBase64);
}

// ─── Encryption / Decryption ──────────────────────────────────────────────────

/**
 * Encrypt a string value with AES-256-GCM.
 * Returns an EncryptedValue with base64 ciphertext + iv.
 */
export async function encrypt(
  plaintext: string,
  key: CryptoKey,
): Promise<EncryptedValue> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt an EncryptedValue back to a string.
 * Throws if the key is wrong or data is tampered (GCM authentication fails).
 */
export async function decrypt(
  encrypted: EncryptedValue,
  key: CryptoKey,
): Promise<string> {
  const iv = base64ToBuffer(encrypted.iv);
  const cipherBuffer = base64ToBuffer(encrypted.ciphertext);
  const plainBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    cipherBuffer,
  );
  return new TextDecoder().decode(plainBuffer);
}

/**
 * Serialize EncryptedValue to a single compact string for Firestore storage.
 * Format: `base64(iv).base64(ciphertext)`
 */
export function encryptedValueToString(ev: EncryptedValue): string {
  return `${ev.iv}.${ev.ciphertext}`;
}

/**
 * Parse a compact encrypted string back to EncryptedValue.
 */
export function encryptedValueFromString(s: string): EncryptedValue {
  const dotIdx = s.indexOf('.');
  if (dotIdx === -1) {
    throw new Error('Invalid encrypted value format');
  }
  return {
    iv: s.slice(0, dotIdx),
    ciphertext: s.slice(dotIdx + 1),
  };
}

// ─── HKDF Read Key Derivation ─────────────────────────────────────────────────

/**
 * Derive a read key for a linked user.
 * readKey = HKDF(masterKey, salt = recipientUid, info = "medtracker-share-v1")
 *
 * The derived key is what we share with the other person — our master key is NEVER shared.
 */
export async function deriveReadKey(
  masterKey: CryptoKey,
  recipientUid: string,
): Promise<CryptoKey> {
  // Import master key as HKDF key material
  const masterRaw = await subtle.exportKey('raw', masterKey);
  const hkdfKey = await subtle.importKey('raw', masterRaw, 'HKDF', false, [
    'deriveKey',
  ]);

  const salt = new TextEncoder().encode(recipientUid);
  const info = new TextEncoder().encode('medtracker-share-v1');

  return subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

// ─── Master Key Backup Encryption ────────────────────────────────────────────

/**
 * Encrypt the master key for Firestore backup using SHA-256(uid + deviceId).
 * This allows key recovery on a new device after re-authentication.
 */
export async function encryptMasterKeyForBackup(
  masterKey: CryptoKey,
  firebaseUid: string,
  deviceId: string,
): Promise<string> {
  const backupKeyMaterial = new TextEncoder().encode(firebaseUid + deviceId);
  const hash = await subtle.digest('SHA-256', backupKeyMaterial);
  const backupKey = await subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const masterRaw = await subtle.exportKey('raw', masterKey);
  const masterBase64 = bufferToBase64(masterRaw);
  const encrypted = await encrypt(masterBase64, backupKey);
  return encryptedValueToString(encrypted);
}

/**
 * Recover master key from Firestore backup string using SHA-256(uid + deviceId).
 */
export async function decryptMasterKeyFromBackup(
  encryptedBackup: string,
  firebaseUid: string,
  deviceId: string,
): Promise<CryptoKey> {
  const backupKeyMaterial = new TextEncoder().encode(firebaseUid + deviceId);
  const hash = await subtle.digest('SHA-256', backupKeyMaterial);
  const backupKey = await subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const encrypted = encryptedValueFromString(encryptedBackup);
  const masterBase64 = await decrypt(encrypted, backupKey);
  return importKey(masterBase64);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

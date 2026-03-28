/**
 * Tests for AES-256-GCM encrypt/decrypt round-trip and HKDF read key derivation.
 *
 * These run in Node.js (Jest) using the `crypto` module which exposes SubtleCrypto.
 * We polyfill `crypto.subtle` for the test environment below.
 */

import {
  generateMasterKey,
  exportKey,
  importKey,
  serializeKey,
  deserializeKey,
  encrypt,
  decrypt,
  encryptedValueToString,
  encryptedValueFromString,
  deriveReadKey,
  encryptMasterKeyForBackup,
  decryptMasterKeyFromBackup,
} from '../encryption';

// Node 18+ exposes globalThis.crypto — polyfill for Jest (jsdom or node environments)
if (typeof globalThis.crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const nodeCrypto = require('crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: nodeCrypto.webcrypto,
  });
}

describe('encryption: round-trip', () => {
  let masterKey: CryptoKey;

  beforeAll(async () => {
    masterKey = await generateMasterKey();
  });

  it('encrypts and decrypts a string', async () => {
    const original = 'Hello MedTracker';
    const encrypted = await encrypt(original, masterKey);
    const decrypted = await decrypt(encrypted, masterKey);
    expect(decrypted).toBe(original);
  });

  it('encrypts numeric values correctly', async () => {
    const values = ['120', '80', '72', '75.5'];
    for (const v of values) {
      const encrypted = await encrypt(v, masterKey);
      const decrypted = await decrypt(encrypted, masterKey);
      expect(decrypted).toBe(v);
    }
  });

  it('encrypted ciphertext differs across calls (random IV)', async () => {
    const enc1 = await encrypt('same plaintext', masterKey);
    const enc2 = await encrypt('same plaintext', masterKey);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  it('rejects tampered ciphertext', async () => {
    const encrypted = await encrypt('secure value', masterKey);
    const tampered = { ...encrypted, ciphertext: encrypted.ciphertext.slice(0, -4) + 'XXXX' };
    await expect(decrypt(tampered, masterKey)).rejects.toThrow();
  });

  it('rejects wrong key', async () => {
    const otherKey = await generateMasterKey();
    const encrypted = await encrypt('secret', masterKey);
    await expect(decrypt(encrypted, otherKey)).rejects.toThrow();
  });
});

describe('encryption: EncryptedValue serialization', () => {
  it('round-trips through encryptedValueToString / encryptedValueFromString', async () => {
    const masterKey = await generateMasterKey();
    const encrypted = await encrypt('test value', masterKey);
    const str = encryptedValueToString(encrypted);
    const parsed = encryptedValueFromString(str);
    const decrypted = await decrypt(parsed, masterKey);
    expect(decrypted).toBe('test value');
  });

  it('throws on invalid format string', () => {
    expect(() => encryptedValueFromString('nodotinhere')).toThrow(
      'Invalid encrypted value format',
    );
  });
});

describe('encryption: key serialization', () => {
  it('exports and imports key via base64', async () => {
    const key = await generateMasterKey();
    const base64 = await exportKey(key);
    const imported = await importKey(base64);
    // Verify they produce the same result
    const encrypted = await encrypt('test', key);
    const decrypted = await decrypt(encrypted, imported);
    expect(decrypted).toBe('test');
  });

  it('serializes and deserializes SerializedKey', async () => {
    const key = await generateMasterKey();
    const serialized = await serializeKey(key);
    const deserialized = await deserializeKey(serialized);
    const encrypted = await encrypt('round-trip', key);
    expect(await decrypt(encrypted, deserialized)).toBe('round-trip');
  });
});

describe('HKDF read key derivation', () => {
  it('derives a deterministic read key for a given uid', async () => {
    const masterKey = await generateMasterKey();
    const uid = 'user_abc_123';
    const readKey1 = await deriveReadKey(masterKey, uid);
    const readKey2 = await deriveReadKey(masterKey, uid);
    // Both keys should encrypt/decrypt the same data
    const plaintext = 'linked user data';
    const encrypted = await encrypt(plaintext, readKey1);
    expect(await decrypt(encrypted, readKey2)).toBe(plaintext);
  });

  it('derives different keys for different uids', async () => {
    const masterKey = await generateMasterKey();
    const key1 = await deriveReadKey(masterKey, 'uid_alice');
    const key2 = await deriveReadKey(masterKey, 'uid_bob');
    const encrypted = await encrypt('data', key1);
    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });

  it('derives different keys from different master keys for same uid', async () => {
    const uid = 'uid_shared';
    const masterKey1 = await generateMasterKey();
    const masterKey2 = await generateMasterKey();
    const key1 = await deriveReadKey(masterKey1, uid);
    const key2 = await deriveReadKey(masterKey2, uid);
    const encrypted = await encrypt('data', key1);
    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });
});

describe('master key backup encryption', () => {
  it('encrypts and decrypts master key for backup', async () => {
    const masterKey = await generateMasterKey();
    const uid = 'firebase_uid_xyz';
    const deviceId = 'device_fingerprint_abc';

    const backup = await encryptMasterKeyForBackup(masterKey, uid, deviceId);
    const recovered = await decryptMasterKeyFromBackup(backup, uid, deviceId);

    // Verify the recovered key is functionally identical
    const plaintext = 'sensitive bp data';
    const encrypted = await encrypt(plaintext, masterKey);
    expect(await decrypt(encrypted, recovered)).toBe(plaintext);
  });

  it('fails to recover with wrong uid', async () => {
    const masterKey = await generateMasterKey();
    const backup = await encryptMasterKeyForBackup(masterKey, 'uid_correct', 'device_123');
    await expect(
      decryptMasterKeyFromBackup(backup, 'uid_wrong', 'device_123'),
    ).rejects.toThrow();
  });

  it('fails to recover with wrong deviceId', async () => {
    const masterKey = await generateMasterKey();
    const backup = await encryptMasterKeyForBackup(masterKey, 'uid_123', 'device_correct');
    await expect(
      decryptMasterKeyFromBackup(backup, 'uid_123', 'device_wrong'),
    ).rejects.toThrow();
  });
});

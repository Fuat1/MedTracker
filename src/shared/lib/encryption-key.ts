import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'com.medtracker.db-encryption';
const KEYCHAIN_USERNAME = 'db-key';

/**
 * Get or create the SQLCipher encryption key.
 * Key is stored in the platform keychain (iOS Keychain / Android Keystore).
 * Generated once on first launch, then retrieved on subsequent launches.
 */
export async function getOrCreateEncryptionKey(): Promise<string> {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    if (credentials) {
      return credentials.password;
    }
  } catch {
    // No stored key — fall through to generate one
  }

  // Generate a 256-bit random hex key
  const key = generateRandomHexKey(32);

  await Keychain.setGenericPassword(KEYCHAIN_USERNAME, key, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });

  return key;
}

/** Generate a random hex string of `byteLength` bytes */
function generateRandomHexKey(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);

  // crypto.getRandomValues is available in Hermes 0.76+ and JSC
  const g = globalThis as any;
  if (typeof g.crypto?.getRandomValues !== 'function') {
    throw new Error(
      'crypto.getRandomValues is not available. A cryptographically secure RNG is required for encryption key generation.',
    );
  }
  g.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

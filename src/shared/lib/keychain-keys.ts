import * as Keychain from 'react-native-keychain';
import { exportKey, importKey, serializeKey } from '@/entities/family-sharing';

const MASTER_KEY_KEYCHAIN_SERVICE = 'medtracker.masterKey';

/** Load the master key from Keychain. Returns null if not found. */
export async function loadMasterKey(): Promise<CryptoKey | null> {
  const result = await Keychain.getGenericPassword({
    service: MASTER_KEY_KEYCHAIN_SERVICE,
  });
  if (!result) {
    return null;
  }
  try {
    const serialized = JSON.parse(result.password);
    const key = await importKey(serialized.keyBase64);
    return key;
  } catch {
    return null;
  }
}

/** Store a master key in Keychain. */
export async function storeMasterKey(uid: string, key: CryptoKey): Promise<void> {
  const serialized = await serializeKey(key);
  await Keychain.setGenericPassword(
    uid,
    JSON.stringify(serialized),
    { service: MASTER_KEY_KEYCHAIN_SERVICE },
  );
}

/** Remove the master key from Keychain. */
export async function removeMasterKey(): Promise<void> {
  await Keychain.resetGenericPassword({ service: MASTER_KEY_KEYCHAIN_SERVICE });
}

/** Load a relationship read key from Keychain (stored by owner UID). */
export async function loadReadKey(ownerUid: string): Promise<CryptoKey | null> {
  const service = `medtracker.readKey.${ownerUid}`;
  const result = await Keychain.getGenericPassword({ service });
  if (!result) {
    return null;
  }
  try {
    const base64 = result.password;
    return importKey(base64);
  } catch {
    return null;
  }
}

/** Store a relationship read key in Keychain. */
export async function storeReadKey(ownerUid: string, key: CryptoKey): Promise<void> {
  const service = `medtracker.readKey.${ownerUid}`;
  const base64 = await exportKey(key);
  await Keychain.setGenericPassword(ownerUid, base64, { service });
}

/** Remove a relationship read key from Keychain (on revocation). */
export async function removeReadKey(ownerUid: string): Promise<void> {
  const service = `medtracker.readKey.${ownerUid}`;
  await Keychain.resetGenericPassword({ service });
}

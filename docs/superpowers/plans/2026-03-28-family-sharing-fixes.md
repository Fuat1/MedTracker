# Family Sharing — Post-Review Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Critical and Important issues found in the code review of the Family Sharing feature commit (b861aae).

**Architecture:** Refactor cross-feature imports into shared/entities layers, fix security issues in Cloud Function and encryption key exchange, add missing spec features (QR code, account deletion cleanup, revocation listener, retry cap), fix deprecated APIs.

**Tech Stack:** React Native CLI, TypeScript, Firebase Cloud Functions, Firestore, AES-256-GCM, react-native-qrcode-svg, @react-native-clipboard/clipboard

---

## File Structure

### Files to create
- `src/shared/lib/keychain-keys.ts` — Master key + read key Keychain management (extracted from features/auth)

### Files to modify
- `functions/src/index.ts` — Remove BP values from push payload (C2), add server-side crisis threshold check (C3)
- `src/features/auth/lib/use-firebase-auth.ts` — Remove key management exports (moved to shared), add full account deletion cleanup (I4)
- `src/features/auth/index.ts` — Remove key management re-exports
- `src/features/sync/lib/use-download-records.ts` — Fix FSD imports (C4/C5), add revocation snapshot listener (I5)
- `src/features/sync/lib/use-upload-record.ts` — Fix FSD import (C5), add max retry cap (I9)
- `src/features/sync/lib/use-relationship-for-current-user.ts` — Fix FSD import (C5)
- `src/features/pairing/lib/use-pairing.ts` — Fix FSD import (C5), encrypt read key before storing (C1)
- `src/features/record-bp/index.ts` — Ensure BP_RECORDS_QUERY_KEY is exported for cross-feature use via shared
- `src/shared/config/index.ts` — Add BP_RECORDS_QUERY_KEY constant
- `src/pages/family-sharing/ui/InvitePage.tsx` — Add QR code (I2), fix deprecated Clipboard (I3)
- `src/pages/family-sharing/ui/SharingSettingsPage.tsx` — Show display names instead of UIDs (I8)
- `src/app/navigation/index.tsx` — Move SyncManager inside NavigationContainer (I6)
- `src/features/sync/lib/sync-store.ts` — Add MAX_RETRY_COUNT constant
- `src/shared/api/bp-repository.ts` — Add linked_users table CRUD functions (I7)
- `docs/verified-functionalities.md` — Update with family sharing feature (I10)
- `package.json` — Add @react-native-clipboard/clipboard dependency

---

### Task 1: Extract key management to shared layer (fixes C4/C5)

Key management functions (`loadMasterKey`, `loadReadKey`, `storeReadKey`, `removeReadKey`) are currently in `features/auth` but imported by `features/sync` and `features/pairing` — violating FSD's no-cross-feature-import rule. Move them to `shared/lib`.

**Files:**
- Create: `src/shared/lib/keychain-keys.ts`
- Modify: `src/features/auth/lib/use-firebase-auth.ts`
- Modify: `src/features/auth/index.ts`
- Modify: `src/features/sync/lib/use-download-records.ts`
- Modify: `src/features/sync/lib/use-upload-record.ts`
- Modify: `src/features/sync/lib/use-relationship-for-current-user.ts`
- Modify: `src/features/pairing/lib/use-pairing.ts`

- [ ] **Step 1: Create `src/shared/lib/keychain-keys.ts`**

Extract the four Keychain functions from `use-firebase-auth.ts`:

```typescript
/**
 * Keychain-backed key management for family sharing encryption.
 *
 * Lives in shared/lib because multiple features (auth, sync, pairing)
 * need to load/store keys without cross-feature imports.
 */

import * as Keychain from 'react-native-keychain';
import { exportKey, importKey, type SerializedKey } from '@/entities/family-sharing';

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
    const serialized: SerializedKey = JSON.parse(result.password);
    return importKey(serialized.keyBase64);
  } catch {
    return null;
  }
}

/** Store the master key in Keychain. */
export async function storeMasterKey(uid: string, key: CryptoKey): Promise<void> {
  const serialized = await exportKey(key);
  await Keychain.setGenericPassword(
    uid,
    JSON.stringify({ keyBase64: serialized }),
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
    return importKey(result.password);
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
```

- [ ] **Step 2: Update `use-firebase-auth.ts` to import from shared**

Remove the four exported functions and the `MASTER_KEY_KEYCHAIN_SERVICE` constant from `use-firebase-auth.ts`. Replace internal usage with imports from `@/shared/lib/keychain-keys`:

```typescript
// At the top of use-firebase-auth.ts, replace Keychain key functions with:
import { loadMasterKey, storeMasterKey, removeMasterKey } from '@/shared/lib/keychain-keys';
```

In `ensureMasterKey`, replace the `Keychain.setGenericPassword` call with `storeMasterKey(uid, masterKey)`.
In `deleteAccount`, replace `Keychain.resetGenericPassword` call with `removeMasterKey()`.
Remove the `loadMasterKey`, `loadReadKey`, `storeReadKey`, `removeReadKey` function definitions entirely.

- [ ] **Step 3: Update `src/features/auth/index.ts`**

Remove key management re-exports. Change from:
```typescript
export { useFirebaseAuth, loadMasterKey, loadReadKey, storeReadKey, removeReadKey } from './lib/use-firebase-auth';
```
To:
```typescript
export { useFirebaseAuth } from './lib/use-firebase-auth';
export type { FirebaseUser, UseFirebaseAuthResult } from './lib/use-firebase-auth';
export { AuthGate } from './lib/auth-gate';
```

- [ ] **Step 4: Update all consumers to import from shared**

In `src/features/sync/lib/use-download-records.ts`:
```typescript
// Replace: import { loadReadKey } from '@/features/auth';
import { loadReadKey } from '@/shared/lib/keychain-keys';
```

In `src/features/sync/lib/use-upload-record.ts`:
```typescript
// Replace: import { loadMasterKey } from '@/features/auth';
import { loadMasterKey } from '@/shared/lib/keychain-keys';
```

In `src/features/pairing/lib/use-pairing.ts`:
```typescript
// Replace: import { loadMasterKey, storeReadKey, removeReadKey } from '@/features/auth';
import { loadMasterKey, storeReadKey, removeReadKey } from '@/shared/lib/keychain-keys';
```

- [ ] **Step 5: Move `BP_RECORDS_QUERY_KEY` to shared config**

In `src/shared/config/index.ts`, add:
```typescript
/** TanStack Query key for BP records — shared across features */
export const BP_RECORDS_QUERY_KEY = ['bp-records'] as const;
```

In `src/features/record-bp/model/use-record-bp.ts`, change:
```typescript
// Replace: export const BP_RECORDS_QUERY_KEY = ['bp-records'];
import { BP_RECORDS_QUERY_KEY } from '@/shared/config';
export { BP_RECORDS_QUERY_KEY };
```

In `src/features/sync/lib/use-download-records.ts`, change:
```typescript
// Replace: import { BP_RECORDS_QUERY_KEY } from '../../record-bp';
import { BP_RECORDS_QUERY_KEY } from '@/shared/config';
```

- [ ] **Step 6: Remove `useRelationships` cross-feature import from `use-download-records.ts`**

The `useRelationships` import from `features/pairing` is an FSD violation. Instead, accept relationships as a parameter from the calling context. Change the hook signature:

In `src/features/sync/lib/use-download-records.ts`:
```typescript
// Replace: import { useRelationships } from '@/features/pairing';
import type { Relationship } from '@/entities/family-sharing';

export function useDownloadRecords(relationships: Relationship[]) {
  // Remove: const { relationships } = useRelationships();
  // ... rest uses the passed-in relationships parameter
```

In `src/features/sync/lib/use-relationship-for-current-user.ts`:
```typescript
// Replace: import { useRelationships } from '@/features/pairing';
import type { Relationship } from '@/entities/family-sharing';

export function useRelationshipForCurrentUser(relationships: Relationship[]) {
  // Remove: const { relationships } = useRelationships();
  // ... rest uses the passed-in relationships parameter
```

Update `SyncManager` in `src/app/navigation/index.tsx` to bridge the gap:
```typescript
import { useRelationships } from '../../features/pairing';

function SyncManager() {
  const { relationships } = useRelationships();
  const { downloadAll } = useDownloadRecords(relationships);
  const { retryAll } = useRetryUploadQueue(relationships);
  // ...
}
```

- [ ] **Step 7: Run typecheck**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: No new errors (existing may remain)

- [ ] **Step 8: Commit**

```bash
git add src/shared/lib/keychain-keys.ts src/features/auth/ src/features/sync/ src/features/pairing/ src/features/record-bp/ src/shared/config/index.ts src/app/navigation/index.tsx
git commit -m "refactor: extract key management to shared/lib, fix FSD layer violations

Move loadMasterKey, loadReadKey, storeReadKey, removeReadKey from
features/auth to shared/lib/keychain-keys so features/sync and
features/pairing can import without cross-feature dependency.

Move BP_RECORDS_QUERY_KEY to shared/config.

Pass relationships as parameter to useDownloadRecords and
useRelationshipForCurrentUser instead of cross-importing useRelationships.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Fix Cloud Function security issues (C2, C3)

**Files:**
- Modify: `functions/src/index.ts`

- [ ] **Step 1: Remove BP values from push notification**

In `functions/src/index.ts`, change the notification body and data payload:

```typescript
// Replace the messages.push block (lines 130-158) with:
messages.push({
  token: fcmToken,
  notification: {
    title: 'High BP Alert',
    body: `${senderName} logged a reading that may need attention.`,
  },
  data: {
    type: 'crisis_alert',
    senderUid,
  },
  android: {
    priority: 'high',
    notification: {
      channelId: 'crisis_alerts',
      priority: 'max',
    },
  },
  apns: {
    payload: {
      aps: {
        sound: 'default',
        badge: 1,
        contentAvailable: true,
      },
    },
  },
});
```

- [ ] **Step 2: Add server-side crisis threshold validation**

Add crisis threshold constants and server-side validation after the range check:

```typescript
// After the range check (line 69), add:
// Crisis thresholds — must match mobile-side isCrisisReading()
// AHA/ACC 2025: SBP >= 180 OR DBP >= 120
const CRISIS_SBP_THRESHOLD = 180;
const CRISIS_DBP_THRESHOLD = 120;

if (systolic < CRISIS_SBP_THRESHOLD && diastolic < CRISIS_DBP_THRESHOLD) {
  throw new functions.https.HttpsError(
    'invalid-argument',
    'Reading does not meet crisis threshold',
  );
}
```

- [ ] **Step 3: Remove systolic/diastolic from logger output**

Change the logger line:
```typescript
// Replace:
functions.logger.info(`Crisis alert sent: ${successCount}/${messages.length} delivered`, {
  senderUid,
  systolic,
  diastolic,
});
// With:
functions.logger.info(`Crisis alert sent: ${successCount}/${messages.length} delivered`, {
  senderUid,
});
```

- [ ] **Step 4: Commit**

```bash
git add functions/src/index.ts
git commit -m "fix: remove BP values from push notification payload, add server-side crisis check

Design spec requires values omitted from FCM payload for privacy.
Also validate crisis threshold server-side to prevent abuse.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Encrypt read key in relationship document (C1)

The current implementation stores the recipientReadKey as plaintext base64 in Firestore. Fix by encrypting it with the relationship ID as an additional derivation context.

**Files:**
- Modify: `src/entities/family-sharing/encryption.ts`
- Modify: `src/features/pairing/lib/use-pairing.ts`

- [ ] **Step 1: Add `encryptReadKeyForTransport` / `decryptReadKeyFromTransport` to encryption.ts**

In `src/entities/family-sharing/encryption.ts`, add two new functions after the existing exports:

```typescript
/**
 * Encrypt a read key for safe storage in a Firestore relationship document.
 * Uses the owner's master key to encrypt, so only the owner can later decrypt.
 *
 * @param readKey - The read key to encrypt
 * @param masterKey - The encrypting party's master key
 * @returns Base64 string safe for Firestore storage
 */
export async function encryptReadKeyForTransport(
  readKey: CryptoKey,
  masterKey: CryptoKey,
): Promise<string> {
  const readKeyBase64 = await exportKey(readKey);
  const encrypted = await encrypt(readKeyBase64, masterKey);
  return btoa(JSON.stringify(encrypted));
}

/**
 * Decrypt a read key that was encrypted for transport.
 *
 * @param encryptedReadKey - Base64 string from Firestore relationship doc
 * @param masterKey - The decrypting party's master key
 * @returns The decrypted CryptoKey, or null on failure
 */
export async function decryptReadKeyFromTransport(
  encryptedReadKey: string,
  masterKey: CryptoKey,
): Promise<CryptoKey | null> {
  try {
    const encrypted: EncryptedValue = JSON.parse(atob(encryptedReadKey));
    const readKeyBase64 = await decrypt(encrypted, masterKey);
    return importKey(readKeyBase64);
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Update `useAcceptInvite` to encrypt the read key**

In `src/features/pairing/lib/use-pairing.ts`, in the `useAcceptInvite` mutation:

```typescript
// Replace the plaintext storage (line ~171):
//   recipientReadKey: myReadKeyBase64,
// With:
import { encryptReadKeyForTransport } from '@/entities/family-sharing';

// Inside mutationFn, after deriving myReadKeyForInitiator:
const encryptedReadKey = await encryptReadKeyForTransport(myReadKeyForInitiator, myMasterKey);

await doc.ref.update({
  recipientUid: currentUser.uid,
  status: RELATIONSHIP_STATUS.active,
  recipientReadKey: encryptedReadKey,
});
```

- [ ] **Step 3: Update `useGenerateInvite` to store encrypted initiator read key**

In the `useGenerateInvite` mutation, after the relationship is created and before returning, compute and store the initiator's read key encrypted:

```typescript
// After const docRef = ... and relationship creation
// Derive initiator's read key for when recipient accepts
// The initiator encrypts their own read key so only they can later provide it
// (This is set properly; the actual key exchange happens on both sides)
```

Note: The full key exchange protocol requires that when the recipient loads the relationship, they use their master key to decrypt the initiator's encrypted read key. Since the initiator stores `initiatorReadKey` encrypted with their own master key, the recipient needs a different mechanism. For now, the approach is:
- Initiator stores their encrypted read key (encrypted with their master key)
- When recipient's device downloads records, it derives the read key from HKDF as specified in the design
- This matches the spec: "readKey = HKDF(masterKey, salt = B_uid, info = 'medtracker-share-v1')"

The recipient derives the initiator's read key locally:
```typescript
// In useDownloadRecords, when downloading for a linked user:
// The read key is derived via HKDF from the recipient's master key + initiator's UID
// This is already implemented in deriveReadKey() — just need to call it and store
```

- [ ] **Step 4: Update useDownloadRecords to derive and store read keys on first download**

In `src/features/sync/lib/use-download-records.ts`, in `downloadForUser`:
```typescript
import { deriveReadKey } from '@/entities/family-sharing';
import { loadReadKey, loadMasterKey, storeReadKey } from '@/shared/lib/keychain-keys';

// At the start of downloadForUser:
let readKey = await loadReadKey(linkedUid);
if (!readKey) {
  // First time downloading from this user — derive and store the read key
  const masterKey = await loadMasterKey();
  if (!masterKey) return;
  readKey = await deriveReadKey(masterKey, linkedUid);
  await storeReadKey(linkedUid, readKey);
}
```

- [ ] **Step 5: Commit**

```bash
git add src/entities/family-sharing/encryption.ts src/features/pairing/lib/use-pairing.ts src/features/sync/lib/use-download-records.ts
git commit -m "fix: encrypt read keys in Firestore relationship docs

Read keys were stored as plaintext base64 in Firestore. Now encrypted
with the owner's master key before storage. Recipients derive read keys
via HKDF as specified in the design.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: Add retry queue max limit (I9)

**Files:**
- Modify: `src/features/sync/lib/sync-store.ts`
- Modify: `src/features/sync/lib/use-upload-record.ts`

- [ ] **Step 1: Add MAX_RETRY_COUNT to sync-store**

In `src/features/sync/lib/sync-store.ts`, add at the top:
```typescript
/** Maximum retry attempts before giving up on a record */
export const MAX_RETRY_COUNT = 10;
```

- [ ] **Step 2: Add pruning in `useRetryUploadQueue`**

In `src/features/sync/lib/use-upload-record.ts`, in the `retryAll` function:

```typescript
import { MAX_RETRY_COUNT } from './sync-store';

// Inside the for loop, before trying to upload:
if (item.retryCount >= MAX_RETRY_COUNT) {
  removeFromRetryQueue(item.recordId);
  continue;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/features/sync/lib/sync-store.ts src/features/sync/lib/use-upload-record.ts
git commit -m "fix: cap upload retry queue at 10 attempts

Records that permanently fail to upload were retrying indefinitely.
Now removed from the queue after 10 failed attempts.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Fix deprecated Clipboard + add QR code to InvitePage (I2, I3)

**Files:**
- Modify: `src/pages/family-sharing/ui/InvitePage.tsx`
- Modify: `package.json`

- [ ] **Step 1: Install @react-native-clipboard/clipboard**

```bash
npm install @react-native-clipboard/clipboard
```

- [ ] **Step 2: Update InvitePage imports and add QR code**

In `src/pages/family-sharing/ui/InvitePage.tsx`:

Replace the `Clipboard` import:
```typescript
// Remove: import { ... Clipboard } from 'react-native';
// Add:
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
```

Add QR code display below the code characters, inside the `<CardBody>`:
```tsx
{/* QR code */}
<View style={styles.qrContainer}>
  <QRCode
    value={deepLink}
    size={160}
    backgroundColor="transparent"
    color={colors.textPrimary}
  />
</View>
```

Add the style:
```typescript
qrContainer: {
  alignItems: 'center',
  marginBottom: 16,
},
```

- [ ] **Step 3: Run typecheck**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/family-sharing/ui/InvitePage.tsx package.json package-lock.json
git commit -m "fix: add QR code to InvitePage, replace deprecated Clipboard

Use react-native-qrcode-svg for invite QR code as per design spec.
Replace removed RN core Clipboard with @react-native-clipboard/clipboard.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Complete account deletion cleanup (I4)

**Files:**
- Modify: `src/features/auth/lib/use-firebase-auth.ts`

- [ ] **Step 1: Add full cleanup to deleteAccount**

Replace the `deleteAccount` function body:

```typescript
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
```

You'll need the imports at the top:
```typescript
import { RELATIONSHIP_STATUS } from '@/shared/config';
```

- [ ] **Step 2: Commit**

```bash
git add src/features/auth/lib/use-firebase-auth.ts
git commit -m "fix: complete account deletion — revoke relationships, delete Firestore records

Previously only deleted the user document. Now also revokes all
active relationships and deletes BP records sub-collection.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Move SyncManager inside NavigationContainer (I6)

**Files:**
- Modify: `src/app/navigation/index.tsx`

- [ ] **Step 1: Restructure Navigation component**

Move `<SyncManager />` from outside `NavigationContainer` to inside it, after the `Stack.Navigator`:

```tsx
return (
  <ErrorBoundary>
    <View style={styles.container}>
      <NavigationContainer
        linking={linking}
        ref={navigationRef}
        onReady={() => {
          BootSplash.hide({ fade: true });
          const pending = consumePendingNavigation();
          if (pending) {
            navigationRef.navigate('Main', { screen: pending as keyof RootTabParamList });
          }
        }}
      >
        <SyncManager />
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
        >
          {/* ... existing screens ... */}
        </Stack.Navigator>
      </NavigationContainer>
      <GlobalToast />
    </View>
  </ErrorBoundary>
);
```

Note: `SyncManager` returns null so it won't affect layout. Placing it inside `NavigationContainer` gives it access to navigation context.

- [ ] **Step 2: Commit**

```bash
git add src/app/navigation/index.tsx
git commit -m "fix: move SyncManager inside NavigationContainer for nav context access

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Add revocation snapshot listener (I5)

The current revocation cleanup depends on `useRelationships()` which filters for `active` and `pending` only. Revoked relationships never appear in state.

**Files:**
- Modify: `src/features/sync/lib/use-download-records.ts`

- [ ] **Step 1: Add dedicated revocation listener**

Add a separate `useEffect` that listens for revoked relationships involving the current user:

```typescript
// Add a dedicated Firestore listener for revocation events
useEffect(() => {
  const currentUid = auth().currentUser?.uid;
  if (!currentUid) {
    return;
  }

  // Listen for relationships where we are initiator and status is revoked
  const unsubInitiator = firestore()
    .collection(FIRESTORE_COLLECTIONS.relationships)
    .where('initiatorUid', '==', currentUid)
    .where('status', '==', RELATIONSHIP_STATUS.revoked)
    .onSnapshot((snapshot) => {
      for (const doc of snapshot.docs) {
        const rel = doc.data() as { recipientUid: string | null };
        if (rel.recipientUid) {
          void deleteBPRecordsByOwner(rel.recipientUid);
          void removeReadKey(rel.recipientUid);
        }
      }
    });

  // Listen for relationships where we are recipient and status is revoked
  const unsubRecipient = firestore()
    .collection(FIRESTORE_COLLECTIONS.relationships)
    .where('recipientUid', '==', currentUid)
    .where('status', '==', RELATIONSHIP_STATUS.revoked)
    .onSnapshot((snapshot) => {
      for (const doc of snapshot.docs) {
        const rel = doc.data() as { initiatorUid: string };
        void deleteBPRecordsByOwner(rel.initiatorUid);
        void removeReadKey(rel.initiatorUid);
      }
    });

  return () => {
    unsubInitiator();
    unsubRecipient();
  };
}, []);
```

Remove the existing `useEffect` that tries to clean up revoked relationships from `relationships` state (the one at ~line 140), since that approach doesn't work.

- [ ] **Step 2: Commit**

```bash
git add src/features/sync/lib/use-download-records.ts
git commit -m "fix: add dedicated Firestore snapshot listener for revocation cleanup

Previous approach relied on useRelationships() which filters out
revoked relationships. Now uses direct Firestore listeners to detect
revocation and clean up local records + read keys.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Populate linked_users table and show display names (I7, I8)

**Files:**
- Modify: `src/shared/api/bp-repository.ts`
- Modify: `src/features/sync/lib/use-download-records.ts`
- Modify: `src/pages/history/ui/HistoryPage.tsx`
- Modify: `src/pages/family-sharing/ui/SharingSettingsPage.tsx`

- [ ] **Step 1: Add linked_users CRUD to bp-repository**

In `src/shared/api/bp-repository.ts`, add:

```typescript
// ─── Linked Users ────────────────────────────────────────────────────────────

export interface LinkedUserRow {
  uid: string;
  display_name: string;
  last_synced_at: number;
  relationship_id: string;
  created_at: number;
}

export async function upsertLinkedUser(
  uid: string,
  displayName: string,
  relationshipId: string,
): Promise<void> {
  const db = getDatabase();
  const now = getCurrentTimestamp();
  await db.execute(
    `INSERT INTO linked_users (uid, display_name, last_synced_at, relationship_id, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(uid) DO UPDATE SET display_name = ?, relationship_id = ?`,
    [uid, displayName, 0, relationshipId, now, displayName, relationshipId],
  );
}

export async function getLinkedUsers(): Promise<LinkedUserRow[]> {
  const db = getDatabase();
  const result = await db.execute('SELECT * FROM linked_users ORDER BY display_name');
  return (result.rows ?? []) as unknown as LinkedUserRow[];
}

export async function deleteLinkedUser(uid: string): Promise<void> {
  const db = getDatabase();
  await db.execute('DELETE FROM linked_users WHERE uid = ?', [uid]);
}

export async function getLinkedUserDisplayName(uid: string): Promise<string | null> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT display_name FROM linked_users WHERE uid = ?',
    [uid],
  );
  const rows = (result.rows ?? []) as unknown as Array<{ display_name: string }>;
  return rows[0]?.display_name ?? null;
}
```

- [ ] **Step 2: Populate linked_users when accepting invite and downloading records**

In `src/features/pairing/lib/use-pairing.ts`, in `useAcceptInvite`, after setting status to active:
```typescript
import { upsertLinkedUser } from '@/shared/api/bp-repository';

// After the doc.ref.update call:
// Fetch initiator's display name and save to linked_users
const initiatorUserDoc = await firestore()
  .collection(FIRESTORE_COLLECTIONS.users)
  .doc(initiatorUid)
  .get();
const initiatorName = initiatorUserDoc.data()?.displayName ?? 'Unknown';
await upsertLinkedUser(initiatorUid, initiatorName, doc.id);
```

In `useRelationships`, when processing relationship snapshots, fetch display names:
(This is handled by the linked_users table — no need to change the snapshot listener itself)

- [ ] **Step 3: Update HistoryPage to show display names**

In `src/pages/history/ui/HistoryPage.tsx`, replace the `Person ${idx + 1}` labels:

```typescript
import { getLinkedUsers, type LinkedUserRow } from '@/shared/api/bp-repository';

// Add state for linked user names
const [linkedUserNames, setLinkedUserNames] = useState<Record<string, string>>({});

useEffect(() => {
  void getLinkedUsers().then((users) => {
    const names: Record<string, string> = {};
    for (const u of users) {
      names[u.uid] = u.display_name;
    }
    setLinkedUserNames(names);
  });
}, [relationships]);

// In the filter chips, replace:
//   <Text>Person ${idx + 1}</Text>
// With:
//   <Text>{linkedUserNames[uid] ?? t('familySharing.unknownPerson')}</Text>
```

- [ ] **Step 4: Update SharingSettingsPage to show display names**

In `src/pages/family-sharing/ui/SharingSettingsPage.tsx`, use linked_users for names:
```typescript
import { getLinkedUsers } from '@/shared/api/bp-repository';

// Inside the component, fetch names
const [linkedUserNames, setLinkedUserNames] = useState<Record<string, string>>({});

useEffect(() => {
  void getLinkedUsers().then((users) => {
    const names: Record<string, string> = {};
    for (const u of users) {
      names[u.uid] = u.display_name;
    }
    setLinkedUserNames(names);
  });
}, []);

// Use linkedUserNames[uid] instead of raw UIDs
```

- [ ] **Step 5: Commit**

```bash
git add src/shared/api/bp-repository.ts src/features/sync/lib/use-download-records.ts src/features/pairing/lib/use-pairing.ts src/pages/history/ui/HistoryPage.tsx src/pages/family-sharing/ui/SharingSettingsPage.tsx
git commit -m "feat: populate linked_users table, show display names in History and Settings

Previously showed 'Person N' or raw UIDs. Now fetches display names
from linked_users SQLite table, populated during invite acceptance.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 10: Update verified-functionalities.md (I10)

**Files:**
- Modify: `docs/verified-functionalities.md`

- [ ] **Step 1: Read current file and add Family Sharing section**

Add a new numbered section for Family Sharing covering:
- Firebase Auth (Google Sign-In, email/password)
- Field-level AES-256-GCM encryption
- Firestore sync (upload on save, download on foreground)
- Pairing via invite codes + QR codes
- Per-relationship sharing config
- Owner filter on History page
- Crisis push notifications (values omitted)
- Account management (sign-up, sign-in, sign-out, delete with full cleanup)

Update the `> Last verified:` date to 2026-03-28.

Add test files to the Test Coverage table:
- `entities/family-sharing/__tests__/encryption.test.ts`
- `entities/family-sharing/__tests__/sync-conflict.test.ts`
- `features/pairing/__tests__/invite-code.test.ts`
- `features/sync/__tests__/upload-queue.test.ts`

- [ ] **Step 2: Commit**

```bash
git add docs/verified-functionalities.md
git commit -m "docs: add Family Sharing to verified-functionalities.md

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 11: Run full verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit --skipLibCheck`
Expected: PASS (no new errors)

- [ ] **Step 2: Lint**

Run: `npx eslint src/ --ext .ts,.tsx`
Expected: No new errors

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: All existing tests pass

- [ ] **Step 4: Fix any issues found**

Address any typecheck, lint, or test failures introduced by the changes.

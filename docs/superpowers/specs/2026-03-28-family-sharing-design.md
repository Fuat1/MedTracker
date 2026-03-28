# Family Sharing — Design Spec

**Date**: 2026-03-28
**Status**: Approved, ready for implementation planning
**Feature branch**: `feat/family-sharing` (to be created)

---

## Overview

Family Sharing allows multiple MedTracker users to link profiles and share BP records bidirectionally. Both parties can log readings that appear in a combined timeline. Each user controls what they share with each linked person and whether crisis alerts are sent.

The app remains **offline-first** — SQLite is still the source of truth. Firebase is a sync layer, not the primary store.

---

## Scope

**In scope:**
- Firebase Auth (Google Sign-In, email/password, phone/OTP)
- Field-level AES-256-GCM encryption of sensitive values before Firestore write
- Firestore sync of BP records (upload on save, download on foreground)
- Pairing via QR code / 6-char invite code (in-person) and email/phone invite (remote)
- Per-relationship sharing config (weight, notes, medications, tags, crisis alerts)
- Owner filter on History and Analytics pages (`Me | [Name] | All`)
- Crisis push notifications via FCM (values omitted from payload for privacy)
- Account management (sign-up, sign-in, sign-out, delete account)

**Out of scope:**
- Medication sync (medications stay local-only for now)
- Family chat / comments
- Admin/caregiver role with elevated permissions
- Web dashboard

---

## Architecture

### Data flow

```
Device A (SQLite)
  → encrypt sensitive fields (AES-256-GCM, master key from Keychain)
  → Firestore /records/{uid}/bp/{recordId}
  → Device B downloads, decrypts with relationship read key
  → Device B SQLite (owner_uid = A's UID)
```

### FSD placement

| Layer | Path | Responsibility |
|---|---|---|
| `entities` | `src/entities/family-sharing/` | Types, encryption utils, Firestore schema constants |
| `features` | `src/features/auth/` | Sign-in/up hooks, Firebase Auth mutations |
| `features` | `src/features/sync/` | Upload/download hooks, retry queue, conflict resolution |
| `features` | `src/features/pairing/` | Invite generation, acceptance, revocation hooks |
| `pages` | `src/pages/family-sharing/` | SharingSettingsPage, InvitePage, AcceptInvitePage, AuthPage |
| `app` | `src/app/` | AuthGate, deep link handler for `medtracker://invite?code=` |

### New packages required

| Package | Purpose |
|---|---|
| `@react-native-firebase/app` | Firebase core |
| `@react-native-firebase/auth` | Auth (Google, email, phone) |
| `@react-native-firebase/firestore` | Real-time sync |
| `@react-native-firebase/messaging` | FCM push notifications |
| `@react-native-firebase/functions` | Crisis alert Cloud Function call |
| `react-native-device-info` | Device fingerprint for key derivation |
| `react-native-qrcode-svg` | QR code generation for invite |

QR scanning: use native camera app (user saves/shares QR image, scans with system camera → deep link). No dedicated scanner library needed.

---

## Auth

### Sign-in methods

| Method | Library | Notes |
|---|---|---|
| Google | `@react-native-google-signin/google-signin` (already installed) | One tap; passes token to Firebase Auth |
| Email/password | Firebase Auth built-in | Email verification required before pairing |
| Phone/OTP | Firebase Phone Auth | SMS code; no password |

### AuthGate

Wraps the root navigator. Unauthenticated users see `AuthPage` with three tabs. Authenticated users see the normal app. Family sharing features are gated behind auth; users who never sign in continue using the app as today (no forced login).

### Firestore user document

```
/users/{uid}
  displayName: string
  email?: string
  phone?: string
  encryptedMasterKey: string   ← master key encrypted with device-derived secret
  fcmToken: string             ← updated on each launch for push delivery
  createdAt: timestamp
  lastActiveAt: timestamp
```

### Account deletion

Deletes `/users/{uid}`, revokes all active relationships, wipes all `/records/{uid}/bp/*`, removes local Firebase token. Local SQLite data is preserved (user keeps their own history).

---

## Encryption

### Master key

- AES-256-GCM symmetric key generated on first sign-in
- Stored in Keychain via `react-native-keychain` (already installed)
- Backup: encrypted with `SHA-256(firebaseUID + deviceId)` and stored as `encryptedMasterKey` in `/users/{uid}` — recoverable on new device after re-authentication
- Never transmitted in plaintext

### Encrypted fields

| Field | Encrypted |
|---|---|
| `systolic`, `diastolic`, `pulse` | ✅ |
| `weight` | ✅ |
| `notes` | ✅ |
| `tags` (array of tag keys) | ✅ |
| `timestamp` | ❌ (needed for Firestore ordering) |
| `location`, `posture` | ❌ (low sensitivity, needed for filtering) |

### Sharing / read keys

When a pairing is accepted, User A derives a **read key** for User B:
```
readKey = HKDF(masterKey, salt = B_uid, info = "medtracker-share-v1")
```
This read key is stored encrypted in the relationship doc. B stores A's read key in Keychain, keyed by A's UID. A's master key is never shared.

### Crypto implementation

Uses Hermes's built-in `crypto` (`SubtleCrypto`) available in React Native 0.76+. No new native crypto dependency. `react-native-get-random-values` (already installed) provides `getRandomValues` polyfill for key generation.

---

## Firestore Schema

### BP records

```
/records/{uid}/bp/{recordId}
  systolic_enc:   string        ← AES-GCM encrypted, base64
  diastolic_enc:  string
  pulse_enc:      string | null
  weight_enc:     string | null
  notes_enc:      string | null
  tags_enc:       string        ← encrypted JSON array
  timestamp:      number        ← Unix seconds, plaintext
  location:       string        ← plaintext
  posture:        string        ← plaintext
  updatedAt:      Timestamp     ← for conflict resolution
  deleted:        boolean       ← soft delete for sync propagation
```

### Relationships

```
/relationships/{relationshipId}
  initiatorUid:      string
  recipientUid:      string | null     ← null until accepted
  status:            'pending' | 'active' | 'revoked'
  inviteCode:        string            ← 6-char alphanumeric, expires 24h
  inviteEmail?:      string
  invitePhone?:      string
  createdAt:         Timestamp
  expiresAt:         Timestamp
  initiatorReadKey:  string            ← recipient's read key for initiator's records, encrypted
  recipientReadKey:  string | null     ← initiator's read key for recipient's records, encrypted
  initiatorSharing:  SharingConfig
  recipientSharing:  SharingConfig
```

### SharingConfig type

```typescript
interface SharingConfig {
  shareWeight: boolean        // default: false
  shareNotes: boolean         // default: false
  shareMedications: boolean   // default: false
  shareTags: boolean          // default: false
  crisisAlertsEnabled: boolean // default: false — controlled by the sharer
}
```

---

## Sync

### Upload (local → Firestore)

- Triggered fire-and-forget after `useRecordBP`, `useEditBP`, `useDeleteBP` succeed
- Encrypts sensitive fields, upserts to `/records/{uid}/bp/{id}`
- Sets `is_synced = 1` on local record on success
- On failure: adds to retry queue (Zustand store persisted to AsyncStorage), retried on next foreground event

### Download (Firestore → local)

- Triggered on sign-in and `AppState` change to `active`
- Per linked user: fetches records where `updatedAt > lastSyncedAt` (stored per-relationship in settings store)
- Decrypts with the relationship read key stored in Keychain
- Upserts to local SQLite with `owner_uid = linkedUserUid`
- Conflict resolution: `updatedAt` (Firestore timestamp) wins — newer record overwrites

### Local schema migration

```sql
-- New column to identify which linked user owns a record (null = local user)
ALTER TABLE bp_records ADD COLUMN owner_uid TEXT;
```

Existing records get `owner_uid = NULL` (treated as local user's own records throughout the app).

---

## Pairing

### Method 1 — QR / invite code (in-person)

1. User A taps "Add Person" → app creates pending relationship in Firestore, generates 6-char code + QR
2. QR encodes deep link: `medtracker://invite?code=XXXXXX`
3. User B scans QR with system camera (opens deep link) or types code manually
4. App shows: "Accept invite from [A's displayName]?" with accept/decline
5. On accept: relationship status → `active`; read keys exchanged and stored

### Method 2 — Email / phone invite (remote)

1. User A enters B's email or phone number
2. Firebase Cloud Function sends email/SMS with deep link: `medtracker://invite?code=XXXXXX`
3. If B has app → deep link opens `AcceptInvitePage` directly
4. If B doesn't have app → link goes to App Store/Play Store; code preserved in referral URL, auto-fills on first launch
5. Same accept flow as Method 1

### Invite expiry

Pending invites expire after 24 hours. Expired relationships are cleaned up by a scheduled Cloud Function (daily).

### Unpairing

Either party can revoke. On revocation:
- Relationship status → `revoked`
- Read keys removed from Firestore relationship doc
- **Both devices** listen to the relationship doc via a Firestore snapshot listener; when status → `revoked`, each device independently deletes the other person's records from local SQLite (`DELETE WHERE owner_uid = revokedUid`) and removes the read key from Keychain
- Local `is_synced` flags unaffected (own records stay)
- If the other device is offline, cleanup runs the next time it comes online and the listener fires

---

## Family Timeline

No new tab. Existing History and Analytics pages get an **owner filter chip row**:

```
[ Me ]  [ Maria ]  [ All ]
```

- `Me` — filters `WHERE owner_uid IS NULL` (default, existing behavior unchanged)
- `[Name]` — filters `WHERE owner_uid = linkedUid`; only shows fields the linked user has enabled in their SharingConfig
- `All` — merges all owners; each record card shows a small initial badge (e.g. "M" for Maria)

Fields the linked user has disabled in SharingConfig are replaced with `—` rather than hidden entirely, so the record structure is visible but private values are clear.

---

## Sharing Settings Page

Route: `Settings → Family Sharing → SharingSettingsPage`

```
Family Sharing
├── My Account
│   ├── [Name / email / phone]
│   ├── Sign Out                    [ghost button]
│   └── Delete Account             [destructive button]
│
├── Linked People
│   └── [Person card] →
│       ├── Crisis alerts           [toggle]  ← do I alert them when I have a crisis?
│       ├── Share my weight         [toggle]
│       ├── Share my notes          [toggle]
│       ├── Share my medications    [toggle]
│       ├── Share my tags           [toggle]
│       └── Remove connection       [destructive button]
│
└── Add Person                      [primary button → InvitePage]
```

Each toggle change writes immediately to `initiatorSharing` or `recipientSharing` in the relationship doc. Redacted fields are not re-encrypted retroactively — they are simply omitted from the next sync upload and ignored during download.

---

## Crisis Push Notifications

**Trigger:** BP record saved with `systolic >= 180 OR diastolic >= 120`

**Flow:**
1. `useRecordBP` detects crisis threshold after successful local save
2. Calls Firebase Cloud Function `sendCrisisAlert(ownerUid, recordId)`
3. Function queries active relationships where `crisisAlertsEnabled = true` for this owner
4. Sends FCM notification to each linked user's `fcmToken`:

```json
{
  "title": "High BP Alert",
  "body": "Maria logged a reading that may need attention.",
  "data": { "type": "crisis", "ownerUid": "..." }
}
```

Values omitted from push payload for privacy. Recipient taps notification → app opens to that person's History tab (filtered by `owner_uid`).

**FCM token management:** Updated in `/users/{uid}.fcmToken` on each app launch via `messaging().getToken()`.

---

## Testing

| Test file | What it covers |
|---|---|
| `entities/family-sharing/__tests__/encryption.test.ts` | encrypt/decrypt round-trip, HKDF read key derivation, key serialization |
| `entities/family-sharing/__tests__/sync-conflict.test.ts` | conflict resolution (updatedAt wins, soft delete propagation) |
| `features/pairing/__tests__/invite-code.test.ts` | code generation uniqueness, expiry logic |
| `features/sync/__tests__/upload-queue.test.ts` | retry queue: add, retry, clear on success |

Firebase Auth, Firestore, and FCM are mocked in tests (no real network calls).

---

## New packages summary

```bash
npm install \
  @react-native-firebase/app \
  @react-native-firebase/auth \
  @react-native-firebase/firestore \
  @react-native-firebase/messaging \
  @react-native-firebase/functions \
  react-native-device-info \
  react-native-qrcode-svg

cd ios && pod install
```

Firebase project setup (done once by developer, not automated):
1. Create Firebase project at console.firebase.google.com
2. Enable Auth (Google, Email/Password, Phone)
3. Enable Firestore (production mode)
4. Enable Cloud Functions (requires Blaze plan — pay-as-you-go, free tier covers typical usage)
5. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) to project

---

## Open questions / future work

- **Multi-device support for same user**: If a user reinstalls on a new phone, key recovery via `encryptedMasterKey` in Firestore covers this, but we should test the recovery path explicitly before shipping.
- **Medications sync**: Kept local-only for now. Firestore schema can accommodate `/records/{uid}/medications/` in a future iteration.
- **Maximum linked people**: No hard limit in this design; practically 5-10 is reasonable. Can add a limit later if needed.

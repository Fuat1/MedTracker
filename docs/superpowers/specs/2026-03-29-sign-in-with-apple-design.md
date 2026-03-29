# Sign in with Apple — Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

Add Sign in with Apple as a third authentication option in the Family Sharing auth flow, alongside existing Google and Email/Password methods. Required for App Store compliance when any third-party social login (Google) is present.

---

## Dependencies

**New package:** `@invertase/react-native-apple-authentication`

- iOS 13+ only
- Requires `pod install` after install
- Requires "Sign in with Apple" capability in Xcode + Apple Developer Portal
- Firebase Console: enable Apple as auth provider (Apple Team ID + Service ID)

---

## Architecture

No new files. Changes to 4 existing locations:

| File | Change |
|---|---|
| `src/features/auth/lib/use-firebase-auth.ts` | Add `signInWithApple()`, export in result type |
| `src/pages/auth/ui/AuthPage.tsx` | Add Apple tab (iOS-only), extend `AuthTab` type |
| `src/shared/config/locales/en/pages.json` | Add `tabApple`, `signInWithApple` strings |
| `src/features/auth/index.ts` | No change needed (already re-exports hook) |

---

## Auth Flow

```
iOS user taps "Apple" tab
  → taps "Sign in with Apple" button
  → Native Apple sheet (Face ID / Touch ID)
  → Apple returns: identity token + optional name/email (first sign-in only)
  → appleAuth.getCredentialStateForUser() — verify credential is authorized
  → auth.AppleAuthProvider.credential(identityToken, nonce)
  → auth().signInWithCredential(credential)
  → onAuthStateChanged fires
  → ensureMasterKey(uid) runs (same path as Google/Email)
```

**Display name:** Apple sends name only on first sign-in. Captured and stored via `updateProfile({ displayName })`. Subsequent sign-ins fall back to existing Firebase profile name.

**Nonce:** A SHA-256 hashed nonce is required by Apple to prevent replay attacks. Generated per-request, raw nonce passed to Firebase credential, hashed nonce passed to Apple.

---

## UI Changes

### Tab row (iOS only shows Apple tab)

```
Android:  [ Google ]  [ Email ]
iOS:      [ Google ]  [ Apple ]  [ Email ]
```

- `AuthTab` type: `'google' | 'apple' | 'email'`
- Default `activeTab` stays `'google'`
- Apple tab hidden on Android via `Platform.OS === 'ios'` filter on tab render

### Apple tab content

Single button, mirrors Google tab:
```
[ logo-apple icon ]  Sign in with Apple
```

Uses existing `Button` (variant="primary"), `ButtonIcon`, `ButtonText` components.

---

## i18n (English only)

Add to `src/shared/config/locales/en/pages.json` under `auth`:

```json
"tabApple": "Apple",
"signInWithApple": "Sign in with Apple"
```

---

## Error Handling

- User cancels Apple sheet → catch `AppleAuthError.CANCELED`, silently ignore (no error shown)
- All other errors → set `error` state (same pattern as Google)
- `appleAuth.isSupported` check guards the flow — if somehow called on Android, logs a warning and returns

---

## Platform Guard

Apple Sign-In is iOS-only at both the UI and code level:

- UI: Apple tab only rendered when `Platform.OS === 'ios'`
- Hook: `signInWithApple` checks `appleAuth.isSupported` before proceeding
- No Android native code changes needed

---

## Out of Scope

- Android Apple Sign-In (not supported by Apple)
- Silent re-authentication / credential refresh
- Revoking Apple token on account deletion (nice-to-have, future work)

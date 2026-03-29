# Sign in with Apple Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sign in with Apple as a third auth tab (iOS-only) in the Family Sharing auth flow, using `@invertase/react-native-apple-authentication` + Firebase.

**Architecture:** Install the Apple auth package, add a `signInWithApple()` function to the existing `useFirebaseAuth` hook using a SHA-256 nonce flow, then extend the `AuthPage` UI with a third "Apple" tab rendered only on iOS.

**Tech Stack:** `@invertase/react-native-apple-authentication`, `@react-native-firebase/auth`, React Native CLI, TypeScript strict

---

## File Map

| File | Action |
|---|---|
| `package.json` | Add `@invertase/react-native-apple-authentication` |
| `ios/Podfile.lock` | Updated by pod install |
| `src/features/auth/lib/use-firebase-auth.ts` | Add `signInWithApple()`, update `UseFirebaseAuthResult` type |
| `src/pages/auth/ui/AuthPage.tsx` | Add Apple tab + button, extend `AuthTab` type |
| `src/shared/config/locales/en/pages.json` | Add `tabApple` and `signInWithApple` strings |

---

### Task 1: Install the package

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install the package**

```bash
npm install @invertase/react-native-apple-authentication
```

Expected output: package added to `node_modules` and `package.json`.

- [ ] **Step 2: Run pod install (iOS)**

```bash
cd ios && pod install && cd ..
```

Expected: Pods installed/updated, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json ios/Podfile.lock
git commit -m "chore: install react-native-apple-authentication"
```

---

### Task 2: Add i18n strings

**Files:**
- Modify: `src/shared/config/locales/en/pages.json`

- [ ] **Step 1: Add the two new strings**

In `src/shared/config/locales/en/pages.json`, find the `"auth"` section and add `tabApple` and `signInWithApple` after `tabEmail`:

```json
"auth": {
  "title": "Family Sharing",
  "subtitle": "Sign in to share readings with family members",
  "tabGoogle": "Google",
  "tabApple": "Apple",
  "tabEmail": "Email",
  "signInWithGoogle": "Sign in with Google",
  "signInWithApple": "Sign in with Apple",
  "emailLabel": "Email",
  "passwordLabel": "Password",
  "displayNameLabel": "Your name",
  "signIn": "Sign In",
  "signUp": "Create Account",
  "switchToSignUp": "Don't have an account? Sign up",
  "switchToSignIn": "Already have an account? Sign in",
  "skipForNow": "Skip for now",
  "emailVerificationSent": "Verification email sent. Check your inbox before signing in.",
  "errorGeneric": "Authentication failed. Please try again."
}
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/config/locales/en/pages.json
git commit -m "feat(i18n): add Sign in with Apple strings"
```

---

### Task 3: Add `signInWithApple` to the auth hook

**Files:**
- Modify: `src/features/auth/lib/use-firebase-auth.ts`

- [ ] **Step 1: Add the import at the top of the file**

After the existing imports, add:

```typescript
import appleAuth from '@invertase/react-native-apple-authentication';
```

- [ ] **Step 2: Add `signInWithApple` to the `UseFirebaseAuthResult` interface**

Replace:
```typescript
export interface UseFirebaseAuthResult {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}
```

With:
```typescript
export interface UseFirebaseAuthResult {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}
```

- [ ] **Step 3: Add the `signInWithApple` implementation**

Add this function inside `useFirebaseAuth`, after the `signInWithGoogle` callback and before `signInWithEmail`:

```typescript
const signInWithApple = useCallback(async () => {
  setError(null);
  if (!appleAuth.isSupported) {
    return;
  }
  try {
    const appleAuthResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
    });

    const credentialState = await appleAuth.getCredentialStateForUser(
      appleAuthResponse.user,
    );
    if (credentialState !== appleAuth.State.AUTHORIZED) {
      throw new Error('Apple credential not authorized');
    }

    const { identityToken, nonce, fullName } = appleAuthResponse;
    if (!identityToken) {
      throw new Error('Apple Sign-In did not return an identity token');
    }

    const credential = auth.AppleAuthProvider.credential(identityToken, nonce);
    const { user: firebaseUser } = await auth().signInWithCredential(credential);

    // Apple only sends name on first sign-in — capture it if present
    const givenName = fullName?.givenName ?? '';
    const familyName = fullName?.familyName ?? '';
    const displayName = [givenName, familyName].filter(Boolean).join(' ');
    if (displayName && !firebaseUser.displayName) {
      await firebaseUser.updateProfile({ displayName });
    }
  } catch (e: unknown) {
    // Silently ignore user cancellation
    if (
      e instanceof Error &&
      'code' in e &&
      (e as { code: string }).code === '1000'
    ) {
      return;
    }
    setError(e instanceof Error ? e.message : 'Apple Sign-In failed');
  }
}, []);
```

- [ ] **Step 4: Add `signInWithApple` to the return value**

Find the return statement at the bottom of `useFirebaseAuth` and add `signInWithApple`:

```typescript
return { user, isLoading, error, signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, signOut, deleteAccount };
```

- [ ] **Step 5: Run type check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors related to the auth hook.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/lib/use-firebase-auth.ts
git commit -m "feat(auth): add signInWithApple to useFirebaseAuth hook"
```

---

### Task 4: Update the AuthPage UI

**Files:**
- Modify: `src/pages/auth/ui/AuthPage.tsx`

- [ ] **Step 1: Add Platform import and update AuthTab type**

At the top of [AuthPage.tsx](src/pages/auth/ui/AuthPage.tsx), `Platform` is already imported from `react-native`. If it is not, add it.

Change the `AuthTab` type from:
```typescript
type AuthTab = 'google' | 'email';
```
To:
```typescript
type AuthTab = 'google' | 'apple' | 'email';
```

- [ ] **Step 2: Destructure `signInWithApple` from the hook**

Find:
```typescript
const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, isLoading } =
  useFirebaseAuth();
```

Replace with:
```typescript
const { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, error, isLoading } =
  useFirebaseAuth();
```

- [ ] **Step 3: Add the Apple tab button in the tab row**

Find the tab row section:
```tsx
<Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tabs}>
  <TabButton
    label={t('auth.tabGoogle')}
    active={activeTab === 'google'}
    onPress={() => setActiveTab('google')}
    colors={colors}
    fontScale={fontScale}
  />
  <TabButton
    label={t('auth.tabEmail')}
    active={activeTab === 'email'}
    onPress={() => setActiveTab('email')}
    colors={colors}
    fontScale={fontScale}
  />
</Animated.View>
```

Replace with:
```tsx
<Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.tabs}>
  <TabButton
    label={t('auth.tabGoogle')}
    active={activeTab === 'google'}
    onPress={() => setActiveTab('google')}
    colors={colors}
    fontScale={fontScale}
  />
  {Platform.OS === 'ios' && (
    <TabButton
      label={t('auth.tabApple')}
      active={activeTab === 'apple'}
      onPress={() => setActiveTab('apple')}
      colors={colors}
      fontScale={fontScale}
    />
  )}
  <TabButton
    label={t('auth.tabEmail')}
    active={activeTab === 'email'}
    onPress={() => setActiveTab('email')}
    colors={colors}
    fontScale={fontScale}
  />
</Animated.View>
```

- [ ] **Step 4: Add Apple tab content in the card body**

Find:
```tsx
{activeTab === 'google' ? (
  <Button
    variant="primary"
    size="lg"
    onPress={signInWithGoogle}
    isLoading={isLoading}
    style={styles.fullWidth}
  >
    <ButtonIcon as={Icon} name="logo-google" />
    <ButtonText>{t('auth.signInWithGoogle')}</ButtonText>
  </Button>
) : (
```

Replace with:
```tsx
{activeTab === 'google' ? (
  <Button
    variant="primary"
    size="lg"
    onPress={signInWithGoogle}
    isLoading={isLoading}
    style={styles.fullWidth}
  >
    <ButtonIcon as={Icon} name="logo-google" />
    <ButtonText>{t('auth.signInWithGoogle')}</ButtonText>
  </Button>
) : activeTab === 'apple' ? (
  <Button
    variant="primary"
    size="lg"
    onPress={signInWithApple}
    isLoading={isLoading}
    style={styles.fullWidth}
  >
    <ButtonIcon as={Icon} name="logo-apple" />
    <ButtonText>{t('auth.signInWithApple')}</ButtonText>
  </Button>
) : (
```

- [ ] **Step 5: Run type check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors.

- [ ] **Step 6: Run lint**

```bash
npx eslint src/pages/auth/ui/AuthPage.tsx src/features/auth/lib/use-firebase-auth.ts --ext .ts,.tsx
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/auth/ui/AuthPage.tsx
git commit -m "feat(auth): add Sign in with Apple tab to AuthPage (iOS only)"
```

---

### Task 5: Manual verification checklist

These steps require a physical iOS device or simulator (iOS 13+).

- [ ] **Step 1: Build iOS**

```bash
npm run ios
```

Expected: app launches without crash.

- [ ] **Step 2: Navigate to Family Sharing auth screen**

Go to Settings → Family Sharing → enable it → auth screen appears.

Expected: three tabs visible — Google, Apple, Email.

- [ ] **Step 3: Verify Apple tab tap**

Tap the Apple tab.

Expected: "Sign in with Apple" button appears with apple logo icon.

- [ ] **Step 4: Verify Apple sign-in sheet**

Tap "Sign in with Apple".

Expected: native Apple authentication sheet appears (Face ID / Touch ID prompt).

- [ ] **Step 5: Verify cancel behaviour**

Cancel the Apple sheet.

Expected: no error message shown, user stays on auth screen.

- [ ] **Step 6: Verify Android — no Apple tab**

Build and run on Android:
```bash
npm run android
```

Expected: only two tabs — Google and Email. Apple tab is not visible.

- [ ] **Step 7: Commit verified state and update verified-functionalities.md**

In `docs/verified-functionalities.md`, add under the auth/family sharing section:

> **Sign in with Apple (iOS):** Available as a third auth tab on iOS 13+. Uses `@invertase/react-native-apple-authentication` + Firebase Apple provider. Tab is hidden on Android. User cancellation is silent (no error shown). Display name captured on first sign-in only.

```bash
git add docs/verified-functionalities.md
git commit -m "docs: mark Sign in with Apple as verified"
```

---

## External Setup (Manual — outside this codebase)

These steps must be done by the developer in external portals before the Apple tab will work end-to-end:

1. **Apple Developer Portal:** Add "Sign in with Apple" capability to your App ID
2. **Xcode:** Enable "Sign in with Apple" in the app target's Signing & Capabilities tab
3. **Firebase Console:** Authentication → Sign-in method → Apple → enable, enter Apple Team ID and Service ID

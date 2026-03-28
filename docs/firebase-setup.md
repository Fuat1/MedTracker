# Firebase Project Setup

Manual steps to perform once in the Firebase Console before building the Family Sharing feature.

---

## 1. Create the Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**
3. Name it `MedTracker` (or your preferred name)
4. Disable Google Analytics (not needed) → **Create project**

---

## 2. Register Android App

1. In the project overview, click the **Android** icon (Add app)
2. **Android package name**: `com.medtracker` (match `android/app/build.gradle` → `applicationId`)
3. **App nickname**: `MedTracker Android`
4. **Debug signing certificate SHA-1** (required for Google Sign-In):
   ```bash
   cd android && ./gradlew signingReport
   # Copy the SHA1 from the "debug" variant
   ```
5. Click **Register app**
6. Download `google-services.json` → place it at `android/app/google-services.json`
7. Skip the "Add Firebase SDK" step (handled by npm packages)

---

## 3. Register iOS App

1. Click **Add app** → **iOS** icon
2. **iOS bundle ID**: `com.medtracker` (match `ios/MedTracker/Info.plist` → `CFBundleIdentifier`)
3. **App nickname**: `MedTracker iOS`
4. Click **Register app**
5. Download `GoogleService-Info.plist` → place it at `ios/MedTracker/GoogleService-Info.plist`
   - In Xcode: right-click `MedTracker` group → **Add Files to "MedTracker"** → select the plist, ensure **Copy items if needed** is checked
6. Skip the "Add Firebase SDK" step (handled by CocoaPods)

---

## 4. Enable Authentication

1. In the Firebase Console sidebar: **Build → Authentication**
2. Click **Get started**
3. Enable **Google** sign-in provider:
   - Toggle **Enable**
   - Set **Project support email** (your email)
   - Click **Save**
4. Enable **Email/Password** sign-in provider:
   - Toggle **Enable**
   - Leave **Email link (passwordless sign-in)** disabled
   - Click **Save**

---

## 5. Enable Firestore

1. In the sidebar: **Build → Firestore Database**
2. Click **Create database**
3. Select **Production mode** (start with strict rules)
4. Choose a region close to your users (e.g., `europe-west1` for EU, `us-central` for US)
5. Click **Enable**
6. Go to **Rules** tab and replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own user doc
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Users can only read/write their own BP records
    match /records/{uid}/bp/{recordId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Relationship docs: initiator or recipient can read/write
    match /relationships/{relationshipId} {
      allow read, write: if request.auth != null &&
        (resource.data.initiatorUid == request.auth.uid ||
         resource.data.recipientUid == request.auth.uid);
      // Allow creating new relationships (initiatorUid must match caller)
      allow create: if request.auth != null &&
        request.resource.data.initiatorUid == request.auth.uid;
    }

    // Linked users can read each other's records (via relationship)
    // Cloud Functions handle cross-user read access for linked records
  }
}
```

7. Click **Publish**

---

## 6. Enable Cloud Functions

1. In the sidebar: **Build → Functions**
2. Click **Get started** — you must upgrade to the **Blaze (pay-as-you-go)** plan
   - Click **Upgrade project** → follow billing setup (Google Cloud billing account required)
   - Free tier: 2M invocations/month, more than enough for personal use
3. After upgrading, Functions will be enabled. The actual functions are deployed from the `functions/` directory in this repo (see Step 9 of the implementation plan)

---

## 7. Enable Cloud Messaging (FCM)

FCM is enabled automatically for all Firebase projects. No manual steps needed.

To get the **Server Key** (used by Cloud Functions to send push notifications):
1. In the sidebar: **Project settings** (gear icon)
2. **Cloud Messaging** tab
3. Note the **Server key** — this is automatically available to Cloud Functions via the Admin SDK, no manual configuration needed

---

## 8. Google Sign-In Configuration

For Google Sign-In to work, you need the **Web Client ID** from Firebase:

1. In the sidebar: **Project settings** → **General** tab
2. Scroll to **Your apps** → find the Web API key
   - Alternatively: **Authentication → Sign-in method → Google → Web SDK configuration → Web client ID**
3. Copy the **Web client ID** (format: `XXXXX.apps.googleusercontent.com`)
4. Add it to your app config in `src/shared/config/firebase.ts`:

```typescript
export const GOOGLE_SIGN_IN_WEB_CLIENT_ID =
  'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```

**Android additional step**: In `android/app/build.gradle`, ensure the SHA-1 fingerprint you provided in step 2 is correct. For release builds, also add the release SHA-1:
```bash
keytool -list -v -keystore android/app/release.keystore
```

---

## 9. Verification Checklist

Before running the app:

- [ ] `android/app/google-services.json` exists and has the correct package name
- [ ] `ios/MedTracker/GoogleService-Info.plist` exists and is added to Xcode project
- [ ] Authentication: Google + Email/Password enabled
- [ ] Firestore: created in Production mode, security rules published
- [ ] Cloud Functions: Blaze plan enabled
- [ ] `GOOGLE_SIGN_IN_WEB_CLIENT_ID` set in `src/shared/config/firebase.ts`
- [ ] `cd ios && pod install` run after adding GoogleService-Info.plist

---

## 10. Local Development Notes

- Use the Firebase **Emulator Suite** for local testing (optional but recommended):
  ```bash
  npm install -g firebase-tools
  firebase login
  firebase init emulators  # select Auth, Firestore, Functions
  firebase emulators:start
  ```
- Set `FIREBASE_EMULATOR=true` in your `.env.local` to point the app at local emulators during development

# Firebase Native Configuration

Steps to wire Firebase packages into Android and iOS native projects.
Run these AFTER completing `docs/firebase-setup.md`.

---

## 1. Install npm packages

```bash
npm install \
  @react-native-firebase/app \
  @react-native-firebase/auth \
  @react-native-firebase/firestore \
  @react-native-firebase/messaging \
  @react-native-firebase/functions \
  react-native-device-info \
  react-native-qrcode-svg
```

---

## 2. Android configuration

### 2a. Root `android/build.gradle`

Add the Google Services classpath inside `buildscript.dependencies`:

```groovy
dependencies {
    classpath("com.android.tools.build:gradle")
    classpath("com.facebook.react:react-native-gradle-plugin")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin")
    // ADD THIS:
    classpath("com.google.gms:google-services:4.4.2")
}
```

### 2b. App `android/app/build.gradle`

At the **very top** of the file, after the existing `apply plugin` lines, add:

```groovy
apply plugin: "com.google.gms.google-services"
```

Full top section should look like:
```groovy
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"
apply plugin: "com.facebook.react"
apply plugin: "com.google.gms.google-services"    // ← ADD
```

### 2c. Place config file

Ensure `android/app/google-services.json` is present (downloaded from Firebase Console).

### 2d. AndroidManifest.xml — FCM

Add notification permission and FCM service declaration inside `<manifest>`:

```xml
<!-- FCM notification permission (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

React Native Firebase auto-registers the `FirebaseMessagingService` via its own manifest merge, so no manual service declaration is needed.

---

## 3. iOS configuration

### 3a. Podfile — no changes needed

React Native Firebase auto-links via CocoaPods. The `Podfile` does not need manual edits.

### 3b. Place config file

Ensure `ios/MedTracker/GoogleService-Info.plist` is present and added to the Xcode project (right-click → Add Files, "Copy items if needed" checked).

### 3c. AppDelegate configuration

In `ios/MedTracker/AppDelegate.swift` (or `.mm`), add Firebase initialization:

**Swift (`AppDelegate.swift`):**
```swift
import Firebase   // ADD at top

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
  func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()   // ADD before other setup
    // ... existing code ...
    return true
  }
}
```

**Objective-C (`AppDelegate.mm`):**
```objc
#import <Firebase.h>   // ADD at top

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  [FIRApp configure];   // ADD as first line in this method
  // ... existing code ...
}
```

### 3d. Capabilities (Xcode)

1. Open `ios/MedTracker.xcworkspace` in Xcode
2. Select the `MedTracker` target → **Signing & Capabilities**
3. Click **+ Capability** and add:
   - **Push Notifications**
   - **Background Modes** → check **Remote notifications**

### 3e. pod install

```bash
cd ios && pod install
```

---

## 4. Verify installation

```bash
# Android
npm run android

# iOS
npm run ios
```

If Firebase initialises correctly, you'll see no errors in Metro logs. If you see "Firebase: No Firebase App '[DEFAULT]' has been created" it means the config files are missing or not linked correctly.

---

## 5. Google Sign-In additional setup

`@react-native-google-signin/google-signin` is already installed. Configure it with the Web Client ID from Firebase Console:

In `src/shared/config/firebase.ts`, replace:
```typescript
export const GOOGLE_SIGN_IN_WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';
```
with your actual Web Client ID.

The `useFirebaseAuth` hook (in `features/auth/`) calls `GoogleSignin.configure()` on mount using this value.

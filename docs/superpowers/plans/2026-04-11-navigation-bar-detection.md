# Navigation Bar Detection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detect whether the device uses gesture navigation or 3-button software navigation and add extra padding to the CustomTabBar and MedicationsPage list so no UI is obscured.

**Architecture:** A small native module (`NavigationBarModule`) lives in Android Kotlin and iOS Swift. A typed TypeScript wrapper calls it once on app start; `useNavigationMode` caches the result module-level so subsequent renders pay zero async cost. `CustomTabBar` and `MedicationPage` consume the hook and add `NAV_BUTTON_BAR_EXTRA` (16dp) when `mode === 'buttons'`. All other tab screens (HomePage, HistoryPage) already use `useBottomTabBarHeight()` which auto-propagates when the CustomTabBar grows taller.

**Tech Stack:** React Native CLI 0.76+, New Architecture, Kotlin, Swift, Objective-C bridge, FSD shared layer

---

### Task 1: Layout constant + TypeScript files

**Files:**
- Create: `src/shared/config/layout.ts`
- Create: `src/shared/lib/native-navigation-bar.ts`
- Create: `src/shared/lib/use-navigation-mode.ts`
- Create: `src/shared/lib/__tests__/use-navigation-mode.test.ts`
- Modify: `src/shared/config/index.ts` — add `export * from './layout'`
- Modify: `src/shared/lib/index.ts` — add exports for hook and wrapper

- [ ] **Step 1: Create `src/shared/config/layout.ts`**

```typescript
/** Extra bottom padding (dp) added to tab bar and list content when the device
 *  uses 3-button software navigation. Safe-area-context already accounts for the
 *  nav bar height in insets.bottom — this is a visual breathing-room buffer. */
export const NAV_BUTTON_BAR_EXTRA = 16;
```

- [ ] **Step 2: Add layout export to `src/shared/config/index.ts`**

Add at the end of the file (after the existing exports):
```typescript
// Layout constants
export * from './layout';
```

- [ ] **Step 3: Create `src/shared/lib/native-navigation-bar.ts`**

```typescript
import { NativeModules } from 'react-native';

export type NavigationMode = 'gesture' | 'buttons' | 'unknown';

const { NavigationBarModule } = NativeModules as {
  NavigationBarModule?: { getNavigationMode(): Promise<string> };
};

export function getNativeNavigationMode(): Promise<NavigationMode> {
  if (!NavigationBarModule) {
    return Promise.resolve('unknown');
  }
  return NavigationBarModule.getNavigationMode().then(result => {
    if (result === 'gesture' || result === 'buttons') {
      return result as NavigationMode;
    }
    return 'unknown';
  });
}
```

- [ ] **Step 4: Create `src/shared/lib/use-navigation-mode.ts`**

```typescript
import { useState, useEffect } from 'react';
import { getNativeNavigationMode, type NavigationMode } from './native-navigation-bar';

// Module-level cache — survives re-renders, reset on fresh JS bundle load only.
let cachedMode: NavigationMode | null = null;

export function useNavigationMode(): { mode: NavigationMode; loading: boolean } {
  const [mode, setMode] = useState<NavigationMode>(cachedMode ?? 'unknown');
  const [loading, setLoading] = useState(cachedMode === null);

  useEffect(() => {
    if (cachedMode !== null) {
      return;
    }
    getNativeNavigationMode().then(result => {
      cachedMode = result;
      setMode(result);
      setLoading(false);
    });
  }, []);

  return { mode, loading };
}
```

- [ ] **Step 5: Write test before verifying it passes**

Create `src/shared/lib/__tests__/use-navigation-mode.test.ts` (write this before running — tests exercise the wrapper that was just created in steps 3–4):

```typescript
/**
 * Tests for useNavigationMode hook.
 * Uses jest.resetModules() to clear the module-level cache between tests.
 */

describe('getNativeNavigationMode', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns "unknown" when NavigationBarModule is not present', async () => {
    jest.mock('react-native', () => ({
      NativeModules: {},
    }));
    const { getNativeNavigationMode } = await import('../native-navigation-bar');
    const result = await getNativeNavigationMode();
    expect(result).toBe('unknown');
  });

  it('returns "gesture" when module resolves "gesture"', async () => {
    jest.mock('react-native', () => ({
      NativeModules: {
        NavigationBarModule: {
          getNavigationMode: jest.fn().mockResolvedValue('gesture'),
        },
      },
    }));
    const { getNativeNavigationMode } = await import('../native-navigation-bar');
    const result = await getNativeNavigationMode();
    expect(result).toBe('gesture');
  });

  it('returns "buttons" when module resolves "buttons"', async () => {
    jest.mock('react-native', () => ({
      NativeModules: {
        NavigationBarModule: {
          getNavigationMode: jest.fn().mockResolvedValue('buttons'),
        },
      },
    }));
    const { getNativeNavigationMode } = await import('../native-navigation-bar');
    const result = await getNativeNavigationMode();
    expect(result).toBe('buttons');
  });

  it('returns "unknown" for unexpected string values', async () => {
    jest.mock('react-native', () => ({
      NativeModules: {
        NavigationBarModule: {
          getNavigationMode: jest.fn().mockResolvedValue('something-weird'),
        },
      },
    }));
    const { getNativeNavigationMode } = await import('../native-navigation-bar');
    const result = await getNativeNavigationMode();
    expect(result).toBe('unknown');
  });
});
```

- [ ] **Step 6: Run tests and verify they pass**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
npx jest src/shared/lib/__tests__/use-navigation-mode.test.ts --no-coverage
```

Expected output: `4 passed`

- [ ] **Step 7: Add exports to `src/shared/lib/index.ts`**

Add at the end of the file:
```typescript
export { getNativeNavigationMode, type NavigationMode } from './native-navigation-bar';
export { useNavigationMode } from './use-navigation-mode';
```

- [ ] **Step 8: Commit**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
git add src/shared/config/layout.ts src/shared/config/index.ts src/shared/lib/native-navigation-bar.ts src/shared/lib/use-navigation-mode.ts src/shared/lib/__tests__/use-navigation-mode.test.ts src/shared/lib/index.ts
git commit -m "feat(nav-detection): add NAV_BUTTON_BAR_EXTRA constant, TS wrapper, and useNavigationMode hook"
```

---

### Task 2: Android native module

**Files:**
- Create: `android/app/src/main/java/com/medtracker/NavigationBarModule.kt`
- Create: `android/app/src/main/java/com/medtracker/NavigationBarPackage.kt`
- Modify: `android/app/src/main/java/com/medtracker/MainApplication.kt`

- [ ] **Step 1: Create `android/app/src/main/java/com/medtracker/NavigationBarModule.kt`**

```kotlin
package com.medtracker

import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NavigationBarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NavigationBarModule"

    /**
     * Returns the current navigation mode:
     *   "gesture"  — fully gestural (Android 10+, mode 2)
     *   "buttons"  — 3-button or 2-button software nav bar (mode 0 or 1)
     *   "unknown"  — could not determine (Settings.Secure unavailable)
     */
    @ReactMethod
    fun getNavigationMode(promise: Promise) {
        try {
            val mode = Settings.Secure.getInt(
                reactApplicationContext.contentResolver,
                "navigation_mode",
                0 // default = 3-button if key missing
            )
            promise.resolve(if (mode == 2) "gesture" else "buttons")
        } catch (e: Exception) {
            promise.resolve("unknown")
        }
    }
}
```

- [ ] **Step 2: Create `android/app/src/main/java/com/medtracker/NavigationBarPackage.kt`**

```kotlin
package com.medtracker

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class NavigationBarPackage : ReactPackage {
    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(NavigationBarModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
```

- [ ] **Step 3: Register the package in `android/app/src/main/java/com/medtracker/MainApplication.kt`**

Current content of the `packageList` block:
```kotlin
packageList = PackageList(this).packages.apply {
  // Packages that cannot be autolinked yet can be added manually here, for example:
  // add(MyReactNativePackage())
}
```

Change it to:
```kotlin
packageList = PackageList(this).packages.apply {
  add(NavigationBarPackage())
}
```

- [ ] **Step 4: Commit**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
git add android/app/src/main/java/com/medtracker/NavigationBarModule.kt android/app/src/main/java/com/medtracker/NavigationBarPackage.kt android/app/src/main/java/com/medtracker/MainApplication.kt
git commit -m "feat(nav-detection): add Android NavigationBarModule native module"
```

---

### Task 3: iOS native module

**Files:**
- Create: `ios/MedTracker/NavigationBarModule.swift`
- Create: `ios/MedTracker/NavigationBarModule.m`

No change to AppDelegate needed — Swift modules with ObjC bridge are picked up automatically.

- [ ] **Step 1: Create `ios/MedTracker/NavigationBarModule.swift`**

```swift
import Foundation
import UIKit

@objc(NavigationBarModule)
class NavigationBarModule: NSObject {

  /// Returns the navigation mode inferred from the key window's bottom safe area inset.
  ///   "gesture"  — Face ID device with home indicator (inset > 0)
  ///   "unknown"  — Home-button device (inset == 0); no software nav bar present
  @objc func getNavigationMode(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      let inset: CGFloat
      if #available(iOS 15.0, *) {
        inset = UIApplication.shared.connectedScenes
          .compactMap { $0 as? UIWindowScene }
          .first?.windows
          .first(where: { $0.isKeyWindow })?.safeAreaInsets.bottom ?? 0
      } else {
        inset = UIApplication.shared.windows
          .first(where: { $0.isKeyWindow })?.safeAreaInsets.bottom ?? 0
      }
      resolve(inset > 0 ? "gesture" : "unknown")
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool { return false }
}
```

- [ ] **Step 2: Create `ios/MedTracker/NavigationBarModule.m`**

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NavigationBarModule, NSObject)

RCT_EXTERN_METHOD(
  getNavigationMode:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
```

- [ ] **Step 3: Commit**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
git add ios/MedTracker/NavigationBarModule.swift ios/MedTracker/NavigationBarModule.m
git commit -m "feat(nav-detection): add iOS NavigationBarModule native module"
```

---

### Task 4: Update CustomTabBar

**Files:**
- Modify: `src/app/navigation/CustomTabBar.tsx`

- [ ] **Step 1: Add imports**

At the top of `src/app/navigation/CustomTabBar.tsx`, after the existing imports, add:
```typescript
import { useNavigationMode } from '../../shared/lib/use-navigation-mode';
import { NAV_BUTTON_BAR_EXTRA } from '../../shared/config/layout';
```

- [ ] **Step 2: Consume the hook inside `CustomTabBar`**

After the existing hook calls (after `const { preferredEntryMode, setPreferredEntryMode } = useSettingsStore();`), add:
```typescript
const { mode } = useNavigationMode();
const navExtraPad = mode === 'buttons' ? NAV_BUTTON_BAR_EXTRA : 0;
```

- [ ] **Step 3: Apply extra padding in the container style**

Find the existing container style application:
```typescript
paddingBottom: Math.max(insets.bottom, 8),
```

Change it to:
```typescript
paddingBottom: Math.max(insets.bottom, 8) + navExtraPad,
```

- [ ] **Step 4: Run typecheck**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "weather-correlation"
```

Expected: no new errors (the pre-existing weather-correlation error is excluded from the grep).

- [ ] **Step 5: Commit**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
git add src/app/navigation/CustomTabBar.tsx
git commit -m "feat(nav-detection): apply extra tab bar padding for 3-button nav devices"
```

---

### Task 5: Update MedicationPage list padding

**Files:**
- Modify: `src/pages/medications/ui/MedicationPage.tsx`

MedicationsPage explicitly uses `insets.bottom` in its list `contentContainerStyle`. Unlike HomePage and HistoryPage (which rely on `useBottomTabBarHeight()` propagating automatically), this page sets `paddingBottom: insets.bottom + 100` directly and needs an explicit extra pad.

- [ ] **Step 1: Add imports to `src/pages/medications/ui/MedicationPage.tsx`**

After the existing imports, add:
```typescript
import { useNavigationMode } from '../../../shared/lib/use-navigation-mode';
import { NAV_BUTTON_BAR_EXTRA } from '../../../shared/config/layout';
```

- [ ] **Step 2: Consume hook inside `MedicationPage`**

After the existing `const insets = useSafeAreaInsets();` line, add:
```typescript
const { mode } = useNavigationMode();
const navExtraPad = mode === 'buttons' ? NAV_BUTTON_BAR_EXTRA : 0;
```

- [ ] **Step 3: Apply to contentContainerStyle**

Find:
```typescript
contentContainerStyle={{ ...styles.list, paddingBottom: insets.bottom + 100 }}
```

Change to:
```typescript
contentContainerStyle={{ ...styles.list, paddingBottom: insets.bottom + 100 + navExtraPad }}
```

- [ ] **Step 4: Run typecheck**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
npx tsc --noEmit --skipLibCheck 2>&1 | grep -v "weather-correlation"
```

Expected: no new errors.

- [ ] **Step 5: Run tests**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
npx jest src/shared/lib/__tests__/use-navigation-mode.test.ts --no-coverage
```

Expected: `4 passed`

- [ ] **Step 6: Commit**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
git add src/pages/medications/ui/MedicationPage.tsx
git commit -m "feat(nav-detection): apply extra list padding in MedicationPage for 3-button nav"
```

---

### Task 6: Update verified-functionalities doc

**Files:**
- Modify: `docs/verified-functionalities.md`

- [ ] **Step 1: Add entry for navigation bar detection**

Open `docs/verified-functionalities.md`, update the `> Last verified:` date to `2026-04-11`, and add a new numbered section:

```markdown
## NN. Navigation Bar Detection

- App detects gesture vs 3-button software navigation via a native module on both Android and iOS
- Android: queries `Settings.Secure.navigation_mode` (0/1 = buttons, 2 = gesture)
- iOS: reads keyWindow.safeAreaInsets.bottom (> 0 = gesture device, 0 = home-button device)
- `useNavigationMode()` hook in `src/shared/lib/` caches the result module-level; subsequent renders pay zero async cost
- CustomTabBar adds `NAV_BUTTON_BAR_EXTRA` (16dp) to `paddingBottom` when `mode === 'buttons'`
- MedicationsPage list adds the same extra padding via `navExtraPad`
- HomePage and HistoryPage use `useBottomTabBarHeight()` which auto-propagates the taller tab bar height
- Falls back to `'unknown'` if the native module is unavailable (no crash, no visual difference)
```

- [ ] **Step 2: Commit**

```bash
cd c:/Users/fuats/Desktop/Workdir/MedTracker
git add docs/verified-functionalities.md
git commit -m "docs: update verified-functionalities with navigation bar detection"
```

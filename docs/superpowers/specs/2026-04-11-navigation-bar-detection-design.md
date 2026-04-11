# Navigation Bar Detection — Design Spec

> Date: 2026-04-11
> Status: Approved

## Goal

Detect whether a device uses gesture navigation or 3-button software navigation, and adjust the tab bar, FABs, and scroll content padding accordingly — so no UI element is obscured by the navigation bar on either platform.

---

## Architecture

Three layers:

```
NavigationBarModule (native)
  ├── Android (Kotlin): queries Settings.Secure "navigation_mode"
  │     0 = 3-button  |  1 = 2-button (Android 9 legacy)  |  2 = gesture
  └── iOS (Swift): reads UIApplication keyWindow safeAreaInsets.bottom
        0 = home-button device (no software nav bar)  |  >0 = gesture device

useNavigationMode (shared hook)   src/shared/lib/use-navigation-mode.ts
  └── calls NativeModule once on mount, caches result in module-level variable
        returns: { mode: 'gesture' | 'buttons' | 'unknown', loading: boolean }

Integration points (consume the hook):
  ├── CustomTabBar       — extra paddingBottom when mode === 'buttons'
  ├── FAB buttons        — extra bottom offset when mode === 'buttons'
  └── ScrollView / FlashList — extra contentContainerStyle.paddingBottom
```

The native module is called once at app start. Navigation mode does not change while the app is running, so no listeners or polling are needed.

---

## Files

### New files

```
android/app/src/main/java/com/medtracker/
  NavigationBarModule.kt     — getNavigationMode() reads Settings.Secure
  NavigationBarPackage.kt    — registers module with React Native

ios/
  NavigationBarModule.swift  — reads UIApplication keyWindow safeAreaInsets.bottom
  NavigationBarModule.m      — ObjC bridge header

src/shared/lib/
  native-navigation-bar.ts   — NativeModule typed wrapper, returns Promise<NavigationMode>
  use-navigation-mode.ts     — hook: calls module once, caches, returns { mode, loading }

src/shared/config/layout.ts  — NAV_BUTTON_BAR_EXTRA constant
```

### Modified files

```
android/app/src/main/java/com/medtracker/MainApplication.kt
  — add NavigationBarPackage() to the packages list

src/app/navigation/CustomTabBar.tsx
  — consume useNavigationMode, add NAV_BUTTON_BAR_EXTRA to paddingBottom

screens/components with FABs
  — pass extra bottom offset from useNavigationMode

screens with scroll content (FlashList / ScrollView)
  — add NAV_BUTTON_BAR_EXTRA to contentContainerStyle.paddingBottom
```

---

## Implementation Details

### Android — NavigationBarModule.kt

```kotlin
import android.provider.Settings
import com.facebook.react.bridge.*

class NavigationBarModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "NavigationBarModule"

    @ReactMethod
    fun getNavigationMode(promise: Promise) {
        try {
            val mode = Settings.Secure.getInt(
                reactApplicationContext.contentResolver,
                "navigation_mode",
                0
            )
            promise.resolve(if (mode == 2) "gesture" else "buttons")
        } catch (e: Exception) {
            promise.resolve("unknown")
        }
    }
}
```

### Android — NavigationBarPackage.kt

```kotlin
class NavigationBarPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext) =
        listOf(NavigationBarModule(context))
    override fun createViewManagers(context: ReactApplicationContext) =
        emptyList<ViewManager<*, *>>()
}
```

### iOS — NavigationBarModule.swift

```swift
@objc(NavigationBarModule)
class NavigationBarModule: NSObject {
    @objc func getNavigationMode(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            let inset = UIApplication.shared.windows
                .first(where: { $0.isKeyWindow })?.safeAreaInsets.bottom ?? 0
            resolve(inset > 0 ? "gesture" : "unknown")
        }
    }

    @objc static func requiresMainQueueSetup() -> Bool { return false }
}
```

### iOS — NavigationBarModule.m (ObjC bridge)

```objc
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NavigationBarModule, NSObject)
RCT_EXTERN_METHOD(
    getNavigationMode:(RCTPromiseResolveBlock)resolve
    rejecter:(RCTPromiseRejectBlock)reject
)
@end
```

### TypeScript wrapper — native-navigation-bar.ts

```typescript
import { NativeModules } from 'react-native';

export type NavigationMode = 'gesture' | 'buttons' | 'unknown';

const { NavigationBarModule } = NativeModules;

export function getNativeNavigationMode(): Promise<NavigationMode> {
  if (!NavigationBarModule) return Promise.resolve('unknown');
  return NavigationBarModule.getNavigationMode() as Promise<NavigationMode>;
}
```

### Hook — use-navigation-mode.ts

```typescript
import { useState, useEffect } from 'react';
import { getNativeNavigationMode, type NavigationMode } from './native-navigation-bar';

let cachedMode: NavigationMode | null = null;

export function useNavigationMode() {
  const [mode, setMode] = useState<NavigationMode>(cachedMode ?? 'unknown');
  const [loading, setLoading] = useState(cachedMode === null);

  useEffect(() => {
    if (cachedMode !== null) return;
    getNativeNavigationMode().then(result => {
      cachedMode = result;
      setMode(result);
      setLoading(false);
    });
  }, []);

  return { mode, loading };
}
```

### Constant — layout.ts

```typescript
/** Extra bottom padding (dp) added when device uses 3-button software navigation.
 *  Safe-area-context already accounts for the nav bar height in insets.bottom —
 *  this is a visual breathing-room buffer on top of that. */
export const NAV_BUTTON_BAR_EXTRA = 16;
```

---

## Integration Patterns

**CustomTabBar** (currently uses `Math.max(insets.bottom, 8)`):
```typescript
const { mode } = useNavigationMode();
const extraPad = mode === 'buttons' ? NAV_BUTTON_BAR_EXTRA : 0;
paddingBottom: Math.max(insets.bottom, 8) + extraPad
```

**FAB buttons**:
```typescript
const { mode } = useNavigationMode();
const fabBottom = insets.bottom + 80 + (mode === 'buttons' ? NAV_BUTTON_BAR_EXTRA : 0);
style={{ bottom: fabBottom }}
```

**Scroll views / FlashList**:
```typescript
const { mode } = useNavigationMode();
const scrollPad = insets.bottom + (mode === 'buttons' ? NAV_BUTTON_BAR_EXTRA : 0);
contentContainerStyle={{ paddingBottom: scrollPad }}
```

During `loading === true`, fall back to current behavior (`insets.bottom` only). The module resolves in under one render cycle on device, so no visible flash is expected.

---

## What Is Not Changing

- Safe-area-context remains the primary source for `insets.bottom` on all screens.
- `NAV_BUTTON_BAR_EXTRA` is additive — it does not replace inset values.
- No polling, no event listeners, no re-fetch after initial call.
- iOS home-button devices return `'unknown'` (no software nav bar present; existing inset handling is sufficient).

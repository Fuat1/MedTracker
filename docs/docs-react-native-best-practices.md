# React Native Best Practices — MedTracker Reference

Comprehensive performance, platform, and accessibility guidelines for React Native CLI 0.76+ with New Architecture, Hermes, and Feature-Sliced Design.

**Last Updated:** 2026-02-15

---

## 1. Performance Optimization

### 1.1 Rendering & Re-render Prevention

**Memoization strategy:**

- Wrap list item components in `React.memo()` with custom comparison functions when props are objects/arrays.
- Use `useCallback` for all handler functions passed as props, especially `renderItem` in lists.
- Use `useMemo` for expensive computed values and derived data (filtered/sorted arrays, statistical calculations).
- For Reanimated gesture objects (`Gesture.Pan()`, `Gesture.Tap()`), always wrap in `useMemo` to prevent reattachment on every render.

```typescript
// ✅ CORRECT — memoized renderItem for lists
const renderItem = useCallback(({ item }: { item: BPReading }) => (
  <ReadingCard reading={item} onPress={handlePress} />
), [handlePress]);

// ✅ CORRECT — memoized gesture
const panGesture = useMemo(
  () => Gesture.Pan()
    .onStart(() => { /* ... */ })
    .onEnd(() => { /* ... */ }),
  [/* deps */]
);
```

**Avoid unnecessary re-renders:**

- Never create objects, arrays, or functions inline in JSX — extract them above the return.
- Use Zustand selectors to subscribe to specific slices: `useStore(s => s.selectedGuideline)` instead of `useStore()`.
- For TanStack Query, use `select` to pick only needed fields — prevents re-renders when unrelated data changes.
- Prefer `useAnimatedStyle` and shared values over React state for anything animation-related.

### 1.2 List Optimization (FlatList / FlashList)

MedTracker displays potentially thousands of BP readings. List performance is critical.

**Prefer FlashList over FlatList** for lists with 100+ items. FlashList uses cell recycling (like Android's RecyclerView / iOS UITableView) instead of mount/unmount cycles, achieving up to 10x faster rendering and significantly lower memory usage.

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={readings}
  renderItem={renderItem}
  estimatedItemSize={80}          // REQUIRED — provide accurate estimate
  getItemType={(item) => item.type} // categorize items to optimize recycling
  keyExtractor={(item) => item.id}
/>
```

**FlashList rules:**

- Always provide `estimatedItemSize` (measure your actual items).
- Use `getItemType` when items have different layouts (e.g. date headers vs reading cards).
- NEVER add `key` prop to the item component — this prevents view recycling.
- Flatten nested lists into a single FlashList with item types.

**FlatList optimization (if FlashList isn't used):**

| Prop | Recommended Value | Purpose |
|------|-------------------|---------|
| `windowSize` | 10–15 | Visible windows to keep rendered |
| `initialNumToRender` | 10–15 | Items rendered on first paint |
| `maxToRenderPerBatch` | 5–10 | Items rendered per scroll batch |
| `removeClippedSubviews` | `true` | Detach off-screen views (Android) |
| `getItemLayout` | provide if items have fixed height | Skip async layout measurement |
| `keyExtractor` | unique stable ID | Efficient reconciliation |

### 1.3 Image Optimization

- Use WebP format for all images (25–35% smaller than PNG/JPEG at equivalent quality).
- Provide `@2x` and `@3x` variants for different screen densities.
- Use `react-native-fast-image` for caching and progressive loading with placeholder transitions.
- For icons, use `react-native-vector-icons` (already in stack) — vector icons scale without multiple files.
- Keep total bundled image assets under 6MB.

### 1.4 Animation Performance

MedTracker uses Reanimated v3 and Gesture Handler.

**Core rules:**

- Always use Reanimated `useSharedValue` + `useAnimatedStyle` — never React state for animated values.
- Prefer **transform animations** (translateX/Y, scale, rotate, opacity) over layout-affecting properties (width, height, margin, padding). Transforms run on the GPU with hardware acceleration.
- Use `withSpring` / `withTiming` for transitions — never `setTimeout` or `setInterval` inside worklets.
- Use `runOnJS` sparingly — only for essential JS-thread callbacks like analytics or navigation.
- Keep animated component trees shallow — deep hierarchies cause frame drops.

**Gesture Handler rules:**

- Replace `TouchableOpacity` from React Native with `Pressable` from `react-native-gesture-handler` for better touch latency.
- Set minimum touch targets of 44×44 points (Apple/Google guidelines).
- Use `hitSlop` for small interactive elements to create forgiving touch areas.
- For swipeable list items, use `activeOffsetX` / `activeOffsetY` to prevent gesture conflicts with scrolling.

### 1.5 JavaScript Thread Optimization

- Use `InteractionManager.runAfterInteractions()` to defer non-critical work (e.g., analytics, pre-fetching) until animations/transitions complete.
- Debounce/throttle high-frequency event handlers (scroll, search input).
- Move CPU-intensive operations (statistical calculations, data transformations) off the JS thread using background workers when processing 1000+ readings.
- Remove `console.log` in production using `babel-plugin-transform-remove-console`.
- Use `React.lazy` / dynamic imports for screens not needed at startup.

### 1.6 TanStack Query Optimization

- Set `staleTime` for BP readings to avoid unnecessary re-fetches (readings don't change externally).
- Use `select` in queries to transform/filter data — prevents re-renders when full query data changes.
- Implement optimistic updates for new readings to make the UI feel instant.
- Use query key factories for consistent cache invalidation: `queryKeys.readings.list(filters)`.
- Set `gcTime` (formerly `cacheTime`) to control memory usage for large datasets.

---

## 2. Platform-Specific Patterns

### 2.1 Keyboard Handling

**Android and iOS behave differently.** The built-in `KeyboardAvoidingView` works well on iOS but is unreliable on Android across different manufacturers and keyboard heights.

**Recommended approach:**

```typescript
import { KeyboardAvoidingView, Platform } from 'react-native';

// For simple screens
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
  style={{ flex: 1 }}
>
  {children}
</KeyboardAvoidingView>
```

**Android-specific keyboard config** in `AndroidManifest.xml`:
```xml
<activity android:windowSoftInputMode="adjustResize" />
```
Use `adjustResize` as the default (content resizes when keyboard appears). Switch to `adjustPan` on specific screens if needed.

**For complex forms or screens with bottom tabs:**

- Consider `react-native-keyboard-controller` — provides consistent keyboard animations on both platforms and a `KeyboardAwareScrollView` that auto-scrolls to focused inputs.
- Always test keyboard behavior on both platforms with different keyboard types (default, numeric, email).
- Dismiss keyboard on background tap using `TouchableWithoutFeedback` + `Keyboard.dismiss()` or `keyboardDismissMode` on ScrollView.

**MedTracker note:** Since MedTracker uses a custom Numpad (not native TextInput) for BP entry, keyboard avoidance is primarily needed for notes/tags input screens.

### 2.2 Safe Area Handling

Modern devices have notches, camera cutouts, rounded corners, Dynamic Island (iOS), and gesture navigation bars (Android).

**Use `react-native-safe-area-context` — NOT React Native's built-in `SafeAreaView`.**

The built-in SafeAreaView only works on iOS 11+ and has animation jitter issues. The library version works cross-platform.

**Setup:**

```typescript
// App root (once)
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

<SafeAreaProvider initialMetrics={initialWindowMetrics}>
  <NavigationContainer>
    {/* ... */}
  </NavigationContainer>
</SafeAreaProvider>
```

**In screens — prefer the hook over the component:**

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ScreenComponent() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* content */}
    </View>
  );
}
```

**Rules:**

- Use `useSafeAreaInsets` hook instead of `SafeAreaView` component — avoids timing/flickering issues and gives more control.
- Don't wrap the entire app in SafeAreaView — apply insets per-screen based on need.
- Use `edges` prop when you need selective safe area (e.g., `edges={['top']}` on a screen with a custom bottom tab bar).
- React Navigation handles safe areas for its built-in UI (headers, tab bars) — don't double-pad.
- Test on devices with and without notches, and in landscape mode.

### 2.3 Platform-Specific Styling

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 4,
    },
  }),
});
```

**Android-specific:**

- Always set BOTH `fontFamily` AND `fontWeight` (Android ignores fontWeight without fontFamily).
- Elevation is the only shadow method (iOS shadow properties don't work on Android).
- `overflow: 'hidden'` behaves differently — test border radius clipping on both platforms.
- `StatusBar.setTranslucent(true)` on Android for content behind status bar.

**iOS-specific:**

- Use `borderCurve: 'continuous'` for iOS-native smooth corners (iOS 13+).
- Respect `UIAccessibilityContentSizeCategory` for Dynamic Type support.
- Test with and without bold text enabled in accessibility settings.

### 2.4 Navigation Patterns

MedTracker uses Stack wrapping Tabs (React Navigation 6/7).

- Use `android_ripple` on Pressables for native Android feedback.
- Handle Android hardware back button via `BackHandler` or navigation's `beforeRemove` event.
- Use `gestureEnabled: true` on iOS stacks for swipe-back (default).
- For modals, use `presentation: 'modal'` (iOS sheet presentation) or `presentation: 'transparentModal'` for custom overlays.
- Lazy-load tab screens with `lazy: true` on Tab.Navigator to reduce initial load.

---

## 3. Memory Management

### 3.1 useEffect Cleanup (MANDATORY)

Every `useEffect` that creates subscriptions, timers, listeners, or async operations MUST return a cleanup function. Missing cleanups are the #1 source of memory leaks in React Native.

```typescript
// ✅ CORRECT — all common patterns

// Timers
useEffect(() => {
  const timer = setInterval(() => { /* ... */ }, 1000);
  return () => clearInterval(timer);
}, []);

// Native listeners (Keyboard, AppState, Dimensions)
useEffect(() => {
  const sub = AppState.addEventListener('change', handleAppState);
  return () => sub.remove();
}, [handleAppState]);

// Navigation listeners
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', handleFocus);
  return () => unsubscribe();
}, [navigation, handleFocus]);

// Async operations (prevent state updates on unmounted component)
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal })
    .then(data => setData(data))
    .catch(err => {
      if (err.name !== 'AbortError') console.error(err);
    });
  return () => controller.abort();
}, []);

// Reanimated scroll handlers — no manual cleanup needed
// (useAnimatedScrollHandler handles its own lifecycle)
```

### 3.2 Subscription Wrapper Pattern

Abstract common subscriptions into custom hooks to systematize cleanup:

```typescript
// shared/lib/hooks/useAppState.ts
export const useAppState = (onChange: (status: AppStateStatus) => void) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, [onChange]);
};
```

### 3.3 Memory Budgets

- Target peak memory ≤ 300MB on 4GB devices, ≤ 200MB on 3GB devices.
- For lists with 10,000+ readings, verify no memory growth during extended scrolling sessions.
- Profile with Flipper's Memory plugin during development.
- Watch for retained closures in navigation listeners — if a screen's data stays in memory after navigating away, the listener closure is still alive.

---

## 4. Accessibility

### 4.1 Core Requirements

MedTracker targets accessibility compliance for health app standards, especially with Senior Mode.

**Every interactive element MUST have:**

```typescript
<Pressable
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={t('readings.addNew')} // Translated, descriptive label
  accessibilityHint={t('readings.addNewHint')} // What happens on activation
  accessibilityState={{ disabled: isSubmitting }}
  onPress={handlePress}
>
```

**Accessibility props reference:**

| Prop | When to Use |
|------|-------------|
| `accessibilityLabel` | Always — describes what the element IS |
| `accessibilityHint` | When the action isn't obvious from the label |
| `accessibilityRole` | Always — 'button', 'header', 'text', 'adjustable', 'image', 'alert' |
| `accessibilityState` | For dynamic states: `{ disabled, checked, selected, expanded, busy }` |
| `accessibilityValue` | For adjustable controls: `{ min, max, now, text }` |
| `accessibilityLiveRegion` | Dynamic content: 'polite' or 'assertive' (Android) |
| `accessibilityElementsHidden` | Hide decorative elements from screen reader |
| `importantForAccessibility` | Android: 'auto', 'yes', 'no', 'no-hide-descendants' |

### 4.2 MedTracker-Specific Accessibility

**BP Classification badges:**

- Never rely on color alone to convey classification (Normal = green, Elevated = yellow, etc.).
- Always include text label AND icon alongside color.
- For charts, provide text-based data summaries accessible to screen readers.

**Custom Numpad:**

- Set `accessibilityRole="adjustable"` or `accessibilityRole="keyboardkey"` on each numpad button.
- Announce entered value changes with `AccessibilityInfo.announceForAccessibility()`.
- Ensure numpad buttons have minimum 44×44pt touch targets.

**Crisis alerts:**

- Use `accessibilityRole="alert"` and `accessibilityLiveRegion="assertive"` for hypertensive crisis warnings.
- These MUST be immediately announced by screen readers.

### 4.3 Color Contrast

- Normal text: minimum 4.5:1 contrast ratio (WCAG AA).
- Large text (≥18pt or ≥14pt bold): minimum 3:1 contrast ratio.
- Senior Mode: use high contrast variants from the theme — aim for 7:1 (WCAG AAA).
- Use `useTheme()` for all colors (already a project rule) — themes must meet contrast requirements.

### 4.4 Testing Checklist

- Test with VoiceOver (iOS physical device — not available in simulator).
- Test with TalkBack (Android emulator or device — install from Play Store on emulator).
- Verify focus order is logical (top-to-bottom, left-to-right).
- Verify all interactive elements are reachable and announced.
- Test with system font size set to maximum.
- Test with "Bold Text" enabled (iOS).
- Use `eslint-plugin-react-native-a11y` for automated linting.

---

## 5. Bundle Size Optimization

**Target: < 20MB APK / IPA (MedTracker requirement)**

### 5.1 Hermes Engine

Hermes is the default JS engine in RN 0.76+ and provides 15–25% smaller bundles and 30–50% faster startup by compiling JS to bytecode at build time. Verify it's enabled:

```groovy
// android/app/build.gradle
project.ext.react = [
    enableHermes: true  // Should be true (default in 0.76+)
]
```

### 5.2 Android Optimizations

**ProGuard / R8 (code shrinking):**

```groovy
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

**ABI splits (architecture-specific APKs):**

```groovy
android {
    splits {
        abi {
            enable true
            reset()
            include 'armeabi-v7a', 'arm64-v8a'  // Drop x86 for production
            universalApk false
        }
    }
}
```

**App Bundles:** Always publish as `.aab` (not `.apk`) — Google Play generates optimized APKs per device.

### 5.3 General Optimizations

- Audit dependencies with `npx depcheck` — remove unused packages.
- Use `babel-plugin-transform-remove-console` to strip console.* from production.
- Compress images before bundling (TinyPNG, Squoosh). Convert to WebP.
- Only include needed font weights (not entire font families).
- Use `react-native-bundle-visualizer` to identify the largest modules in your JS bundle.
- For icons, `react-native-vector-icons` is already efficient — but only import the icon sets you use (Ionicons only, not MaterialIcons + FontAwesome + etc.).

### 5.4 Monitoring

- Integrate bundle size checks in CI — fail builds if JS bundle exceeds budget.
- Track APK/IPA size trend across releases.
- Use Android Studio APK Analyzer to inspect what's consuming space.

---

## 6. Error Handling Patterns

### 6.1 Database Errors (op-sqlite)

```typescript
// entities/reading/api/reading-repository.ts
async function insertReading(reading: BPReading): Promise<Result<void, DatabaseError>> {
  try {
    await db.executeSql(
      'INSERT INTO readings (...) VALUES (?, ?, ?, ?)',
      [reading.systolic, reading.diastolic, reading.pulse, reading.timestamp]
    );
    return { ok: true, data: undefined };
  } catch (error) {
    if (error.message?.includes('SQLITE_FULL')) {
      return { ok: false, error: { type: 'STORAGE_FULL', message: t('errors.storageFull') } };
    }
    if (error.message?.includes('SQLITE_CORRUPT')) {
      return { ok: false, error: { type: 'DB_CORRUPT', message: t('errors.dbCorrupt') } };
    }
    return { ok: false, error: { type: 'UNKNOWN', message: error.message } };
  }
}
```

### 6.2 File System Errors

- Always check available storage before PDF export.
- Handle permission denials gracefully with user-friendly messages.
- Wrap file operations in try/catch — `react-native-fs` throws on permission/disk issues.

### 6.3 Error Boundaries

Place React Error Boundaries at the page level to prevent one screen crash from killing the app:

```typescript
// app/providers/ErrorBoundary.tsx
<ErrorBoundary fallback={<CrashScreen />}>
  <Navigation />
</ErrorBoundary>
```

---

## 7. New Architecture Considerations (RN 0.76+)

MedTracker has New Architecture enabled. Key implications:

- **Fabric Renderer:** Enables `useLayoutEffect` for synchronous layout reads — use for measuring views before paint. FlashList 2.0 leverages this internally.
- **TurboModules:** Native modules load on demand via JSI (not all at startup) — faster cold start.
- **Concurrent Features:** `startTransition` for low-priority updates (e.g., filtering a large readings list while typing). Wrap non-urgent state updates to keep the UI responsive.
- **Bridgeless Mode:** No JS Bridge — direct C++ communication. All native module calls are synchronous-capable.
- **View Flattening:** Fabric automatically removes unnecessary host views, reducing the native view count.

**Caveats:**

- Test all third-party libraries for New Architecture compatibility before adding them.
- Some Reanimated animations may have performance regressions on New Architecture — check Reanimated's performance guide and apply recommended feature flags.
- Development builds may feel slower than release — always benchmark release builds.

---

## 8. Profiling & Debugging

### 8.1 Performance Metrics

| Metric | Target |
|--------|--------|
| Cold start (TTI) | < 2 seconds |
| List scroll FPS | 60fps (0 dropped frames on critical screens) |
| Numpad input latency | < 16ms response |
| JS bundle size (gzipped) | < 1.2MB |
| Peak memory (4GB device) | < 300MB |
| APK size | < 20MB |

### 8.2 Tools

- **React Native DevTools** (built into 0.76+): Component inspector, profiler.
- **Flipper**: Memory profiler, network inspector, React DevTools plugin.
- **Android Studio Profiler**: CPU, memory, energy profiling for native side.
- **Xcode Instruments**: Time Profiler, Leaks, Allocations.
- **Metro bundler**: Module resolution 15x faster in 0.76+ — warm reloads ~4x faster.
- **react-native-bundle-visualizer**: JS bundle composition analysis.

### 8.3 When to Profile

- After adding a new dependency.
- When a list screen displays 500+ items.
- Before every release build.
- When users report sluggishness on specific devices.
- After enabling/disabling New Architecture feature flags.
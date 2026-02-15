# Platform & Performance Rules

Rules for React Native CLI 0.76+ with New Architecture, Hermes, and Reanimated.
Full reference: `docs/react-native-best-practices.md`

## Performance (MUST)

- **PREFER FlashList over FlatList** for lists with 100+ items — always provide `estimatedItemSize` and `getItemType`
- **NEVER add `key` prop to FlashList item components** — it prevents view recycling
- **ALWAYS wrap `renderItem` in `useCallback`** and list item components in `React.memo()`
- **ALWAYS wrap Gesture objects** (`Gesture.Pan()`, `Gesture.Tap()`) **in `useMemo`** with proper deps
- **PREFER transform animations** (translateX, scale, opacity) over layout-affecting styles (width, height, margin)
- **NEVER use `setTimeout`/`setInterval` inside Reanimated worklets** — use `withTiming`/`withSpring`
- **NEVER use `Animated` (legacy)** — use Reanimated `useSharedValue` + `useAnimatedStyle`
- **ALWAYS defer non-critical work** with `InteractionManager.runAfterInteractions()`
- **Use `runOnJS` sparingly** — only for essential JS-thread callbacks from worklets
- **Use Zustand selectors** — `useStore(s => s.field)` not `useStore()` to prevent re-renders
- **Use TanStack Query `select`** to pick only needed fields from query data
- **Replace `TouchableOpacity`** with `Pressable` from `react-native-gesture-handler` for better touch latency
- **Minimum touch target: 44×44 points** on all interactive elements

## Memory Management (MUST)

- **EVERY `useEffect` that creates subscriptions/timers/listeners MUST return a cleanup function**
- **ALWAYS clean up**: timers (`clearInterval`/`clearTimeout`), native listeners (`.remove()`), navigation listeners, AbortController for fetches, WebSocket `.close()`
- **Abstract common listeners into custom hooks** (e.g., `useAppState`, `useKeyboard`) to systematize cleanup
- **For async operations in useEffect**, use `AbortController` or `isMounted` flag to prevent state updates on unmounted components
- **Profile memory with Flipper** — target peak ≤300MB on 4GB devices

## Safe Area (MUST)

- **Use `react-native-safe-area-context`** — NOT React Native's built-in `SafeAreaView`
- **Prefer `useSafeAreaInsets` hook** over `<SafeAreaView>` component (avoids timing/flicker issues)
- **Apply insets per-screen** — don't wrap entire app in SafeAreaView
- **Don't double-pad** — React Navigation handles its own UI safe areas

## Keyboard Handling

- **iOS**: `KeyboardAvoidingView` with `behavior="padding"` + `keyboardVerticalOffset={headerHeight}`
- **Android**: Set `android:windowSoftInputMode="adjustResize"` in AndroidManifest — then `behavior={undefined}` for KeyboardAvoidingView
- **Dismiss keyboard on background tap** using `Keyboard.dismiss()`
- **For complex forms**, consider `react-native-keyboard-controller` for consistent cross-platform behavior

## Platform Styling (MUST)

- **ALWAYS set BOTH `fontFamily` AND `fontWeight`** — Android ignores fontWeight without fontFamily
- **Use `Platform.select()`** for shadows: `shadowColor/Offset/Opacity/Radius` on iOS, `elevation` on Android
- **Test `overflow: 'hidden'` + `borderRadius`** on both platforms — behavior differs
- **Handle Android back button** via `BackHandler` or navigation's `beforeRemove`

## Accessibility (MUST)

- **EVERY interactive element MUST have**: `accessible={true}`, `accessibilityRole`, `accessibilityLabel` (using `t()`)
- **NEVER rely on color alone** to convey BP classification — always include text label + icon
- **Crisis alerts MUST use** `accessibilityRole="alert"` + `accessibilityLiveRegion="assertive"`
- **Color contrast**: ≥4.5:1 for normal text, ≥3:1 for large text (WCAG AA minimum)
- **Senior Mode**: aim for ≥7:1 contrast (WCAG AAA)
- **Announce dynamic changes** with `AccessibilityInfo.announceForAccessibility()`
- **Use `eslint-plugin-react-native-a11y`** for automated accessibility linting

## Bundle Size

- **Hermes MUST be enabled** (default in 0.76+) — verify in build.gradle
- **Enable ProGuard + R8 + `shrinkResources`** for release builds
- **Enable ABI splits** — generate per-architecture APKs (arm64-v8a, armeabi-v7a)
- **Publish as `.aab`** (App Bundle) — not `.apk`
- **Strip console.log** in production: `babel-plugin-transform-remove-console`
- **Compress images** before bundling — use WebP format, keep total < 6MB
- **Only import used icon sets** from react-native-vector-icons (Ionicons only)
- **Audit deps regularly** with `npx depcheck` — remove unused packages

## Error Handling (MUST)

- **Wrap database operations** in try/catch with typed error handling (SQLITE_FULL, SQLITE_CORRUPT)
- **Check available storage** before PDF export
- **Handle file permission denials** with user-friendly messages
- **Place Error Boundaries** at page level to prevent full-app crashes
- **ALWAYS use parameterized queries** for op-sqlite (existing rule — repeated for safety)

## New Architecture Notes

- **Use `useLayoutEffect`** for synchronous layout measurement before paint
- **Use `startTransition`** for low-priority state updates (e.g., filtering large reading lists)
- **Verify library compatibility** before adding new dependencies
- **Benchmark release builds** — dev builds may feel slower with New Architecture
- **Check Reanimated performance guide** if animations stutter — apply recommended feature flags
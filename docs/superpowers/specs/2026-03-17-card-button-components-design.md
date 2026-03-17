# Card & Button Component System — Design Spec

**Date:** 2026-03-17
**Status:** Approved (revised after spec review)
**Scope:** New reusable Card and Button components for MedTracker using Gluestack UI v3 + NativeWind

---

## 1. Overview

MedTracker currently has no dedicated Card or Button components. Cards are built inline with `View + StyleSheet` across widgets, and buttons are ad-hoc `Pressable` elements or the single `SaveButton` component. This creates inconsistency and duplicated styling logic.

This spec introduces a full Card and Button component system built on Gluestack UI v3 (copy-paste model, like shadcn/ui) with NativeWind for layout utilities, integrated with the existing `useTheme()` system, and enriched with Reanimated micro-interactions.

### Design Direction

- **Visual style:** Modern Minimal — clean flat surfaces, subtle shadows, generous whitespace (Apple Health / Samsung Health aesthetic)
- **Styling engine:** Hybrid — NativeWind for layout/spacing/structure, inline `style` for theme colors via `useTheme()`
- **Animations:** Rich — press feedback, platform-appropriate ripple (Android) / scale (iOS), shimmer skeleton, spring-based collapse

### Key Constraints

- Must support all 3 theme modes (light, dark, high contrast)
- Must support senior mode (1.4x font scale)
- Must meet WCAG AA accessibility (44x44pt touch targets, 4.5:1 contrast, screen reader support)
- Must respect FSD architecture (components live in `shared/ui`)
- `useTheme()` remains the runtime source of truth
- All user-facing strings use `t()` for i18n
- Font sizes always use inline `typography.*` values (not NativeWind text-size classes) to respect senior mode scaling

---

## 0. Prerequisite: Compatibility Verification Spike

**Before Phase 1 begins**, build a minimal proof-of-concept branch that verifies:

1. NativeWind v4 configured correctly in metro.config.js + global.css on RN 0.83 + React 19
2. Runtime theme switching: `useTheme()` colors flowing into component styles alongside NativeWind layout classes
3. A single Gluestack-generated Button renders on both iOS and Android with New Architecture enabled
4. Reanimated 4 animations work on Gluestack-generated components

**If Gluestack v3 is incompatible** with RN 0.83 / React 19 / New Architecture, fall back to building components from scratch using the same API design (the copy-paste model means generated code is just a starting point).

---

## 2. Setup & Theme Bridging

### 2.1 Gluestack UI v3 Installation

- Run `npx gluestack-ui init` to scaffold GluestackUIProvider + base config
- Components are copied (not installed as deps) into `src/shared/ui/gluestack/`
- Add individual components via `npx gluestack-ui add button card`

### 2.2 NativeWind Configuration

**metro.config.js** — must wrap with NativeWind:

```js
const { withNativeWind } = require('nativewind/metro');
const { mergeConfig } = require('@react-native/metro-config');
// ... existing config ...
module.exports = withNativeWind(mergedConfig, { input: './global.css' });
```

**global.css** — required by NativeWind v4:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**tailwind.config.js** — layout utilities + font families (NO color tokens as CSS variables):

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        nunito: ['Nunito-Regular'],
        'nunito-medium': ['Nunito-Medium'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        'nunito-extrabold': ['Nunito-ExtraBold'],
      },
      borderRadius: {
        card: '12px',
        'card-sm': '8px',
        'card-lg': '16px',
      },
      spacing: {
        'card-sm': '8px',
        'card-md': '16px',
        'card-lg': '20px',
      },
    },
  },
  plugins: [],
};
```

### 2.3 Theme Integration (Hybrid Approach)

**NativeWind handles:** layout, spacing, flexbox, border-radius, padding, margin — structural concerns that don't change across themes.

**Inline `style` via `useTheme()` handles:** all colors (`backgroundColor`, `color`, `borderColor`, `shadowColor`), font sizes (`typography.*`), and any value that changes with theme mode or senior mode.

Example pattern:

```tsx
const { colors, typography } = useTheme();

<Animated.View
  className="p-card-md rounded-card flex-row items-center"
  style={{ backgroundColor: colors.surface, shadowColor: colors.shadow }}
>
  <Text
    className="font-nunito-bold"
    style={{ color: colors.textPrimary, fontSize: typography.lg, fontWeight: '700' }}
  >
    {title}
  </Text>
</Animated.View>
```

This avoids CSS variable bridging (which is unreliable in NativeWind v4 on React Native) while still leveraging NativeWind for concise layout code.

### 2.4 Provider Hierarchy

```
<SafeAreaProvider>
  <QueryClientProvider>
    <GluestackUIProvider>
      <NavigationContainer>
        ...
      </NavigationContainer>
    </GluestackUIProvider>
  </QueryClientProvider>
</SafeAreaProvider>
```

---

## 3. Button Component

**Location:** `src/shared/ui/Button/`

### 3.1 Variants (7 total)

| Variant | Appearance | Primary Use Case |
|---|---|---|
| `primary` | Filled teal, white text | Main CTAs (Save Reading, Log Dose) |
| `secondary` | Outlined teal border, teal text | Secondary actions (Cancel, Back) |
| `ghost` | Text-only, no border/bg | Tertiary actions (Skip, Dismiss) |
| `destructive` | Filled red, white text | Delete reading, Remove medication |
| `icon` | Circle/rounded square, icon centered | Toolbar actions, close buttons |
| `fab` | Floating circle, elevation shadow | Quick-add new reading |
| `link` | Underlined text, no padding | Inline navigation ("View all") |

### 3.2 Sizes (3 total)

| Size | Min Height | Font Size | Icon Size | Use Case |
|---|---|---|---|---|
| `sm` | 36pt | typography.sm | 16 | Secondary actions |
| `md` | 44pt | typography.md | 20 | Default |
| `lg` | 52pt | typography.lg | 24 | Primary CTAs |

All sizes auto-scale with senior mode via `typography` computed values. Minimum visual touch target is 36pt (`sm`), with 44pt hit slop enforced. For a health app targeting older demographics, `md` should be the default for all action buttons.

### 3.3 States

- **Default** — standard appearance
- **Pressed** — spring scale to 0.96 + opacity 0.85
- **Disabled** — opacity 0.5, non-interactive, `accessibilityState={{ disabled: true }}`
- **Loading** — spinner replaces content with smooth crossfade, non-interactive, `accessibilityState={{ busy: true }}`
- **Focused** — visible focus ring (2px accent outline, especially prominent in high-contrast mode)

### 3.4 Sub-components

```tsx
<Button variant="primary" size="md" onPress={handleSave} isLoading={saving} testID="save-reading-btn">
  <ButtonIcon as={Ionicons} name="checkmark" />
  <ButtonText>{t('common.save')}</ButtonText>
</Button>

<ButtonGroup direction="row" spacing="sm">
  <Button variant="secondary">...</Button>
  <Button variant="primary">...</Button>
</ButtonGroup>
```

- `Button` — container with press handling, layout, and animation
- `ButtonText` — styled text (inherits variant color, font family + weight via `useTheme()`)
- `ButtonIcon` — icon element (inherits variant color, size-appropriate)
- `ButtonSpinner` — ActivityIndicator for loading state
- `ButtonGroup` — layout container with direction, spacing, and optional `isAttached` for connected buttons

### 3.5 Animations (Reanimated)

| Animation | Trigger | Implementation | Platform |
|---|---|---|---|
| Press scale | onPressIn/onPressOut | `withSpring(0.96)` / `withSpring(1)` | Both |
| Ripple | onPress | Expanding circle `SharedValue` from touch coordinates, opacity fade | Android only |
| Press opacity | onPressIn/onPressOut | `withTiming(0.85)` / `withTiming(1)` | iOS only |
| Loading crossfade | isLoading change | `withTiming` opacity swap between content and spinner | Both |
| FAB entry | mount | `withSpring` translateY from bottom + scale from 0 | Both |

Ripple is Android-only via `Platform.OS` check. iOS uses scale + opacity feedback (matching iOS conventions).

### 3.6 Accessibility

- `accessibilityRole="button"` on all variants
- `accessibilityLabel` via `t()` — required prop for `icon` variant
- `accessibilityState={{ disabled, busy }}` — `busy` set during loading
- `testID` prop supported on all variants (auto-derived from variant + label if not provided)
- Minimum 44x44pt touch target enforced (hit slop on `sm` size)
- High-contrast mode: 2px solid borders, no shadow reliance
- Crisis-related destructive buttons: `accessibilityHint` explaining the action

### 3.7 TypeScript Interface

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon' | 'fab' | 'link';
  size?: 'sm' | 'md' | 'lg';               // default: 'md'
  onPress: () => void;
  isLoading?: boolean;
  isDisabled?: boolean;
  accessibilityLabel?: string;              // required for 'icon' variant
  accessibilityHint?: string;
  testID?: string;
  children: React.ReactNode;
}

interface ButtonGroupProps {
  direction?: 'row' | 'column';             // default: 'row'
  spacing?: 'sm' | 'md' | 'lg';            // default: 'md'
  isAttached?: boolean;
  children: React.ReactNode;
}
```

---

## 4. Card Component

**Location:** `src/shared/ui/Card/`

### 4.1 Variants (6 total)

| Variant | Appearance | Primary Use Case |
|---|---|---|
| `elevated` | White/surface bg, subtle shadow | Default container (CircadianCard) |
| `outline` | Border, no shadow | TodayScheduleCard style |
| `ghost` | No border/shadow, just padding | Lightweight grouping |
| `filled` | Tinted background (accent at 10% opacity) | Highlighted info sections |
| `pressable` | Elevated + press animation + onPress | Tappable BPRecordCard |
| `gradient` | LinearGradient background | Summary cards, premium feel |

**Note on `gradient` variant:** Falls back to `filled` in high-contrast mode. Must never be used as the sole carrier of information — always pair with text/icon. Uses existing `react-native-linear-gradient` dependency.

### 4.2 Specialized Card Components (5 total)

Built on top of the base Card:

| Component | Description | Use Case |
|---|---|---|
| `StatCard` | Large value + unit + label + trend indicator | BP averages, streaks, scores |
| `ListCard` | Header + repeating rows with dividers | Medication lists (short lists, max ~20 items) |
| `CollapsibleCard` | Header + animated expand/collapse body | Detailed breakdowns |
| `CardGroup` | Visually connected cards (shared border radius) | Related stats side-by-side |
| `SkeletonCard` | Shimmer placeholder matching card shape | Loading states |

**`ListCard` usage note:** Designed for short, bounded lists only (fewer than ~20 items). For longer lists (100+ items), use FlashList with Card-styled item components instead.

### 4.3 Sizes

| Size | Padding | Border Radius | Use Case |
|---|---|---|---|
| `sm` | 8pt | 8 | Compact lists |
| `md` | 16pt | 12 | Default |
| `lg` | 20pt | 16 | Hero/feature cards |

### 4.4 Sub-components

```tsx
<Card variant="elevated" size="md" testID="todays-bp-card">
  <CardHeader icon="heart" title={t('home.todaysBP')} action={<Button variant="ghost" size="sm">...</Button>} />
  <CardBody>
    <Text>Content here</Text>
  </CardBody>
  <CardDivider />
  <CardFooter>
    <Button variant="link">{t('common.viewAll')}</Button>
  </CardFooter>
</Card>
```

- `Card` — outer container with variant styling
- `CardHeader` — icon + title + optional action element (right-aligned)
- `CardBody` — main content area
- `CardFooter` — bottom row for actions or metadata
- `CardDivider` — themed horizontal line

### 4.5 Specialized Component APIs

```tsx
{/* Stat Card */}
<StatCard
  value="128"
  unit="mmHg"
  label={t('stats.avgSystolic')}
  trend="down"        // "up" | "down" | "stable"
  trendValue="-3"
  trendColor={colors.success}
  testID="avg-systolic-stat"
/>

{/* Collapsible Card */}
<CollapsibleCard
  title={t('details.circadian')}
  defaultExpanded={false}
>
  <CircadianBreakdownBars data={data} />
</CollapsibleCard>

{/* Skeleton Card */}
<SkeletonCard variant="elevated" lines={3} />

{/* Card Group */}
<CardGroup direction="row">
  <StatCard value="128" label="SBP" />
  <StatCard value="82" label="DBP" />
  <StatCard value="72" label="Pulse" />
</CardGroup>

{/* List Card */}
<ListCard
  title={t('meds.todaySchedule')}
  icon="medical"
  items={medications}
  renderItem={(med) => <MedRow med={med} />}
  maxItems={20}
/>
```

### 4.6 Animations (Reanimated)

| Animation | Trigger | Implementation |
|---|---|---|
| Entry fade | mount | `FadeInUp.delay(Math.min(index, 10) * 50)` — staggered, capped at 10 |
| Press scale | onPressIn/Out (pressable) | `withSpring(0.98)` / `withSpring(1)` |
| Collapse/expand | toggle | Spring-based height animation via `useAnimatedStyle` + `measure()` |
| Skeleton shimmer | continuous | `LinearGradient` + `withRepeat(withTiming(translateX))` — respects `AccessibilityInfo.isReduceMotionEnabled()` (shows static placeholder instead) |
| CardGroup stagger | mount | Shared `entering` layout animation with stagger |

### 4.7 Accessibility

- Pressable cards: `accessibilityRole="button"` + `accessibilityLabel`
- StatCard: combined label e.g., "Average systolic 128 millimeters of mercury, trending down 3"
- CollapsibleCard: `accessibilityState={{ expanded }}` + `accessibilityHint={t('a11y.tapToToggle')}`
- High-contrast mode: shadows removed, 2px solid borders enforced, gradient variant falls back to filled
- Color is never the sole information carrier — always paired with text/icon
- Skeleton shimmer disabled when system reduce-motion is enabled
- `testID` prop supported on all card variants

### 4.8 TypeScript Interfaces

```typescript
interface CardProps {
  variant?: 'elevated' | 'outline' | 'ghost' | 'filled' | 'pressable' | 'gradient';  // default: 'elevated'
  size?: 'sm' | 'md' | 'lg';              // default: 'md'
  onPress?: () => void;                    // required when variant='pressable'
  accessibilityLabel?: string;
  testID?: string;
  children: React.ReactNode;
}

interface StatCardProps {
  value: string;
  unit?: string;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  trendColor?: string;
  testID?: string;
}

interface ListCardProps<T> {
  title: string;
  icon?: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  maxItems?: number;                       // default: 20, for longer lists use FlashList
  testID?: string;
}

interface CollapsibleCardProps {
  title: string;
  defaultExpanded?: boolean;               // default: false
  children: React.ReactNode;
  testID?: string;
}

interface CardGroupProps {
  direction?: 'row' | 'column';            // default: 'row'
  children: React.ReactNode;
  testID?: string;
}

interface SkeletonCardProps {
  variant?: 'elevated' | 'outline';        // default: 'elevated'
  lines?: number;                          // default: 3
  testID?: string;
}
```

---

## 5. Migration Strategy

### Phase 0 — Compatibility Spike (prerequisite)

See Section 0. Verify Gluestack v3 + NativeWind v4 + RN 0.83 + React 19 + Reanimated 4 compatibility.

### Phase 1 — Foundation (no breaking changes)

1. Configure NativeWind properly (metro.config.js, global.css, tailwind.config.js)
2. Install Gluestack UI v3, add GluestackUIProvider to provider hierarchy
3. Build Button component with all 7 variants in `src/shared/ui/Button/`
4. Build Card component with all 6 base variants + 5 specialized cards in `src/shared/ui/Card/`
5. Export from `src/shared/ui/index.ts` barrel
6. Jest snapshot tests for all variants × sizes × theme modes

### Phase 2 — Adopt in new code

- All new pages/widgets use Button and Card components
- Existing code continues working unchanged (StyleSheet coexists with NativeWind)

### Phase 3 — Gradual widget migration (one at a time)

| Widget | Card Migration | Button Migration |
|---|---|---|
| BPRecordCard | → `Card variant="pressable"` | N/A |
| CircadianCard | → `Card variant="elevated"` | N/A |
| CorrelationCard | → `Card variant="elevated"` with `CardHeader` | N/A |
| TodayScheduleCard | → `ListCard variant="outline"` | Checkmark → `Button variant="icon"` |
| CrisisModal | Keep card as-is (complex modal) | Buttons → `Button variant="destructive"` / `primary` |
| PageHeader | Keep as-is (not a card) | N/A |
| SaveButton | Deprecated → `Button variant="primary"` | Direct replacement |
| All ad-hoc Pressables | N/A | → appropriate `Button` variant |

### What Does NOT Change

- `useTheme()` remains the runtime source of truth for all colors and font sizes
- Settings store (Zustand) unchanged
- All 3 theme modes preserved (light, dark, high contrast)
- Senior mode font scaling preserved (inline `typography.*` values)
- FSD architecture respected
- Existing tests continue to pass

---

## 6. File Structure

```
src/shared/ui/
├── Button/
│   ├── Button.tsx              # Main component + sub-components
│   ├── ButtonGroup.tsx         # Group layout component
│   ├── button-animations.ts   # Reanimated hooks (useRipple, usePressScale)
│   ├── button.styles.ts       # NativeWind class compositions
│   └── index.ts               # Barrel export
├── Card/
│   ├── Card.tsx                # Base Card + CardHeader/Body/Footer/Divider
│   ├── StatCard.tsx            # Stat display card
│   ├── ListCard.tsx            # List with rows card (short lists only)
│   ├── CollapsibleCard.tsx     # Expand/collapse card
│   ├── CardGroup.tsx           # Connected cards layout
│   ├── SkeletonCard.tsx        # Shimmer loading card
│   ├── card-animations.ts     # Reanimated hooks (useCollapse, useShimmer)
│   ├── card.styles.ts          # NativeWind class compositions
│   └── index.ts               # Barrel export
├── gluestack/                  # Gluestack UI v3 copied base components
│   └── ...
└── index.ts                    # Updated barrel export
```

---

## 7. Dependencies

**New:**
- Gluestack UI v3 (copy-paste, no npm dep beyond CLI)
- NativeWind properly configured (already installed, currently unused)

**Existing (already in project):**
- react-native-reanimated (animations)
- react-native-linear-gradient (gradient cards)
- react-native-vector-icons/Ionicons (button icons)
- react-native-gesture-handler (Pressable)

**No new npm runtime dependencies expected.** Gluestack v3 copies component source code into the project.

---

## 8. Testing Strategy

- **Unit tests (Jest):** Render each variant, verify accessibility props, verify press callbacks
- **Snapshot tests:** Capture each variant × size × theme mode combination
- **`testID` props:** All components support `testID` for future E2E testing (Detox/Maestro)
- **Manual testing:** Verify on both iOS and Android with all 3 themes + senior mode
- **Accessibility audit:** VoiceOver (iOS) + TalkBack (Android) verification for all interactive components
- **Reduced motion:** Verify skeleton shimmer and entry animations respect `AccessibilityInfo.isReduceMotionEnabled()`

---

## 9. Theme Color Token Mapping

Reference mapping from Tailwind token intentions to `ThemeColors` properties:

| Usage | `useTheme()` Property | Notes |
|---|---|---|
| Card/surface background | `colors.surface` | Primary card bg |
| Page background | `colors.background` | Behind cards |
| Primary text | `colors.textPrimary` | Headings, values |
| Secondary text | `colors.textSecondary` | Labels, captions |
| Accent/CTA | `colors.accent` | Primary buttons, links |
| Borders | `colors.border` | Outline cards, dividers |
| Light borders | `colors.borderLight` | Subtle separators |
| Error/destructive | `colors.error` | Destructive buttons |
| Success | `colors.successText` (fg) / `colors.successBg` (bg) | Trend indicators |
| Warning | `colors.warningText` (fg) / `colors.warningBg` (bg) | Warning states |
| Crisis | `colors.crisisRed` (fg) / `colors.crisisBorder` (border) | Crisis buttons |
| Shadows | `colors.shadow` + `colors.shadowOpacity` | Elevated cards |
| Disabled | `colors.textSecondary` at 50% opacity | Disabled buttons |

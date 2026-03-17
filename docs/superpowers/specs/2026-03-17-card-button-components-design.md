# Card & Button Component System — Design Spec

**Date:** 2026-03-17
**Status:** Approved
**Scope:** New reusable Card and Button components for MedTracker using Gluestack UI v3 + NativeWind

---

## 1. Overview

MedTracker currently has no dedicated Card or Button components. Cards are built inline with `View + StyleSheet` across widgets, and buttons are ad-hoc `Pressable` elements or the single `SaveButton` component. This creates inconsistency and duplicated styling logic.

This spec introduces a full Card and Button component system built on Gluestack UI v3 (copy-paste model, like shadcn/ui) with NativeWind styling, integrated with the existing `useTheme()` system, and enriched with Reanimated micro-interactions.

### Design Direction

- **Visual style:** Modern Minimal — clean flat surfaces, subtle shadows, generous whitespace (Apple Health / Samsung Health aesthetic)
- **Styling engine:** NativeWind-first, with gradual migration of existing StyleSheet code over time
- **Animations:** Rich — press feedback, entry animations, ripple, shimmer skeleton, spring-based collapse

### Key Constraints

- Must support all 3 theme modes (light, dark, high contrast)
- Must support senior mode (1.4x font scale)
- Must meet WCAG AA accessibility (44x44pt touch targets, 4.5:1 contrast, screen reader support)
- Must respect FSD architecture (components live in `shared/ui`)
- `useTheme()` remains the runtime source of truth
- All user-facing strings use `t()` for i18n

---

## 2. Setup & Theme Bridging

### 2.1 Gluestack UI v3 Installation

- Run `npx gluestack-ui init` to scaffold GluestackUIProvider + base config
- Components are copied (not installed as deps) into `src/shared/ui/gluestack/`
- Add individual components via `npx gluestack-ui add button card`

### 2.2 NativeWind Configuration

Configure `tailwind.config.js` with MedTracker's existing theme tokens:

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Mapped from src/shared/config/theme.ts
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        accent: 'var(--color-accent)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        border: 'var(--color-border)',
        error: 'var(--color-error)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        crisis: 'var(--color-crisis)',
        shadow: 'var(--color-shadow)',
      },
      fontFamily: {
        nunito: ['Nunito-Regular'],
        'nunito-medium': ['Nunito-Medium'],
        'nunito-semibold': ['Nunito-SemiBold'],
        'nunito-bold': ['Nunito-Bold'],
        'nunito-extrabold': ['Nunito-ExtraBold'],
      },
    },
  },
  plugins: [],
};
```

### 2.3 Theme Bridge

A `ThemeBridge` component (rendered inside `GluestackUIProvider`) sets CSS variables from `useTheme()` at runtime:

```tsx
// src/shared/lib/ThemeBridge.tsx
function ThemeBridge({ children }) {
  const { colors } = useTheme();
  // Sets CSS custom properties that NativeWind/Tailwind classes resolve against
  // Updates reactively when theme/mode changes
}
```

This means:
- `useTheme()` drives the values (dark/light/high-contrast, senior mode)
- NativeWind classes like `bg-surface` and `text-accent` resolve to the correct colors
- No duplication of color definitions

### 2.4 Provider Hierarchy

```
<SafeAreaProvider>
  <QueryClientProvider>
    <GluestackUIProvider>
      <ThemeBridge>
        <NavigationContainer>
          ...
        </NavigationContainer>
      </ThemeBridge>
    </GluestackUIProvider>
  </QueryClientProvider>
</SafeAreaProvider>
```

---

## 3. Button Component

**Location:** `src/shared/ui/Button/`

### 3.1 Variants

| Variant | Appearance | Primary Use Case |
|---|---|---|
| `primary` | Filled teal, white text | Main CTAs (Save Reading, Log Dose) |
| `secondary` | Outlined teal border, teal text | Secondary actions (Cancel, Back) |
| `ghost` | Text-only, no border/bg | Tertiary actions (Skip, Dismiss) |
| `destructive` | Filled red, white text | Delete reading, Remove medication |
| `icon` | Circle/rounded square, icon centered | Toolbar actions, close buttons |
| `fab` | Floating circle, elevation shadow | Quick-add new reading |
| `link` | Underlined text, no padding | Inline navigation ("View all") |
| `split` | Primary + dropdown chevron | Actions with sub-options |

### 3.2 Sizes

| Size | Min Height | Font Size | Icon Size | Use Case |
|---|---|---|---|---|
| `xs` | 28pt | typography.xs | 14 | Dense toolbars |
| `sm` | 36pt | typography.sm | 16 | Secondary actions |
| `md` | 44pt | typography.md | 20 | Default |
| `lg` | 52pt | typography.lg | 24 | Primary CTAs |

All sizes auto-scale with senior mode via `typography` computed values. Minimum touch target of 44x44pt enforced even on `xs`/`sm` via hit slop.

### 3.3 States

- **Default** — standard appearance
- **Pressed** — spring scale to 0.96 + opacity 0.85
- **Disabled** — opacity 0.5, non-interactive, `accessibilityState={{ disabled: true }}`
- **Loading** — spinner replaces content with smooth crossfade, non-interactive
- **Focused** — visible focus ring (2px accent outline, especially prominent in high-contrast mode)

### 3.4 Sub-components

```tsx
<Button variant="primary" size="md" onPress={handleSave} isLoading={saving}>
  <ButtonIcon as={Ionicons} name="checkmark" />
  <ButtonText>{t('common.save')}</ButtonText>
</Button>

<ButtonGroup direction="row" spacing="sm">
  <Button variant="secondary">...</Button>
  <Button variant="primary">...</Button>
</ButtonGroup>
```

- `Button` — container with press handling, layout, and animation
- `ButtonText` — styled text (inherits variant color, font family + weight)
- `ButtonIcon` — icon element (inherits variant color, size-appropriate)
- `ButtonSpinner` — ActivityIndicator for loading state
- `ButtonGroup` — layout container with direction, spacing, and optional `isAttached` for connected buttons

### 3.5 Animations (Reanimated)

| Animation | Trigger | Implementation |
|---|---|---|
| Press scale | onPressIn/onPressOut | `withSpring(0.96)` / `withSpring(1)` |
| Ripple | onPress | Expanding circle `SharedValue` from touch coordinates, opacity fade |
| Loading crossfade | isLoading change | `withTiming` opacity swap between content and spinner |
| FAB entry | mount | `withSpring` translateY from bottom + scale from 0 |

### 3.6 Accessibility

- `accessibilityRole="button"` on all variants
- `accessibilityLabel` via `t()` — required prop for `icon` variant
- `accessibilityState={{ disabled, busy }}` — `busy` set during loading
- Minimum 44x44pt touch target enforced (hit slop on smaller sizes)
- High-contrast mode: 2px solid borders, no shadow reliance
- Crisis-related destructive buttons: `accessibilityHint` explaining the action

---

## 4. Card Component

**Location:** `src/shared/ui/Card/`

### 4.1 Variants

| Variant | Appearance | Primary Use Case |
|---|---|---|
| `elevated` | White/surface bg, subtle shadow | Default container (CircadianCard) |
| `outline` | Border, no shadow | TodayScheduleCard style |
| `ghost` | No border/shadow, just padding | Lightweight grouping |
| `filled` | Tinted background (accent at 10% opacity) | Highlighted info sections |
| `pressable` | Elevated + press animation + onPress | Tappable BPRecordCard |
| `gradient` | LinearGradient background | Summary cards, premium feel |

### 4.2 Specialized Card Components

Built on top of the base Card:

| Component | Description | Use Case |
|---|---|---|
| `StatCard` | Large value + unit + label + trend indicator | BP averages, streaks, scores |
| `ListCard` | Header + repeating rows with dividers | Medication lists, reading history |
| `SectionedCard` | Multiple titled sections with dividers | Settings groups, detail views |
| `CollapsibleCard` | Header + animated expand/collapse body | Detailed breakdowns, FAQ |
| `CardGroup` | Visually connected cards (shared border radius) | Related stats side-by-side |
| `SkeletonCard` | Shimmer placeholder matching card shape | Loading states |

### 4.3 Sizes

| Size | Padding | Border Radius | Use Case |
|---|---|---|---|
| `sm` | 8pt | 8 | Compact lists |
| `md` | 16pt | 12 | Default |
| `lg` | 20pt | 16 | Hero/feature cards |

### 4.4 Sub-components

```tsx
<Card variant="elevated" size="md">
  <CardHeader icon="heart" title={t('home.todaysBP')} action={<Button variant="ghost" size="xs">...</Button>} />
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
/>
```

### 4.6 Animations (Reanimated)

| Animation | Trigger | Implementation |
|---|---|---|
| Entry fade | mount | `FadeInUp.delay(index * 50)` — staggered in lists |
| Press scale | onPressIn/Out (pressable) | `withSpring(0.98)` / `withSpring(1)` |
| Collapse/expand | toggle | Spring-based height animation via `useAnimatedStyle` + `measure()` |
| Skeleton shimmer | continuous | `LinearGradient` + `withRepeat(withTiming(translateX))` |
| CardGroup stagger | mount | Shared `entering` layout animation with stagger |

### 4.7 Accessibility

- Pressable cards: `accessibilityRole="button"` + `accessibilityLabel`
- StatCard: combined label e.g., "Average systolic 128 millimeters of mercury, trending down 3"
- CollapsibleCard: `accessibilityState={{ expanded }}` + `accessibilityHint={t('a11y.tapToToggle')}`
- High-contrast mode: shadows removed, 2px solid borders enforced, no gradient variant (falls back to filled)
- Color is never the sole information carrier — always paired with text/icon

---

## 5. Migration Strategy

### Phase 1 — Foundation (no breaking changes)

1. Install Gluestack UI v3, configure NativeWind (tailwind.config.js, metro.config.js, babel.config.js)
2. Create ThemeBridge to map `useTheme()` colors → CSS variables
3. Add GluestackUIProvider to provider hierarchy
4. Build Button component with all variants in `src/shared/ui/Button/`
5. Build Card component with all variants in `src/shared/ui/Card/`
6. Export from `src/shared/ui/index.ts` barrel
7. Add Storybook-style test page (optional) or Jest snapshot tests

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
| PageHeader | Keep as-is (not a card) | N/A |
| SaveButton | Deprecated → `Button variant="primary"` | Direct replacement |
| All ad-hoc Pressables | N/A | → appropriate `Button` variant |

### What Does NOT Change

- `useTheme()` remains the runtime source of truth
- Settings store (Zustand) unchanged
- All 3 theme modes preserved (light, dark, high contrast)
- Senior mode font scaling preserved
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
│   ├── ListCard.tsx            # List with rows card
│   ├── SectionedCard.tsx       # Multi-section card
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
- **Manual testing:** Verify on both iOS and Android with all 3 themes + senior mode
- **Accessibility audit:** VoiceOver (iOS) + TalkBack (Android) verification for all interactive components

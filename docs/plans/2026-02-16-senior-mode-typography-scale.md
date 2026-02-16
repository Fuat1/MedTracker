# Senior Mode Typography Scale Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every text element in the app scale at 1.4× in Senior Mode, raising minimum body text from 16px to 22px (meeting the NIH/NCBI 22pt research minimum for adults 65+), and fixing all screens that currently ignore `fontScale` entirely.

**Architecture:** Add `TYPOGRAPHY_BASE` constants + `computeTypographyScale()` to `theme.ts`, update `useTheme()` to return a `typography` object with pre-computed sizes, then replace hardcoded `fontSize: N` with `typography.XX` or `Math.round(N * fontScale)` across ~18 files. The `fontScale` raw multiplier stays in the hook return for backward compatibility and SVG usage.

**Tech Stack:** React Native CLI, TypeScript strict, NativeWind, react-native-svg (for chart text), Zustand (settings-store for seniorMode), Jest (existing test infra in `src/shared/lib/__tests__/`)

---

## Size Mapping Reference (use this throughout the plan)

| Typography Key | Base (px) | Senior 1.4× (px) | Maps from |
|---|---|---|---|
| `xs` | 12 | 17 | 11, 12 |
| `sm` | 14 | 20 | 13, 14 |
| `md` | 16 | 22 | 15, 16 |
| `lg` | 18 | 25 | 18 |
| `xl` | 22 | 31 | 22 |
| `'2xl'` | 28 | 39 | 28 |
| `'3xl'` | 36 | 50 | 36 |
| `hero` | 56 | 78 | 56 |

For sizes **not in the table** (24, 26, 30, 32, 44, 60, 64): use `Math.round(N * fontScale)` to preserve normal-mode sizes exactly.

---

## Task 1: Add `computeTypographyScale` to theme.ts (TDD)

**Files:**
- Create: `src/shared/config/__tests__/typography-scale.test.ts`
- Modify: `src/shared/config/theme.ts`

**Step 1: Write the failing test**

Create `src/shared/config/__tests__/typography-scale.test.ts`:

```typescript
import { computeTypographyScale, TYPOGRAPHY_BASE, SENIOR_SCALE } from '../theme';

describe('computeTypographyScale', () => {
  describe('normal mode (seniorMode=false)', () => {
    it('returns base sizes unchanged', () => {
      const t = computeTypographyScale(false);
      expect(t.xs).toBe(12);
      expect(t.sm).toBe(14);
      expect(t.md).toBe(16);
      expect(t.lg).toBe(18);
      expect(t.xl).toBe(22);
      expect(t['2xl']).toBe(28);
      expect(t['3xl']).toBe(36);
      expect(t.hero).toBe(56);
    });

    it('fontScale is 1.0 in normal mode', () => {
      expect(SENIOR_SCALE).toBe(1.4);
      expect(TYPOGRAPHY_BASE.md).toBe(16);
    });
  });

  describe('senior mode (seniorMode=true)', () => {
    it('applies 1.4x scale to all sizes', () => {
      const t = computeTypographyScale(true);
      expect(t.xs).toBe(17);   // Math.round(12 * 1.4)
      expect(t.sm).toBe(20);   // Math.round(14 * 1.4)
      expect(t.md).toBe(22);   // Math.round(16 * 1.4)
      expect(t.lg).toBe(25);   // Math.round(18 * 1.4)
      expect(t.xl).toBe(31);   // Math.round(22 * 1.4)
      expect(t['2xl']).toBe(39); // Math.round(28 * 1.4)
      expect(t['3xl']).toBe(50); // Math.round(36 * 1.4)
      expect(t.hero).toBe(78);  // Math.round(56 * 1.4)
    });

    it('body text (md) meets 22pt minimum for 65+ adults (NIH/NCBI)', () => {
      const t = computeTypographyScale(true);
      expect(t.md).toBeGreaterThanOrEqual(22);
    });
  });
});
```

**Step 2: Run test to see it fail**

```bash
npm test -- --testPathPattern="typography-scale" --watchAll=false
```

Expected: FAIL — `computeTypographyScale` is not exported from `../theme`

**Step 3: Add to `src/shared/config/theme.ts`**

Add at the top of the file (after the existing import line, before `FONTS`):

```typescript
// ─── Typography Scale ────────────────────────────────────────────────────────

/** Base font sizes (normal mode). All values are in logical pixels. */
export const TYPOGRAPHY_BASE = {
  xs: 12,    // Smallest: chart labels, decorators, units
  sm: 14,    // Small: captions, timestamps, secondary info
  md: 16,    // Base body text → 22px in senior mode (meets 22pt for 65+)
  lg: 18,    // Section headers, card titles
  xl: 22,    // Prominent values (pulse badge, category label)
  '2xl': 28, // Statistics display values, large headings
  '3xl': 36, // Entry form input display
  hero: 56,  // Main BP reading hero display
} as const;

export type TypographyScale = typeof TYPOGRAPHY_BASE;

/** Scale multiplier applied in Senior Mode. 16 × 1.4 = 22.4 → 22px (rounds). */
export const SENIOR_SCALE = 1.4;

/**
 * Returns a TypographyScale with sizes multiplied by SENIOR_SCALE when seniorMode is true.
 * All sizes are rounded to whole pixels.
 */
export function computeTypographyScale(seniorMode: boolean): TypographyScale {
  const scale = seniorMode ? SENIOR_SCALE : 1.0;
  return {
    xs:    Math.round(TYPOGRAPHY_BASE.xs    * scale),
    sm:    Math.round(TYPOGRAPHY_BASE.sm    * scale),
    md:    Math.round(TYPOGRAPHY_BASE.md    * scale),
    lg:    Math.round(TYPOGRAPHY_BASE.lg    * scale),
    xl:    Math.round(TYPOGRAPHY_BASE.xl    * scale),
    '2xl': Math.round(TYPOGRAPHY_BASE['2xl'] * scale),
    '3xl': Math.round(TYPOGRAPHY_BASE['3xl'] * scale),
    hero:  Math.round(TYPOGRAPHY_BASE.hero  * scale),
  };
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="typography-scale" --watchAll=false
```

Expected: PASS — all 4 tests green

**Step 5: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors

**Step 6: Commit**

```bash
git add src/shared/config/__tests__/typography-scale.test.ts src/shared/config/theme.ts
git commit -m "feat(typography): add TYPOGRAPHY_BASE, SENIOR_SCALE, computeTypographyScale"
```

---

## Task 2: Update `useTheme` to return `typography`

**Files:**
- Modify: `src/shared/lib/use-theme.ts`

**Step 1: Update the interface and hook**

Replace the entire file content of `src/shared/lib/use-theme.ts`:

```typescript
import { useColorScheme } from 'react-native';
import { useSettingsStore } from './settings-store';
import {
  lightColors,
  darkColors,
  highContrastColors,
  computeTypographyScale,
  SENIOR_SCALE,
  type ThemeColors,
  type TypographyScale,
} from '../config/theme';

interface UseThemeResult {
  colors: ThemeColors;
  isDark: boolean;
  fontScale: number;
  highContrast: boolean;
  typography: TypographyScale;
}

export function useTheme(): UseThemeResult {
  const { theme, highContrast, seniorMode } = useSettingsStore();
  const systemColorScheme = useColorScheme();

  // High Contrast forces Light Mode
  const effectiveTheme = highContrast ? 'light' : theme;

  // Determine actual theme (resolve 'system')
  const actualTheme =
    effectiveTheme === 'system'
      ? systemColorScheme || 'light'
      : effectiveTheme;

  const isDark = actualTheme === 'dark';

  // Use high-contrast palette if enabled, otherwise normal theme colors
  const colors = highContrast
    ? highContrastColors
    : (isDark ? darkColors : lightColors);

  // Font scale multiplier for Senior Mode
  const fontScale = seniorMode ? SENIOR_SCALE : 1.0;

  // Pre-computed typography scale (use these in components instead of raw fontScale math)
  const typography = computeTypographyScale(seniorMode);

  return { colors, isDark, fontScale, highContrast, typography };
}
```

**Step 2: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors

**Step 3: Run all tests**

```bash
npm test -- --watchAll=false
```

Expected: all existing tests pass (no regressions)

**Step 4: Commit**

```bash
git add src/shared/lib/use-theme.ts
git commit -m "feat(typography): add typography object to useTheme return value"
```

---

## Task 3: Fix `LineChart.tsx` — SVG labels (user-reported issue)

This is the primary user-reported issue: the "Last 7 Days" chart labels are `fontSize={11}` and never scale.

**Files:**
- Modify: `src/shared/ui/LineChart.tsx`

**Step 1: Update the component**

In `src/shared/ui/LineChart.tsx`:

1. Change `const { colors } = useTheme();` to `const { colors, typography } = useTheme();`
2. Change `fontSize={11}` on `<SvgText>` to `fontSize={typography.xs}`
3. Change `fontSize: 14` on `styles.emptyText` to use inline style with fontScale

Full diff:
```typescript
// Line 25 — change:
const { colors } = useTheme();
// to:
const { colors, typography } = useTheme();

// Lines 98-108 — change fontSize={11} to:
<SvgText
  x={x}
  y={y - 12}
  fontSize={typography.xs}   // ← was: fontSize={11}
  fontFamily={FONTS.medium}
  fontWeight="500"
  fill={colors.chartLabel}
  textAnchor="middle"
>

// In StyleSheet, line 124 — change:
  fontSize: 14,
// to: (keep as inline style using fontScale, or just keep at 14 — this is empty state text)
// Leave as is — it is set in the component inline style already? No, it's a StyleSheet.
// Actually we should update the emptyText style.
```

For `styles.emptyText`, since StyleSheet is static, we need to move it inline. Change the empty state JSX from:
```typescript
<Text style={[styles.emptyText, { color: colors.textTertiary }]}>{emptyText}</Text>
```
to:
```typescript
<Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>
  {emptyText}
</Text>
```
And remove `fontSize: 14` from `styles.emptyText`.

**Step 2: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

**Step 3: Commit**

```bash
git add src/shared/ui/LineChart.tsx
git commit -m "fix(chart): scale LineChart SVG labels and empty text with senior mode"
```

---

## Task 4: Fix `BPTrendChart.tsx` — SVG labels

**Files:**
- Modify: `src/shared/ui/BPTrendChart.tsx`

**Step 1: Find and update font sizes**

In `BPTrendChart.tsx`, the file uses `fontSize={10}` for axis labels and `fontSize={11}` for value labels. It also has `fontSize: 14` in StyleSheet.

1. Add `typography` to `useTheme()` destructure
2. Replace `fontSize={10}` with `fontSize={typography.xs}` (all occurrences — lines ~149, 158, 167, 180)
3. Replace `fontSize={11}` with `fontSize={typography.xs}` (all occurrences — lines ~308, 320, 334, 350)
4. Replace `fontSize: 14` in the StyleSheet (line ~369) with inline style using `typography.sm`

Pattern for StyleSheet fontSize:
- Find `const { colors } = useTheme();` (or similar) and add `typography`
- Any `fontSize: N` in StyleSheet that should scale must be moved to inline style `{ fontSize: typography.XX }`

**Step 2: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

**Step 3: Commit**

```bash
git add src/shared/ui/BPTrendChart.tsx
git commit -m "fix(chart): scale BPTrendChart SVG labels with senior mode typography"
```

---

## Task 5: Fix `HomePage.tsx` — trend title and card labels

This file already uses `fontScale` correctly for the main BP value, pulse, PP/MAP, and category. Only the static StyleSheet sizes need updating.

**Files:**
- Modify: `src/pages/home/ui/HomePage.tsx`

**Step 1: Add `typography` to the hook destructure**

Change:
```typescript
const { colors, isDark, fontScale } = useTheme();
```
to:
```typescript
const { colors, isDark, fontScale, typography } = useTheme();
```

**Step 2: Update the trendTitle style (the primary bug)**

In the JSX, add `fontSize: typography.lg` inline to the `trendTitle`:
```typescript
<Text style={[styles.trendTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
  {t('home.last7Days')}
</Text>
```
Remove `fontSize: 18` from `styles.trendTitle` in StyleSheet (it's now always set inline).

**Step 3: Update remaining static sizes**

Move these from StyleSheet to inline styles (or add alongside existing `{ color: ... }` object):

| Style name | Current size | Key | Where to set inline |
|---|---|---|---|
| `bpCardLabel` | 16 | `typography.md` | Wrap existing style with `{ color: ..., fontSize: typography.md }` |
| `bpUnit` | 16 | `typography.md` | Same pattern |
| `categoryTextEmpty` | 14 | `typography.sm` | Same pattern |
| `pulseUnit` | 12 | `typography.xs` | Same pattern |
| `metricDivider` | 16 | `typography.md` | Same pattern |

For `bpCardLabel` example:
```typescript
// Before (JSX):
<Text style={styles.bpCardLabel}>{t('home.bpReadings')}</Text>

// After (JSX):
<Text style={[styles.bpCardLabel, { fontSize: typography.md }]}>{t('home.bpReadings')}</Text>
```

Remove the `fontSize` from the corresponding StyleSheet entries.

**Step 4: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

**Step 5: Commit**

```bash
git add src/pages/home/ui/HomePage.tsx
git commit -m "fix(home): scale all text in HomePage with senior mode typography"
```

---

## Task 6: Fix `AnalyticsPage.tsx` — statistics that never scaled

This is the largest task. The analytics page has 12+ hardcoded sizes, none of which scale.

**Files:**
- Modify: `src/pages/analytics/ui/AnalyticsPage.tsx`

**Step 1: Add `typography` to useTheme**

Change:
```typescript
const { colors, isDark } = useTheme();
```
to:
```typescript
const { colors, isDark, typography } = useTheme();
```

**Step 2: Move every StyleSheet `fontSize` to inline styles**

For each style name, move `fontSize` out of StyleSheet into JSX:

| Style name | Size | Key | Notes |
|---|---|---|---|
| `cardTitle` | 18 | `typography.lg` | Card section headers |
| `rangeLabel` | 13 | `typography.sm` | "Start" / "End" labels |
| `notesInput` | 14 | `typography.sm` | Doctor notes TextInput |
| `statLabel` | 13 | `typography.sm` | "Avg Systolic", etc. |
| `statValue` | 28 | `typography['2xl']` | **The key stat number** |
| `statUnit` | 12 | `typography.xs` | "mmHg" under stats |
| `statNoData` | 13 | `typography.sm` | No data message |
| `amPmLabel` | 12 | `typography.xs` | "AM" / "PM" labels |
| `amPmValue` | 16 | `typography.md` | AM/PM reading values |
| `cardSubtitle` | 15 | `typography.md` | Sub-section text |
| `noDataText` | 14 | `typography.sm` | No data message |
| `surgeText` | 13 | `typography.sm` | Morning surge warning |
| `toggleLabel` | 14 | `typography.sm` | PP/MAP toggle labels |
| `checkboxLabel` | 15 | `typography.md` | PDF export checkbox |
| `exportButtonText` | 16 | `typography.md` | Export/Download buttons |

**Pattern for the JSX update:** Find every Text component using these style names and add `fontSize: typography.XX` to the style array.

Example for `statValue` (the critical statistic that was unreadable):
```typescript
// Before:
<Text style={[styles.statValue, { color: colors.textPrimary }]}>

// After:
<Text style={[styles.statValue, { color: colors.textPrimary, fontSize: typography['2xl'] }]}>
```

For `notesInput` (TextInput uses `style` prop same way):
```typescript
// Before:
<TextInput style={[styles.notesInput, { color: colors.textPrimary, ... }]} ...>

// After:
<TextInput style={[styles.notesInput, { color: colors.textPrimary, ..., fontSize: typography.sm }]} ...>
```

**Step 3: Remove the `fontSize` from each StyleSheet entry** (so there's no conflict)

**Step 4: Typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

**Step 5: Commit**

```bash
git add src/pages/analytics/ui/AnalyticsPage.tsx
git commit -m "fix(analytics): scale all statistics and card text with senior mode typography"
```

---

## Task 7: Fix `PageHeader.tsx`

**Files:**
- Modify: `src/widgets/page-header/ui/PageHeader.tsx`

**Step 1: Add `typography` to useTheme**

Change:
```typescript
const { colors } = useTheme();
```
to:
```typescript
const { colors, typography } = useTheme();
```

**Step 2: Update JSX with inline sizes**

| Style name | Size | Key |
|---|---|---|
| `greetingText` | 22 | `typography.xl` |
| `userName` | 28 | `typography['2xl']` |
| `title` | 28 | `typography['2xl']` |
| `badgeText` | 11 | `typography.xs` |

For each Text component, add `fontSize: typography.XX` to the style array. Remove `fontSize` from the StyleSheet entries.

**Step 3: Typecheck + commit**

```bash
npx tsc --noEmit --skipLibCheck
git add src/widgets/page-header/ui/PageHeader.tsx
git commit -m "fix(page-header): scale greeting, title, and badge text with senior mode"
```

---

## Task 8: Fix `BPRecordCard.tsx`

**Files:**
- Modify: `src/widgets/bp-record-card/ui/BPRecordCard.tsx`

**Step 1: Identify the component's useTheme call**

Find `useTheme()` in the file and add `typography` to the destructure.

**Step 2: Update compact variant styles (lines ~229-282)**

| Style name | Size | Key/Expression |
|---|---|---|
| `time` | 16 | `typography.md` |
| `period` | 11 | `typography.xs` |
| `bpValue` | 22 | `typography.xl` |
| `unit` | 11 | `typography.xs` |
| `badgeText` | 11 | `typography.xs` |

**Step 3: Update full variant styles (lines ~284-433)**

| Style name | Size | Key/Expression |
|---|---|---|
| `valueTextLarge` | 26 | `Math.round(26 * fontScale)` |
| `separator` | 18 | `typography.lg` |
| `unit` | 12 | `typography.xs` |
| `timeText` | 12 | `typography.xs` |
| `badgeText` | 12 | `typography.xs` |
| `detailChipText` | 12 | `typography.xs` |
| `timestamp` | 11 | `typography.xs` |
| `windowChipText` | 11 | `typography.xs` |
| `surgeChipText` | 11 | `typography.xs` |
| `notesText` | 13 | `typography.sm` |

Note: `valueTextLarge` at 26px uses `Math.round(26 * fontScale)` rather than a key to avoid changing the normal-mode design.

**Step 4: Typecheck + commit**

```bash
npx tsc --noEmit --skipLibCheck
git add src/widgets/bp-record-card/ui/BPRecordCard.tsx
git commit -m "fix(bp-record-card): scale reading values and metadata with senior mode typography"
```

---

## Task 9: Fix `BPEntryForm.tsx`

**Files:**
- Modify: `src/widgets/bp-entry-form/ui/BPEntryForm.tsx`

**Step 1: Add `typography` (and `fontScale`) to useTheme destructure**

**Step 2: Update sizes**

| Style name | Size | Key/Expression |
|---|---|---|
| `fieldLabel` | 14 | `typography.sm` |
| `fieldValue` (36px) | 36 | `typography['3xl']` |
| `fieldValueUnit` (24px) | 24 | `Math.round(24 * fontScale)` |
| `dateLabel` | 14 | `typography.sm` |
| `dateValue` (24px) | 24 | `Math.round(24 * fontScale)` |
| `pulseLabel` | 16 | `typography.md` |
| `pulseDescription` | 14 | `typography.sm` |
| `sectionTitle` | 18 | `typography.lg` |
| `sectionDesc` | 14 | `typography.sm` |
| `locationTitle` | 18 | `typography.lg` |
| `locationValueText` (30px) | 30 | `Math.round(30 * fontScale)` |
| `locationValue` | 18 | `typography.lg` |

Find each Text/TextInput in JSX that uses these styles and add inline `fontSize`.

**Step 3: Typecheck + commit**

```bash
npx tsc --noEmit --skipLibCheck
git add src/widgets/bp-entry-form/ui/BPEntryForm.tsx
git commit -m "fix(bp-entry-form): scale field labels, values, section headers with senior mode"
```

---

## Task 10: Fix `BPRecordsList.tsx` and `HistoryPage.tsx`

**Files:**
- Modify: `src/widgets/bp-records-list/ui/BPRecordsList.tsx`
- Modify: `src/pages/history/ui/HistoryPage.tsx`

### BPRecordsList.tsx

**Step 1: Add `typography` to useTheme**

**Step 2: Update sizes**

| Style name | Size | Key/Expression |
|---|---|---|
| `errorTitle` | 18 | `typography.lg` |
| `emptyIcon` | 60 | `Math.round(60 * fontScale)` |
| `emptyTitle` | 18 | `typography.lg` |
| `sectionTitle` | 14 | `typography.sm` |

### HistoryPage.tsx

**Step 1: Add `typography` to useTheme**

**Step 2: Update sizes**

| Style name | Size | Key |
|---|---|---|
| `filterTabText` | 14 | `typography.sm` |

**Step 3: Typecheck + commit**

```bash
npx tsc --noEmit --skipLibCheck
git add src/widgets/bp-records-list/ui/BPRecordsList.tsx src/pages/history/ui/HistoryPage.tsx
git commit -m "fix(history): scale list empty state, section headers, and filter tabs"
```

---

## Task 11: Fix `SettingsPage.tsx`

**Files:**
- Modify: `src/pages/settings/ui/SettingsPage.tsx`

**Step 1: Add `typography` to useTheme**

**Step 2: Update sizes**

| Style name | Size | Key |
|---|---|---|
| `profileName` | 24 | `Math.round(24 * fontScale)` |
| `cardTitle` | 18 | `typography.lg` |
| `cardSubtitle` | 13 | `typography.sm` |
| `settingLabel` | 14 | `typography.sm` |
| `settingDescription` | 12 | `typography.xs` |
| `noteText` | 11 | `typography.xs` |
| `activeText` | 14 | `typography.sm` |
| `warningText` | 13 | `typography.sm` |
| `outlineButtonText` | 14 | `typography.sm` |
| `filledButtonText` | 14 | `typography.sm` |
| `systemThemeText` | 13 | `typography.sm` |
| `legendText` | 14 | `typography.sm` |
| `detectRegionText` | 14 | `typography.sm` |

**Step 3: Typecheck + commit**

```bash
npx tsc --noEmit --skipLibCheck
git add src/pages/settings/ui/SettingsPage.tsx
git commit -m "fix(settings): scale all settings labels and card text with senior mode"
```

---

## Task 12: Fix `PreMeasurementPage.tsx`, `NewReadingPage.tsx`, `QuickLogPage.tsx`

**Files:**
- Modify: `src/pages/pre-measurement/ui/PreMeasurementPage.tsx`
- Modify: `src/pages/new-reading/ui/NewReadingPage.tsx`
- Modify: `src/pages/quick-log/ui/QuickLogPage.tsx`

### PreMeasurementPage.tsx

Add `typography` and update:

| Style name | Size | Key |
|---|---|---|
| `stepTitle` (22px) | 22 | `typography.xl` |
| `stepHeader` (26px) | 26 | `Math.round(26 * fontScale)` |
| `stepDescription` (15px) | 15 | `typography.md` |
| `checklistItem` (15px) | 15 | `typography.md` |
| `breathingText` (15px) | 15 | `typography.md` |
| `timerDisplay` (56px) | 56 | `typography.hero` |
| `timerLabel` (13px) | 13 | `typography.sm` |
| `readyText` (15px) | 15 | `typography.md` |
| `buttonText` (16px) | 16 | `typography.md` |

### NewReadingPage.tsx

This page already uses `fontScale` for the main input display (32 * fontScale) and category (13 * fontScale). Still has static sizes:

| Style name | Size | Key |
|---|---|---|
| `stepLabel` (22px) | 22 | `typography.xl` |
| `fieldUnitLabel` (22px) | 22 | `typography.xl` |
| `fieldSeparator` (10px) | 10 | `typography.xs` |
| `categorySubtext` (9px) | 9 | (leave as-is — decorative) |

### QuickLogPage.tsx

This page already uses `fontScale` for the main display (44 * fontScale) and category (13 * fontScale). Still has static sizes:

| Style name | Size | Key |
|---|---|---|
| `stepLabel` (22px) | 22 | `typography.xl` |
| `fieldLabel` (12px) | 12 | `typography.xs` |
| `fieldUnit` (22px) | 22 | `typography.xl` |
| `fieldSeparator` (10px) | 10 | `typography.xs` |
| `categorySubtext` (9px) | 9 | (leave as-is — decorative) |

**Step: Typecheck + commit all three**

```bash
npx tsc --noEmit --skipLibCheck
git add src/pages/pre-measurement/ui/PreMeasurementPage.tsx \
        src/pages/new-reading/ui/NewReadingPage.tsx \
        src/pages/quick-log/ui/QuickLogPage.tsx
git commit -m "fix(entry): scale pre-measurement and entry form text with senior mode"
```

---

## Task 13: Fix `BreathingGuide.tsx`

**Files:**
- Modify: `src/widgets/breathing-guide/ui/BreathingGuide.tsx`

**Step 1: Add `typography` to useTheme**

**Step 2: Update sizes**

| Style name | Size | Key/Expression |
|---|---|---|
| `emojiText` (64px) | 64 | `Math.round(64 * fontScale)` |
| `phaseTitle` (24px) | 24 | `Math.round(24 * fontScale)` |
| `phaseDescription` (15px) | 15 | `typography.md` |

**Step 3: Typecheck + commit**

```bash
npx tsc --noEmit --skipLibCheck
git add src/widgets/breathing-guide/ui/BreathingGuide.tsx
git commit -m "fix(breathing-guide): scale phase title and description with senior mode"
```

---

## Task 14: Final Verification

**Step 1: Run full test suite**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass (new typography tests + all existing tests)

**Step 2: Full TypeScript check**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: 0 errors

**Step 3: ESLint**

```bash
npx eslint src/ --ext .ts,.tsx
```

Expected: 0 errors (may have warnings — acceptable)

**Step 4: Manual visual verification checklist**

Enable Senior Mode in Settings, then verify on each screen:

- [ ] **Home**: BP reading card text scales (bpCardLabel, unit text, PP/MAP labels, category)
- [ ] **Home**: "Last 7 Days" trend title is larger in senior mode
- [ ] **Home**: LineChart SVG dot labels are larger in senior mode
- [ ] **Analytics**: Weekly avg statistic values (28px → 39px) are clearly readable
- [ ] **Analytics**: All card titles, labels, AM/PM values are larger
- [ ] **History**: Filter tab text is larger; record card BP values are larger
- [ ] **Settings**: All setting labels, descriptions, card titles are larger
- [ ] **Quick Log**: Entry labels (22px → 31px) are larger
- [ ] **New Reading**: Step labels are larger
- [ ] **Pre-Measurement**: Step headers, descriptions, timer scale
- [ ] **Normal Mode**: All screens look identical to before (fontScale=1.0 returns exact base sizes)

**Step 5: Commit verification results (optional note in docs)**

```bash
git add -A
git commit -m "chore: verify senior mode typography across all screens" --allow-empty
```

---

## Summary

**Files changed: ~18**
- `src/shared/config/theme.ts` + `__tests__/typography-scale.test.ts`
- `src/shared/lib/use-theme.ts`
- `src/shared/ui/LineChart.tsx`, `BPTrendChart.tsx`
- `src/pages/home/`, `analytics/`, `history/`, `settings/`, `pre-measurement/`, `new-reading/`, `quick-log/`
- `src/widgets/page-header/`, `bp-entry-form/`, `bp-record-card/`, `bp-records-list/`, `breathing-guide/`

**Result:**
- Senior mode body text: 16px → **22px** (meets NIH/NCBI 22pt minimum for 65+ adults)
- All previously unscaled text now scales at 1.4× in senior mode
- Normal mode: zero visual regressions (fontScale=1.0 preserves all current sizes)
- Chart labels (home page trend, analytics chart) now scale in senior mode

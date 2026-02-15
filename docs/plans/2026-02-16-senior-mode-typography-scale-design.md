# Senior Mode Typography Scale — Design

**Date**: 2026-02-16
**Status**: Approved
**Author**: Claude Code + User

## Problem

Senior Mode currently applies a 1.2× font scale (20% increase), which is insufficient for users 65+. Research (NIH/NCBI, Frontiers in Psychology 2022) establishes that 65+ adults require a minimum of 22pt body text on mobile touchscreens. With a base of 16px, a 1.2× scale produces only 19.2px — below the threshold.

Additionally, dozens of components ignore `fontScale` entirely. Hardcoded font sizes exist across:
- `AnalyticsPage` — 12 statistics text sizes, none scaled
- `PageHeader` — section headings not scaled
- `BPRecordCard`, `BPRecordsList` — reading card values not scaled
- `LineChart` SVG — `fontSize={11}` labels never grow
- `SettingsPage`, `HistoryPage`, `PreMeasurementPage`, `BreathingGuide`, `BPEntryForm`

**User-reported issue**: Home page "Last 7 Days" trend card statistics are too small even with Senior Mode enabled.

## Research Basis

| Source | Recommendation |
|---|---|
| NIH/NCBI PMC9376262 (2022) | 65+ optimal: 22pt; preferred: larger sizes |
| Frontiers in Psychology | Font size > typeface for readability |
| WCAG / W3C Older Users | Minimum 16px body, resizable to 200% |
| ElderTech / Adchitects | Min 19–22px for senior-focused design |

**Font family**: Keep **Nunito** — rounded sans-serif with clear letterforms, appropriate for seniors. Research confirms font size matters more than family. No new font assets required.

## Design Decision

### Senior Scale: 1.4×

This takes the 16px base to **22.4px**, meeting the 22pt research minimum for 65+ users.

### Typography Constants

A new `TYPOGRAPHY` object in `src/shared/config/theme.ts` defines 8 semantic size names:

| Key | Base (px) | Senior 1.4× (px) | Usage |
|---|---|---|---|
| `xs` | 12 | 17 | Chart labels, decorative, tiny decorators |
| `sm` | 14 | 20 | Timestamps, units (BPM, mmHg labels), secondary info |
| `md` | 16 | 22 | Body text, standard labels |
| `lg` | 18 | 25 | Section headers, card titles, trend title |
| `xl` | 22 | 31 | Pulse values, category labels, prominent values |
| `2xl` | 28 | 39 | Statistics display values |
| `3xl` | 36 | 50 | Entry form values |
| `hero` | 56 | 78 | Main BP reading display |

### Font Size Mapping (old → new key)

| Old size | Maps to | Context |
|---|---|---|
| 11 | `xs` | SVG chart labels |
| 12 | `xs` | Metadata, timestamps |
| 13 | `sm` | Captions, secondary text |
| 14 | `sm` | Body secondary, field labels |
| 15–16 | `md` | Body primary, standard labels |
| 18 | `lg` | Section titles, card headings |
| 22–24 | `xl` | Pulse values, prominent labels |
| 26–28 | `2xl` | Statistics values |
| 30–36 | `3xl` | Form input display values |
| 44 | `3xl` or `hero` | Quick log large display |
| 56+ | `hero` | Main BP reading |

## Architecture

### 1. `src/shared/config/theme.ts`

Add TYPOGRAPHY object and SENIOR_SCALE constant:

```typescript
export const SENIOR_SCALE = 1.4;

export const TYPOGRAPHY_BASE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  hero: 56,
} as const;

export type TypographyScale = typeof TYPOGRAPHY_BASE;
```

### 2. `src/shared/lib/use-theme.ts`

Compute and return `typography` object alongside colors:

```typescript
// Compute typography scale
const scale = seniorMode ? SENIOR_SCALE : 1.0;
const typography: TypographyScale = {
  xs:    Math.round(TYPOGRAPHY_BASE.xs    * scale),
  sm:    Math.round(TYPOGRAPHY_BASE.sm    * scale),
  md:    Math.round(TYPOGRAPHY_BASE.md    * scale),
  lg:    Math.round(TYPOGRAPHY_BASE.lg    * scale),
  xl:    Math.round(TYPOGRAPHY_BASE.xl    * scale),
  '2xl': Math.round(TYPOGRAPHY_BASE['2xl'] * scale),
  '3xl': Math.round(TYPOGRAPHY_BASE['3xl'] * scale),
  hero:  Math.round(TYPOGRAPHY_BASE.hero  * scale),
};

return { colors, isDark, fontScale: scale, highContrast, typography };
```

Update the `UseThemeResult` interface to include `typography: TypographyScale`.

### 3. Component Pattern

**Regular Text components:**
```typescript
// Before
const { colors, fontScale } = useTheme();
// ...
fontSize: 18        // hardcoded, no senior scaling
fontSize: 16        // hardcoded, no senior scaling

// After
const { colors, typography } = useTheme();
// ...
fontSize: typography.lg   // 18 normal, 25 senior
fontSize: typography.md   // 16 normal, 22 senior
```

**Components already using fontScale (backward-compatible):**
```typescript
// Keep working — fontScale is still returned
fontSize: 56 * fontScale   // Already correct on HomePage main value
```

These can optionally migrate to `typography.hero`, but it is not required in this task.

**SVG chart components** (react-native-svg requires numeric fontSize):
```typescript
// Before
<SvgText fontSize={11} ...>

// After
const { fontScale } = useTheme();
<SvgText fontSize={Math.round(11 * fontScale)} ...>
// Or more precisely:
<SvgText fontSize={typography.xs} ...>
```

### 4. Backward Compatibility

- `fontScale` stays in the `useTheme()` return value — no existing code breaks
- Components using `XX * fontScale` remain correct (they already scale)
- New components should prefer `typography.XX` (semantic names)

## Files to Change

### Core (2 files)
1. `src/shared/config/theme.ts` — add TYPOGRAPHY_BASE, SENIOR_SCALE, TypographyScale type
2. `src/shared/lib/use-theme.ts` — compute typography, add to UseThemeResult

### Shared UI (~4 files)
3. `src/shared/ui/LineChart.tsx` — SVG fontSize={11} → typography.xs
4. `src/shared/ui/BPTrendChart.tsx` — SVG font sizes → scaled
5. Any other shared/ui components with hardcoded font sizes

### Pages (~7 files)
6. `src/pages/home/ui/HomePage.tsx` — trendTitle (18), bpCardLabel (16), etc.
7. `src/pages/analytics/ui/AnalyticsPage.tsx` — 12 hardcoded sizes (13–28px)
8. `src/pages/history/ui/HistoryPage.tsx` — fontSize: 14
9. `src/pages/settings/ui/SettingsPage.tsx` — 10+ sizes (11–24px)
10. `src/pages/pre-measurement/ui/PreMeasurementPage.tsx` — sizes (13–26px)
11. `src/pages/new-reading/ui/NewReadingPage.tsx` — sizes (10–22px)
12. `src/pages/quick-log/ui/QuickLogPage.tsx` — sizes (9–22px)

### Widgets (~5 files)
13. `src/widgets/page-header/ui/PageHeader.tsx` — 22, 28px headers
14. `src/widgets/bp-entry-form/ui/BPEntryForm.tsx` — 14–36px form values
15. `src/widgets/bp-record-card/ui/BPRecordCard.tsx` — 11–26px record text
16. `src/widgets/bp-records-list/ui/BPRecordsList.tsx` — 14–60px values
17. `src/widgets/breathing-guide/ui/BreathingGuide.tsx` — 15–64px

**Total: ~18 files**

## Success Criteria

1. Senior mode body text ≥ 22px on every screen
2. Chart labels (LineChart/BPTrendChart SVG text) scale in senior mode
3. Home page "Last 7 Days" trend title scales with senior mode
4. Analytics page statistics scale with senior mode
5. History, Settings, Pre-measurement, entry form pages all scale
6. No regression: normal mode font sizes unchanged
7. TypeScript strict mode passes
8. ESLint passes

## What We Are NOT Changing

- Font family (Nunito stays)
- Color scheme / contrast ratios
- Layout proportions (card sizes, paddings)
- Very small purely decorative sizes (9, 10px notch lines — not readable text)
- Components already correctly using `* fontScale` (Numpad, SaveButton, etc.)

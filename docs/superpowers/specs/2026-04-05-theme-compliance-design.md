# Theme Compliance Design — Full Regulatory Mode Implementation

**Date:** 2026-04-05
**References:** `docs/research-requirements.md`, `docs/research-tech.md`
**Compliance targets:** IEC 62366-1, EAA, EN 301 549, WCAG 2.1 AA+

---

## Overview

Replace the current teal/mint brand palette with a medical-blue palette and bring all four regulatory display modes (Light, Dark, High Contrast, Senior) into full compliance with the technical spec in `docs/research-tech.md`. The implementation follows Approach A — token-first, then propagate through FSD layers: `shared` → `widgets` → `pages`.

Mode architecture stays as **combinable independent flags**:
- `theme: 'light' | 'dark' | 'system'` — base colour scheme
- `highContrast: boolean` — forces light base, removes shadows/gradients, adds thick borders and redundant encoding
- `seniorMode: boolean` — overlays 1.4× typography, 56px touch targets, 16px minimum spacing on top of any base theme

This supports combinations: Dark + Senior, Light + High Contrast + Senior, etc.

---

## Section 1 — Theme Infrastructure

### 1.1 Color Token Changes (`shared/config/theme.ts`)

#### Light Mode
| Token | Old Value | New Value | Reason |
|---|---|---|---|
| `background` | `#EDF5F0` | `#F5F5F5` | LM-001: soft off-white, no mint tint |
| `textPrimary` | `#1a1a2e` | `#1A1A1A` | LM-002: deep saturated dark gray |
| `textSecondary` | `#64748b` | `#6B7280` | LM-002: mid-gray |
| `accent` | `#0D9488` | `#2563EB` | LM-004: calming medical blue |
| `gradientStart` | `#0D9488` | `#1D4ED8` | blue gradient |
| `gradientEnd` | `#14B8A6` | `#2563EB` | blue gradient |
| `chartLine` | `#0D9488` | `#003B49` | LM-005: deep blue systolic |
| `chartLineDiastolic` | `#5EEAD4` | `#007A78` | LM-005: forest green diastolic |
| `chartLabel` | `#475569` | `#374151` | LM-005: charcoal gray |
| `toggleTrackActive` | `#0D9488` | `#2563EB` | blue accent |
| `iconCircleBg` | `rgba(13,148,136,0.12)` | `rgba(37,99,235,0.12)` | blue tint |
| All other teal refs | `#0D9488` / `#14B8A6` | `#2563EB` / `#3B82F6` | brand replacement |

#### Dark Mode
| Token | Old Value | New Value | Reason |
|---|---|---|---|
| `background` | `#0f172a` | `#121212` | DM-001: spec-compliant dark gray |
| `surface` | `#1e293b` | `#1E1E1E` | DM-001 |
| `surfaceSecondary` | `#2a3441` | `#2C2C2C` | DM-001 |
| `textPrimary` | `#f8fafc` | `rgba(255,255,255,0.87)` | DM-002: halation prevention |
| `textSecondary` | `#94a3b8` | `rgba(255,255,255,0.60)` | DM-002 |
| `textTertiary` | `#64748b` | `rgba(255,255,255,0.38)` | DM-002: disabled/hint text |
| `accent` | `#14B8A6` | `#60A5FA` | blue for dark |

#### Dark BP Colors (`BP_COLORS_DARK`) — Desaturate 10–20%
| Category | Old | New | Reason |
|---|---|---|---|
| `crisis` | `#ef4444` | `#FCA5A5` | DM-003: pastel coral |
| `normal` | `#4ade80` | `#86EFAC` | DM-003: desaturated green |
| `elevated` | `#fbbf24` | `#FDE68A` | DM-003: desaturated yellow |
| `stage_1` | `#fb923c` | `#FDBA74` | DM-003: desaturated orange |
| `stage_2` | `#f87171` | `#FECACA` | DM-003: desaturated red (lighter than crisis to stay distinct) |

#### High Contrast Mode — Additions Only
- Existing values remain valid
- Add `borderWidth: 3` token (new field — see 1.2)
- `accent`: `#1D4ED8` (accessible blue, replaces teal)
- `shadowOpacity: 0` already correct — keep

### 1.2 New Token Fields

**Added to `ThemeColors` interface** (static, per palette):
```typescript
borderWidth: number;  // HC: 3, all others: 1
```

**Added to `useTheme()` return value** (computed from `seniorMode`, not part of palette):
```typescript
touchTargetSize: number;    // seniorMode ? 56 : 44
interactiveSpacing: number; // seniorMode ? 16 : 8
seniorMode: boolean;        // exposed so components can gate structural changes
```

`borderWidth` belongs in the palette (it varies by mode). `touchTargetSize` and `interactiveSpacing` belong in `useTheme()` return (they vary by the `seniorMode` flag, which layers across all themes).

### 1.3 `useTheme()` Hook Updates (`shared/lib/use-theme.ts`)

- Add `seniorMode` to the return value
- Add `touchTargetSize: seniorMode ? 56 : 44`
- Add `interactiveSpacing: seniorMode ? 16 : 8`
- Existing logic (HC forces light base, typography scale, font scale) unchanged

### 1.4 New File — `shared/lib/haptics.ts`

```typescript
export function hapticKeystroke(): void  // Haptics.impactAsync(Light)
export function hapticSave(): void       // Haptics.notificationAsync(Success)
export function hapticCrisis(): void     // Haptics.impactAsync(Heavy) × repeated pattern
```

Each function is a no-op if `expo-haptics` is unavailable (graceful degradation). No mode-reading logic needed — all modes use the same haptic profiles; only crisis differs by intensity.

---

## Section 2 — Shared UI Components

### `Numpad.tsx`
- Add `layout: 'calculator' | 'telephone'` prop (default `'calculator'`); calculator = 7–8–9 top row
- Senior Mode: key min size = `touchTargetSize` (56px); font = `typography.xl`
- High Contrast: 3px solid border per key (`colors.borderWidth`); no shadow; no opacity backgrounds
- Haptics: call `hapticKeystroke()` on every key press

### `SaveButton.tsx`
- Senior Mode: minHeight/minWidth = `touchTargetSize` (56px); font = `typography.lg`
- High Contrast: 3px border; no shadow
- Haptics: call `hapticSave()` on press

### `OptionChip.tsx`
- Senior Mode: minHeight/minWidth 56px via explicit style + `hitSlop`; font = `typography.md`
- High Contrast: 3px border; no background opacity; selection indicated by border weight change (not color alone)
- Spacing: `interactiveSpacing` between adjacent chips

### `TagChip.tsx`
- High Contrast: 2px border; remove subtle background opacity

### `CrisisModal.tsx` — Trimodal Alert
- **Visual**: bold octagon icon (SVG stop-sign shape, min 24×24px); plain language body ("Contact emergency services"); `accessibilityRole="alert"`; `accessibilityLiveRegion="assertive"`
- **Haptic**: call `hapticCrisis()` on modal mount
- **High Contrast**: 3px `colors.crisisBorder` border; BP value prefixed with `"Crisis: {sys}/{dia}"`
- **Senior Mode**: 1.4× typography; 56px touch targets on action buttons
- **Audio**: play a distinct multi-tonal cue via `expo-av` on mount (non-startling tone)

### `BPTrendChart.tsx`
- High Contrast: SVG pattern fills on threshold bands:
  - Stage 1 zone: 45° diagonal hatch
  - Stage 2 zone: dense stipple/dot pattern
  - Crisis zone: cross-hatch pattern
  - Systolic line: 3px solid; data points = triangles
  - Diastolic line: 2px dashed; data points = squares
- Dark Mode: use `BP_COLORS_DARK` desaturated values (now correctly wired)
- Light Mode: systolic `#003B49`, diastolic `#007A78`, auxiliary `#374151`

### `Card/Card.tsx`
- High Contrast: `elevation: 0`; `shadowOpacity: 0`; add `borderWidth: colors.borderWidth` border
- Gradient variant: flatten to solid when HC active (`gradientStart === gradientEnd`)

### `Button/Button.tsx`
- Senior Mode: minHeight/minWidth 56px on all variants; font uses `typography.md`/`typography.lg`
- High Contrast: 3px border on `primary`, `secondary`, `destructive` variants; no shadow

### `DateTimePicker.tsx`
- High Contrast: 3px borders on input fields; permanent underlines on any link-style text
- Senior Mode: 56px touch targets on confirm/cancel buttons; `typography.md` minimum

---

## Section 3 — Widgets

### `BPRecordCard`
- High Contrast — Redundant Encoding:
  - Text prefix on classification: `"Normal: 118/76"`, `"Crisis: 182/112"` etc.
  - Geometric icon alongside color badge (SVG, min 20×20px):
    - Normal → `●` solid circle
    - Elevated → `▲` upward triangle
    - Stage 1 → `◆` filled diamond
    - Stage 2 → `◇` outlined diamond
    - Crisis → bold octagon
- Senior Mode: larger padding; `typography.md` minimum; 56px touch target if card is pressable
- All modes: blue accent tokens replace teal

### `BPRecordsList`
- Senior Mode: increase FlashList `estimatedItemSize` for larger card heights; `interactiveSpacing` between items
- High Contrast: section headers get 2px bottom border

### `BPEntryForm`
- Senior Mode: linear single-step layout; `typography.lg` for input labels; hide advanced options behind "More options" toggle
- High Contrast: 3px borders on all input containers; no opacity overlays

### `PageHeader`
- Senior Mode: greeting = `typography.xl`; subtitle = `typography.md`
- High Contrast: solid `colors.surface` background (no gradient); 2px bottom border
- Dark Mode: text now correctly uses `rgba(255,255,255,0.87)` via `colors.textPrimary`

### `TagSelector`
- Senior Mode: chips expand to 56px touch targets with 16px gaps
- High Contrast: thick borders on chips; selected state uses border weight change + checkmark icon (not color alone)

### `TodayScheduleCard`
- Senior Mode: row height minimum 56px; bold medication names (`FONTS.bold`)
- High Contrast: 3px border around card and each row separator; no subtle background tints

### `WeatherCorrelationCard`
- High Contrast: remove gradient overlays; pattern fills on correlation zones; chart lines differentiated by stroke weight/dash
- Dark Mode: desaturated zone colors from `BP_COLORS_DARK`

### `CircadianCard`
- High Contrast: pattern-filled bars + text period labels (no color-only encoding)
- Dark Mode: desaturated period colors

### `CorrelationCard`
- High Contrast: text + icon replaces color-only correlation indicators; permanent underlines on links
- Senior Mode: `typography.md` minimum; 56px touch targets

---

## Section 4 — Pages

### `AppSettingsPage`
- **Mode selector**: 2×2 grid of mode cards (Light, Dark, High Contrast, Senior preview swatches + labels)
- **Combination toggles**: "High Contrast" and "Senior Mode" toggle below grid — layer on top of selected base theme
- **Numpad layout toggle**: "Calculator (7–8–9)" / "Telephone (1–2–3)" — persisted to AsyncStorage
- Mode changes apply instantly via Zustand (no restart)

### `NewReadingPage`
- Senior Mode: strictly linear flow; hide advanced options; `PreMeasurementChecklist` uses plain language + `typography.md`

### `QuickLogPage`
- Senior Mode: same linear flow treatment as `NewReadingPage`

### `PreMeasurementPage`
- Senior Mode: checklist items `typography.md`; generous padding; 56px checkboxes; plain language throughout
- High Contrast: 3px borders on checklist items; checkmark icon for completion (not color alone)

### `HistoryPage`
- Senior Mode: permanent confirmation dialog on all destructive actions; no swipe-to-delete without confirmation
- High Contrast: redundant encoding on inline BP classification badges; 2px section separators

### `EditReadingPage`
- Senior Mode: 56px touch targets; `typography.lg` field labels
- High Contrast: 3px borders on all input fields

### `AnalyticsPage`
- High Contrast: all charts use HC pattern fills (delegated to chart components); text labels on all data zones
- Senior Mode: `typography.md` minimum on stat labels; secondary charts hidden behind "Show more" toggle

### `HomePage`
- High Contrast: latest reading card shows redundant encoding (text prefix + geometric icon)
- Senior Mode: collapse secondary widgets; show only latest reading + today's schedule by default

### `ClassificationPage`
- High Contrast: redundant encoding on every threshold row (text + geometric icon + color); 3px borders on threshold bands
- Senior Mode: `typography.lg` for threshold values; 56px row minimum height

### `SettingsPage` / `PersonalInfoPage` / `SyncPage` / `WeatherSettingsPage`
- Inherit token changes from `Card`, `Button`, `OptionChip` automatically
- Senior Mode: 56px touch targets on all rows; `typography.md` minimum
- High Contrast: 3px section card borders; no icon circle background opacity

### `AuthPage`
- All modes: input fields get HC 3px borders; `Button` uses blue accent; no teal references

### `MedicationPage` / `MedicationModal`
- Senior Mode: 56px touch targets; confirmation dialog on delete
- High Contrast: redundant encoding on status indicators (taken/missed)

### `FamilySharing` pages
- Inherit token changes; no mode-specific structural changes

### `VoiceConfirmationPage`
- Senior Mode: confirmed values in `typography.xl`; 56px buttons

---

## Cross-Cutting Requirements

| Req | Description | Implementation |
|---|---|---|
| XC-001 | Mode persistence | Existing AsyncStorage via Zustand persist — no change |
| XC-002 | Instant mode transitions | Existing Zustand subscription — no change |
| XC-003 | Medical constants integrity | `bp-guidelines.ts` never touched by this work |
| XC-004 | Haptic abstraction | New `shared/lib/haptics.ts` |
| XC-005 | Accessibility metadata | `accessibilityLabel`, `accessibilityRole` on all interactive elements; mode toggle announces via `AccessibilityInfo.announceForAccessibility()` |
| XC-006 | Testing | Snapshot tests per mode; redundant encoding unit tests per classification; 56px touch target layout tests; haptic call mocks |
| XC-007 | PDF/Print | HC pattern fills verified in grayscale export context |

---

## Implementation Order (FSD Layer by Layer)

1. **`shared/config/theme.ts`** — token values + new fields
2. **`shared/lib/use-theme.ts`** — expose `seniorMode`, `touchTargetSize`, `interactiveSpacing`
3. **`shared/lib/haptics.ts`** — new file
4. **`shared/ui`** — Numpad, SaveButton, OptionChip, TagChip, CrisisModal, BPTrendChart, Card, Button, DateTimePicker
5. **`widgets`** — BPRecordCard, BPRecordsList, BPEntryForm, PageHeader, TagSelector, TodayScheduleCard, WeatherCorrelationCard, CircadianCard, CorrelationCard
6. **`pages`** — AppSettingsPage, then remaining pages in dependency order

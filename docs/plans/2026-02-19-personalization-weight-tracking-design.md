# Design: Personalization Settings & Per-Reading Weight Tracking
**Date:** 2026-02-19
**Phase:** 2.4
**Status:** Approved

---

## Overview

Two capabilities added in one feature set:

1. **Personalization Settings (2.4a)** — Unified settings section grouping user profile (DOB, height, default weight) with existing measurement defaults (location, posture). Dynamic profile card with age and BMI.
2. **Per-Reading Weight Tracking (2.4b)** — Weight stored per BP reading, enabling weight trend charts, BMI derivation, and weight-vs-BP correlation analysis. Requires DB schema migration.

**Key constraint:** None of the 4 BP classification guidelines (AHA/ACC, ESC/ESH, JSH, WHO) use age, weight, or BMI for threshold classification — all profile data is purely informational/contextual.

---

## Feature 1: Personalization Settings

### New Settings Store Fields

| Field | Type | Default | Storage |
|-------|------|---------|---------|
| `dateOfBirth` | `string \| null` (ISO `YYYY-MM-DD`) | `null` | Zustand/AsyncStorage |
| `height` | `number \| null` (cm internally) | `null` | Zustand/AsyncStorage |
| `defaultWeight` | `number \| null` (kg internally) | `null` | Zustand/AsyncStorage |
| `heightUnit` | `'cm' \| 'ft'` | `'cm'` | Zustand/AsyncStorage |
| `weightUnit` | `'kg' \| 'lbs'` | `'kg'` | Zustand/AsyncStorage |

Existing `defaultLocation` and `defaultPosture` remain unchanged but are visually regrouped under Personalization.

### Profile Card (Settings Page Header)

Replaces the current static "Alex" header with a dynamic profile card:

```
┌─────────────────────────────────────────┐
│  (person-circle-icon)                   │
│        Alex                             │
│        Age: 34  |  BMI: 22.4 (Normal)   │
└─────────────────────────────────────────┘
```

- Age computed from `dateOfBirth` via `calculateAge()`
- BMI computed from latest reading's weight + settings `height` via `calculateBMI()`
- Shows `--` for missing values

### Personalization Card (Settings Page)

Replaces and consolidates separate Location/Posture cards:

```
┌═══════════════════════════════════════════┐
│ [person-outline]  Personalization         │
├───────────────────────────────────────────┤
│                                           │
│ Date of Birth                             │
│ [calendar-outline]  [ Feb 15, 1992  (v) ] │
│                                           │
│ ─────────────────────────────────────     │
│                                           │
│ Height                                    │
│ [resize-outline]   [ 175 ]  [cm] [ft]    │
│                                           │
│ ─────────────────────────────────────     │
│                                           │
│ Default Weight                            │
│ [scale-outline]    [ 72.5 ]  [kg] [lbs]  │
│ (Pre-fills weight on new readings)        │
│                                           │
│ ─────────────────────────────────────     │
│                                           │
│ Default Location                          │
│ [Left Arm] [Right Arm] [L.Wrist] [R.Wrist]│
│                                           │
│ ─────────────────────────────────────     │
│                                           │
│ Default Posture                           │
│ [Sitting] [Standing] [Lying]              │
│                                           │
└═══════════════════════════════════════════┘
```

- DOB: uses React Native DateTimePicker (date mode)
- Height/Weight: `TextInput` with numeric keyboard (NOT Numpad — these are not BP values)
- Unit toggles: `OptionChip` selector (reuse existing pattern)
- Location/Posture: existing chip selectors, moved into this card

### Pure Functions (`src/entities/user-profile/lib.ts`)

```typescript
calculateBMI(weightKg: number | null, heightCm: number | null): number | null
getBMICategory(bmi: number): BMICategory    // underweight | normal | overweight | obese
calculateAge(dateOfBirth: string | null): number | null
convertWeight(value: number, from: WeightUnit, to: WeightUnit): number
convertHeight(valueCm: number, to: HeightUnit): string   // "175 cm" or "5'9""
formatWeight(weightKg: number, unit: WeightUnit): string  // "72.5 kg" or "159.8 lbs"
formatHeight(heightCm: number, unit: HeightUnit): string
validateWeight(weightKg: number | null): string[]
validateHeight(heightCm: number | null): string[]
validateDateOfBirth(dob: string | null): string[]
```

### Constants (`src/shared/config/profile-constants.ts`)

```typescript
WEIGHT_LIMITS = { min: 20, max: 500 }        // kg
HEIGHT_LIMITS = { min: 50, max: 280 }        // cm
BMI_THRESHOLDS = { underweight: 18.5, normal: 25.0, overweight: 30.0 }
BMI_CATEGORIES = { UNDERWEIGHT, NORMAL, OVERWEIGHT, OBESE }
```

---

## Feature 2: Per-Reading Weight Tracking

### Database Schema Migration

```sql
ALTER TABLE bp_records ADD COLUMN weight REAL CHECK(weight IS NULL OR weight BETWEEN 20 AND 500);
```

Migration runs in `shared/api/db.ts` `initDatabase()`, wrapped in try-catch (idempotent — column-already-exists is a no-op). Existing records get NULL.

### Type Updates (`src/shared/api/bp-repository.ts`)

```typescript
// Add to BPRecordRow:
weight: number | null;

// Add to BPRecord:
weight: number | null;

// Add to BPRecordInput:
weight?: number | null;
```

### Entry Flow Changes (QuickLog + NewReading)

Optional weight pill inserted alongside the tag pill in the dateTimeWrapper area:

```
[Feb 15, 12:34 PM]     [tags: 2]
[scale: 72.5 kg]

[Systolic | Diastolic | Pulse]
[Numpad]
────────────────────────────
[      Save Reading      ]
```

- Weight pill pre-fills from `defaultWeight` in settings
- Tapping opens small modal with `TextInput` (numeric keyboard, decimal support)
- Weight is **optional** — pill shows "Add weight" if not set
- Passed to `recordBP.mutateAsync({ weight, ... })` on save

### Edit Reading Page

Weight field added to Details section:

```
┌─────────────────────────────────────────┐
│ DETAILS                                 │
│                                         │
│ Weight                                  │
│ [ 72.5 ]  [kg] / [lbs]                │
│ BMI: 22.4 (Normal)                      │
│                                         │
│ Location                                │
│ [Left Arm] [Right Arm] [L.Wrist] [R.Wrist] │
│                                         │
│ Posture                                 │
│ [Sitting] [Standing] [Lying]            │
└─────────────────────────────────────────┘
```

BMI shown only when both weight (from reading) and height (from settings) are available.

### BPRecordCard Changes

**Full variant** (Home, tapped History card) — add chips in detailsRow:

```
| [scale] 72.5 kg | [body] BMI 22.4 |
```

Only shown when weight is non-null. BMI only when height is set in settings.

**Compact variant** (History list) — no weight (keep compact).

### Analytics: Weight Trends Card

New card on `AnalyticsPage` after existing cards:

```
┌─────────────────────────────────────────┐
│ [scale-outline]  Weight Trends          │
├─────────────────────────────────────────┤
│ [Line chart showing weight over time]   │
│                                         │
│ Avg: 72.3 kg  |  Range: 71.0-74.2 kg  │
│                                         │
│ Correlation with BP: Weak positive      │
│ Higher weight days show +4 mmHg systolic│
├─────────────────────────────────────────┤
│ For informational purposes only.        │
│ Not a substitute for professional       │
│ medical advice.                         │
└─────────────────────────────────────────┘
```

Requires ≥5 records with weight for correlation analysis.

### Analytics Pure Functions (`src/shared/lib/analytics-utils.ts`)

```typescript
computeWeightTrend(records: BPRecord[]): WeightTrend
// => { hasData, points[], minWeight, maxWeight, avgWeight }

computeWeightBPCorrelation(records: BPRecord[]): WeightBPCorrelation
// => { hasData, correlationCoeff, direction: 'positive' | 'negative' | 'none' }
```

### PDF Report Changes

Header metadata addition:
```
Patient: Alex  |  Age: 34  |  Height: 175 cm  |  Generated: Feb 19, 2026
Period: Last 30 days  |  Guideline: AHA/ACC
```

New stat boxes in stats-grid:
```
| Avg Weight   | Weight Range  | Avg BMI       |
| 72.3 kg      | 71.0-74.2 kg  | 22.4 (Normal) |
```

Weight column added to individual readings table.

### Home Page Profile Summary

Age and BMI badges in greeting/profile area:

```
Good morning, Alex
Age: 34  |  BMI: 22.4 (Normal)
```

---

## Display Surface Summary

| Surface | What Shows | Data Source |
|---------|-----------|-------------|
| Settings — Profile Card | Name, Age, BMI | Settings store + latest record |
| Settings — Personalization | DOB, height, weight, units, location, posture | Settings store |
| Home — Greeting area | Age badge, BMI badge | Settings + latest record |
| Home — Latest Card | Weight + BMI chips | BPRecord.weight + settings.height |
| History — Compact card | No weight (keep compact) | — |
| History — Full card (on tap) | Weight + BMI chips | BPRecord.weight + settings.height |
| EditReadingPage | Editable weight + BMI | BPRecord.weight + settings.height |
| Analytics | Weight trend chart, avg/range, BP correlation | All records with weight |
| PDF Report | Header: age, height. Stats: avg weight, range, BMI | Settings + filtered records |

---

## Translation Keys (English only, per CLAUDE.md rule)

### `common.json` additions
```json
{
  "weight": {
    "label": "Weight",
    "kg": "kg",
    "lbs": "lbs",
    "addWeight": "Add weight"
  },
  "height": {
    "label": "Height",
    "cm": "cm",
    "ft": "ft"
  },
  "bmi": {
    "label": "BMI",
    "underweight": "Underweight",
    "normal": "Normal",
    "overweight": "Overweight",
    "obese": "Obese"
  },
  "age": {
    "label": "Age",
    "years": "{{count}} years"
  }
}
```

### `pages.json` additions
```json
{
  "settings": {
    "personalization": {
      "title": "Personalization",
      "dateOfBirth": {
        "label": "Date of Birth",
        "placeholder": "Select your date of birth",
        "notSet": "Not set"
      },
      "height": {
        "label": "Height",
        "placeholder": "Enter height"
      },
      "defaultWeight": {
        "label": "Default Weight",
        "placeholder": "Enter weight",
        "hint": "Pre-fills weight on new readings"
      },
      "weightUnit": { "kg": "kg", "lbs": "lbs" },
      "heightUnit": { "cm": "cm", "ft": "ft/in" }
    },
    "profile": {
      "age": "Age: {{age}}",
      "bmi": "BMI: {{bmi}} ({{category}})",
      "noBmi": "BMI: --"
    }
  },
  "analytics": {
    "weightTrend": {
      "title": "Weight Trends",
      "avg": "Avg: {{value}} {{unit}}",
      "range": "Range: {{min}} - {{max}} {{unit}}",
      "correlation": "Correlation with BP",
      "correlationPositive": "Higher weight days show +{{delta}} mmHg systolic",
      "correlationNegative": "Lower weight days show -{{delta}} mmHg systolic",
      "correlationNone": "No significant correlation detected",
      "notEnoughData": "Not enough weight data"
    }
  }
}
```

---

## FSD Changes Summary

| File | Action |
|------|--------|
| `src/entities/user-profile/types.ts` | CREATE — WeightUnit, HeightUnit, BMICategory, UserProfile |
| `src/entities/user-profile/lib.ts` | CREATE — BMI, age, conversion, validation functions |
| `src/entities/user-profile/__tests__/lib.test.ts` | CREATE — Comprehensive unit tests |
| `src/entities/user-profile/index.ts` | CREATE — Barrel export |
| `src/shared/config/profile-constants.ts` | CREATE — WEIGHT_LIMITS, HEIGHT_LIMITS, BMI_THRESHOLDS |
| `src/shared/config/index.ts` | MODIFY — re-export profile-constants |
| `src/shared/api/db.ts` | MODIFY — ALTER TABLE migration for weight column |
| `src/shared/api/bp-repository.ts` | MODIFY — Add weight to types + CRUD |
| `src/shared/lib/settings-store.ts` | MODIFY — Add profile fields + setters |
| `src/shared/lib/analytics-utils.ts` | MODIFY — Add computeWeightTrend, computeWeightBPCorrelation |
| `src/shared/config/locales/en/pages.json` | MODIFY — personalization, profile, weightTrend keys |
| `src/shared/config/locales/en/common.json` | MODIFY — weight, height, bmi, age keys |
| `src/features/record-bp/model/use-record-bp.ts` | MODIFY — Accept/pass weight |
| `src/features/edit-bp/model/use-edit-bp.ts` | MODIFY — Accept/pass weight |
| `src/features/export-pdf/lib/generate-report-html.ts` | MODIFY — Profile section + weight stats |
| `src/features/export-pdf/lib/compute-report-stats.ts` | MODIFY — Weight stats computation |
| `src/pages/settings/ui/SettingsPage.tsx` | MODIFY — Personalization section + dynamic profile card |
| `src/pages/new-reading/ui/NewReadingPage.tsx` | MODIFY — Add weight pill |
| `src/pages/quick-log/ui/QuickLogPage.tsx` | MODIFY — Add weight pill |
| `src/pages/edit-reading/ui/EditReadingPage.tsx` | MODIFY — Add weight field + BMI |
| `src/pages/home/ui/HomePage.tsx` | MODIFY — Profile badges |
| `src/widgets/bp-record-card/ui/BPRecordCard.tsx` | MODIFY — Weight + BMI chips |
| `src/widgets/correlation-card/ui/CorrelationCard.tsx` | MODIFY — Weight-vs-BP correlation row |

---

## Shared Decisions

- All new pure functions in `entities/user-profile/` — fully testable without React
- No new npm packages needed (reuses existing DateTimePicker, TextInput, OptionChip)
- Weight input uses `TextInput` (not Numpad) — "no TextInput for BP" rule is BP-specific, weight needs decimal
- Internal storage always metric (kg, cm) — display converts per user's unit preference
- BMI always derived at render time, never persisted — avoids stale data if height changes
- Weight is **optional** everywhere — zero impact on existing BP logging flow
- DB migration is **idempotent** (try-catch on ALTER TABLE) — safe on first run and upgrades
- Correlation analysis requires **≥5 samples** with weight data (statistical minimum)
- Medical disclaimer required on weight analytics card (informational purposes only)

# Design: Circadian Analysis & Lifestyle Tagging
**Date:** 2026-02-14
**Phase:** 2.2 + 2.3
**Status:** Approved

---

## Overview

Two features implemented in one session:

1. **Circadian Analysis (2.2)** — Time-of-day grouping, morning surge detection, time-in-range visualization. Pure analytics; no schema changes.
2. **Lifestyle Tagging (2.3)** — 7 tags on BP readings, correlation analysis. Requires DB schema migration.

---

## Feature 1: Circadian Analysis

### Time Windows

| Window | Hours | Icon |
|--------|-------|------|
| Morning | 06:00–09:59 | sunrise |
| Day | 10:00–17:59 | sunny |
| Evening | 18:00–21:59 | partly-sunny |
| Night | 22:00–05:59 | moon |

### Pure Functions (`src/shared/lib/circadian-utils.ts`)

```typescript
getTimeWindow(timestamp: number): 'morning' | 'day' | 'evening' | 'night'
computeCircadianBreakdown(records: BPReading[]): CircadianBreakdown
detectMorningSurge(records: BPReading[]): MorningSurgeResult
computeTimeInRange(records: BPReading[], guideline: Guideline): TimeInRangeResult
```

**Morning Surge threshold:** ≥20 mmHg systolic rise from prior night average (AHA evidence-based).

### New Shared UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `DonutChart` | `src/shared/ui/DonutChart.tsx` | Custom SVG donut for overall time-in-range |
| `CircadianBreakdownBars` | `src/shared/ui/CircadianBreakdownBars.tsx` | 4 horizontal segmented bars, one per time window |

### Analytics "Circadian Patterns" Card

Inserted after the existing stats row on `AnalyticsPage`. Filtered by the selected period.

```
┌─────────────────────────────────────────┐
│  Circadian Patterns                     │
│                                         │
│  [DonutChart] ← Overall time-in-range   │
│   Normal 45% / Elevated 30% / ...       │
│                                         │
│  Morning  [████░░░░] 120/78 avg         │
│  Day      [████████] 118/76 avg         │
│  Evening  [██████░░] 126/82 avg         │
│  Night    [███░░░░░] 115/74 avg         │
│                                         │
│  ⚠ Morning Surge detected 2 days       │  ← hidden if 0
└─────────────────────────────────────────┘
```

### History Page Changes

`BPRecordCard` gains two optional badges:
- **Time-window badge** — always shown (e.g. "Morning", "Evening")
- **Morning Surge badge** — amber, shown only when the record triggered a surge

### Morning Surge Toast

Triggered in `QuickLogPage` / `NewReadingPage` after successful save. Uses existing `useToast()` hook with `'warning'` type. Runs `detectMorningSurge()` against the current day's records post-save.

### FSD Changes Summary

| File | Action |
|------|--------|
| `src/shared/lib/circadian-utils.ts` | CREATE |
| `src/shared/ui/DonutChart.tsx` | CREATE |
| `src/shared/ui/CircadianBreakdownBars.tsx` | CREATE |
| `src/shared/ui/index.ts` | MODIFY — export new components |
| `src/shared/lib/index.ts` | MODIFY — export circadian-utils |
| `src/entities/blood-pressure/lib.ts` | MODIFY — re-export `getTimeWindow()` |
| `src/entities/blood-pressure/index.ts` | MODIFY — barrel update |
| `src/widgets/bp-record-card/ui/BPRecordCard.tsx` | MODIFY — add time-window + surge badges |
| `src/pages/analytics/ui/AnalyticsPage.tsx` | MODIFY — add Circadian Patterns card |
| `src/pages/quick-log/ui/QuickLogPage.tsx` | MODIFY — post-save surge check + toast |
| `src/pages/new-reading/ui/NewReadingPage.tsx` | MODIFY — post-save surge check + toast |
| `src/shared/config/locales/en/pages.json` | MODIFY — circadian translation keys |
| `src/shared/config/locales/en/common.json` | MODIFY — time window label keys |

---

## Feature 2: Lifestyle Tagging

### 7 Tags

| Key | Label | Icon (Ionicons) |
|-----|-------|-----------------|
| `salt` | Salt | `fast-food-outline` |
| `stress` | Stress | `flash-outline` |
| `alcohol` | Alcohol | `wine-outline` |
| `exercise` | Exercise | `barbell-outline` |
| `medication` | Medication | `medkit-outline` |
| `caffeine` | Caffeine | `cafe-outline` |
| `poor_sleep` | Poor Sleep | `moon-outline` |

### Database Schema Migration

```sql
CREATE TABLE IF NOT EXISTS bp_tags (
  id         TEXT PRIMARY KEY NOT NULL,
  record_id  TEXT NOT NULL,
  tag        TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (record_id) REFERENCES bp_records(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_bp_tags_record_id ON bp_tags(record_id);
CREATE INDEX IF NOT EXISTS idx_bp_tags_tag ON bp_tags(tag);
```

Migration runs in `shared/api/db.ts` alongside existing table creation (safe, idempotent).

### New `TagChips` Shared Component

```typescript
// src/shared/ui/TagChips.tsx
interface TagChipsProps {
  selectedTags: LifestyleTag[];
  onToggle: (tag: LifestyleTag) => void;
  disabled?: boolean;
}
```

Horizontal `ScrollView` of pill chips. Selected: accent background + white text + icon. Unselected: `surfaceSecondary` + `textSecondary` + icon. Theme-aware via `useTheme()`.

### Entry Flow Changes (QuickLog + NewReading)

Optional tag row inserted between `DateTimePicker` and `SaveButton`:

```
[Systolic | Diastolic | Pulse]
[Numpad]
────────────────────────────
Tags (optional)
[ 🍔 Salt ][ ⚡ Stress ][ 🍷 Alcohol ][ 🏋 Exercise ]
[ 💊 Medication ][ ☕ Caffeine ][ 🌙 Poor Sleep ]
────────────────────────────
[      Save Reading      ]
```

Tags saved via `useSaveTags()` **after** `useRecordBP()` succeeds — no change to BP save logic or validation.

### Post-Save Edit (History Page)

Tapping a `BPRecordCard` opens a bottom sheet showing the reading's current tags via `TagChips`. Changes are saved immediately via `useSaveTags()`.

### Entity Layer (`src/entities/lifestyle-tag/`)

```typescript
// lib.ts
export type LifestyleTag = 'salt' | 'stress' | 'alcohol' | 'exercise' | 'medication' | 'caffeine' | 'poor_sleep';
export const LIFESTYLE_TAGS: { key: LifestyleTag; icon: string; labelKey: string }[]
export function computeTagCorrelations(records, tagMap): TagCorrelationResult[]
```

`computeTagCorrelations()` returns delta mmHg per tag (with/without). Only shown in Analytics when ≥5 tagged readings exist.

### Feature Layer (`src/features/manage-tags/`)

```typescript
// use-manage-tags.ts
useTagsForRecord(recordId: string)  // TanStack Query: fetch tags for one record
useSaveTagsForRecord(recordId: string)  // useMutation: replace all tags for record
```

### Analytics "Lifestyle Insights" Card

New card on `AnalyticsPage`, below the Circadian Patterns card. Only rendered when ≥5 readings have at least one tag.

```
┌─────────────────────────────────────────┐
│  Lifestyle Insights                     │
│                                         │
│  ⚡ Stress    +8 mmHg  (12 readings)    │
│  🍔 Salt      +6 mmHg  (9 readings)     │
│  🏋 Exercise  −4 mmHg  (7 readings)     │
│  ☕ Caffeine  +3 mmHg  (5 readings)     │
└─────────────────────────────────────────┘
```

### FSD Changes Summary

| File | Action |
|------|--------|
| `src/entities/lifestyle-tag/lib.ts` | CREATE |
| `src/entities/lifestyle-tag/index.ts` | CREATE |
| `src/features/manage-tags/model/use-manage-tags.ts` | CREATE |
| `src/features/manage-tags/index.ts` | CREATE |
| `src/shared/api/bp-tags-repository.ts` | CREATE |
| `src/shared/ui/TagChips.tsx` | CREATE |
| `src/shared/ui/index.ts` | MODIFY — export TagChips |
| `src/shared/api/db.ts` | MODIFY — run bp_tags migration |
| `src/widgets/bp-record-card/ui/BPRecordCard.tsx` | MODIFY — show tag pills + tap → edit sheet |
| `src/pages/quick-log/ui/QuickLogPage.tsx` | MODIFY — add TagChips before SaveButton |
| `src/pages/new-reading/ui/NewReadingPage.tsx` | MODIFY — add TagChips before SaveButton |
| `src/pages/analytics/ui/AnalyticsPage.tsx` | MODIFY — add Lifestyle Insights card |
| `src/shared/config/locales/en/pages.json` | MODIFY — lifestyle insights keys |
| `src/shared/config/locales/en/common.json` | MODIFY — tag label keys |

---

## Translation Keys (English only, per CLAUDE.md rule)

### `common.json` additions
```json
{
  "timeWindow": {
    "morning": "Morning",
    "day": "Day",
    "evening": "Evening",
    "night": "Night"
  },
  "tags": {
    "salt": "Salt",
    "stress": "Stress",
    "alcohol": "Alcohol",
    "exercise": "Exercise",
    "medication": "Medication",
    "caffeine": "Caffeine",
    "poor_sleep": "Poor Sleep",
    "title": "Tags (optional)",
    "edit": "Edit Tags"
  }
}
```

### `pages.json` additions
```json
{
  "analytics": {
    "circadian": {
      "title": "Circadian Patterns",
      "morningSurge": "Morning Surge detected {{count}} day",
      "morningSurge_other": "Morning Surge detected {{count}} days",
      "noData": "Not enough data",
      "timeInRange": "Time in Range"
    },
    "lifestyleInsights": {
      "title": "Lifestyle Insights",
      "mmhgHigher": "+{{delta}} mmHg ({{count}} readings)",
      "mmhgLower": "−{{delta}} mmHg ({{count}} readings)",
      "noData": "Log tags on 5+ readings to see correlations"
    }
  }
}
```

---

## Shared Decisions

- All new pure functions placed in `shared/lib/` or `entities/` — fully testable without React
- No new npm packages needed (reuses react-native-svg for DonutChart)
- Morning surge threshold: **≥20 mmHg** systolic (AHA literature)
- Correlation shown only with **≥5 samples** per tag (statistical minimum)
- Tags are **optional** everywhere — zero impact on existing BP logging flow
- DB migration is **idempotent** (`CREATE TABLE IF NOT EXISTS`) — safe on first run and upgrades

# MedTracker — Health Metric Template

MedTracker is a production-ready **React Native health tracking template**. The Blood Pressure tracker is the reference implementation. You can build a completely different health app (glucose, weight, sleep, heart rate, etc.) by writing one config file and optionally adding custom UI components.

Everything else — database creation, entry forms, history lists, trend charts, PDF export, medication tracking, offline sync, Firebase backup, tags, weather correlation — works automatically.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native CLI 0.76+ (Bare workflow, New Architecture) |
| Language | TypeScript strict mode |
| Database | `op-sqlite` (JSI) + SQLCipher encryption |
| State — server/DB | TanStack Query v5 |
| State — UI/client | Zustand |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| Animations | React Native Reanimated 3 |
| Icons | react-native-vector-icons (Ionicons) |
| i18n | i18next + react-i18next |
| Charts | react-native-gifted-charts |
| Testing | Jest + React Native Testing Library |
| Cloud sync | Firebase (Auth + Firestore) — optional, offline-first |
| PDF export | react-native-html-to-pdf |

---

## Architecture: Feature-Sliced Design (FSD)

The codebase follows strict **one-way dependency flow**:

```
app/       ← entry, navigation, providers
pages/     ← full screens
widgets/   ← complex UI blocks
features/  ← user actions, mutations
entities/  ← domain logic, types
shared/    ← utilities, components, config
```

A layer can only import from layers **below** it. `shared/` imports nothing from the app.

---

## Quick Start

### Prerequisites

- **Node.js** >= 20
- **Java 17** (Android builds)
- **Ruby** + **CocoaPods** (iOS builds, macOS only)
- **Android Studio** with SDK 34 or Xcode 15+
- **React Native CLI** environment — follow the [official setup guide](https://reactnative.dev/docs/set-up-your-environment)

### Install and Run

```bash
# 1. Install JS dependencies
npm install

# 2. iOS only — install native pods
cd ios && pod install && cd ..

# 3. Start Metro bundler
npm start

# 4. Run on device/emulator
npm run android
# or
npm run ios
```

### Verification Commands

```bash
npx tsc --noEmit --skipLibCheck   # Type check
npx eslint src/ --ext .ts,.tsx    # Lint
npm test                           # Jest (353 tests)
```

---

## Building Your Own Health Tracker

The template is designed so creating a new metric requires **one file** and **one registration call**. No existing code needs to change.

### Step 1 — Create Your Metric Config

Create `src/entities/<your-metric>/config.ts`. The `MetricConfig<TRecord, TValues>` interface defines everything about your metric.

**Minimal working example** (single-field tracker):

```typescript
// src/entities/glucose/config.ts
import type { MetricConfig } from '../../shared/config/metric-types';

export interface GlucoseRecord {
  id: string;
  value: number;        // mmol/L
  timestamp: number;    // Unix seconds
  notes: string | null;
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
}

export interface GlucoseValues extends Record<string, unknown> {
  value: number;
}

export const glucoseConfig: MetricConfig<GlucoseRecord, GlucoseValues> = {
  id: 'glucose',
  nameKey: 'medical:metrics.glucose',       // i18n key
  shortNameKey: 'medical:metrics.glucoseShort',
  iconName: 'water-outline',                 // Ionicons name
  queryKey: ['glucose-records'],             // TanStack Query cache key

  fields: [
    {
      key: 'value',
      labelKey: 'medical:glucose.fields.value',
      unit: 'mmol/L',
      type: 'float',     // 'integer' | 'float' | 'text' | 'boolean'
      min: 1.0,
      max: 33.3,
      required: true,
    },
  ],

  categories: [
    { id: 'low',     labelKey: 'medical:glucose.categories.low',     colorLight: '#60a5fa', colorDark: '#93c5fd', colorHighContrast: '#1d4ed8', severity: 'caution' },
    { id: 'normal',  labelKey: 'medical:glucose.categories.normal',  colorLight: '#22c55e', colorDark: '#86efac', colorHighContrast: '#15803d', severity: 'safe'    },
    { id: 'high',    labelKey: 'medical:glucose.categories.high',    colorLight: '#f97316', colorDark: '#fdba74', colorHighContrast: '#c2410c', severity: 'warning' },
    { id: 'veryHigh',labelKey: 'medical:glucose.categories.veryHigh',colorLight: '#ef4444', colorDark: '#fca5a5', colorHighContrast: '#b91c1c', severity: 'danger'  },
  ],

  guidelines: [
    { id: 'who', nameKey: 'medical:glucose.guideline', year: 2006, isDefault: true },
  ],

  classify: (values: GlucoseValues): string => {
    const v = values.value;
    if (v < 3.9)  return 'low';
    if (v <= 5.5) return 'normal';
    if (v <= 10)  return 'high';
    return 'veryHigh';
  },

  db: {
    tableName: 'glucose_records',
    columns: [
      { name: 'value', type: 'REAL', notNull: true, check: 'value BETWEEN 1.0 AND 33.3' },
      { name: 'notes', type: 'TEXT', notNull: false },
    ],
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_glucose_records_timestamp ON glucose_records(timestamp DESC)',
    ],
  },

  rowToDomain: (row): GlucoseRecord => ({
    id:        row.id as string,
    value:     row.value as number,
    timestamp: row.timestamp as number,
    notes:     (row.notes as string | null) ?? null,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    isSynced:  (row.is_synced as number) === 1,
  }),

  domainToFieldValues: (record: GlucoseRecord): GlucoseValues => ({
    value: record.value,
  }),
};
```

### Step 2 — Register the Metric

Open `src/app/providers/index.tsx` and register your config:

```typescript
import { glucoseConfig } from '../../entities/glucose';

// Add this line alongside the BP registration:
registerMetric(glucoseConfig);
```

To make your metric the **active** one shown in the app, change the active metric ID in `src/shared/config/metric-registry.ts`:

```typescript
export function getActiveMetricId(): string {
  return 'glucose';   // was 'blood-pressure'
}
```

That's it. The SQLite table is created automatically on first launch, and every generic screen works immediately.

### Step 3 (Optional) — Add Custom UI Components

The generic forms and cards work for any single- or multi-field metric. If your metric needs a custom UI (e.g., a glucose meter-style dual display, a chart with a custom reference band), you can override any slot without touching generic code.

Create `src/app/providers/glucose-components.ts`:

```typescript
import React from 'react';
import { GlucoseEntryForm } from '../../widgets/glucose-entry-form';
import { GlucoseRecordCard } from '../../widgets/glucose-record-card';
import type { ComponentOverrides } from '../../shared/config/metric-types';

export const glucoseComponents: ComponentOverrides = {
  EntryForm:  GlucoseEntryForm  as ComponentOverrides['EntryForm'],
  RecordCard: GlucoseRecordCard as ComponentOverrides['RecordCard'],
  // TrendChart, CircadianCard, AnalyticsView, CrisisModal — all optional
};
```

Then merge it at registration:

```typescript
registerMetric({ ...glucoseConfig, components: glucoseComponents });
```

**Available override slots:**

| Slot | When to use |
|---|---|
| `EntryForm` | Custom entry UI (dual numpad, slider, picker) |
| `RecordCard` | Custom record display (extra fields, badges, derived values) |
| `TrendChart` | Custom chart (reference bands, dual-axis, etc.) |
| `CircadianCard` | Day/night pattern analysis (enable with `circadian.enabled: true`) |
| `AnalyticsView` | Full custom analytics tab |
| `CrisisModal` | Custom crisis/alert popup |

### Step 4 (Optional) — Add i18n Keys

Add your metric's translation keys to `src/shared/config/locales/en/` under the `medical` namespace. Other languages (`tr`, `id`, `sr`) are translated separately — only edit the `en/` files.

### Step 5 (Optional) — Add Multi-Field Entry

For metrics with multiple fields (e.g., systolic + diastolic, sleep hours + quality), add more entries to `fields[]`. The generic `GenericEntryForm` steps through them one at a time with a numpad. Mark optional fields with `required: false`.

```typescript
fields: [
  { key: 'hours',   labelKey: '...', type: 'float',   min: 0,   max: 24,  required: true  },
  { key: 'quality', labelKey: '...', type: 'integer',  min: 1,   max: 10,  required: false },
],
```

### Step 6 (Optional) — Enable Crisis Detection

Add a `crisis` block to your config. The generic `useRecordMetric` hook calls it after every save:

```typescript
crisis: {
  crisisCategoryId: 'veryHigh',
  isCrisis: (values: GlucoseValues) => values.value > 16.7,
  alertTitleKey: 'crisis:glucose.title',
  alertBodyKey:  'crisis:glucose.body',
},
```

### Step 7 (Optional) — Add Derived Metrics

Values computed from your fields and shown alongside the reading (like Pulse Pressure for BP):

```typescript
derived: [
  {
    key: 'trend',
    labelKey: 'medical:glucose.derived.trend',
    unit: 'mmol/L',
    compute: (values: GlucoseValues) => values.value - previousValue,
  },
],
```

---

## What You Get for Free

Implementing `MetricConfig` gives you these features with **zero extra code**:

- **Offline SQLite storage** — table created from your `db` schema on first launch
- **Entry form** — numpad-driven, steps through all your `fields` in order
- **Home screen** — latest reading card with category color + trend chart
- **History list** — paginated, grouped by Today / Yesterday / Last Week / Older, pull-to-refresh
- **Classification** — category badge derived from your `classify()` function
- **Theme-aware colors** — light / dark / high-contrast from `colorLight` / `colorDark` / `colorHighContrast`
- **Tags** — lifestyle tag selector (exercise, stress, sleep, etc.) on every reading
- **Weather correlation** — automatic local weather fetch on every save, shown in analytics
- **Medication tracking** — Today's schedule card on the home screen (metric-agnostic)
- **PDF export** — report generated from your records
- **Firebase sync** — optional cloud backup when user signs in
- **Offline-first** — app fully usable with no network connection
- **Senior mode** — font scaling and high-contrast support baked in
- **Multi-guideline support** — add multiple entries to `guidelines[]` to let users switch

---

## Config Reference

Full `MetricConfig<TRecord, TValues>` interface is defined in:
`src/shared/config/metric-types.ts`

Key sections:

```
id                  — unique string identifier
nameKey             — i18n key for the metric name
iconName            — Ionicons icon name
queryKey            — TanStack Query cache key array
fields[]            — measurement fields (MetricFieldDef)
crossFieldRules[]   — cross-field validation (e.g. systolic > diastolic)
contextFields[]     — optional context dimensions (location, posture, meal timing)
categories[]        — classification buckets with colors (MetricCategory)
guidelines[]        — classification guidelines (ClassificationGuideline)
classify()          — (values, guidelineId) => categoryId string
crisis?             — optional crisis/alert detection (CrisisConfig)
derived[]           — optional computed values (DerivedMetricDef)
circadian?          — optional day/night pattern config (CircadianConfig)
db                  — SQLite schema (MetricDBSchema)
rowToDomain()       — SQLite row → domain object
domainToFieldValues() — domain object → field values for classification
export?             — PDF export template config (ExportConfig)
components?         — optional UI overrides (ComponentOverrides)
```

---

## Blood Pressure Reference Implementation

The BP tracker is the full reference implementation. Study these files to understand every config option in practice:

| File | What it shows |
|---|---|
| `src/entities/blood-pressure/config.ts` | Full `MetricConfig` with cross-field rules, 3 fields, 4 guidelines, derived metrics, crisis config, circadian config |
| `src/app/providers/bp-components.ts` | All 4 override slots in use (EntryForm, RecordCard, TrendChart, CircadianCard) |
| `src/entities/weight/config.ts` | Minimal config — single field, no overrides, no crisis, no circadian |

---

## Privacy and Security

- **No analytics or tracking** — zero outbound network calls on startup
- **SQLCipher encryption** — database is encrypted at rest
- **Local-first** — the app is 100% functional with no internet connection
- **Firebase is opt-in** — sync only activates after the user signs in
- **Cloud backup uses `appDataFolder`** — not visible in the user's Google Drive

---

## Contributing

When adding a new feature to the template:

1. Add generic behavior to the appropriate FSD layer (`shared/`, `entities/health-metric/`, `features/record-metric/`, generic widgets/pages)
2. Add BP-specific behavior as a config override — never hardcode it in the generic path
3. Update `docs/verified-functionalities.md` with the new capability
4. Run `npm test` and `npx tsc --noEmit --skipLibCheck` before committing

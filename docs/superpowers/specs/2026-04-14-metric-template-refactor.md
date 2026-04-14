# Refactor: Config-First Health Metric Template with Override Hooks

## Context

MedTracker is a React Native BP tracker with solid FSD architecture. ~60% of the codebase is already generic (auth, sync, tags, weather, medications, UI components). The goal is to make it a **reusable template** so that creating a new health tracker app (glucose, weight, sleep) requires editing one config file + optionally adding custom UI components. BP remains the first instance and must be fully working at the end. Breaking BP temporarily during refactoring is acceptable.

**Approach:** Config-first with override hooks — a `MetricConfig<T>` interface defines everything about a metric (fields, validation, classification, DB schema, colors, i18n, UI component overrides). Generic screens/widgets read from this config. Custom components are optional slots that override the defaults.

---

## Phase 0: Foundation Types

**Goal:** Define `MetricConfig<T>` interface and `MetricRegistry`. Pure additive — no runtime changes.

**Create:**
- `src/shared/config/metric-types.ts` — The full MetricConfig interface with:
  - `MetricFieldDef` — field definitions (key, label, type, min/max, unit)
  - `CrossFieldRule` — cross-field validation (e.g., systolic > diastolic)
  - `MetricCategory` — classification categories with colors per theme
  - `ClassificationGuideline` — guideline definitions (BP has 4, most metrics have 1)
  - `ClassifyFn<T>` — classification function signature
  - `CrisisConfig<T>` — optional crisis/alert detection
  - `DerivedMetricDef<T>` — optional calculated values (PP, MAP for BP)
  - `ContextFieldDef` — measurement context (location, posture, meal timing)
  - `MetricDBSchema` — table name, columns, CREATE SQL, indexes
  - `CircadianConfig` — optional time-window analysis
  - `ComponentOverrides<T>` — optional custom UI slots (EntryForm, RecordCard, TrendChart, AnalyticsView, CrisisModal)
  - `ExportConfig<T>` — PDF export template
  - `MetricConfig<T>` — the main interface composing all of the above
- `src/shared/config/metric-registry.ts` — `registerMetric()`, `getMetricConfig()`, `getAllMetricConfigs()`, `getActiveMetricId()`

**Verify:** `npx tsc --noEmit --skipLibCheck` passes, `npm test` passes (no runtime changes)

---

## Phase 1: Create BP Config Instance

**Goal:** Express all existing BP constants/thresholds/logic as a `MetricConfig<BPValues>`. Additive only — existing code untouched.

**Create:**
- `src/entities/blood-pressure/config.ts` — BP MetricConfig instance that:
  - References existing `BP_LIMITS`, `BP_THRESHOLDS` from `src/shared/config/bp-guidelines.ts`
  - References existing `classifyBP()`, `calculatePulsePressure()`, `calculateMAP()` from `src/entities/blood-pressure/lib.ts`
  - Defines 3 fields (systolic, diastolic, pulse), 2 context fields (location, posture)
  - Defines 5 categories (normal, elevated, stage_1, stage_2, crisis) with light/dark colors
  - Defines 4 guidelines (AHA/ACC, ESC/ESH, JSH, WHO)
  - Defines 2 derived metrics (PP, MAP)
  - Defines circadian config (enabled, morning surge threshold 20mmHg)
  - Includes DB schema matching existing `bp_records`/`bp_tags` tables
  - Includes `rowToDomain`/`domainToFieldValues` mapping functions

**Modify:**
- `src/app/providers/index.tsx` — Call `registerMetric(bpConfig)` during app init

**Verify:** Types compile, existing tests pass, write unit test for `bpConfig.classify()`

---

## Phase 2: Abstract Database Layer

**Goal:** Generic `MetricRepository` that generates SQL from MetricConfig. BP repository becomes a thin delegate.

**Create:**
- `src/shared/api/metric-repository.ts` — Generic CRUD:
  - `insertMetricRecord(config, input)` — builds INSERT from `config.db.columns`
  - `getMetricRecords(config, limit?)` — SELECT from `config.db.tableName`
  - `getMetricRecordById(config, id)` — single record
  - `getLatestMetricRecord(config)` — latest by timestamp
  - `updateMetricRecord(config, id, input)` — parameterized UPDATE
  - `deleteMetricRecord(config, id)` — DELETE with cascade via FK
  - `markMetricRecordSynced(config, id)` — sync status
- `src/shared/api/metric-tags-repository.ts` — Generic tag CRUD with parameterized table name

**Modify:**
- `src/shared/api/db.ts` — `initDatabase()` reads CREATE SQL from metric registry instead of hardcoding BP SQL. Keep medications, weather, linked_users, custom_tags as-is.
- `src/shared/api/bp-repository.ts` — Rewrite internals to delegate to `metric-repository` while keeping the same exports (`insertBPRecord`, `getBPRecords`, etc.)
- `src/shared/api/bp-tags-repository.ts` — Delegate to `metric-tags-repository`

**Key files to understand:**
- `src/shared/api/db.ts` — current init with inline CREATE TABLE
- `src/shared/api/bp-repository.ts` — current BP CRUD (~200 lines)
- `src/shared/api/bp-tags-repository.ts` — current tag CRUD

**Verify:** All existing tests pass, manual test insert/read/update/delete a BP record

---

## Phase 3: Abstract Entity Layer

**Goal:** Generic validation/classification hooks using MetricConfig. Can run in parallel with Phase 2.

**Create:**
- `src/entities/health-metric/index.ts`
- `src/entities/health-metric/lib.ts` — `validateMetricValues(config, values)` reads `config.fields` for range checks, `config.crossFieldRules` for cross-field rules
- `src/entities/health-metric/use-metric-classification.ts` — `useMetricClassification(config, values)` hook wrapping `config.classify()` + `config.categories` color lookup
- `src/entities/health-metric/use-metric-records.ts` — Generic query hook using `config.queryKey` + generic repository
- `src/entities/health-metric/circadian-classification.ts` — Generic time-in-range using `config.classify()` + `config.circadian`

**Existing BP entity files stay untouched** — they contain the implementation that `bpConfig` delegates to. BP-specific hooks (`useBPClassification`) can optionally be rewritten to delegate to the generic hook later.

**Key files to understand:**
- `src/entities/blood-pressure/lib.ts` — current classification/validation (~220 lines)
- `src/entities/blood-pressure/use-bp-classification.ts` — current hook
- `src/entities/blood-pressure/circadian-classification.ts` — time-in-range

**Verify:** Unit tests for `validateMetricValues` using bpConfig, generic circadian tests, all existing tests pass

---

## Phase 4: Abstract Feature Layer

**Goal:** Generic CRUD mutation hooks. BP features become thin wrappers.

**Create:**
- `src/features/record-metric/model/use-record-metric.ts` — `useRecordMetric(config)` mutation: validates, inserts, saves tags, triggers weather fetch, syncs, checks crisis (if config defines it)
- `src/features/record-metric/model/use-metric-records.ts` — `useMetricRecords(config, limit?)` query hook
- `src/features/edit-metric/model/use-edit-metric.ts` — `useEditMetric(config)` mutation
- `src/features/delete-metric/model/use-delete-metric.ts` — `useDeleteMetric(config)` mutation

**Modify:**
- `src/features/record-bp/model/use-record-bp.ts` — Delegate to `useRecordMetric(bpConfig)`, keep same return type
- `src/features/record-bp/model/use-bp-records.ts` — Delegate to `useMetricRecords(bpConfig)`
- `src/features/edit-bp/model/use-edit-bp.ts` — Delegate to `useEditMetric(bpConfig)`
- `src/features/delete-bp/model/use-delete-bp.ts` — Delegate to `useDeleteMetric(bpConfig)`

**Note:** Crisis alerts stay BP-specific for now. Generic hook calls `checkAndAlert` conditionally when `config.id === 'blood-pressure'`. Other metrics can define their own alert behavior later.

**Key files to understand:**
- `src/features/record-bp/model/use-record-bp.ts` (~61 lines)
- `src/features/edit-bp/model/use-edit-bp.ts` (~63 lines)
- `src/features/delete-bp/model/use-delete-bp.ts` (~24 lines)

**Verify:** All BP CRUD operations work end-to-end, existing tests pass, barrel exports unchanged

---

## Phase 5: Abstract Widget Layer

**Goal:** Generic widgets with override slots. BP's complex widgets become override components.

**Create:**
- `src/widgets/metric-entry-form/ui/MetricEntryForm.tsx` — Checks `config.components?.EntryForm`, renders custom or generic default
- `src/widgets/metric-entry-form/ui/GenericEntryForm.tsx` — Data-driven form: one numpad field per `config.fields`, context selectors from `config.contextFields`
- `src/widgets/metric-record-card/ui/MetricRecordCard.tsx` — Same override pattern
- `src/widgets/metric-record-card/ui/GenericRecordCard.tsx` — Shows field values + category badge
- `src/widgets/metric-records-list/ui/MetricRecordsList.tsx` — Generic SectionList
- `src/widgets/metric-trend-chart/ui/MetricTrendChart.tsx` — Override or generic line chart
- `src/widgets/metric-circadian-card/ui/MetricCircadianCard.tsx` — Only renders if `config.circadian.enabled`

**FSD compliance for overrides:**
- `src/entities/blood-pressure/config.ts` stays **pure data** (no React imports)
- `src/entities/blood-pressure/components.ts` — NEW, exports component override map referencing existing BP widgets
- `src/app/providers/` — Merges config + components: `registerMetric({ ...bpConfig, components: bpComponents })`

**Existing BP widgets stay in place** — `widgets/bp-entry-form/`, `widgets/bp-reading-form/`, `widgets/bp-record-card/` become the override components referenced by `bpComponents`.

**Verify:** All screens look identical, New Reading shows BP dual-numpad, history cards show classifications

---

## Phase 6: Abstract Page Layer

**Goal:** Generic page components driven by MetricConfig. Most labor-intensive phase.

**Create:**
- `src/pages/metric-home/ui/MetricHomePage.tsx` — Latest reading card (via config's RecordCard), trend chart, circadian card (if enabled), medication schedule
- `src/pages/metric-analytics/ui/MetricAnalyticsPage.tsx` — Period selector, stats, chart, correlations, export
- `src/pages/metric-history/ui/MetricHistoryPage.tsx` — Generic history list with filters
- `src/pages/metric-new-reading/ui/MetricNewReadingPage.tsx` — Wraps MetricEntryForm
- `src/pages/metric-edit-reading/ui/MetricEditReadingPage.tsx` — Edit form

**Modify:**
- `src/app/navigation/index.tsx` — Tab screens use generic pages parameterized with active metric config
- `src/app/navigation/CustomTabBar.tsx` — FAB label from config ("+ New Reading" → `config.nameKey`)

**Strategy:** Generic pages have override slots via `config.components?.AnalyticsView`. BP's complex analytics (circadian, PP/MAP) use this override. Generic analytics shows basic stats + chart for simple metrics.

**Verify:** Full end-to-end: add reading → home → history → analytics → edit → delete → export PDF

---

## Phase 7: Abstract Theme and i18n

**Goal:** Move BP-specific theme tokens and i18n to config-driven system. Can partially run in parallel with Phases 3-6.

**Modify:**
- `src/shared/config/theme.ts`:
  - Remove standalone `BP_COLORS_LIGHT/DARK` exports
  - Add `getMetricCategoryColors(config, isDark)` — reads from `config.categories`
  - Keep generic `ThemeColors` interface + light/dark/highContrast palettes
- `src/shared/config/locales/en/medical.json` — Add generic `"metric"` and `"fields"` top-level keys
- `src/shared/lib/analytics-utils.ts` — Generalize to accept configurable field keys instead of hardcoded systolic/diastolic
- `src/shared/lib/circadian-utils.ts` — Generalize to accept any record with `.timestamp` + configurable field keys
- `src/shared/lib/record-utils.ts` — Generalize `groupRecordsByTimePeriod` to any record with `.timestamp`
- `src/shared/lib/use-bp-input.ts` → rename to `use-metric-input.ts`, read fields from config
- `src/shared/lib/settings-store.ts` — Keep BP-specific `guideline`/`unit` fields for now, add `metricSettings: Record<string, Record<string, unknown>>` for future multi-metric

**Verify:** Visual regression (all screens identical), theme switching works, language switching works

---

## Phase 8: Clean Up and Verify

**Goal:** Remove dead code, fix imports, full end-to-end verification.

**Actions:**
- Remove BP-specific functions that are now fully delegated to generic equivalents
- Update barrel exports (`index.ts` files)
- `npx tsc --noEmit --skipLibCheck`
- `npx eslint src/ --ext .ts,.tsx`
- `npm test`

**End-to-end checklist:**
1. Fresh install — app boots, database initializes
2. Quick Log entry (numpad)
3. Guided Flow entry (pre-measurement + breathing + form)
4. Home page — latest reading + classification colors
5. History page — grouped records + filters
6. Analytics page — trend chart, circadian, correlations, weather
7. Edit a reading
8. Delete a reading
9. Export PDF report
10. Change guideline (AHA → ESC) — classifications update
11. Change theme (light → dark → high contrast)
12. Senior mode toggle — font scaling
13. Tag a reading with lifestyle tags
14. Medication tracking
15. Voice logging deep link

---

## Phase 9: Smoke Test — Weight Metric

**Goal:** Validate the template by creating a second metric with minimal code.

**Create:**
- `src/entities/weight/config.ts` — WeightConfig: single `value` field, 4 categories (underweight/normal/overweight/obese), no circadian, no crisis, no derived metrics, no custom UI components
- `src/shared/config/locales/en/weight.json` — Small i18n namespace (~20 keys)
- Register in `src/app/` — `registerMetric(weightConfig)`

**What this validates:**
- Generic `initDatabase()` creates weight tables automatically
- Generic entry form renders single-field numpad (no override needed)
- Generic record card shows weight + classification
- Generic analytics shows trends
- Tags, weather, export all work without weight-specific code
- **Zero custom UI components needed** — all defaults work

**Verify:** Add weight reading, view on all screens, export PDF, switch back to BP — everything still works

---

## Phase Dependency Graph

```
Phase 0 (Types)           ── no dependencies
Phase 1 (BP Config)       ── depends on Phase 0
Phase 2 (DB Layer)        ── depends on Phase 0, 1
Phase 3 (Entity Layer)    ── depends on Phase 0, 1 (parallel with Phase 2)
Phase 7 (Theme/i18n)      ── depends on Phase 0, 1 (parallel with Phases 2-6)
Phase 4 (Feature Layer)   ── depends on Phase 2, 3
Phase 5 (Widget Layer)    ── depends on Phase 3, 4
Phase 6 (Page Layer)      ── depends on Phase 5
Phase 8 (Cleanup)         ── depends on all above
Phase 9 (Smoke Test)      ── depends on Phase 8
```

---

## Key Architectural Decisions

1. **MetricConfig type in `shared/`, config instances in `entities/`, component overrides registered in `app/`** — respects FSD one-way dependency flow
2. **Generic repository generates SQL dynamically** from `config.db.columns` — safe because column defs are compile-time constants, all values parameterized
3. **Override pattern uses React component slots** (`React.ComponentType<Props>`), not render props — keeps overrides as testable FSD widgets
4. **BP delegate pattern** — existing BP functions (`insertBPRecord`, `useRecordBP`) keep their signatures but delegate to generic internals. No downstream breakage until Phase 8 cleanup.
5. **Weather FK stays linked to active metric table** — for multi-metric future, switch to soft reference with `metric_type` + `record_id`
6. **Settings store stays BP-centric for now** — `guideline`/`unit` fields remain. Future multi-metric adds `metricSettings` map.
7. **Sync/encryption stays BP-specific initially** — generalizing Firestore encryption requires reading `config.encryptedFields`, plus a collection path migration (`records/{uid}/bp` → `records/{uid}/{metricId}`)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking the app during refactoring | Every phase preserves existing function signatures via delegate pattern |
| TypeScript strict mode issues with generics | `MetricConfig<T>` carries concrete type; `rowToDomain`/`domainToFieldValues` handle conversions at boundary |
| Performance from dynamic SQL | SQL strings cached after first construction; column arrays are small (10-15 items) |
| i18n key mismatches | BP config reuses all existing i18n keys unchanged; new metrics get own namespace |
| Firestore sync breaking change | Sync generalization is explicitly deferred; BP sync continues working as-is |

---

## Critical Files Reference

| File | Role |
|------|------|
| `src/shared/config/metric-types.ts` | NEW — MetricConfig interface (heart of refactor) |
| `src/shared/config/metric-registry.ts` | NEW — Runtime metric registry |
| `src/shared/api/metric-repository.ts` | NEW — Generic CRUD |
| `src/shared/api/metric-tags-repository.ts` | NEW — Generic tag CRUD |
| `src/entities/blood-pressure/config.ts` | NEW — BP as MetricConfig instance |
| `src/entities/blood-pressure/components.ts` | NEW — BP UI override map |
| `src/entities/health-metric/` | NEW — Generic entity hooks |
| `src/features/record-metric/` | NEW — Generic record mutation |
| `src/features/edit-metric/` | NEW — Generic edit mutation |
| `src/features/delete-metric/` | NEW — Generic delete mutation |
| `src/widgets/metric-entry-form/` | NEW — Generic entry with override slot |
| `src/widgets/metric-record-card/` | NEW — Generic card with override slot |
| `src/pages/metric-home/` | NEW — Generic home page |
| `src/shared/api/db.ts` | MODIFY — Dynamic table creation from registry |
| `src/shared/api/bp-repository.ts` | MODIFY — Delegate to generic |
| `src/shared/config/theme.ts` | MODIFY — Config-driven category colors |
| `src/app/navigation/index.tsx` | MODIFY — Generic page routing |

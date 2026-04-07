# Component Extraction & Reuse Design

**Date:** 2026-04-07  
**Scope:** Full sweep — new shared/ui components, adopt existing shared/ui, merge NewReadingPage + QuickLogPage  
**Approach:** Impact-first (Phase 1 → Phase 2 → Phase 3)

---

## Background

A codebase audit of 214 files found three categories of duplication:

1. **Missing components** — recurring inline JSX patterns (SettingRow, EmptyState, MenuItem, etc.) that should exist in `shared/ui` but don't.
2. **Ignored existing components** — `<Card>`, `<CardHeader>`, `<Button>` already exist in `shared/ui` but 20+ files build equivalent structures manually.
3. **Near-duplicate pages** — `NewReadingPage` and `QuickLogPage` are 85%+ identical (~400 lines each) and should share a single `<BPReadingForm>` widget.

**Goals:**
- Eliminate ~2,000+ lines of duplicate code
- Make all colors, spacing, and theme tokens flow through shared components
- All new components live in `src/shared/ui/`
- Follow FSD: `shared/ui` imports nothing from upper layers

---

## Phase 1 — New `shared/ui` Components

All components use `useTheme()` for colors. No hardcoded values. All user-facing strings use `t()`.

### 1. `<SettingRow>`

Covers both "settings row" (with description) and "toggle row" (without) — same component, `description` is optional.

```tsx
<SettingRow
  label="Senior Mode"
  description="Larger text and higher contrast"   // optional
  value={seniorMode}
  onValueChange={setSeniorMode}
  disabled={false}          // optional, default false
  icon="accessibility"      // optional Ionicons name
  iconColor={colors.accent} // optional, used only when icon is set
/>
```

**Adopters (22 instances):** AppSettingsPage ×3, SyncPage ×2, WeatherSettingsPage ×1, AnalyticsPage ×4+, HistoryPage ×2+, SharingSettingsPage ×5+

---

### 2. `<EmptyState>`

```tsx
<EmptyState
  icon="💓"                            // emoji string or Ionicons name
  title={t('history.empty_title')}
  subtitle={t('history.empty_subtitle')}
  action={{ label: t('common.add'), onPress: onAdd }}  // optional
/>
```

**Adopters (3+):** BPRecordsList, MedicationPage, SharingSettingsPage

---

### 3. `<LoadingState>`

```tsx
<LoadingState message={t('common.loading')} />  // message optional
```

Centered `ActivityIndicator` + optional text. Replaces inline `isLoading ? <ActivityIndicator>` pattern.

**Adopters (3):** EditReadingPage, AcceptInvitePage, WeatherSettingsPage

---

### 4. `<ErrorState>`

```tsx
<ErrorState
  title={t('errors.load_failed')}
  subtitle={t('errors.try_again')}
  onRetry={refetch}   // optional
/>
```

**Adopters (3+):** BPRecordsList, MedicationPage

---

### 5. `<MenuItem>`

Icon-circle + label + optional subtitle + chevron row. Wraps in `<Card variant="pressable">`.

```tsx
<MenuItem
  icon="person-outline"
  iconColor={colors.accent}
  label={t('settings.personal_info')}
  subtitle="John, 45"          // optional
  onPress={navigate}
  showChevron={true}           // default true
  rightElement={<Badge />}     // optional override for right side
/>
```

**Adopters (6):** SettingsPage ×6 (currently a local function component)

---

### 6. `<FormField>`

Label + TextInput or Pressable picker with consistent border/background styling.

```tsx
// Text input variant
<FormField
  label={t('profile.full_name')}
  value={name}
  onChangeText={setName}
  placeholder="John Doe"
  keyboardType="default"
/>

// Pressable picker variant
<FormField
  label={t('profile.date_of_birth')}
  value={displayDOB}
  onPress={openDatePicker}
  type="pressable"
/>
```

**Adopters (7+):** PersonalInfoPage — name, DOB, gender, location, posture, height, weight fields

---

### 7. `<ProfileBadgeRow>`

Horizontal row of icon+text badges with dot separators. Highest instance count.

```tsx
<ProfileBadgeRow
  badges={[
    { icon: 'calendar-outline', label: '45 yrs' },
    { icon: 'male-outline', label: 'Male' },
    { icon: 'body-outline', label: 'BMI 24.1', category: 'normal' },
  ]}
/>
```

`category` maps to a theme color (normal/elevated/high/crisis). All colors from `useTheme()`.

**Adopters (21+ instances across 4 pages):** HomePage, AnalyticsPage, HistoryPage, SettingsPage

---

### 8. `<SectionHeader>`

Single uppercase/semibold date-group label.

```tsx
<SectionHeader title={t('history.section_today')} />
```

**Adopters (4+):** BPRecordsList, SharingSettingsPage

---

### 9. `<DetailChip>`

Small chip with icon + text for metadata display.

```tsx
<DetailChip icon="time-outline" label="08:30 AM" />
<DetailChip icon="location-outline" label="Home" color={colors.accent} />
```

**Adopters (7+):** BPRecordCard ×7, WeatherCorrelationCard

---

### 10. `<PeriodSelector>`

Horizontal scrollable `<OptionChip>` row for date-range filtering.

```tsx
<PeriodSelector
  value={period}
  onChange={setPeriod}
  options={['7d', '14d', '30d', '90d', 'all', 'custom']}
  onCustomPress={openCustomRangePicker}  // optional
/>
```

**Adopters (2):** AnalyticsPage, HistoryPage

---

### 11. `<InfoBanner>`

Colored alert/detection banner with accent border and background tint.

```tsx
<InfoBanner
  icon="shield-checkmark-outline"
  title={t('classification.detected_guideline')}
  body={t('classification.detection_note')}
  color={colors.accent}   // drives border + background tint
/>
```

**Adopters (2):** ClassificationPage

---

### 12. `<InfoHintRow>`

Subtle single-line icon + explanatory text row.

```tsx
<InfoHintRow
  icon="information-circle-outline"
  text={t('analytics.pp_map_hint')}
  color={colors.info}   // optional, defaults to textSecondary
/>
```

**Adopters (2):** AnalyticsPage

---

## Phase 2 — Adopt Existing `shared/ui` Components

No new components created. Mechanical replacement of inline builds.

### 2a. Inline card builds → `<Card>`

| File | Current | Replace with |
|------|---------|--------------|
| `pages/settings/ui/SettingsPage.tsx` | MenuItem Pressable wrapper | `<Card variant="pressable">` |
| `pages/medications/ui/MedicationPage.tsx` | medication card View | `<Card variant="elevated">` |
| `widgets/bp-record-card/ui/BPRecordCard.tsx` | full + compact wrappers | `<Card variant="elevated">` |
| `pages/settings/ui/AppSettingsPage.tsx` | section card Views | `<Card variant="elevated">` |
| `pages/settings/ui/SyncPage.tsx` | section card Views | `<Card variant="elevated">` |
| `pages/settings/ui/WeatherSettingsPage.tsx` | section card Views | `<Card variant="elevated">` |

20+ total inline card builds across the app.

### 2b. Inline card header rows → `<CardHeader>`

8+ places manually build `View(row) → iconCircle + title + subtitle`:

- `AppSettingsPage.tsx` — Entry Mode, Theme, Numpad Layout section headers
- `SyncPage.tsx` — Health Integration, Data Privacy, Cloud Sync headers
- `WeatherSettingsPage.tsx` — Location Mode, correlation section headers

### 2c. Raw Pressable buttons → `<Button>`

- `pages/medications/ui/MedicationPage.tsx` — add medication FAB-style button
- `pages/family-sharing/ui/AcceptInvitePage.tsx` — accept/decline buttons
- `pages/family-sharing/ui/SharingSettingsPage.tsx` — invite button

---

## Phase 3 — Merge NewReadingPage + QuickLogPage

### Problem

`NewReadingPage` and `QuickLogPage` are ~400 lines each and 85%+ identical. Any bug fix or feature must be applied twice.

### Solution

Extract shared logic into a `widgets/bp-reading-form/` widget. Each page becomes a ~50-line shell.

### File Structure

```
src/widgets/bp-reading-form/
  ui/BPReadingForm.tsx          ← shared form UI (~350 lines)
  lib/use-bp-reading-form.ts    ← validation, save mutation, crisis trigger

src/pages/new-reading/ui/NewReadingPage.tsx   ← ~50 lines
src/pages/quick-log/ui/QuickLogPage.tsx       ← ~50 lines
```

### Shared Elements (extracted to BPReadingForm)

- BP number display + classification color banner
- `<Numpad>` integration with field focus management
- Systolic → Diastolic auto-advance (controlled via `autoAdvance` prop)
- DateTime picker row
- Weight input pill
- Tag pills (Home/Office/Clinic/Exercise/Other)
- Notes field
- CrisisModal trigger
- Form validation: SBP > DBP, range checks (SBP 40–300, DBP 30–200)
- Save mutation + error handling

### What Stays Per-Page

| Prop | NewReadingPage | QuickLogPage |
|------|---------------|--------------|
| `variant` | `"full"` | `"compact"` |
| `autoAdvance` | `true` | `false` |
| `title` | `t('new_reading.title')` | `t('quick_log.title')` |
| `subtitle` | guideline name | omitted |
| `onDismiss` | `navigation.goBack` (modal) | `navigation.goBack` (stack) |

### API

```tsx
// NewReadingPage.tsx
<BPReadingForm
  variant="full"
  autoAdvance={true}
  title={t('new_reading.title')}
  subtitle={guidelineName}
  onDismiss={navigation.goBack}
/>

// QuickLogPage.tsx
<BPReadingForm
  variant="compact"
  autoAdvance={false}
  title={t('quick_log.title')}
  onDismiss={navigation.goBack}
/>
```

### `use-bp-reading-form` Hook API

```ts
const {
  sbp, dbp, pulse,
  setSbp, setDbp, setPulse,
  activeField, setActiveField,
  datetime, setDatetime,
  weight, setWeight,
  tags, toggleTag,
  notes, setNotes,
  classification,
  isCrisis,
  isSaving,
  handleSave,
  handleNumpadPress,
  validationError,
} = useBPReadingForm({ autoAdvance, onDismiss })
```

---

## Implementation Order

### Phase 1 — Create new components (safe, additive)
Create each of the 12 components in `src/shared/ui/`, export from `src/shared/ui/index.ts`, then adopt in each identified file.

**Sequence within Phase 1:** highest-instance-count first:
1. `<SettingRow>` (22 instances)
2. `<ProfileBadgeRow>` (21+ instances)
3. `<MenuItem>` (6 instances)
4. `<FormField>` (7+ instances)
5. `<EmptyState>` + `<LoadingState>` + `<ErrorState>` (state trio)
6. `<DetailChip>` (7+ instances)
7. `<SectionHeader>` (4+ instances)
8. `<PeriodSelector>` (2 instances)
9. `<InfoBanner>` + `<InfoHintRow>` (2 instances each)

### Phase 2 — Adopt existing shared/ui (mechanical replacements)
1. Replace inline card builds with `<Card>`
2. Replace inline card headers with `<CardHeader>`
3. Replace raw Pressable buttons with `<Button>`

### Phase 3 — Merge reading pages (highest risk, done last)
1. Extract `use-bp-reading-form` hook from NewReadingPage
2. Build `BPReadingForm` widget using the hook
3. Refactor NewReadingPage to ~50-line shell
4. Refactor QuickLogPage to ~50-line shell
5. Verify both pages behave identically to before

---

## Constraints

- All components use `useTheme()` — no hardcoded colors
- All user-facing strings use `t()` — no hardcoded text
- All interactive elements meet 44×44pt touch target minimum
- FSD dependency rule: `shared/ui` imports nothing from upper layers
- Phase 3 must not change user-facing behavior of either reading page

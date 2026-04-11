# DateTimePicker Redesign — Design Spec

**Date:** 2026-04-11  
**Status:** Approved

---

## Problem

The current `DateTimePicker` modal shows three separate stepper rows (DAY / HOUR / MINUTE) each with circular − number + buttons. Users find this confusing — it's not clear that all three rows combine into one date/time, and the large isolated numbers give no contextual cues.

---

## Goal

Replace the stepper-row modal with a **bottom sheet** containing a **calendar grid** for date selection and **± buttons** above/below the hour and minute digits for time selection. No new libraries. Same external props.

---

## Scope

Single file replacement: `src/shared/ui/DateTimePicker.tsx`

All 6 consumers use the same props interface `{ value: Date, onChange: (date: Date) => void, disabled?: boolean }` — no consumer changes needed.

---

## Architecture

The component stays in `src/shared/ui/DateTimePicker.tsx` as a single self-contained file. No sub-components are extracted (the file handles trigger pill + bottom sheet modal). The calendar grid logic (day-cell generation, month navigation) lives as pure helper functions at the top of the file.

### Helper functions (top of file, not exported)

```ts
// Returns array of { date: Date | null, isCurrentMonth: boolean }[] for a 6×7 grid
function buildCalendarGrid(year: number, month: number): CalendarCell[]

// True if two Date objects represent the same calendar day
function isSameDay(a: Date, b: Date): boolean

// True if a Date is strictly after now (used to disable future cells / time + buttons)
function isFuture(date: Date): boolean
```

### State inside `DateTimePicker`

| State variable | Type | Purpose |
|---|---|---|
| `modalVisible` | `boolean` | Controls bottom sheet open/close |
| `tempDate` | `Date` | Working copy; committed on Done, discarded on Cancel |
| `viewYear` | `number` | Currently displayed calendar year |
| `viewMonth` | `number` | Currently displayed calendar month (0–11) |

`viewYear` / `viewMonth` initialise from `tempDate` when the sheet opens, and update when the user taps ‹ ›.

---

## UI Sections

### Trigger pill

Unchanged from current. Shows calendar icon + relative time text. Two visual states:
- **Now** (within 60 s): transparent background, `colors.border` border, `colors.textSecondary` text
- **Past**: `colors.accent + '15'` background, `colors.accent` border and text

### Bottom sheet

`Modal` with `animationType="slide"`, `transparent`, `presentationStyle="overFullScreen"`. Overlay tapping calls `handleCancel`.

Inner sheet: `borderTopLeftRadius: 24`, `borderTopRightRadius: 24`, `backgroundColor: colors.surface`, anchored to screen bottom with `justifyContent: 'flex-end'` on the overlay.

**Sheet sections (top to bottom):**

1. **Drag handle** — 40 × 4 pt pill, `colors.border`, centred, `marginBottom: 16`
2. **Header row** — title "Select Date & Time" (`colors.textPrimary`) left, "Set to Now" tappable link (`colors.accent`) right
3. **Month navigation row** — ‹ chevron · "Month Year" label · › chevron. Right chevron disabled (visually and functionally) when `viewMonth === currentMonth && viewYear === currentYear`
4. **Day-of-week row** — S M T W T F S, `colors.textTertiary`, 7-column grid
5. **Calendar grid** — 7-column grid, up to 6 rows
   - Cells outside current month: `colors.textTertiary`, not pressable
   - Future cells: `colors.textTertiary`, not pressable
   - Selected cell: filled circle `colors.accent`, white text
   - Past/today cells in current month: `colors.textPrimary`, pressable
6. **Divider** — `StyleSheet.hairlineWidth`, `colors.border`
7. **Time row** — centred, horizontal layout:
   - Hour column: + button · HH display · − button
   - Colon separator
   - Minute column: + button · MM display · − button
8. **Action row** — Cancel (secondary) + Done (primary) buttons using `<Button>` from `shared/ui`

---

## Behaviour

### Calendar navigation

- ‹ always enabled (no lower bound on past dates)
- › disabled when `viewMonth === today.getMonth() && viewYear === today.getFullYear()`
- Tapping a day cell: updates `tempDate` preserving existing HH:MM, sets `viewYear`/`viewMonth` to match

### Time stepping

| Control | Step | Wrap |
|---|---|---|
| Hour + / − | 1 | 0–23 wraps |
| Minute + / − | 5 | 0–55 wraps |

"+" disabled when the resulting `tempDate` would be in the future (i.e. `isFuture(candidate)`).

When the current `tempDate` is today, the + buttons on hour and minute are additionally clamped so the result never exceeds `new Date()`.

### Set to Now

Resets `tempDate`, `viewYear`, `viewMonth` to current moment.

### Done / Cancel

- **Done**: calls `onChange(tempDate)`, closes modal
- **Cancel**: resets `tempDate` to original `value`, closes modal
- **Backdrop tap**: same as Cancel

---

## Accessibility

Every interactive element carries `accessibilityRole` and `accessibilityLabel` via `t()`:
- Day cells: `t('dateTime.selectDay', { day, month, year })`
- Month nav: `t('dateTime.prevMonth')` / `t('dateTime.nextMonth')`
- Hour/Minute ±: `t('dateTime.incrementHour')` / `t('dateTime.decrementHour')` etc.
- Set to Now: `t('dateTime.setToNow')`
- Done / Cancel: existing keys

Minimum touch target 44×44 pt on all pressable elements.

---

## i18n

New translation keys needed in `src/shared/config/locales/en/common.json` under the existing `dateTime` namespace:

```json
"dateTime": {
  "prevMonth": "Previous month",
  "nextMonth": "Next month",
  "selectDay": "{{day}} {{month}} {{year}}",
  "incrementHour": "Increase hour",
  "decrementHour": "Decrease hour",
  "incrementMinute": "Increase minute",
  "decrementMinute": "Decrease minute"
}
```

Existing keys (`selectTime`, `setToNow`, `day`, `hour`, `minute`) are no longer used and can be removed.

---

## What Does NOT Change

- External props: `value`, `onChange`, `disabled`
- Trigger pill visual design
- Where the component lives (`src/shared/ui/DateTimePicker.tsx`)
- Consumers: `BPReadingForm`, `QuickLogPage`, `NewReadingPage`, `EditReadingPage`, `HistoryPage`, `AnalyticsPage` — zero changes needed
- The "no future date" constraint

---

## Out of Scope

- Scroll-wheel (drum roll) time picker
- Native OS date picker (`@react-native-community/datetimepicker`)
- Time-only or date-only modes
- Multi-date selection

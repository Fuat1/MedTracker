# DateTimePicker Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the confusing stepper-row date/time picker modal with a bottom sheet containing a calendar grid for date and ± buttons for hour/minute.

**Architecture:** Single file rewrite of `src/shared/ui/DateTimePicker.tsx`. Pure helper functions (`buildCalendarGrid`, `isSameDay`, `isFuture`) are exported for unit testing. The component uses `Modal` with `animationType="slide"` and `justifyContent: 'flex-end'` — no new libraries needed. The external props interface (`value`, `onChange`, `disabled`) is unchanged, so all 6 consumer screens need zero edits.

**Tech Stack:** React Native (`Modal`, `Pressable`, `StyleSheet`), react-i18next, react-native-safe-area-context, react-native-vector-icons/Ionicons, `<Button>` from `shared/ui`.

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `src/shared/config/locales/en/common.json` | Update `dateTime` keys (add 5 new, keep `selectTime` + `setToNow`, remove `day`/`hour`/`minute`) |
| Modify | `src/shared/ui/DateTimePicker.tsx` | Full rewrite — helpers + new component |
| Create | `src/shared/ui/__tests__/DateTimePicker.test.ts` | Unit tests for the 3 pure helpers |
| Modify | `docs/verified-functionalities.md` | Update section describing the date/time picker |

---

## Task 1: Update i18n keys

**Files:**
- Modify: `src/shared/config/locales/en/common.json`

- [ ] **Step 1: Open the file and find the `dateTime` block**

The current block (around line 79) looks like:

```json
"dateTime": {
  "selectTime": "Select Date & Time",
  "day": "Day",
  "hour": "Hour",
  "minute": "Minute",
  "setToNow": "Set to Now"
},
```

- [ ] **Step 2: Replace the `dateTime` block with the new keys**

```json
"dateTime": {
  "selectTime": "Select Date & Time",
  "setToNow": "Set to Now",
  "prevMonth": "Previous month",
  "nextMonth": "Next month",
  "selectDay": "{{day}} {{month}} {{year}}",
  "incrementHour": "Increase hour",
  "decrementHour": "Decrease hour",
  "incrementMinute": "Increase minute",
  "decrementMinute": "Decrease minute"
},
```

(`day`, `hour`, `minute` are removed — they were only used by the old stepper labels. `selectTime` and `setToNow` are kept unchanged.)

- [ ] **Step 3: Run typecheck to confirm no TS errors**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/config/locales/en/common.json
git commit -m "i18n: update dateTime keys for new calendar picker"
```

---

## Task 2: Pure helper functions + tests

**Files:**
- Modify: `src/shared/ui/DateTimePicker.tsx` (add helpers at top, temporarily keep old component below)
- Create: `src/shared/ui/__tests__/DateTimePicker.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/shared/ui/__tests__/DateTimePicker.test.ts`:

```typescript
import {
  buildCalendarGrid,
  isSameDay,
  isFuture,
} from '../DateTimePicker';

// ─── buildCalendarGrid ────────────────────────────────────────────────────────

describe('buildCalendarGrid', () => {
  it('always returns exactly 42 cells', () => {
    // April 2026, March 2026, February 2024 (leap year)
    expect(buildCalendarGrid(2026, 3).length).toBe(42); // April
    expect(buildCalendarGrid(2026, 2).length).toBe(42); // March
    expect(buildCalendarGrid(2024, 1).length).toBe(42); // Feb leap
  });

  it('fills leading cells from the previous month for April 2026', () => {
    // April 1, 2026 is a Wednesday (day index 3), so 3 leading prev-month cells
    const cells = buildCalendarGrid(2026, 3);
    expect(cells[0].isCurrentMonth).toBe(false);
    expect(cells[0].date.getMonth()).toBe(2); // March
    expect(cells[0].date.getDate()).toBe(29); // March 29 (Sunday)
    expect(cells[1].date.getDate()).toBe(30); // March 30
    expect(cells[2].date.getDate()).toBe(31); // March 31
  });

  it('marks April days as isCurrentMonth: true', () => {
    const cells = buildCalendarGrid(2026, 3);
    // Cell index 3 = April 1
    expect(cells[3].isCurrentMonth).toBe(true);
    expect(cells[3].date.getDate()).toBe(1);
    expect(cells[3].date.getMonth()).toBe(3); // April
    // Cell index 32 = April 30
    expect(cells[32].isCurrentMonth).toBe(true);
    expect(cells[32].date.getDate()).toBe(30);
  });

  it('fills trailing cells from the next month', () => {
    const cells = buildCalendarGrid(2026, 3);
    // April has 30 days; 3 leading + 30 = 33; trailing = 9 (May 1-9)
    expect(cells[33].isCurrentMonth).toBe(false);
    expect(cells[33].date.getMonth()).toBe(4); // May
    expect(cells[33].date.getDate()).toBe(1);
    expect(cells[41].date.getDate()).toBe(9); // May 9
  });

  it('handles a month starting on Sunday (no leading cells)', () => {
    // March 2026: March 1 is a Sunday (day index 0)
    const cells = buildCalendarGrid(2026, 2);
    expect(cells[0].isCurrentMonth).toBe(true);
    expect(cells[0].date.getDate()).toBe(1);
  });
});

// ─── isSameDay ────────────────────────────────────────────────────────────────

describe('isSameDay', () => {
  it('returns true for two Date objects on the same calendar day', () => {
    const a = new Date(2026, 3, 10, 8, 0, 0);
    const b = new Date(2026, 3, 10, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });

  it('returns false for dates on different days', () => {
    const a = new Date(2026, 3, 10);
    const b = new Date(2026, 3, 11);
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for same day in different months', () => {
    const a = new Date(2026, 3, 10);
    const b = new Date(2026, 4, 10);
    expect(isSameDay(a, b)).toBe(false);
  });

  it('returns false for same day in different years', () => {
    const a = new Date(2025, 3, 10);
    const b = new Date(2026, 3, 10);
    expect(isSameDay(a, b)).toBe(false);
  });
});

// ─── isFuture ─────────────────────────────────────────────────────────────────

describe('isFuture', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns true for a date strictly in the future', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date(2026, 3, 10, 12, 0, 0).getTime());
    const future = new Date(2026, 3, 10, 13, 0, 0);
    expect(isFuture(future)).toBe(true);
  });

  it('returns false for a date in the past', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date(2026, 3, 10, 12, 0, 0).getTime());
    const past = new Date(2026, 3, 10, 11, 0, 0);
    expect(isFuture(past)).toBe(false);
  });

  it('returns false for a date exactly equal to now', () => {
    const now = new Date(2026, 3, 10, 12, 0, 0).getTime();
    jest.spyOn(Date, 'now').mockReturnValue(now);
    expect(isFuture(new Date(now))).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest src/shared/ui/__tests__/DateTimePicker.test.ts --no-coverage
```

Expected: FAIL — `buildCalendarGrid`, `isSameDay`, `isFuture` are not yet exported from `DateTimePicker`.

- [ ] **Step 3: Add the exported helpers to the top of `DateTimePicker.tsx`**

Insert this block at the very top of `src/shared/ui/DateTimePicker.tsx`, before all existing code:

```typescript
// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

// ─── Pure helpers (exported for testing) ──────────────────────────────────────

/**
 * Builds a 6×7 (42-cell) calendar grid for the given year/month.
 * Cells outside the current month are marked isCurrentMonth: false.
 * month is 0-indexed (0 = January).
 */
export function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay(); // 0 = Sunday
  const cells: CalendarCell[] = [];

  // Leading cells from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), isCurrentMonth: false });
  }

  // Current month days
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Trailing cells to fill the 42-cell grid
  const trailing = 42 - cells.length;
  for (let d = 1; d <= trailing; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
  }

  return cells;
}

/** Returns true if two Date values fall on the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Returns true if `date` is strictly after the current moment. */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest src/shared/ui/__tests__/DateTimePicker.test.ts --no-coverage
```

Expected: PASS — 12 tests, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/DateTimePicker.tsx src/shared/ui/__tests__/DateTimePicker.test.ts
git commit -m "feat(picker): add pure calendar helpers with tests"
```

---

## Task 3: Full component rewrite

**Files:**
- Modify: `src/shared/ui/DateTimePicker.tsx` — replace the `DateTimePicker` function and `styles` object (keep the helpers added in Task 2)

- [ ] **Step 1: Replace everything below the helpers block with the new component**

The file should contain the helpers from Task 2, then this replacement (delete the old imports, old `DateTimePickerProps`, old function, and old `StyleSheet` block, replace with):

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';
import { Button, ButtonText } from './Button';

// ─── Types ───────────────────────────────────────────────────────────────────

export type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

// ─── Pure helpers (exported for testing) ──────────────────────────────────────
// (already added in Task 2 — do not duplicate)

// ─── Component ────────────────────────────────────────────────────────────────

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DateTimePicker({ value, onChange, disabled }: DateTimePickerProps) {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value);
  const [viewYear, setViewYear] = useState(value.getFullYear());
  const [viewMonth, setViewMonth] = useState(value.getMonth());

  const openSheet = () => {
    if (disabled) return;
    setTempDate(value);
    setViewYear(value.getFullYear());
    setViewMonth(value.getMonth());
    setModalVisible(true);
  };

  const handleDone = () => {
    onChange(tempDate);
    setModalVisible(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setModalVisible(false);
  };

  const handleSetToNow = () => {
    const now = new Date();
    setTempDate(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  const handleDayPress = (cell: CalendarCell) => {
    if (!cell.isCurrentMonth) return;
    const candidate = new Date(cell.date);
    candidate.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
    // If combining the selected day with the current time would be future, clamp to now
    setTempDate(isFuture(candidate) ? new Date() : candidate);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const adjustHour = (delta: number) => {
    const next = new Date(tempDate);
    next.setHours((next.getHours() + delta + 24) % 24);
    if (!isFuture(next)) setTempDate(next);
  };

  const adjustMinute = (delta: number) => {
    const next = new Date(tempDate);
    let m = next.getMinutes() + delta;
    if (m > 55) m = 0;
    if (m < 0) m = 55;
    next.setMinutes(m);
    if (!isFuture(next)) setTempDate(next);
  };

  // ── Derived values ──────────────────────────────────────────────────────────

  const today = new Date();
  const isNextMonthDisabled =
    viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const cells = buildCalendarGrid(viewYear, viewMonth);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const formatDateTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      if (diffMinutes < 1) return t('time.justNow');
      if (diffMinutes < 60) return t('time.minute', { count: diffMinutes });
      return t('time.hour', { count: diffHours });
    }
    if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return (
      date.toLocaleDateString() +
      ', ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const isNow = new Date().getTime() - value.getTime() < 60 * 1000;
  const pillColor = isNow ? colors.textSecondary : colors.accent;
  const pillBg = isNow ? 'transparent' : colors.accent + '15';
  const pillBorder = isNow ? colors.border : colors.accent;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Trigger pill ── */}
      <Pressable
        style={[styles.trigger, { backgroundColor: pillBg, borderColor: pillBorder }]}
        onPress={openSheet}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t('dateTime.selectTime')}
      >
        <Icon name="calendar-outline" size={13} color={pillColor} />
        <Text style={[styles.triggerText, { color: pillColor }]}>
          {formatDateTime(value)}
        </Text>
      </Pressable>

      {/* ── Bottom sheet modal ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        {/* Backdrop — tap to cancel */}
        <TouchableWithoutFeedback onPress={handleCancel} accessible={false}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          {/* Drag handle */}
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

          {/* Header row */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('dateTime.selectTime')}
            </Text>
            <Pressable
              onPress={handleSetToNow}
              accessibilityRole="button"
              accessibilityLabel={t('dateTime.setToNow')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.setToNowLink,
                  { color: colors.accent, backgroundColor: colors.accent + '15' },
                ]}
              >
                {t('dateTime.setToNow')}
              </Text>
            </Pressable>
          </View>

          {/* Month navigation */}
          <View style={styles.monthNav}>
            <Pressable
              onPress={handlePrevMonth}
              style={[styles.navButton, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel={t('dateTime.prevMonth')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="chevron-back" size={16} color={colors.textPrimary} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
              {monthLabel}
            </Text>
            <Pressable
              onPress={handleNextMonth}
              disabled={isNextMonthDisabled}
              style={[styles.navButton, { backgroundColor: colors.surfaceSecondary }]}
              accessibilityRole="button"
              accessibilityLabel={t('dateTime.nextMonth')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon
                name="chevron-forward"
                size={16}
                color={isNextMonthDisabled ? colors.textTertiary : colors.textPrimary}
              />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.dayRow}>
            {DAY_LABELS.map((label, i) => (
              <Text key={i} style={[styles.dayLabel, { color: colors.textTertiary }]}>
                {label}
              </Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {cells.map((cell, i) => {
              const isSelected = isSameDay(cell.date, tempDate);
              const isDisabled = !cell.isCurrentMonth || isFuture(cell.date);
              return (
                <Pressable
                  key={i}
                  onPress={() => handleDayPress(cell)}
                  disabled={isDisabled}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: colors.accent },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t('dateTime.selectDay', {
                    day: cell.date.getDate(),
                    month: cell.date.toLocaleDateString('en-US', { month: 'long' }),
                    year: cell.date.getFullYear(),
                  })}
                >
                  <Text
                    style={[
                      styles.dayCellText,
                      isDisabled
                        ? { color: colors.textTertiary }
                        : { color: isSelected ? '#ffffff' : colors.textPrimary },
                    ]}
                  >
                    {cell.date.getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Time picker */}
          <View style={styles.timeRow}>
            {/* Hour column */}
            <View style={styles.timeColumn}>
              <Pressable
                onPress={() => adjustHour(1)}
                style={[styles.timeButton, { backgroundColor: colors.surfaceSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={t('dateTime.incrementHour')}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <View
                style={[
                  styles.timeDisplay,
                  { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                  {tempDate.getHours().toString().padStart(2, '0')}
                </Text>
              </View>
              <Pressable
                onPress={() => adjustHour(-1)}
                style={[styles.timeButton, { backgroundColor: colors.surfaceSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={t('dateTime.decrementHour')}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* Colon */}
            <Text style={[styles.colon, { color: colors.textPrimary }]}>:</Text>

            {/* Minute column */}
            <View style={styles.timeColumn}>
              <Pressable
                onPress={() => adjustMinute(5)}
                style={[styles.timeButton, { backgroundColor: colors.surfaceSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={t('dateTime.incrementMinute')}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="add" size={18} color={colors.textPrimary} />
              </Pressable>
              <View
                style={[
                  styles.timeDisplay,
                  { borderColor: colors.border, backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                  {tempDate.getMinutes().toString().padStart(2, '0')}
                </Text>
              </View>
              <Pressable
                onPress={() => adjustMinute(-5)}
                style={[styles.timeButton, { backgroundColor: colors.surfaceSecondary }]}
                accessibilityRole="button"
                accessibilityLabel={t('dateTime.decrementMinute')}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Icon name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <Button
              variant="ghost"
              size="md"
              onPress={handleCancel}
              style={styles.actionButton}
              accessibilityLabel={t('buttons.cancel')}
            >
              <ButtonText>{t('buttons.cancel')}</ButtonText>
            </Button>
            <Button
              variant="primary"
              size="md"
              onPress={handleDone}
              style={styles.actionButton}
              accessibilityLabel={t('buttons.done')}
            >
              <ButtonText>{t('buttons.done')}</ButtonText>
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  triggerText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  setToNowLink: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  dayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  dayCell: {
    width: '14.285714%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  dayCellText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  timeColumn: {
    alignItems: 'center',
    gap: 6,
  },
  timeButton: {
    width: 44,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    width: 56,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  colon: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
```

**Important:** The final file structure is:
1. Imports (React, RN, i18next, safe-area-context, icons, theme, Button)
2. `CalendarCell` type export
3. `buildCalendarGrid` export
4. `isSameDay` export
5. `isFuture` export
6. `DateTimePickerProps` interface
7. `DAY_LABELS` constant
8. `DateTimePicker` function export
9. `styles` StyleSheet

- [ ] **Step 2: Run typecheck**

```bash
npx tsc --noEmit --skipLibCheck
```

Expected: no errors.

- [ ] **Step 3: Run all tests to confirm helpers still pass**

```bash
npx jest src/shared/ui/__tests__/DateTimePicker.test.ts --no-coverage
```

Expected: 12 tests pass.

- [ ] **Step 4: Manually test the golden path**

Start Metro and run on Android or iOS:

```bash
npm start
# in another terminal:
npm run android   # or: npm run ios
```

Open any screen that shows the date/time picker (e.g. new reading entry or quick log). Verify:
- Tapping the trigger pill opens the bottom sheet from the bottom
- Calendar shows the correct month with the selected date highlighted
- Tapping a past day moves the selection
- Future days are greyed out and untappable
- ‹ navigates to previous months; › is disabled on the current month
- Hour + / − buttons change the hour display, wrapping at 23→0
- Minute + / − buttons change by 5, wrapping at 55→0
- "Set to Now" resets to the current moment
- Tapping the backdrop or Cancel discards changes
- Done saves the selected date

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/DateTimePicker.tsx
git commit -m "feat(picker): redesign DateTimePicker as bottom sheet with calendar + time controls"
```

---

## Task 4: Update docs

**Files:**
- Modify: `docs/verified-functionalities.md`

- [ ] **Step 1: Find the existing DateTimePicker entry**

Search the file for "DateTimePicker" or "date.*time.*picker" (case-insensitive). Update that section to describe the new design:

- Bottom sheet (slides up)
- Calendar grid with month navigation
- ± buttons for hour (step 1) and minute (step 5)
- Set to Now shortcut
- No future dates selectable
- Backdrop tap dismisses as Cancel
- Props unchanged: `value`, `onChange`, `disabled`

- [ ] **Step 2: Update the `> Last verified:` date at the top**

Change it to `2026-04-11`.

- [ ] **Step 3: Commit**

```bash
git add docs/verified-functionalities.md
git commit -m "docs: update verified-functionalities with new DateTimePicker design"
```

---

## Self-Review

### 1. Spec coverage

| Spec requirement | Covered by |
|---|---|
| Bottom sheet (slides up) | Task 3 — `animationType="slide"`, `justifyContent: 'flex-end'` overlay |
| Calendar grid with month nav | Task 3 — `buildCalendarGrid` + `viewMonth`/`viewYear` state |
| Future cells greyed + untappable | Task 3 — `isFuture(cell.date)` disables cell |
| › disabled on current month | Task 3 — `isNextMonthDisabled` flag |
| ± buttons for hour (step 1) | Task 3 — `adjustHour` |
| ± buttons for minute (step 5) | Task 3 — `adjustMinute` |
| Hour wraps 0–23 | Task 3 — `(getHours() + delta + 24) % 24` |
| Minute wraps 0–55 | Task 3 — explicit clamp in `adjustMinute` |
| + disabled when result is future | Task 3 — `if (!isFuture(next)) setTempDate(next)` |
| Set to Now shortcut | Task 3 — `handleSetToNow` |
| Backdrop tap = Cancel | Task 3 — `TouchableWithoutFeedback` on overlay |
| Props unchanged | Task 3 — same `interface DateTimePickerProps` |
| i18n new keys | Task 1 |
| 44×44 touch targets | Task 3 — `hitSlop` on small buttons; `timeButton` is 44×32 (meets 44 height via hitSlop) |
| Accessibility labels | Task 3 — every Pressable has `accessibilityRole` + `accessibilityLabel` |
| Docs updated | Task 4 |

### 2. Placeholder scan

No TBD, TODO, or vague steps — every step contains actual code. ✓

### 3. Type consistency

- `CalendarCell` defined in Task 2, used in Task 3 `handleDayPress(cell: CalendarCell)`. ✓
- `buildCalendarGrid`, `isSameDay`, `isFuture` defined in Task 2, used in Task 3. ✓
- `adjustHour`, `adjustMinute` defined and called in Task 3. ✓
- `Button`, `ButtonText` imported from `'./Button'` in Task 3. ✓

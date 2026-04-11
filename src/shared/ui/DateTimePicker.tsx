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

// ─── Component ────────────────────────────────────────────────────────────────

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
        <View style={styles.modalContainer}>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
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

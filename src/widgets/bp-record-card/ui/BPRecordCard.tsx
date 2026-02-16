import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { BPRecord } from '../../../shared/api';
import {
  classifyBP,
  getBPCategoryLabel,
} from '../../../entities/blood-pressure';
import { formatDateTime, getRelativeTime, formatTimeSplit, useSettingsStore, getTimeWindow } from '../../../shared/lib';
import type { TimeWindow } from '../../../shared/lib';
import { useTheme } from '../../../shared/lib/use-theme';
import { BP_COLORS_LIGHT, BP_COLORS_DARK, FONTS } from '../../../shared/config/theme';

const WINDOW_ICONS: Record<TimeWindow, string> = {
  morning: 'sunny-outline',
  day: 'partly-sunny-outline',
  evening: 'cloudy-night-outline',
  night: 'moon-outline',
};

interface BPRecordCardProps {
  record: BPRecord;
  variant?: 'full' | 'compact';
  isMorningSurge?: boolean;
}

export function BPRecordCard({ record, variant = 'full', isMorningSurge }: BPRecordCardProps) {
  const { t } = useTranslation('common');
  const { colors, isDark, fontScale, typography } = useTheme();
  const { guideline } = useSettingsStore();
  const category = classifyBP(record.systolic, record.diastolic, guideline);
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const categoryColor = bpColors[category];
  const categoryLabel = getBPCategoryLabel(category);
  const timeWindow = getTimeWindow(record.timestamp);
  const windowIcon = WINDOW_ICONS[timeWindow];

  // Compact variant for History page
  if (variant === 'compact') {
    const timeSplit = formatTimeSplit(record.timestamp);

    return (
      <Animated.View entering={FadeInRight.duration(300)}>
        <View
          style={[
            compactStyles.card,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
              shadowOpacity: colors.shadowOpacity,
            },
          ]}
        >
          {/* Time Column */}
          <View style={compactStyles.timeColumn}>
            <Text style={[compactStyles.time, { color: colors.textPrimary, fontSize: typography.md }]}>
              {timeSplit.time}
            </Text>
            <Text style={[compactStyles.period, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {timeSplit.period}
            </Text>
          </View>

          {/* Divider */}
          <View style={[compactStyles.divider, { backgroundColor: colors.borderLight }]} />

          {/* BP Value */}
          <View style={compactStyles.valueColumn}>
            <Text style={[compactStyles.bpValue, { color: colors.textPrimary, fontSize: typography.xl }]}>
              {record.systolic}/{record.diastolic}
            </Text>
            <Text style={[compactStyles.unit, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {t('units.mmhg')}
            </Text>
          </View>

          {/* Time-window icon */}
          <View style={[compactStyles.windowPill, { backgroundColor: colors.surfaceSecondary }]}>
            <Icon name={windowIcon} size={11} color={colors.textTertiary} />
          </View>

          {/* Category Badge */}
          <View style={[compactStyles.badge, { backgroundColor: categoryColor + '20' }]}>
            <Text style={[compactStyles.badgeText, { color: categoryColor, fontSize: typography.xs }]}>
              {categoryLabel}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  // Full variant (original design)
  const locationLabels: Record<string, string> = {
    left_arm: t('location.leftArm'),
    right_arm: t('location.rightArm'),
    left_wrist: t('location.leftWrist'),
    right_wrist: t('location.rightWrist'),
  };

  const postureLabels: Record<string, string> = {
    sitting: t('posture.sitting'),
    standing: t('posture.standing'),
    lying: t('posture.lying'),
  };

  return (
    <Animated.View entering={FadeInRight.duration(400)}>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderLeftColor: categoryColor,
            shadowColor: colors.shadow,
            shadowOpacity: colors.shadowOpacity,
          },
        ]}
        activeOpacity={0.95}
      >
        <View style={styles.header}>
          {/* BP Values */}
          <View style={styles.valuesRow}>
            <View style={[styles.iconCircle, { backgroundColor: categoryColor + '15' }]}>
              <Icon name="heart" size={20} color={categoryColor} />
            </View>
            <View style={styles.valuesColumn}>
              <View style={styles.bpValuesRow}>
                <Text style={[styles.valueTextLarge, { color: categoryColor, fontSize: Math.round(26 * fontScale) }]}>
                  {record.systolic}
                </Text>
                <Text style={[styles.separator, { color: colors.textTertiary, fontSize: typography.lg }]}>/</Text>
                <Text style={[styles.valueTextLarge, { color: categoryColor, fontSize: Math.round(26 * fontScale) }]}>
                  {record.diastolic}
                </Text>
                <Text style={[styles.unit, { color: colors.textSecondary, fontSize: typography.xs }]}>{t('units.mmhg')}</Text>
              </View>
              <Text style={[styles.timeText, { color: colors.textTertiary, fontSize: typography.xs }]}>
                {getRelativeTime(record.timestamp)}
              </Text>
            </View>
          </View>

          {/* Category Badge */}
          <View
            style={[styles.badge, { backgroundColor: categoryColor + '15' }]}
          >
            <View style={[styles.badgeDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.badgeText, { color: categoryColor, fontSize: typography.xs }]}>{categoryLabel}</Text>
          </View>
        </View>

        {/* Pulse and Metadata Row */}
        <View style={styles.detailsRow}>
          {record.pulse && (
            <View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
              <Icon name="pulse" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                {record.pulse} {t('units.bpm')}
              </Text>
            </View>
          )}
          <View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
            <Icon name="body-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {locationLabels[record.location] || record.location}
            </Text>
          </View>
          <View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
            <Icon name="walk-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {postureLabels[record.posture] || record.posture}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Icon name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.timestamp, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {formatDateTime(record.timestamp)}
          </Text>
        </View>

        {/* Time Window + optional Surge badges */}
        <View style={styles.windowRow}>
          <View style={[styles.windowChip, { backgroundColor: colors.surfaceSecondary }]}>
            <Icon name={windowIcon} size={11} color={colors.textSecondary} />
            <Text style={[styles.windowChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {t(('timeWindow.' + timeWindow) as any)}
            </Text>
          </View>
          {isMorningSurge && (
            <View style={[styles.surgeChip, { backgroundColor: colors.surgeBg }]}>
              <Icon name="trending-up-outline" size={11} color={colors.surgeColor} />
              <Text style={[styles.surgeChipText, { color: colors.surgeColor, fontSize: typography.xs }]}>
                {t('morningSurge')}
              </Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {record.notes && (
          <View style={[styles.notesContainer, { borderTopColor: colors.borderLight }]}>
            <Icon name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.notesText, { color: colors.textSecondary, fontSize: typography.sm }]}>{record.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Compact variant styles (History page)
const compactStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  timeColumn: {
    width: 56,
    alignItems: 'center',
  },
  time: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  period: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  valueColumn: {
    flex: 1,
  },
  bpValue: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  windowPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
});

// Full variant styles (original)
const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuesColumn: {
    justifyContent: 'center',
  },
  bpValuesRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueTextLarge: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  separator: {
    fontFamily: FONTS.regular,
    marginHorizontal: 3,
  },
  unit: {
    fontFamily: FONTS.regular,
    marginLeft: 4,
  },
  timeText: {
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailChipText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontFamily: FONTS.regular,
  },
  windowRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  windowChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  windowChipText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  surgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  surgeChipText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  notesContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  notesText: {
    flex: 1,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
});

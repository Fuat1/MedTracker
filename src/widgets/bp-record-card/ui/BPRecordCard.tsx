import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import type { BPRecord } from '../../../shared/api';
import {
  classifyBP,
  getBPCategoryLabel,
  calculatePulsePressure,
  calculateMAP,
} from '../../../entities/blood-pressure';
import { LIFESTYLE_TAGS } from '../../../entities/lifestyle-tag';
import { useCustomTags } from '../../../features/manage-tags';
import { isCustomTagKey, getCustomTagId } from '../../../shared/types/custom-tag';
import type { TagKey } from '../../../shared/api/bp-tags-repository';
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

// Icons for BP categories (used in senior mode compact cards)
const CATEGORY_ICONS: Record<string, string> = {
  normal: 'checkmark-circle',
  elevated: 'arrow-up-circle',
  stage_1: 'warning',
  stage_2: 'alert-circle',
  crisis: 'flash',
};

interface BPRecordCardProps {
  record: BPRecord;
  variant?: 'full' | 'compact';
  isMorningSurge?: boolean;
  tags?: TagKey[];
  /** Called when the PP info icon is tapped; receives the calculated PP value */
  onPPPress?: (value: number) => void;
  /** Called when the MAP info icon is tapped; receives the calculated MAP value */
  onMAPPress?: (value: number) => void;
  /** Called when the card itself is tapped (compact variant only) */
  onPress?: () => void;
}

export function BPRecordCard({ record, variant = 'full', isMorningSurge, tags, onPPPress, onMAPPress, onPress }: BPRecordCardProps) {
  const { t } = useTranslation('common');
  const { colors, isDark, fontScale, typography } = useTheme();
  const { guideline } = useSettingsStore();
  const category = classifyBP(record.systolic, record.diastolic, guideline);
  const { data: customTags = [] } = useCustomTags();

  const resolveTag = (tagKey: TagKey): { icon: string; label: string } | null => {
    if (isCustomTagKey(tagKey)) {
      const id = getCustomTagId(tagKey);
      const ct = customTags.find(c => c.id === id);
      return ct ? { icon: ct.icon, label: ct.label } : null;
    }
    const meta = LIFESTYLE_TAGS.find(m => m.key === tagKey);
    return meta ? { icon: meta.icon, label: t(meta.labelKey as any) } : null;
  };
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const categoryColor = bpColors[category];
  const categoryLabel = getBPCategoryLabel(category);
  const timeWindow = getTimeWindow(record.timestamp);
  const windowIcon = WINDOW_ICONS[timeWindow];
  const ppValue = calculatePulsePressure(record.systolic, record.diastolic);
  const mapValue = calculateMAP(record.systolic, record.diastolic);

  // Compact variant for History page
  if (variant === 'compact') {
    const timeSplit = formatTimeSplit(record.timestamp);

    return (
      <Animated.View entering={FadeInRight.duration(300)}>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : undefined}
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
          <View style={[compactStyles.timeColumn, { width: Math.round(56 * fontScale) }]}>
            <Text
              style={[compactStyles.time, { color: colors.textPrimary, fontSize: typography.md }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {timeSplit.time}
            </Text>
            <Text
              style={[compactStyles.period, { color: colors.textTertiary, fontSize: typography.xs }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {timeSplit.period}
            </Text>
          </View>

          {/* Divider */}
          <View style={[compactStyles.divider, { backgroundColor: colors.borderLight, height: Math.round(32 * fontScale) }]} />

          {/* BP Value */}
          <View style={compactStyles.valueColumn}>
            <Text
              style={[compactStyles.bpValue, { color: colors.textPrimary, fontSize: typography.xl }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {record.systolic}/{record.diastolic}
            </Text>
            <Text
              style={[compactStyles.unit, { color: colors.textTertiary, fontSize: typography.xs }]}
              numberOfLines={1}
            >
              {t('units.mmhg')}
            </Text>

            {/* PP / MAP derived metrics row */}
            {(onPPPress || onMAPPress) && (
              <View style={compactStyles.derivedRow}>
                {onPPPress && (
                  <Pressable
                    style={compactStyles.derivedBtn}
                    onPress={() => onPPPress(ppValue)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`PP ${ppValue} mmHg, more info`}
                  >
                    <Text style={[compactStyles.derivedLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
                      PP: {ppValue}
                    </Text>
                    <Icon name="information-circle-outline" size={11} color={colors.textTertiary} />
                  </Pressable>
                )}
                {onPPPress && onMAPPress && (
                  <Text style={[compactStyles.derivedDot, { color: colors.borderLight }]}>·</Text>
                )}
                {onMAPPress && (
                  <Pressable
                    style={compactStyles.derivedBtn}
                    onPress={() => onMAPPress(mapValue)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    accessibilityRole="button"
                    accessibilityLabel={`MAP ${mapValue} mmHg, more info`}
                  >
                    <Text style={[compactStyles.derivedLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
                      MAP: {mapValue}
                    </Text>
                    <Icon name="information-circle-outline" size={11} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Time-window icon */}
          <View style={[compactStyles.windowPill, { backgroundColor: colors.surfaceSecondary }]}>
            <Icon name={windowIcon} size={11} color={colors.textTertiary} />
          </View>

          {/* Tag icons (max 3 + overflow) */}
          {tags && tags.length > 0 && (
            <View style={compactStyles.tagIcons}>
              {tags.slice(0, 3).map(tag => {
                const display = resolveTag(tag);
                return display ? (
                  <Icon key={tag} name={display.icon} size={12} color={colors.textTertiary} />
                ) : null;
              })}
              {tags.length > 3 && (
                <Text style={[compactStyles.tagOverflow, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  +{tags.length - 3}
                </Text>
              )}
            </View>
          )}

          {/* Category Badge — icon-only in senior mode to save space */}
          {fontScale > 1 ? (
            <View
              style={[compactStyles.iconBadge, { backgroundColor: categoryColor + '20' }]}
              accessibilityRole="text"
              accessibilityLabel={categoryLabel}
            >
              <Icon
                name={CATEGORY_ICONS[category] || 'help-circle'}
                size={20}
                color={categoryColor}
              />
            </View>
          ) : (
            <View style={[compactStyles.badge, { backgroundColor: categoryColor + '20' }]}>
              <Text
                style={[compactStyles.badgeText, { color: categoryColor, fontSize: typography.xs }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {categoryLabel}
              </Text>
            </View>
          )}
        </Pressable>
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
          {tags && tags.map(tag => {
            const display = resolveTag(tag);
            if (!display) return null;
            return (
              <View
                key={tag}
                style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}
              >
                <Icon name={display.icon} size={14} color={colors.textSecondary} />
                <Text style={[styles.detailChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                  {display.label}
                </Text>
              </View>
            );
          })}
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 6,
    flexShrink: 1,
    maxWidth: 100,
  },
  badgeText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  windowPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  tagIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginRight: 4,
  },
  tagOverflow: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  derivedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  derivedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  derivedLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  derivedDot: {
    fontFamily: FONTS.regular,
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

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
import { formatDateTime, getRelativeTime } from '../../../shared/lib';
import { useTheme } from '../../../shared/lib/use-theme';
import { BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';

interface BPRecordCardProps {
  record: BPRecord;
}

export function BPRecordCard({ record }: BPRecordCardProps) {
  const { t } = useTranslation('common');
  const { colors, isDark } = useTheme();
  const category = classifyBP(record.systolic, record.diastolic);
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const categoryColor = bpColors[category];
  const categoryLabel = getBPCategoryLabel(category);

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
                <Text style={[styles.valueTextLarge, { color: categoryColor }]}>
                  {record.systolic}
                </Text>
                <Text style={[styles.separator, { color: colors.textTertiary }]}>/</Text>
                <Text style={[styles.valueTextLarge, { color: categoryColor }]}>
                  {record.diastolic}
                </Text>
                <Text style={[styles.unit, { color: colors.textSecondary }]}>{t('units.mmhg')}</Text>
              </View>
              <Text style={[styles.timeText, { color: colors.textTertiary }]}>
                {getRelativeTime(record.timestamp)}
              </Text>
            </View>
          </View>

          {/* Category Badge */}
          <View
            style={[styles.badge, { backgroundColor: categoryColor + '15' }]}
          >
            <View style={[styles.badgeDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.badgeText, { color: categoryColor }]}>{categoryLabel}</Text>
          </View>
        </View>

        {/* Pulse and Metadata Row */}
        <View style={styles.detailsRow}>
          {record.pulse && (
            <View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
              <Icon name="pulse" size={14} color={colors.textSecondary} />
              <Text style={[styles.detailChipText, { color: colors.textSecondary }]}>
                {record.pulse} {t('units.bpm')}
              </Text>
            </View>
          )}
          <View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
            <Icon name="body-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailChipText, { color: colors.textSecondary }]}>
              {locationLabels[record.location] || record.location}
            </Text>
          </View>
          <View style={[styles.detailChip, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderLight }]}>
            <Icon name="walk-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.detailChipText, { color: colors.textSecondary }]}>
              {postureLabels[record.posture] || record.posture}
            </Text>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Icon name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {formatDateTime(record.timestamp)}
          </Text>
        </View>

        {/* Notes */}
        {record.notes && (
          <View style={[styles.notesContainer, { borderTopColor: colors.borderLight }]}>
            <Icon name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{record.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

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
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  separator: {
    fontSize: 18,
    marginHorizontal: 3,
  },
  unit: {
    fontSize: 12,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '500',
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
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
    fontSize: 13,
    lineHeight: 18,
  },
});

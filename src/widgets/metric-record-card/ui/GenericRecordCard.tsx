/**
 * GenericRecordCard
 *
 * Data-driven record card for any MetricConfig.
 * Reads field values via config.domainToFieldValues(), classifies via
 * useMetricClassification(), and renders a compact or full card.
 *
 * BP uses BPRecordCard as an override (registered via bpComponents).
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useMetricClassification } from '../../../entities/health-metric';
import { formatDateTime, getRelativeTime } from '../../../shared/lib';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import type { MetricConfig } from '../../../shared/config/metric-types';

interface GenericRecordCardProps<TRecord> {
  record: TRecord;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>;
  variant?: 'full' | 'compact';
  tags?: string[];
  onPress?: () => void;
}

export function GenericRecordCard<TRecord extends { id: string; timestamp: number }>({
  record,
  config,
  variant = 'full',
  onPress,
}: GenericRecordCardProps<TRecord>) {
  const { colors, typography, fontScale } = useTheme();
  const values = config.domainToFieldValues(record);
  const { categoryColor, categoryLabel } = useMetricClassification(config, values);

  const primaryFields = config.fields.slice(0, 2);

  const primaryDisplay = primaryFields
    .map(f => {
      const v = values[f.key as keyof typeof values];
      if (v === undefined || v === null) return null;
      return `${v}${f.unit ? '\u202f' + f.unit : ''}`;
    })
    .filter(Boolean)
    .join(' / ');

  if (variant === 'compact') {
    return (
      <Animated.View entering={FadeInRight.duration(300)}>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : undefined}
          style={[
            styles.compactCard,
            {
              backgroundColor: colors.surface,
              shadowColor: colors.shadow,
              shadowOpacity: colors.shadowOpacity,
            },
          ]}
        >
          <View style={styles.compactValues}>
            <Text
              style={[styles.compactPrimary, { color: colors.textPrimary, fontSize: typography.xl }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {primaryDisplay}
            </Text>
            <Text style={[styles.compactTime, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {getRelativeTime(record.timestamp)}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: categoryColor + '20' }]}>
            <Text
              style={[styles.badgeText, { color: categoryColor, fontSize: typography.xs }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {categoryLabel}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Full variant
  return (
    <Animated.View entering={FadeInRight.duration(400)}>
      <Pressable
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderLeftColor: categoryColor,
            shadowColor: colors.shadow,
            shadowOpacity: colors.shadowOpacity,
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
      >
        <View style={styles.header}>
          <View style={styles.valuesRow}>
            <View style={[styles.iconCircle, { backgroundColor: categoryColor + '15' }]}>
              <Icon name="stats-chart" size={20} color={categoryColor} />
            </View>
            <View>
              <Text
                style={[styles.primaryValue, { color: categoryColor, fontSize: Math.round(26 * fontScale) }]}
              >
                {primaryDisplay}
              </Text>
              <Text style={[styles.timeText, { color: colors.textTertiary, fontSize: typography.xs }]}>
                {getRelativeTime(record.timestamp)}
              </Text>
            </View>
          </View>

          <View style={[styles.badge, { backgroundColor: categoryColor + '15' }]}>
            <View style={[styles.badgeDot, { backgroundColor: categoryColor }]} />
            <Text style={[styles.badgeText, { color: categoryColor, fontSize: typography.xs }]}>
              {categoryLabel}
            </Text>
          </View>
        </View>

        {/* Additional fields row */}
        {config.fields.length > 2 && (
          <View style={styles.detailsRow}>
            {config.fields.slice(2).map(f => {
              const v = values[f.key as keyof typeof values];
              if (v === undefined || v === null) return null;
              return (
                <View key={f.key} style={[styles.chip, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.chipText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    {`${v}${f.unit ? '\u202f' + f.unit : ''}`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.timestampRow}>
          <Icon name="time-outline" size={12} color={colors.textTertiary} />
          <Text style={[styles.timestamp, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {formatDateTime(record.timestamp)}
          </Text>
        </View>
      </Pressable>
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
  primaryValue: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  chipText: {
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
  // Compact variant
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  compactValues: {
    flex: 1,
  },
  compactPrimary: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  compactTime: {
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { computeCircadianBreakdown, detectMorningSurge, useTheme } from '../../../shared/lib';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { computeTimeInRange } from '../../../entities/blood-pressure';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';
import { DonutChart, CircadianBreakdownBars } from '../../../shared/ui';
import type { DonutSegment, CircadianWindowData } from '../../../shared/ui';
import type { BPRecord } from '../../../shared/api/bp-repository';

interface CircadianCardProps {
  /** Period-filtered records — used for breakdown and time-in-range computation */
  records: BPRecord[];
  /** All unfiltered records — surge detection needs today's first morning reading */
  allRecords: BPRecord[];
}

export function CircadianCard({ records, allRecords }: CircadianCardProps) {
  const { t } = useTranslation('pages');
  const { t: tMedical } = useTranslation('medical');
  const { colors, isDark, typography } = useTheme();
  const guideline = useSettingsStore(state => state.guideline);
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const circadianBreakdown = useMemo(
    () => computeCircadianBreakdown(records),
    [records],
  );

  const timeInRange = useMemo(
    () => computeTimeInRange(records, guideline),
    [records, guideline],
  );

  const surgeResult = useMemo(
    () => detectMorningSurge(allRecords),
    [allRecords],
  );

  const donutSegments: DonutSegment[] = [
    { percent: timeInRange.overall.normal,   color: bpColors.normal,   label: t('analytics.zones.normal') },
    { percent: timeInRange.overall.elevated, color: bpColors.elevated, label: t('analytics.zones.elevated') },
    { percent: timeInRange.overall.stage1,   color: bpColors.stage_1,  label: tMedical('categories.stage1') },
    { percent: timeInRange.overall.stage2,   color: bpColors.stage_2,  label: tMedical('categories.stage2') },
    { percent: timeInRange.overall.crisis,   color: bpColors.crisis,   label: tMedical('categories.crisis') },
  ];

  const circadianWindows: CircadianWindowData[] = [
    { windowKey: 'morning', avg: circadianBreakdown.morningAvg, timeInRange: timeInRange.morning },
    { windowKey: 'day',     avg: circadianBreakdown.dayAvg,     timeInRange: timeInRange.day },
    { windowKey: 'evening', avg: circadianBreakdown.eveningAvg, timeInRange: timeInRange.evening },
    { windowKey: 'night',   avg: circadianBreakdown.nightAvg,   timeInRange: timeInRange.night },
  ];

  return (
    <Animated.View
      entering={FadeInUp.delay(250).duration(500)}
      style={[styles.container, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
    >
      <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
        {t('analytics.circadian.title')}
      </Text>

      {records.length < 4 ? (
        <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: typography.sm }]}>
          {t('analytics.circadian.noData')}
        </Text>
      ) : (
        <>
          {/* Donut Chart — time in range */}
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
            {t('analytics.circadian.timeInRange')}
          </Text>
          <DonutChart
            segments={donutSegments}
            size={140}
            centerLabel={`${timeInRange.overall.normal}%`}
            centerSubLabel={tMedical('categories.normal')}
          />

          {/* Per-window breakdown bars */}
          <CircadianBreakdownBars windows={circadianWindows} />

          {/* Morning surge alert badge (count: 1 since detectMorningSurge only tracks single event) */}
          {surgeResult.hasSurge && (
            <View style={[styles.surgeRow, { backgroundColor: colors.surgeBg }]}>
              <Icon name="trending-up-outline" size={14} color={colors.surgeColor} />
              <Text style={[styles.surgeText, { color: colors.surgeColor, fontSize: typography.sm }]}>
                {t('analytics.circadian.morningSurge', { count: 1 })}
              </Text>
            </View>
          )}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 8,
  },
  noDataText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 8,
  },
  surgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  surgeText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});

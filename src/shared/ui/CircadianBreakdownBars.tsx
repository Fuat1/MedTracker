import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../config/theme';
import { useTranslation } from 'react-i18next';
import type { CircadianAvg } from '../lib/circadian-utils';
import type { TimeInRangeWindow } from '../lib/circadian-utils';

export interface CircadianWindowData {
  windowKey: 'morning' | 'day' | 'evening' | 'night';
  avg: CircadianAvg | null;
  timeInRange: TimeInRangeWindow;
}

interface CircadianBreakdownBarsProps {
  windows: CircadianWindowData[];
}

const WINDOW_ICONS: Record<string, string> = {
  morning: 'sunny-outline',
  day:     'partly-sunny-outline',
  evening: 'cloudy-night-outline',
  night:   'moon-outline',
};

export function CircadianBreakdownBars({ windows }: CircadianBreakdownBarsProps) {
  const { colors, isDark, typography } = useTheme();
  const { t } = useTranslation('common');
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const xAxisLabelTextStyle = useMemo(() => ({
    color: colors.textSecondary,
    fontSize: typography.xs - 2,
    fontFamily: FONTS.medium,
    fontWeight: '500' as const,
  }), [colors.textSecondary, typography.xs]);

  // Build stacked bar data for gifted-charts
  const stackData = windows.map(w => {
    const hasData = w.avg !== null;
    const totalPercent = hasData
      ? w.timeInRange.normal + w.timeInRange.elevated + w.timeInRange.stage1 + w.timeInRange.stage2 + w.timeInRange.crisis
      : 0;

    return {
      stacks: hasData && totalPercent > 0
        ? [
            { value: w.timeInRange.normal,   color: bpColors.normal },
            { value: w.timeInRange.elevated, color: bpColors.elevated },
            { value: w.timeInRange.stage1,   color: bpColors.stage_1 },
            { value: w.timeInRange.stage2,   color: bpColors.stage_2 },
            { value: w.timeInRange.crisis,   color: bpColors.crisis },
          ].filter(s => s.value > 0)
        : [{ value: 100, color: colors.surfaceSecondary }],
      label: t(`timeWindow.${w.windowKey}` as any),
    };
  });

  return (
    <View style={styles.container}>
      {/* Icon labels on the left */}
      <View style={styles.labelsColumn}>
        {windows.map(w => (
          <View key={w.windowKey} style={styles.labelRow}>
            <Icon name={WINDOW_ICONS[w.windowKey]} size={14} color={colors.textSecondary} />
          </View>
        ))}
      </View>

      {/* Stacked bars */}
      <View style={styles.chartColumn}>
        <BarChart
          stackData={stackData}
          height={100}
          barWidth={16}
          spacing={18}
          stackBorderRadius={3}
          hideRules
          hideYAxisText
          hideAxesAndRules
          isAnimated
          animationDuration={600}
          barBorderRadius={3}
          noOfSections={4}
          maxValue={100}
          backgroundColor="transparent"
          yAxisColor="transparent"
          xAxisColor="transparent"
          xAxisLabelTextStyle={xAxisLabelTextStyle}
        />
      </View>

      {/* Average values on the right */}
      <View style={styles.avgColumn}>
        {windows.map(w => (
          <Text key={w.windowKey} style={[styles.avgText, { color: colors.textPrimary, fontSize: typography.xs }]}>
            {w.avg ? `${w.avg.systolic}/${w.avg.diastolic}` : '--'}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelsColumn: {
    gap: 18,
    paddingTop: 4,
  },
  labelRow: {
    height: 16,
    justifyContent: 'center',
  },
  chartColumn: {
    flex: 1,
  },
  avgColumn: {
    gap: 18,
    paddingTop: 4,
    minWidth: 64,
    alignItems: 'flex-end',
  },
  avgText: {
    height: 16,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textAlign: 'right',
  },
});

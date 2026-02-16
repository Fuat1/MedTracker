import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

interface DataPoint {
  systolic: number;
  diastolic: number;
}

interface LineChartProps {
  data: DataPoint[];
  width: number;
  height?: number;
  emptyText?: string;
}

export function LineChart({
  data,
  width,
  height = 160,
  emptyText = 'No data yet',
}: LineChartProps) {
  const { colors, typography, fontScale } = useTheme();

  // Transform data for gifted-charts (safe with empty/null data)
  const chartData = useMemo(
    () => (data || []).map(d => ({ value: d.systolic })),
    [data],
  );

  // Tooltip showing sys/dia values
  const renderTooltip = useMemo(() => {
    return (_items: Array<{ value: number }>, index: number) => {
      const d = data[index];
      if (!d) return null;
      return (
        <View style={[tooltipStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[tooltipStyles.value, { color: colors.chartLine }]}>
            {d.systolic}/{d.diastolic}
          </Text>
        </View>
      );
    };
  }, [data, colors]);

  // Early return AFTER all hooks
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>{emptyText}</Text>
      </View>
    );
  }

  // Compute Y range using 20 mmHg steps for clean integer labels
  const allValues = data.flatMap(d => [d.systolic, d.diastolic]);
  const step = 20;
  const minVal = Math.floor((Math.min(...allValues) - 10) / step) * step;
  const maxVal = Math.ceil((Math.max(...allValues) + 10) / step) * step;
  const chartNoOfSections = Math.max(2, (maxVal - minVal) / step);
  const yAxisLabels = Array.from({ length: chartNoOfSections + 1 }, (_, i) =>
    String(minVal + i * step),
  );

  const chartInnerWidth = width - 30;
  const idealSpacing = data.length <= 1
    ? 0
    : Math.floor(chartInnerWidth / (data.length - 1));
  const minSpacing = 50 * fontScale;
  const spacing = Math.max(minSpacing, Math.min(70, idealSpacing));
  const needsScroll = data.length > 1 && (data.length - 1) * spacing > chartInnerWidth;

  return (
    <GiftedLineChart
      data={chartData}
      height={height}
      width={chartInnerWidth}
      curved
      isAnimated
      animationDuration={600}
      areaChart
      startFillColor={colors.chartLine + '1F'}
      endFillColor={colors.chartLine + '00'}
      startOpacity={0.12}
      endOpacity={0}

      maxValue={maxVal}
      yAxisOffset={minVal}
      noOfSections={chartNoOfSections}
      yAxisLabelTexts={yAxisLabels}

      color={colors.chartLine}
      thickness={2.5}
      dataPointsColor={colors.chartLine}
      dataPointsRadius={5}

      rulesType="dashed"
      rulesColor={colors.border + '60'}
      dashWidth={4}
      dashGap={4}

      yAxisColor="transparent"
      yAxisTextStyle={{
        color: colors.textSecondary,
        fontSize: typography.xs,
        fontFamily: FONTS.regular,
      }}

      xAxisColor={colors.border}

      spacing={spacing}
      initialSpacing={15}
      endSpacing={15}

      disableScroll={!needsScroll}
      scrollToEnd={false}
      showScrollIndicator={false}

      backgroundColor="transparent"

      pointerConfig={{
        pointerLabelComponent: renderTooltip,
        showPointerStrip: true,
        pointerStripColor: colors.textTertiary + '30',
        pointerStripWidth: 1,
        pointerColor: colors.chartLine,
        radius: 6,
        pointerLabelWidth: 90,
        pointerLabelHeight: 36,
        autoAdjustPointerLabelPosition: true,
        shiftPointerLabelX: -45,
        shiftPointerLabelY: -50,
      }}
    />
  );
}

const tooltipStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  value: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
  },
});

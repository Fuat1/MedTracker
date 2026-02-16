import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';
import { BP_THRESHOLDS } from '../config/bp-guidelines';

interface DataPoint {
  systolic: number;
  diastolic: number;
  pp?: number;
  map?: number;
}

interface BPTrendChartProps {
  data: DataPoint[];
  width: number;
  height?: number;
  emptyText?: string;
  showPP?: boolean;
  showMAP?: boolean;
  zoneLabels?: {
    normal: string;
    elevated: string;
    high: string;
  };
  legendLabels?: {
    systolic: string;
    diastolic: string;
    pp?: string;
    map?: string;
  };
  guidelineId?: string;
}

export function BPTrendChart({
  data,
  width,
  height = 220,
  emptyText = 'No data yet',
  showPP = false,
  showMAP = false,
  zoneLabels,
  legendLabels = { systolic: 'Systolic', diastolic: 'Diastolic', pp: 'PP', map: 'MAP' },
  guidelineId = 'aha_acc',
}: BPTrendChartProps) {
  const { colors, typography } = useTheme();

  const guideline = BP_THRESHOLDS[guidelineId] || BP_THRESHOLDS.aha_acc;
  const normalThreshold = guideline.normalBelow.systolic;
  const highThreshold = guideline.stage_2.systolic;

  // Y-axis range: extend down to 20 when PP is shown (PP values can be 20–80)
  const yAxisMin = showPP ? 20 : 60;
  const yAxisMax = 180;
  const yAxisStep = 20;
  const noOfSections = (yAxisMax - yAxisMin) / yAxisStep;
  const yAxisLabelTexts = useMemo(
    () => Array.from({ length: noOfSections + 1 }, (_, i) => String(yAxisMin + i * yAxisStep)),
    [yAxisMin, noOfSections, yAxisStep],
  );

  // Transform data for gifted-charts (safe with empty/null data)
  const systolicData = useMemo(
    () => (data || []).map(d => ({ value: d.systolic })),
    [data],
  );
  const diastolicData = useMemo(
    () => (data || []).map(d => ({ value: d.diastolic })),
    [data],
  );

  // Build datasets array: always systolic + diastolic, conditionally PP + MAP
  const datasets = useMemo(() => {
    const safeData = data || [];
    const sets: Array<{
      data: Array<{ value: number }>;
      color: string;
      thickness: number;
      dataPointsColor: string;
      dataPointsRadius: number;
      strokeDashArray?: number[];
      hideDataPoints?: boolean;
      startFillColor?: string;
      endFillColor?: string;
      startOpacity?: number;
      endOpacity?: number;
    }> = [
      {
        data: systolicData,
        color: colors.chartLine,
        thickness: 2.5,
        dataPointsColor: colors.chartLine,
        dataPointsRadius: 4,
        startFillColor: colors.chartLine + '1F',
        endFillColor: colors.chartLine + '00',
        startOpacity: 0.12,
        endOpacity: 0,
      },
      {
        data: diastolicData,
        color: colors.chartLineDiastolic,
        thickness: 2,
        dataPointsColor: colors.chartLineDiastolic,
        dataPointsRadius: 3,
        strokeDashArray: [6, 4],
        startOpacity: 0,
        endOpacity: 0,
      },
    ];

    if (showPP) {
      sets.push({
        data: safeData.map(d => ({ value: d.pp || 0 })),
        color: colors.ppColor,
        thickness: 2,
        dataPointsColor: colors.ppColor,
        dataPointsRadius: 3,
        strokeDashArray: [5, 3],
        startOpacity: 0,
        endOpacity: 0,
      });
    }

    if (showMAP) {
      sets.push({
        data: safeData.map(d => ({ value: d.map || 0 })),
        color: colors.mapColor,
        thickness: 2,
        dataPointsColor: colors.mapColor,
        dataPointsRadius: 3,
        strokeDashArray: [2, 3],
        startOpacity: 0,
        endOpacity: 0,
      });
    }

    return sets;
  }, [systolicData, diastolicData, data, showPP, showMAP, colors]);

  // Tooltip renderer
  const renderTooltip = useMemo(() => {
    return (items: Array<{ value: number }>) => {
      const sysVal = items[0]?.value;
      const diaVal = items[1]?.value;

      let ppIdx = -1;
      let mapIdx = -1;
      let idx = 2;
      if (showPP) { ppIdx = idx++; }
      if (showMAP) { mapIdx = idx; }

      return (
        <View style={[tooltipStyles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={tooltipStyles.row}>
            <View style={[tooltipStyles.dot, { backgroundColor: colors.chartLine }]} />
            <Text style={[tooltipStyles.label, { color: colors.textSecondary }]}>
              {legendLabels.systolic}
            </Text>
            <Text style={[tooltipStyles.value, { color: colors.chartLine }]}>
              {sysVal}
            </Text>
          </View>
          <View style={tooltipStyles.row}>
            <View style={[tooltipStyles.dot, { backgroundColor: colors.chartLineDiastolic }]} />
            <Text style={[tooltipStyles.label, { color: colors.textSecondary }]}>
              {legendLabels.diastolic}
            </Text>
            <Text style={[tooltipStyles.value, { color: colors.chartLineDiastolic }]}>
              {diaVal}
            </Text>
          </View>
          {ppIdx >= 0 && items[ppIdx] && (
            <View style={tooltipStyles.row}>
              <View style={[tooltipStyles.dot, { backgroundColor: colors.ppColor }]} />
              <Text style={[tooltipStyles.label, { color: colors.textSecondary }]}>
                {legendLabels.pp}
              </Text>
              <Text style={[tooltipStyles.value, { color: colors.ppColor }]}>
                {items[ppIdx].value}
              </Text>
            </View>
          )}
          {mapIdx >= 0 && items[mapIdx] && (
            <View style={tooltipStyles.row}>
              <View style={[tooltipStyles.dot, { backgroundColor: colors.mapColor }]} />
              <Text style={[tooltipStyles.label, { color: colors.textSecondary }]}>
                {legendLabels.map}
              </Text>
              <Text style={[tooltipStyles.value, { color: colors.mapColor }]}>
                {items[mapIdx].value}
              </Text>
            </View>
          )}
        </View>
      );
    };
  }, [showPP, showMAP, colors, legendLabels]);

  // Early return AFTER all hooks
  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>{emptyText}</Text>
      </View>
    );
  }

  // Calculate point spacing — comfortable for touch but scrollable when dense
  const chartInnerWidth = width - 40;
  const idealSpacing = data.length <= 1
    ? 0
    : Math.floor(chartInnerWidth / (data.length - 1));
  const spacing = Math.max(40, Math.min(60, idealSpacing));
  const needsScroll = data.length > 1 && (data.length - 1) * spacing > chartInnerWidth;

  return (
    <View>
      <GiftedLineChart
        dataSet={datasets}
        height={height}
        width={chartInnerWidth}
        areaChart
        curved
        isAnimated
        animationDuration={800}
        animateOnDataChange

        maxValue={yAxisMax}
        yAxisOffset={yAxisMin}
        noOfSections={noOfSections}
        yAxisLabelTexts={yAxisLabelTexts}

        rulesType="dashed"
        rulesColor={colors.border + '80'}
        dashWidth={4}
        dashGap={4}

        yAxisColor="transparent"
        yAxisTextStyle={{
          color: colors.textSecondary,
          fontSize: typography.xs,
          fontFamily: FONTS.regular,
        }}

        xAxisColor={colors.border}
        hideDataPoints={false}

        spacing={spacing}
        initialSpacing={15}
        endSpacing={15}

        disableScroll={!needsScroll}
        scrollToEnd={needsScroll}
        showScrollIndicator={false}

        backgroundColor="transparent"

        pointerConfig={{
          pointerLabelComponent: renderTooltip,
          showPointerStrip: true,
          pointerStripColor: colors.textTertiary + '40',
          pointerStripWidth: 1,
          pointerColor: colors.chartLine,
          radius: 5,
          pointerLabelWidth: 160,
          pointerLabelHeight: showPP || showMAP ? 110 : 70,
          autoAdjustPointerLabelPosition: true,
          shiftPointerLabelX: -80,
          shiftPointerLabelY: -90,
        }}

        showReferenceLine1
        referenceLine1Position={normalThreshold}
        referenceLine1Config={{
          color: colors.textTertiary + '50',
          dashWidth: 4,
          dashGap: 4,
          thickness: 1,
        }}

        showReferenceLine2
        referenceLine2Position={highThreshold}
        referenceLine2Config={{
          color: colors.error + '50',
          dashWidth: 4,
          dashGap: 4,
          thickness: 1,
        }}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.chartLine }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {legendLabels.systolic}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.chartLineDiastolic }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {legendLabels.diastolic}
          </Text>
        </View>
        {showPP && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.ppColor }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {legendLabels.pp}
            </Text>
          </View>
        )}
        {showMAP && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.mapColor }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {legendLabels.map}
            </Text>
          </View>
        )}
      </View>

      {/* Reference line labels */}
      {zoneLabels && (
        <View style={styles.referenceLabelRow}>
          <View style={[styles.refLabelChip, { backgroundColor: colors.chartZoneNormal }]}>
            <Text style={[styles.refLabelText, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {'< '}{normalThreshold} {zoneLabels.normal}
            </Text>
          </View>
          <View style={[styles.refLabelChip, { backgroundColor: colors.chartZoneHigh }]}>
            <Text style={[styles.refLabelText, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {'>= '}{highThreshold} {zoneLabels.high}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const tooltipStyles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  referenceLabelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 6,
  },
  refLabelChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  refLabelText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});

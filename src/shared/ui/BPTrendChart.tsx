import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart as GiftedLineChart } from 'react-native-gifted-charts';
import Svg, { Defs, Pattern, Rect, Line, Circle as SvgCircle } from 'react-native-svg';
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
  const { colors, typography, highContrast } = useTheme();

  const guideline = BP_THRESHOLDS[guidelineId] || BP_THRESHOLDS.aha_acc;
  const normalThreshold = guideline.normalBelow.systolic;
  const highThreshold = guideline.stage_2.systolic;

  // Y-axis range: extend down when derived metrics are shown
  // PP values ~20–80, MAP values ~55–110
  const yAxisMin = showPP ? 20 : showMAP ? 40 : 60;
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
        thickness: highContrast ? 3 : 2.5,
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
  }, [systolicData, diastolicData, data, showPP, showMAP, colors, highContrast]);

  // Tooltip renderer
  const renderTooltip = useMemo(() => {
    return (items: Array<{ value: number }>) => {
      const sysVal = items[0] ? items[0].value + yAxisMin : undefined;
      const diaVal = items[1] ? items[1].value + yAxisMin : undefined;

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
                {items[ppIdx].value + yAxisMin}
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
                {items[mapIdx].value + yAxisMin}
              </Text>
            </View>
          )}
        </View>
      );
    };
  }, [showPP, showMAP, colors, legendLabels, yAxisMin]);

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

  const renderHCOverlay = () => {
    if (!highContrast) return null;

    // Use the same width/height as the chart area
    const chartW = chartInnerWidth;
    const chartH = height;

    const yMin = 60;
    const yMax = 180;
    const yRange = yMax - yMin;
    const pixelsPerUnit = chartH / yRange;

    // Y positions (0 = top of chart)
    const stage1Y = chartH - (130 - yMin) * pixelsPerUnit;
    const stage2Y = chartH - (140 - yMin) * pixelsPerUnit;

    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width={chartW} height={chartH}>
          <Defs>
            <Pattern id="hatch" patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(45)">
              <Line x1={0} y1={0} x2={0} y2={8} stroke="#000" strokeWidth={1.5} opacity={0.25} />
            </Pattern>
            <Pattern id="dots" patternUnits="userSpaceOnUse" width={6} height={6}>
              <SvgCircle cx={3} cy={3} r={1.2} fill="#000" opacity={0.3} />
            </Pattern>
            <Pattern id="crosshatch" patternUnits="userSpaceOnUse" width={8} height={8}>
              <Line x1={0} y1={0} x2={8} y2={8} stroke="#000" strokeWidth={1.5} opacity={0.3} />
              <Line x1={8} y1={0} x2={0} y2={8} stroke="#000" strokeWidth={1.5} opacity={0.3} />
            </Pattern>
          </Defs>
          {stage1Y > stage2Y && (
            <Rect x={0} y={stage2Y} width={chartW} height={stage1Y - stage2Y} fill="url(#hatch)" />
          )}
          {stage2Y > 0 && (
            <Rect x={0} y={0} width={chartW} height={stage2Y} fill="url(#dots)" />
          )}
          <Rect x={0} y={0} width={chartW} height={Math.min(10, stage2Y)} fill="url(#crosshatch)" />
        </Svg>
      </View>
    );
  };
  const idealSpacing = data.length <= 1
    ? 0
    : Math.floor(chartInnerWidth / (data.length - 1));
  const spacing = Math.max(40, Math.min(60, idealSpacing));
  const needsScroll = data.length > 1 && (data.length - 1) * spacing > chartInnerWidth;

  return (
    <View>
      <View style={{ position: 'relative' }}>
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
          showScrollIndicator={needsScroll}
          nestedScrollEnabled={needsScroll}

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
        {renderHCOverlay()}
      </View>

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

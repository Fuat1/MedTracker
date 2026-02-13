import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

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
}

export function BPTrendChart({
  data,
  width,
  height = 220,
  emptyText = 'No data yet',
  showPP = false,
  showMAP = false,
  zoneLabels = { normal: 'Normal', elevated: 'Elevated', high: 'High' },
  legendLabels = { systolic: 'Systolic', diastolic: 'Diastolic', pp: 'PP', map: 'MAP' },
}: BPTrendChartProps) {
  const { colors } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{emptyText}</Text>
      </View>
    );
  }

  const PADDING_TOP = 12;
  const PADDING_BOTTOM = 40; // space for legend
  const PADDING_LEFT = 36;
  const PADDING_RIGHT = 60; // space for zone labels
  const chartWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const chartHeight = height - PADDING_TOP - PADDING_BOTTOM;

  // Fixed Y-axis range for BP (70-180 covers most readings)
  const Y_MIN = 70;
  const Y_MAX = 180;
  const Y_RANGE = Y_MAX - Y_MIN;

  // BP zone thresholds (AHA/ACC)
  const ZONE_NORMAL_MAX = 120;
  const ZONE_ELEVATED_MAX = 140;

  // Calculate point positions
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const getX = (index: number) =>
    PADDING_LEFT + (data.length > 1 ? index * stepX : chartWidth / 2);

  const getY = (value: number) => {
    const clamped = Math.max(Y_MIN, Math.min(Y_MAX, value));
    return PADDING_TOP + chartHeight - ((clamped - Y_MIN) / Y_RANGE) * chartHeight;
  };

  // Build SVG path
  const buildPath = (getValue: (d: DataPoint) => number) => {
    if (data.length === 1) return '';
    return data
      .map((d, i) => {
        const x = getX(i);
        const y = getY(getValue(d));
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const systolicPath = buildPath(d => d.systolic);
  const diastolicPath = buildPath(d => d.diastolic);
  const ppPath = showPP ? buildPath(d => d.pp || 0) : '';
  const mapPath = showMAP ? buildPath(d => d.map || 0) : '';

  // Zone Y positions
  const zoneNormalTop = getY(ZONE_NORMAL_MAX);
  const zoneNormalBottom = PADDING_TOP + chartHeight; // bottom of chart
  const zoneElevatedTop = getY(ZONE_ELEVATED_MAX);
  const zoneHighTop = PADDING_TOP;

  // Y-axis labels
  const yLabels = [80, 100, 120, 140, 160];

  const legendY = height - 14;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Background zones */}
        {/* Normal zone (bottom - green) */}
        <Rect
          x={PADDING_LEFT}
          y={zoneNormalTop}
          width={chartWidth}
          height={zoneNormalBottom - zoneNormalTop}
          fill={colors.chartZoneNormal}
          opacity={0.5}
        />
        {/* Elevated zone (middle - yellow) */}
        <Rect
          x={PADDING_LEFT}
          y={zoneElevatedTop}
          width={chartWidth}
          height={zoneNormalTop - zoneElevatedTop}
          fill={colors.chartZoneElevated}
          opacity={0.5}
        />
        {/* High zone (top - red) */}
        <Rect
          x={PADDING_LEFT}
          y={zoneHighTop}
          width={chartWidth}
          height={zoneElevatedTop - zoneHighTop}
          fill={colors.chartZoneHigh}
          opacity={0.5}
        />

        {/* Zone labels (right side) */}
        <SvgText
          x={PADDING_LEFT + chartWidth + 8}
          y={(zoneNormalTop + zoneNormalBottom) / 2 + 4}
          fontSize={10}
          fontFamily={FONTS.medium}
          fill={colors.textTertiary}
        >
          {zoneLabels.normal}
        </SvgText>
        <SvgText
          x={PADDING_LEFT + chartWidth + 8}
          y={(zoneElevatedTop + zoneNormalTop) / 2 + 4}
          fontSize={10}
          fontFamily={FONTS.medium}
          fill={colors.textTertiary}
        >
          {zoneLabels.elevated}
        </SvgText>
        <SvgText
          x={PADDING_LEFT + chartWidth + 8}
          y={(zoneHighTop + zoneElevatedTop) / 2 + 4}
          fontSize={10}
          fontFamily={FONTS.medium}
          fill={colors.textTertiary}
        >
          {zoneLabels.high}
        </SvgText>

        {/* Y-axis labels */}
        {yLabels.map(val => (
          <React.Fragment key={val}>
            <SvgText
              x={PADDING_LEFT - 8}
              y={getY(val) + 4}
              fontSize={10}
              fontFamily={FONTS.regular}
              fill={colors.textTertiary}
              textAnchor="end"
            >
              {val}
            </SvgText>
            <Line
              x1={PADDING_LEFT}
              y1={getY(val)}
              x2={PADDING_LEFT + chartWidth}
              y2={getY(val)}
              stroke={colors.border}
              strokeWidth={0.5}
              strokeDasharray="4,4"
            />
          </React.Fragment>
        ))}

        {/* Diastolic line (lighter, dashed) */}
        {data.length > 1 && (
          <Path
            d={diastolicPath}
            fill="none"
            stroke={colors.chartLineDiastolic}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6,4"
          />
        )}

        {/* MAP line (dotted, orange) */}
        {showMAP && data.length > 1 && (
          <Path
            d={mapPath}
            fill="none"
            stroke="#f97316"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="2,4"
          />
        )}

        {/* PP line (dash-dot, purple) */}
        {showPP && data.length > 1 && (
          <Path
            d={ppPath}
            fill="none"
            stroke="#a855f7"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="8,4,2,4"
          />
        )}

        {/* Systolic line (solid, primary) */}
        {data.length > 1 && (
          <Path
            d={systolicPath}
            fill="none"
            stroke={colors.chartLine}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Diastolic dots */}
        {data.map((d, i) => (
          <Circle
            key={`dia-${i}`}
            cx={getX(i)}
            cy={getY(d.diastolic)}
            r={3.5}
            fill={colors.chartDot}
            stroke={colors.chartLineDiastolic}
            strokeWidth={2}
          />
        ))}

        {/* MAP dots */}
        {showMAP && data.map((d, i) => (
          <Circle
            key={`map-${i}`}
            cx={getX(i)}
            cy={getY(d.map || 0)}
            r={3}
            fill={colors.chartDot}
            stroke="#f97316"
            strokeWidth={2}
          />
        ))}

        {/* PP dots */}
        {showPP && data.map((d, i) => (
          <Circle
            key={`pp-${i}`}
            cx={getX(i)}
            cy={getY(d.pp || 0)}
            r={3}
            fill={colors.chartDot}
            stroke="#a855f7"
            strokeWidth={2}
          />
        ))}

        {/* Systolic dots */}
        {data.map((d, i) => (
          <Circle
            key={`sys-${i}`}
            cx={getX(i)}
            cy={getY(d.systolic)}
            r={4}
            fill={colors.chartDot}
            stroke={colors.chartLine}
            strokeWidth={2.5}
          />
        ))}

        {/* Legend */}
        {/* Systolic legend */}
        <Circle cx={PADDING_LEFT + 8} cy={legendY} r={5} fill={colors.chartLine} />
        <SvgText
          x={PADDING_LEFT + 18}
          y={legendY + 4}
          fontSize={11}
          fontFamily={FONTS.medium}
          fill={colors.textSecondary}
        >
          {legendLabels.systolic}
        </SvgText>

        {/* Diastolic legend */}
        <Circle cx={PADDING_LEFT + 90} cy={legendY} r={5} fill={colors.chartLineDiastolic} />
        <SvgText
          x={PADDING_LEFT + 100}
          y={legendY + 4}
          fontSize={11}
          fontFamily={FONTS.medium}
          fill={colors.textSecondary}
        >
          {legendLabels.diastolic}
        </SvgText>

        {/* PP legend */}
        {showPP && (
          <>
            <Circle cx={PADDING_LEFT + 182} cy={legendY} r={5} fill="#a855f7" />
            <SvgText
              x={PADDING_LEFT + 192}
              y={legendY + 4}
              fontSize={11}
              fontFamily={FONTS.medium}
              fill={colors.textSecondary}
            >
              {legendLabels.pp}
            </SvgText>
          </>
        )}

        {/* MAP legend */}
        {showMAP && (
          <>
            <Circle cx={PADDING_LEFT + (showPP ? 232 : 182)} cy={legendY} r={5} fill="#f97316" />
            <SvgText
              x={PADDING_LEFT + (showPP ? 242 : 192)}
              y={legendY + 4}
              fontSize={11}
              fontFamily={FONTS.medium}
              fill={colors.textSecondary}
            >
              {legendLabels.map}
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
});

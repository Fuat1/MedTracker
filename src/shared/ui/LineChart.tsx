import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../lib/use-theme';

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
  const { colors } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{emptyText}</Text>
      </View>
    );
  }

  const PADDING_TOP = 28;
  const PADDING_BOTTOM = 16;
  const PADDING_X = 32;
  const chartWidth = width - PADDING_X * 2;
  const chartHeight = height - PADDING_TOP - PADDING_BOTTOM;

  // Get min/max for scaling
  const allValues = data.flatMap(d => [d.systolic, d.diastolic]);
  const minVal = Math.min(...allValues) - 5;
  const maxVal = Math.max(...allValues) + 5;
  const range = maxVal - minVal || 1;

  // Calculate point positions
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : 0;

  const getX = (index: number) =>
    PADDING_X + (data.length > 1 ? index * stepX : chartWidth / 2);

  const getY = (value: number) =>
    PADDING_TOP + chartHeight - ((value - minVal) / range) * chartHeight;

  // Build SVG path for the systolic line
  const buildPath = (getValue: (d: DataPoint) => number) => {
    if (data.length === 1) {
      return '';
    }
    return data
      .map((d, i) => {
        const x = getX(i);
        const y = getY(getValue(d));
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  // Use systolic values for the main line (as shown in screenshot)
  const linePath = buildPath(d => d.systolic);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Line */}
        {data.length > 1 && (
          <Path
            d={linePath}
            fill="none"
            stroke={colors.chartLine}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points and labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d.systolic);
          return (
            <React.Fragment key={i}>
              {/* Dot */}
              <Circle cx={x} cy={y} r={5} fill={colors.chartDot} stroke={colors.chartLine} strokeWidth={2.5} />

              {/* Label: systolic/diastolic */}
              <SvgText
                x={x}
                y={y - 12}
                fontSize={11}
                fontWeight="500"
                fill={colors.chartLabel}
                textAnchor="middle"
              >
                {d.systolic}/{d.diastolic}
              </SvgText>
            </React.Fragment>
          );
        })}
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
  },
});

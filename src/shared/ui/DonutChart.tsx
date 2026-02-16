import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../lib/use-theme';
import { FONTS } from '../config/theme';

export interface DonutSegment {
  /** percentage 0–100 */
  percent: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}

export function DonutChart({
  segments,
  size = 120,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const { colors, typography } = useTheme();

  const activeSegments = segments.filter(s => s.percent > 0);

  // Transform segments to PieChart data format
  const pieData = activeSegments.map(s => ({
    value: s.percent,
    color: s.color,
    text: `${s.percent}%`,
    textColor: s.color,
  }));

  // If no data, show empty ring
  if (pieData.length === 0) {
    pieData.push({
      value: 100,
      color: colors.surfaceSecondary,
      text: '',
      textColor: 'transparent',
    });
  }

  const radius = size / 2;
  const innerRadius = radius * 0.6;

  const CenterLabel = useCallback(() => (
    <View style={styles.center}>
      {centerLabel && (
        <Text style={[styles.centerLabel, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {centerLabel}
        </Text>
      )}
      {centerSubLabel && (
        <Text style={[styles.centerSubLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
          {centerSubLabel}
        </Text>
      )}
    </View>
  ), [centerLabel, centerSubLabel, colors, typography]);

  return (
    <View style={styles.container}>
      <PieChart
        data={pieData}
        donut
        radius={radius}
        innerRadius={innerRadius}
        isAnimated
        animationDuration={800}
        focusOnPress
        toggleFocusOnPress
        centerLabelComponent={CenterLabel}
      />

      {/* Legend */}
      <View style={styles.legend}>
        {activeSegments.map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {s.label} {s.percent}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  centerSubLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 2,
  },
  legend: {
    gap: 4,
    alignSelf: 'stretch',
  },
  legendRow: {
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
    fontFamily: FONTS.regular,
  },
});

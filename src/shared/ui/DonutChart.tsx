import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
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
  strokeWidth = 18,
  centerLabel,
  centerSubLabel,
}: DonutChartProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Build stroke-dasharray/offset per segment
  let cumulativePercent = 0;
  const arcs = segments
    .filter(s => s.percent > 0)
    .map(s => {
      const dashArray = (s.percent / 100) * circumference;
      const dashOffset = circumference - (cumulativePercent / 100) * circumference;
      cumulativePercent += s.percent;
      return { ...s, dashArray, dashOffset };
    });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background ring */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Segments — rotate so first starts at top */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          {arcs.map((arc, i) => (
            <Circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              stroke={arc.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arc.dashArray} ${circumference}`}
              strokeDashoffset={arc.dashOffset - circumference}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      {/* Center text */}
      {centerLabel && (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={[styles.centerLabel, { color: colors.textPrimary }]}>
            {centerLabel}
          </Text>
          {centerSubLabel && (
            <Text style={[styles.centerSubLabel, { color: colors.textSecondary }]}>
              {centerSubLabel}
            </Text>
          )}
        </View>
      )}
      {/* Legend */}
      <View style={styles.legend}>
        {segments.filter(s => s.percent > 0).map((s, i) => (
          <View key={i} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
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
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 20,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  centerSubLabel: {
    fontSize: 11,
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
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});

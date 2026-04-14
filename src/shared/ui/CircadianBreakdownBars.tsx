import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../lib/use-theme';
import { FONTS, BP_COLORS_LIGHT, BP_CHART_COLORS_DARK } from '../config/theme';
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
  const bpColors = isDark ? BP_CHART_COLORS_DARK : BP_COLORS_LIGHT;

  return (
    <View style={styles.container}>
      {windows.map(w => {
        const hasData = w.avg !== null;
        const totalPercent =
          w.timeInRange.normal +
          w.timeInRange.elevated +
          w.timeInRange.stage1 +
          w.timeInRange.stage2 +
          w.timeInRange.crisis;

        const segments = [
          { value: w.timeInRange.normal,   color: bpColors.normal },
          { value: w.timeInRange.elevated, color: bpColors.elevated },
          { value: w.timeInRange.stage1,   color: bpColors.stage_1 },
          { value: w.timeInRange.stage2,   color: bpColors.stage_2 },
          { value: w.timeInRange.crisis,   color: bpColors.crisis },
        ].filter(s => s.value > 0);

        return (
          <View key={w.windowKey} style={styles.windowRow}>
            {/* Time-of-day icon */}
            <Icon
              name={WINDOW_ICONS[w.windowKey]}
              size={14}
              color={colors.textSecondary}
              style={styles.rowIcon}
            />

            {/* Horizontal stacked bar */}
            <View
              style={[
                styles.barTrack,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              {hasData && totalPercent > 0
                ? segments.map((seg, i) => (
                    <View
                      key={i}
                      style={{ flex: seg.value, backgroundColor: seg.color }}
                    />
                  ))
                : null}
            </View>

            {/* Average BP value */}
            <Text
              style={[
                styles.avgText,
                { color: w.avg ? colors.textPrimary : colors.textTertiary, fontSize: typography.xs },
              ]}
            >
              {w.avg ? `${w.avg.systolic}/${w.avg.diastolic}` : '--'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 8,
  },
  windowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowIcon: {
    width: 18,
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  avgText: {
    minWidth: 60,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textAlign: 'right',
  },
});

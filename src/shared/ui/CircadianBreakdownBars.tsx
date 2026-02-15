import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const { colors, isDark } = useTheme();
  const { t } = useTranslation('common');
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const emptyBarStyle = { flex: 1, backgroundColor: colors.surfaceSecondary };

  return (
    <View style={styles.container}>
      {windows.map(w => (
        <View key={w.windowKey} style={styles.row}>
          {/* Icon + label */}
          <View style={styles.labelCol}>
            <Icon name={WINDOW_ICONS[w.windowKey]} size={14} color={colors.textSecondary} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t(`timeWindow.${w.windowKey}` as any)}
            </Text>
          </View>

          {/* Segmented bar */}
          <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
            {w.avg ? (
              <>
                <View style={[styles.barSegment, { flex: w.timeInRange.normal,   backgroundColor: bpColors.normal }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.elevated, backgroundColor: bpColors.elevated }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.stage1,   backgroundColor: bpColors.stage_1 }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.stage2,   backgroundColor: bpColors.stage_2 }]} />
                <View style={[styles.barSegment, { flex: w.timeInRange.crisis,   backgroundColor: bpColors.crisis }]} />
              </>
            ) : (
              <View style={[styles.barSegment, emptyBarStyle]} />
            )}
          </View>

          {/* Avg value */}
          <Text style={[styles.avgText, { color: colors.textPrimary }]}>
            {w.avg ? `${w.avg.systolic}/${w.avg.diastolic}` : '--'}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelCol: {
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  avgText: {
    width: 64,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});

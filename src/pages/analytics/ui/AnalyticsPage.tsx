import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useBPRecords } from '../../../features/record-bp';
import { useExportPdf } from '../../../features/export-pdf';
import { calculatePulsePressure, calculateMAP, computeTimeInRange } from '../../../entities/blood-pressure';
import { useTheme } from '../../../shared/lib/use-theme';
import {
  computeWeeklyAverage,
  computeAmPmComparison,
  computeCircadianBreakdown,
  detectMorningSurge,
} from '../../../shared/lib';
import {
  BPTrendChart,
  OptionChip,
  DateTimePicker,
  DonutChart,
  CircadianBreakdownBars,
} from '../../../shared/ui';
import type { DonutSegment, CircadianWindowData } from '../../../shared/ui';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';
import { PageHeader } from '../../../widgets/page-header';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import type { BPRecord } from '../../../shared/api/bp-repository';

type PeriodKey = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

export function AnalyticsPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { t: tMedical } = useTranslation('medical');
  const { colors, isDark, typography } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { data: allRecords } = useBPRecords();
  const { exportPdf, downloadPdf, isExporting, activeAction } = useExportPdf();
  const guideline = useSettingsStore(state => state.guideline);
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [customEnd, setCustomEnd] = useState<Date>(() => new Date());
  const [doctorNote, setDoctorNote] = useState('');
  const [showPP, setShowPP] = useState(false);
  const [showMAP, setShowMAP] = useState(false);
  const [includePPMAPInExport, setIncludePPMAPInExport] = useState(false);

  const filterByPeriod = useCallback(
    (recs: BPRecord[]): BPRecord[] => {
      const nowSec = Math.floor(Date.now() / 1000);
      if (period === 'all') return recs;
      if (period === 'custom') {
        const startSec = Math.floor(customStart.getTime() / 1000);
        const endSec = Math.floor(customEnd.getTime() / 1000);
        return recs.filter(r => r.timestamp >= startSec && r.timestamp <= endSec);
      }
      const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
      const cutoffSec = nowSec - daysMap[period] * 86400;
      return recs.filter(r => r.timestamp >= cutoffSec);
    },
    [period, customStart, customEnd],
  );

  const records = useMemo(
    () => filterByPeriod(allRecords ?? []),
    [filterByPeriod, allRecords],
  );

  const getPeriodLabel = (): string => {
    if (period === 'all') return t('analytics.period.all');
    if (period === 'custom') {
      return `${customStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} \u2013 ${customEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const keyMap: Record<string, string> = { '7d': 'days7', '14d': 'days14', '30d': 'days30', '90d': 'days90' };
    return t(`analytics.period.${keyMap[period]}` as any);
  };

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return [...records].reverse().map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
      pp: calculatePulsePressure(r.systolic, r.diastolic),
      map: calculateMAP(r.systolic, r.diastolic),
    }));
  }, [records]);

  const weeklyAvg = useMemo(
    () => computeWeeklyAverage(records),
    [records],
  );

  const amPm = useMemo(
    () => computeAmPmComparison(records),
    [records],
  );

  const circadianBreakdown = useMemo(
    () => computeCircadianBreakdown(records),
    [records],
  );

  const timeInRange = useMemo(
    () => computeTimeInRange(records, guideline),
    [records, guideline],
  );

  const surgeResult = useMemo(
    () => detectMorningSurge(allRecords ?? []),
    [allRecords],
  );

  const donutSegments: DonutSegment[] = [
    { percent: timeInRange.overall.normal,   color: bpColors.normal,   label: t('analytics.zones.normal') },
    { percent: timeInRange.overall.elevated, color: bpColors.elevated, label: t('analytics.zones.elevated') },
    { percent: timeInRange.overall.stage1,   color: bpColors.stage_1,  label: tMedical('categories.stage1') },
    { percent: timeInRange.overall.stage2,   color: bpColors.stage_2,  label: tMedical('categories.stage2') },
    { percent: timeInRange.overall.crisis,   color: bpColors.crisis,   label: tMedical('categories.crisis') },
  ];

  const circadianWindows: CircadianWindowData[] = [
    { windowKey: 'morning', avg: circadianBreakdown.morningAvg, timeInRange: timeInRange.morning },
    { windowKey: 'day',     avg: circadianBreakdown.dayAvg,     timeInRange: timeInRange.day },
    { windowKey: 'evening', avg: circadianBreakdown.eveningAvg, timeInRange: timeInRange.evening },
    { windowKey: 'night',   avg: circadianBreakdown.nightAvg,   timeInRange: timeInRange.night },
  ];

  const chartWidth = screenWidth - 80; // 20px margin + 20px card padding on each side

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <PageHeader variant="greeting" />

        {/* Period Selector */}
        <Animated.View
          entering={FadeInUp.delay(50).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
            {t('analytics.period.title')}
          </Text>
          <View style={styles.chipsRow}>
            {(['7d', '14d', '30d', '90d', 'all', 'custom'] as PeriodKey[]).map(p => (
              <OptionChip
                key={p}
                label={
                  p === '7d' ? t('analytics.period.days7') :
                  p === '14d' ? t('analytics.period.days14') :
                  p === '30d' ? t('analytics.period.days30') :
                  p === '90d' ? t('analytics.period.days90') :
                  p === 'all' ? t('analytics.period.all') :
                  t('analytics.period.custom')
                }
                selected={period === p}
                onPress={() => setPeriod(p)}
              />
            ))}
          </View>
          {period === 'custom' && (
            <View style={styles.customRangeRow}>
              <Text style={[styles.rangeLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('analytics.customRange.from')}
              </Text>
              <DateTimePicker value={customStart} onChange={setCustomStart} />
              <Text style={[styles.rangeLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('analytics.customRange.to')}
              </Text>
              <DateTimePicker value={customEnd} onChange={setCustomEnd} />
            </View>
          )}
        </Animated.View>

        {/* BP Trends Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
            {t('analytics.bpTrends')}
          </Text>

          {/* PP/MAP Toggles */}
          <View style={styles.togglesRow}>
            <View style={styles.toggleItem}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('analytics.toggles.showPP')}
              </Text>
              <Switch
                value={showPP}
                onValueChange={setShowPP}
                trackColor={{ false: colors.toggleTrackInactive, true: colors.ppColor }}
                thumbColor={colors.toggleThumb}
                accessibilityRole="switch"
                accessibilityLabel={t('analytics.toggles.showPP')}
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={[styles.toggleLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('analytics.toggles.showMAP')}
              </Text>
              <Switch
                value={showMAP}
                onValueChange={setShowMAP}
                trackColor={{ false: colors.toggleTrackInactive, true: colors.mapColor }}
                thumbColor={colors.toggleThumb}
                accessibilityRole="switch"
                accessibilityLabel={t('analytics.toggles.showMAP')}
              />
            </View>
          </View>

          <BPTrendChart
            data={chartData}
            width={chartWidth}
            height={220}
            emptyText={t('analytics.noData')}
            showPP={showPP}
            showMAP={showMAP}
            zoneLabels={{
              normal: t('analytics.zones.normal'),
              elevated: t('analytics.zones.elevated'),
              high: t('analytics.zones.high'),
            }}
            legendLabels={{
              systolic: t('analytics.legend.systolic'),
              diastolic: t('analytics.legend.diastolic'),
              pp: 'PP',
              map: 'MAP',
            }}
          />
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsRow}>
          {/* Weekly Average */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
              <Icon name="trending-up" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {t('analytics.weeklyAverage')}
            </Text>
            {weeklyAvg.hasData ? (
              <>
                <Text
                  style={[styles.statValue, { color: colors.textPrimary, fontSize: typography['2xl'] }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {weeklyAvg.systolic}/{weeklyAvg.diastolic}
                </Text>
                <Text style={[styles.statUnit, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  {tCommon('units.mmhg')}
                </Text>
              </>
            ) : (
              <Text style={[styles.statNoData, { color: colors.textTertiary, fontSize: typography.sm }]}>
                {t('analytics.noData')}
              </Text>
            )}
          </View>

          {/* Morning vs Evening */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
              <Icon name="sunny" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {t('analytics.morningVsEvening')}
            </Text>
            {amPm.hasAmData || amPm.hasPmData ? (
              <View style={styles.amPmContainer}>
                <View style={styles.amPmRow}>
                  <Text style={[styles.amPmLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>AM</Text>
                  <Text
                    style={[styles.amPmValue, { color: colors.textPrimary, fontSize: typography.md }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {amPm.hasAmData ? `${amPm.am.systolic}/${amPm.am.diastolic}` : '---'}
                  </Text>
                </View>
                <View style={[styles.amPmDivider, { backgroundColor: colors.border }]} />
                <View style={styles.amPmRow}>
                  <Text style={[styles.amPmLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>PM</Text>
                  <Text
                    style={[styles.amPmValue, { color: colors.textPrimary, fontSize: typography.md }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {amPm.hasPmData ? `${amPm.pm.systolic}/${amPm.pm.diastolic}` : '---'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.statNoData, { color: colors.textTertiary, fontSize: typography.sm }]}>
                {t('analytics.noData')}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Circadian Patterns Card */}
        <Animated.View
          entering={FadeInUp.delay(250).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
            {t('analytics.circadian.title')}
          </Text>

          {records.length < 4 ? (
            <Text style={[styles.noDataText, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {t('analytics.circadian.noData')}
            </Text>
          ) : (
            <>
              {/* Donut Chart — time in range */}
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: typography.md }]}>
                {t('analytics.circadian.timeInRange')}
              </Text>
              <DonutChart
                segments={donutSegments}
                size={140}
                centerLabel={`${timeInRange.overall.normal}%`}
                centerSubLabel={tMedical('categories.normal')}
              />

              {/* Per-window breakdown bars */}
              <CircadianBreakdownBars windows={circadianWindows} />

              {/* Morning surge alert badge (count: 1 since detectMorningSurge only tracks single event) */}
              {surgeResult.hasSurge && (
                <View style={[styles.surgeRow, { backgroundColor: colors.surgeBg }]}>
                  <Icon name="trending-up-outline" size={14} color={colors.surgeColor} />
                  <Text style={[styles.surgeText, { color: colors.surgeColor, fontSize: typography.sm }]}>
                    {t('analytics.circadian.morningSurge', { count: 1 })}
                  </Text>
                </View>
              )}
            </>
          )}
        </Animated.View>

        {/* Doctor Notes */}
        <Animated.View
          entering={FadeInUp.delay(280).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
            {t('analytics.doctorNote.label')}
          </Text>
          <TextInput
            value={doctorNote}
            onChangeText={setDoctorNote}
            placeholder={t('analytics.doctorNote.placeholder')}
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            style={[
              styles.notesInput,
              {
                color: colors.textPrimary,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
                fontSize: typography.sm,
              },
            ]}
          />
        </Animated.View>

        {/* Export PDF Button */}
        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.exportContainer}>
          {/* Include PP/MAP Checkbox */}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setIncludePPMAPInExport(!includePPMAPInExport)}
            accessibilityRole="checkbox"
            accessibilityLabel={t('analytics.export.includePPMAP')}
            accessibilityState={{ checked: includePPMAPInExport }}
          >
            <View style={[styles.checkbox, { borderColor: colors.border }]}>
              {includePPMAPInExport && (
                <Icon name="checkmark" size={18} color={colors.accent} />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.textPrimary, fontSize: typography.md }]}>
              {t('analytics.export.includePPMAP')}
            </Text>
          </Pressable>

          <View style={styles.exportButtonsRow}>
            {/* Save to Device */}
            <Pressable
              style={[
                styles.exportButton,
                styles.exportButtonSecondary,
                {
                  backgroundColor: isExporting ? colors.border : colors.surfaceSecondary,
                  borderColor: isExporting ? colors.border : colors.accent,
                },
              ]}
              onPress={() =>
                downloadPdf(records, {
                  period: getPeriodLabel(),
                  doctorNote: doctorNote.trim() || undefined,
                  includePPMAP: includePPMAPInExport,
                })
              }
              disabled={isExporting}
              accessibilityRole="button"
              accessibilityLabel={t('analytics.savePdf')}
              accessibilityState={{ disabled: isExporting }}
            >
              <Icon
                name="download-outline"
                size={22}
                color={isExporting ? colors.textTertiary : colors.accent}
              />
              <Text
                style={[
                  styles.exportButtonText,
                  { color: isExporting ? colors.textTertiary : colors.accent, fontSize: typography.md },
                ]}
              >
                {activeAction === 'save' ? t('analytics.savingPdf') : t('analytics.savePdf')}
              </Text>
            </Pressable>

            {/* Share PDF */}
            <Pressable
              style={[
                styles.exportButton,
                { backgroundColor: isExporting ? colors.border : colors.accent },
              ]}
              onPress={() =>
                exportPdf(records, {
                  period: getPeriodLabel(),
                  doctorNote: doctorNote.trim() || undefined,
                  includePPMAP: includePPMAPInExport,
                })
              }
              disabled={isExporting}
              accessibilityRole="button"
              accessibilityLabel={t('analytics.exportPdf')}
              accessibilityState={{ disabled: isExporting }}
            >
              <Icon name="share-outline" size={22} color={colors.surface} />
              <Text style={[styles.exportButtonText, { color: colors.surface, fontSize: typography.md }]}>
                {activeAction === 'share' ? t('analytics.generatingPdf') : t('analytics.exportPdf')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Chart card / generic card
  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Period selector chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  customRangeRow: {
    marginTop: 14,
    gap: 8,
  },
  rangeLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 4,
  },

  // Doctor notes
  notesInput: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlignVertical: 'top',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '46%',
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statNoData: {
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  amPmContainer: {
    marginTop: 4,
  },
  amPmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amPmLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  amPmValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  amPmDivider: {
    height: 1,
    marginVertical: 6,
  },

  // Circadian card
  cardSubtitle: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 8,
  },
  noDataText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 8,
  },
  surgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  surgeText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // Toggles
  togglesRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },

  // Export
  exportContainer: {
    paddingHorizontal: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  exportButtonSecondary: {
    borderWidth: 1.5,
  },
  exportButtonText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

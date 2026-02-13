import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useBPRecords } from '../../../features/record-bp';
import { useExportPdf } from '../../../features/export-pdf';
import { useTheme } from '../../../shared/lib/use-theme';
import { computeWeeklyAverage, computeAmPmComparison } from '../../../shared/lib';
import { BPTrendChart, OptionChip, DateTimePicker } from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import { PageHeader } from '../../../widgets/page-header';
import type { BPRecord } from '../../../shared/api/bp-repository';

type PeriodKey = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

export function AnalyticsPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { data: allRecords } = useBPRecords();
  const { exportPdf, isExporting } = useExportPdf();

  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [customEnd, setCustomEnd] = useState<Date>(() => new Date());
  const [doctorNote, setDoctorNote] = useState('');

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
    return t(`analytics.period.${keyMap[period]}`);
  };

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return [...records].reverse().map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
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

  const chartWidth = screenWidth - 40;

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
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
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
              <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
                {t('analytics.customRange.from')}
              </Text>
              <DateTimePicker value={customStart} onChange={setCustomStart} />
              <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
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
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            {t('analytics.bpTrends')}
          </Text>
          <BPTrendChart
            data={chartData}
            width={chartWidth}
            height={220}
            emptyText={t('analytics.noData')}
            zoneLabels={{
              normal: t('analytics.zones.normal'),
              elevated: t('analytics.zones.elevated'),
              high: t('analytics.zones.high'),
            }}
            legendLabels={{
              systolic: t('analytics.legend.systolic'),
              diastolic: t('analytics.legend.diastolic'),
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
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('analytics.weeklyAverage')}
            </Text>
            {weeklyAvg.hasData ? (
              <>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {weeklyAvg.systolic}/{weeklyAvg.diastolic}
                </Text>
                <Text style={[styles.statUnit, { color: colors.textTertiary }]}>
                  {tCommon('units.mmhg')}
                </Text>
              </>
            ) : (
              <Text style={[styles.statNoData, { color: colors.textTertiary }]}>
                {t('analytics.noData')}
              </Text>
            )}
          </View>

          {/* Morning vs Evening */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
              <Icon name="sunny" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('analytics.morningVsEvening')}
            </Text>
            {amPm.hasAmData || amPm.hasPmData ? (
              <View style={styles.amPmContainer}>
                <View style={styles.amPmRow}>
                  <Text style={[styles.amPmLabel, { color: colors.textTertiary }]}>AM</Text>
                  <Text style={[styles.amPmValue, { color: colors.textPrimary }]}>
                    {amPm.hasAmData ? `${amPm.am.systolic}/${amPm.am.diastolic}` : '---'}
                  </Text>
                </View>
                <View style={[styles.amPmDivider, { backgroundColor: colors.border }]} />
                <View style={styles.amPmRow}>
                  <Text style={[styles.amPmLabel, { color: colors.textTertiary }]}>PM</Text>
                  <Text style={[styles.amPmValue, { color: colors.textPrimary }]}>
                    {amPm.hasPmData ? `${amPm.pm.systolic}/${amPm.pm.diastolic}` : '---'}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={[styles.statNoData, { color: colors.textTertiary }]}>
                {t('analytics.noData')}
              </Text>
            )}
          </View>
        </Animated.View>

        {/* Doctor Notes */}
        <Animated.View
          entering={FadeInUp.delay(280).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
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
              },
            ]}
          />
        </Animated.View>

        {/* Export PDF Button */}
        <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.exportContainer}>
          <TouchableOpacity
            style={[
              styles.exportButton,
              { backgroundColor: isExporting ? colors.border : colors.accent },
            ]}
            onPress={() =>
              exportPdf(records, {
                period: getPeriodLabel(),
                doctorNote: doctorNote.trim() || undefined,
              })
            }
            disabled={isExporting}
            activeOpacity={0.85}
          >
            <Icon name="document-text-outline" size={22} color="#ffffff" />
            <Text style={styles.exportButtonText}>
              {isExporting ? 'Generating PDF...' : t('analytics.exportPdf')}
            </Text>
          </TouchableOpacity>
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
    fontSize: 18,
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
    fontSize: 13,
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
    fontSize: 14,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlignVertical: 'top',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
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
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statNoData: {
    fontSize: 13,
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
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  amPmValue: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  amPmDivider: {
    height: 1,
    marginVertical: 6,
  },

  // Export
  exportContainer: {
    paddingHorizontal: 20,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  exportButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useBPRecords } from '../../../features/record-bp';
import { useTheme } from '../../../shared/lib/use-theme';
import { computeWeeklyAverage, computeAmPmComparison } from '../../../shared/lib';
import { BPTrendChart } from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import { PageHeader } from '../../../widgets/page-header';

export function AnalyticsPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { data: records } = useBPRecords(30);

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return [...records].reverse().map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
    }));
  }, [records]);

  const weeklyAvg = useMemo(
    () => computeWeeklyAverage(records || []),
    [records],
  );

  const amPm = useMemo(
    () => computeAmPmComparison(records || []),
    [records],
  );

  const chartWidth = screenWidth - 40;

  const handleExportPdf = () => {
    Alert.alert(t('analytics.title'), t('analytics.exportComingSoon'));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <PageHeader variant="greeting" />

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

        {/* Export PDF Button */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.exportContainer}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.accent }]}
            onPress={handleExportPdf}
            activeOpacity={0.85}
          >
            <Icon name="document-text" size={22} color="#ffffff" />
            <Text style={styles.exportButtonText}>
              {t('analytics.exportPdf')}
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

  // Chart card
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

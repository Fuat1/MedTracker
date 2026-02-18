import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useLatestBPRecord, useBPRecords } from '../../../features/record-bp';
import {
  classifyBP,
  getBPCategoryLabel,
  calculatePulsePressure,
  calculateMAP,
} from '../../../entities/blood-pressure';
import { useSettingsStore, computeWeeklyAverage, computeAmPmComparison } from '../../../shared/lib';
import { useTheme } from '../../../shared/lib/use-theme';
import { DerivedMetricsModal, BPTrendChart } from '../../../shared/ui';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';
import { PageHeader } from '../../../widgets/page-header';

function getBPCardGradient(
  category: string | null,
  isDark: boolean,
  fallbackStart: string,
  fallbackEnd: string,
): [string, string] {
  if (!category) return [fallbackStart, fallbackEnd];
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const color = bpColors[category as keyof typeof bpColors];
  if (!color) return [fallbackStart, fallbackEnd];
  // Use the category color as base, darken slightly for gradient end
  return [color, color];
}

export function HomePage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { width: screenWidth } = useWindowDimensions();
  const { data: latestRecord } = useLatestBPRecord();
  const { data: recentRecords } = useBPRecords(7);
  const { guideline } = useSettingsStore();
  const { colors, isDark, fontScale, typography } = useTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'pp' | 'map'>('pp');
  const tabBarHeight = useBottomTabBarHeight();

  const latestCategory = latestRecord
    ? classifyBP(latestRecord.systolic, latestRecord.diastolic, guideline)
    : null;

  const gradientColors = getBPCardGradient(
    latestCategory,
    isDark,
    colors.gradientStart,
    colors.gradientEnd,
  );

  const categoryLabel = latestCategory
    ? getBPCategoryLabel(latestCategory)
    : '';

  const ppValue = latestRecord
    ? calculatePulsePressure(latestRecord.systolic, latestRecord.diastolic)
    : null;

  const mapValue = latestRecord
    ? calculateMAP(latestRecord.systolic, latestRecord.diastolic)
    : null;


  const handlePPInfo = () => {
    setModalType('pp');
    setModalVisible(true);
  };

  const handleMAPInfo = () => {
    setModalType('map');
    setModalVisible(true);
  };

  // Prepare chart data (reverse so oldest is first)
  const chartData = useMemo(() => {
    if (!recentRecords || recentRecords.length === 0) return [];
    return [...recentRecords].reverse().map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
      pp: calculatePulsePressure(r.systolic, r.diastolic),
      map: calculateMAP(r.systolic, r.diastolic),
    }));
  }, [recentRecords]);

  const weeklyAvg = useMemo(() => computeWeeklyAverage(recentRecords ?? []), [recentRecords]);
  const amPm = useMemo(() => computeAmPmComparison(recentRecords ?? []), [recentRecords]);

  const chartWidth = screenWidth - 80; // 20px margin + 20px card padding on each side

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
      >
        {/* Header */}
        <PageHeader variant="greeting" />

        {/* Main BP Reading Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.bpCardWrapper}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bpCard}
          >
            {/* Decorative wave overlay */}
            <View style={styles.cardOverlay} />

            <Text style={[styles.bpCardLabel, { fontSize: typography.md }]}>{t('home.bpReadings')}</Text>

            <View style={styles.bpValueRow}>
              <Text style={[styles.bpValueLarge, { fontSize: 56 * fontScale }]}>
                {latestRecord
                  ? `${latestRecord.systolic}/${latestRecord.diastolic}`
                  : '---/---'}
              </Text>
            </View>
            <Text style={[styles.bpUnit, { fontSize: typography.md }]}>{tCommon('units.mmhg')}</Text>

            {/* Derived Metrics Row */}
            {latestRecord && (
              <View style={styles.metricsRow}>
                {/* Pulse Pressure */}
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { fontSize: 13 * fontScale }]}>
                    PP:
                  </Text>
                  <Text style={[styles.metricValue, { fontSize: 18 * fontScale }]}>
                    {ppValue}
                  </Text>
                  <Pressable
                    onPress={handlePPInfo}
                    style={styles.infoButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon('common.moreInfo') + ' PP'}
                  >
                    <Icon name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                </View>

                {/* Divider */}
                <Text style={[styles.metricDivider, { fontSize: typography.md }]}>•</Text>

                {/* Mean Arterial Pressure */}
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { fontSize: 13 * fontScale }]}>
                    MAP:
                  </Text>
                  <Text style={[styles.metricValue, { fontSize: 18 * fontScale }]}>
                    {mapValue}
                  </Text>
                  <Pressable
                    onPress={handleMAPInfo}
                    style={styles.infoButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon('common.moreInfo') + ' MAP'}
                  >
                    <Icon name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.bpCardBottom}>
              {/* Category label */}
              <View style={styles.categoryRow}>
                {latestCategory ? (
                  <>
                    <Icon name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={[styles.categoryText, { fontSize: 15 * fontScale }]}>{categoryLabel}</Text>
                  </>
                ) : (
                  <Text style={[styles.categoryTextEmpty, { fontSize: typography.sm }]}>
                    {t('home.noReadingsYet')}
                  </Text>
                )}
              </View>

              {/* Pulse badge */}
              {latestRecord?.pulse ? (
                <View style={styles.pulseBadge}>
                  <Icon name="heart" size={18} color="#ffffff" />
                  <Text style={[styles.pulseValue, { fontSize: 22 * fontScale }]}>{latestRecord.pulse}</Text>
                  <Text style={[styles.pulseUnit, { fontSize: typography.xs }]}>{tCommon('units.bpm')}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 7-Day Trend Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={[styles.trendCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.trendTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
            {t('home.last7Days')}
          </Text>
          <BPTrendChart
            data={chartData}
            width={chartWidth}
            height={160}
            emptyText={t('home.addFirstReading')}
            legendLabels={{
              systolic: tCommon('common.systolic'),
              diastolic: tCommon('common.diastolic'),
            }}
          />
        </Animated.View>

        {/* 7-Day Stats Row */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.statsRow}
        >
          {/* Weekly Average */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
              <Icon name="trending-up" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {t('home.weeklyAvg')}
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
                {t('home.noData')}
              </Text>
            )}
          </View>

          {/* AM vs PM */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
              <Icon name="sunny" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
              {t('home.morningVsEvening')}
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
                {t('home.noData')}
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Derived Metrics Info Modal */}
      <DerivedMetricsModal
        visible={modalVisible}
        type={modalType}
        value={modalType === 'pp' ? ppValue ?? 0 : mapValue ?? 0}
        onClose={() => setModalVisible(false)}
        bottomOffset={tabBarHeight}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // BP Card
  bpCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bpCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    minHeight: 220,
  },
  cardOverlay: {
    position: 'absolute',
    top: 40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bpCardLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 12,
  },
  bpValueRow: {
    marginBottom: 2,
  },
  bpValueLarge: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  bpUnit: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 20,
  },
  bpCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    color: '#ffffff',
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  categoryTextEmpty: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  pulseValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    color: '#ffffff',
  },
  pulseUnit: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },

  // Metrics Row (PP/MAP)
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  metricValue: {
    color: '#ffffff',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  metricDivider: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: FONTS.regular,
  },
  infoButton: {
    padding: 2,
  },

  // Trend Card
  trendCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  trendTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 16,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  statUnit: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
  statNoData: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 4,
  },
  amPmContainer: {
    marginTop: 4,
    gap: 4,
  },
  amPmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amPmLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    width: 22,
  },
  amPmValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    flex: 1,
  },
  amPmDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 3,
  },
});

/**
 * MetricHomePage
 *
 * Generic home screen driven by the active MetricConfig.
 *
 * Structure:
 *   - Greeting header (PageHeader)
 *   - Latest reading card (MetricRecordCard — dispatches to BP or generic)
 *   - Trend chart (MetricTrendChart — dispatches to BPTrendChart for BP)
 *   - Circadian card (MetricCircadianCard — only when config.circadian.enabled)
 *   - Medication schedule (TodayScheduleCard — shared, metric-agnostic)
 *
 * BP: all three override slots render rich BP-specific components.
 * Future metrics: generic fallbacks for trend chart and record card.
 */

import React, { useMemo } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMetricRecords } from '../../../entities/health-metric';
import { getActiveMetricConfig } from '../../../shared/config/metric-registry';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { MetricRecordCard } from '../../../widgets/metric-record-card';
import { MetricTrendChart } from '../../../widgets/metric-trend-chart';
import { MetricCircadianCard } from '../../../widgets/metric-circadian-card';
import { PageHeader } from '../../../widgets/page-header';
import TodayScheduleCard from '../../../widgets/medication-adherence/TodayScheduleCard';

const config = getActiveMetricConfig();

export function MetricHomePage() {
  const { t } = useTranslation('pages');
  const { colors, typography } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();

  const { data: records = [] } = useMetricRecords(config, 30);
  const latestRecord = records[0] ?? null;

  // useMemo is safe here — records reference changes when data changes
  const recentRecords = useMemo(() => records.slice(0, 30), [records]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader variant="greeting" />

        {/* Latest reading */}
        {latestRecord ? (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.section}>
            <MetricRecordCard
              record={latestRecord}
              config={config}
              variant="full"
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.md }]}>
              {t('home.noReadingsYet')}
            </Text>
          </Animated.View>
        )}

        {/* Trend chart */}
        {recentRecords.length > 0 && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('home.last7Days')}
            </Text>
            <MetricTrendChart records={recentRecords} config={config} />
          </Animated.View>
        )}

        {/* Circadian card (BP-specific via override; skipped for metrics without circadian config) */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <MetricCircadianCard
            records={recentRecords}
            allRecords={recentRecords}
            config={config}
          />
        </Animated.View>

        {/* Medication schedule — metric-agnostic */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <TodayScheduleCard />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
});

/**
 * MetricHistoryPage
 *
 * Generic history screen driven by the active MetricConfig.
 *
 * Structure:
 *   - PageHeader (title variant)
 *   - MetricRecordsList — sections grouped by calendar week ("This week",
 *     "Last week", or "Mon DD – Mon DD" for older weeks)
 *
 * BP: BPRecordCard renders for each record via MetricRecordCard override.
 * Future metrics: GenericRecordCard via MetricRecordCard fallback.
 *
 * Navigation: tapping a record navigates to EditReading.
 */

import React, { useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { useMetricRecords } from '../../../entities/health-metric';
import { getActiveMetricConfig } from '../../../shared/config/metric-registry';
import { useTheme } from '../../../shared/lib/use-theme';
import { MetricRecordCard } from '../../../widgets/metric-record-card';
import { MetricRecordsList } from '../../../widgets/metric-records-list';
import { PageHeader } from '../../../widgets/page-header';
import type { RootStackParamList } from '../../../app/navigation';

const config = getActiveMetricConfig();

/**
 * Groups records into sections by calendar week.
 * Returns sections ordered newest first with human-readable titles.
 */
function groupByWeek<TRecord extends { id: string; timestamp: number }>(
  records: TRecord[],
  tHistory: (key: string) => string,
): Array<{ title: string; data: TRecord[] }> {
  if (records.length === 0) return [];

  const now = new Date();
  // Start of this week (Monday)
  const dayOfWeek = now.getDay(); // 0=Sun
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setHours(0, 0, 0, 0);
  startOfThisWeek.setDate(now.getDate() - daysSinceMonday);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const map = new Map<string, TRecord[]>();

  for (const record of records) {
    const date = new Date(record.timestamp);
    let key: string;

    if (date >= startOfThisWeek) {
      key = tHistory('filters.thisWeek') || 'This week';
    } else if (date >= startOfLastWeek) {
      key = tHistory('filters.lastWeek') || 'Last week';
    } else {
      // Group by calendar week: "Mon DD – Sun DD MMM YYYY"
      const weekMonday = new Date(date);
      const d = (date.getDay() + 6) % 7;
      weekMonday.setDate(date.getDate() - d);
      weekMonday.setHours(0, 0, 0, 0);
      const weekSunday = new Date(weekMonday);
      weekSunday.setDate(weekMonday.getDate() + 6);

      const fmt = (d: Date) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      key = `${fmt(weekMonday)} – ${fmt(weekSunday)} ${weekSunday.getFullYear()}`;
    }

    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(record);
  }

  return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
}

export function MetricHistoryPage() {
  const { t } = useTranslation('pages');
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    data: records = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useMetricRecords(config);

  const sections = useMemo(
    () => groupByWeek(records, (key) => t(key as any) as string),
    [records, t],
  );

  const handleRefresh = useCallback(() => { void refetch(); }, [refetch]);

  const renderCard = useCallback(
    (record: (typeof records)[number]) => (
      <MetricRecordCard
        record={record}
        config={config}
        variant="compact"
        onPress={() =>
          navigation.navigate('EditReading', { recordId: record.id })
        }
      />
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <PageHeader variant="title" title={t('history.title')} />
      <MetricRecordsList
        config={config}
        sections={sections}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRefresh={handleRefresh}
        renderCard={renderCard}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

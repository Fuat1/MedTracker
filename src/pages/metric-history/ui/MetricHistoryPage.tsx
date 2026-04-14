/**
 * MetricHistoryPage
 *
 * Generic history screen driven by the active MetricConfig.
 *
 * Structure:
 *   - PageHeader (title variant)
 *   - MetricRecordsList — sections grouped by Today / Yesterday / Last Week / Older
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
import { groupMetricRecordsByTimePeriod } from '../../../shared/lib/record-utils';
import { MetricRecordCard } from '../../../widgets/metric-record-card';
import { MetricRecordsList } from '../../../widgets/metric-records-list';
import { PageHeader } from '../../../widgets/page-header';
import type { RootStackParamList } from '../../../app/navigation';

const config = getActiveMetricConfig();

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

  // Translate titleKeys → title strings for MetricRecordsList
  const sections = useMemo(
    () =>
      groupMetricRecordsByTimePeriod(records).map(section => ({
        title: t(section.titleKey as any) as string,
        data: section.data,
      })),
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

import React, { useState, useMemo, useCallback } from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../widgets/page-header';
import { BPRecordsList } from '../../../widgets/bp-records-list';
import { useBPRecords } from '../../../features/record-bp';
import { classifyBP } from '../../../entities/blood-pressure';
import {
  useSettingsStore,
  useTheme,
  filterRecords,
  groupRecordsByTimePeriod,
} from '../../../shared/lib';
import { FONTS } from '../../../shared/config/theme';
import type { HistoryFilterType } from '../../../shared/lib';
import type { BPRecord } from '../../../shared/api';

const filterOptions: Array<{ key: HistoryFilterType; labelKey: string }> = [
  { key: 'all', labelKey: 'history.filters.all' },
  { key: 'morning', labelKey: 'history.filters.morning' },
  { key: 'evening', labelKey: 'history.filters.evening' },
  { key: 'highAlert', labelKey: 'history.filters.highAlert' },
];

export function HistoryPage() {
  const { t } = useTranslation('pages');
  const { colors } = useTheme();
  const { guideline } = useSettingsStore();
  const { data: records, isLoading, isError, refetch, isRefetching } = useBPRecords();
  const [filter, setFilter] = useState<HistoryFilterType>('all');

  const isHighAlert = useCallback(
    (record: BPRecord) => {
      const category = classifyBP(record.systolic, record.diastolic, guideline);
      return category === 'stage_2' || category === 'crisis';
    },
    [guideline],
  );

  const sections = useMemo(() => {
    if (!records || records.length === 0) return [];
    const filtered = filterRecords(records, filter, isHighAlert);
    const grouped = groupRecordsByTimePeriod(filtered);
    return grouped.map(s => ({
      ...s,
      title: t(s.titleKey as any) as string,
    }));
  }, [records, filter, isHighAlert, t]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <PageHeader variant="title" title={t('history.title')} />

      {/* Filter Chips */}
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterOptions.map(item => {
            const isActive = filter === item.key;
            const tabStyle = { backgroundColor: isActive ? colors.accent : 'transparent', borderColor: isActive ? colors.accent : colors.border };
            const textStyle = { color: isActive ? '#ffffff' : colors.textSecondary };
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterTab, tabStyle]}
                onPress={() => setFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterTabText, textStyle]}>
                  {t(item.labelKey as any)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Records List */}
      <BPRecordsList
        sections={sections}
        isLoading={isLoading}
        isError={isError}
        isRefetching={isRefetching}
        onRefresh={refetch}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: 4,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
});

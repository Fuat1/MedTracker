import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBPRecords } from '../../../features/record-bp';
import { BPRecordCard } from '../../bp-record-card';
import type { BPRecord } from '../../../shared/api';
import { useTheme } from '../../../shared/lib/use-theme';

interface BPRecordsListProps {
  limit?: number;
}

export function BPRecordsList({ limit }: BPRecordsListProps) {
  const { t } = useTranslation('widgets');
  const { colors } = useTheme();
  const { data: records, isLoading, isError, refetch, isRefetching } = useBPRecords(limit);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('bpRecordsList.loading')}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>
          {t('bpRecordsList.error.title')}
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          {t('bpRecordsList.error.subtitle')}
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: BPRecord }) => (
    <BPRecordCard record={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💓</Text>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {t('bpRecordsList.empty.title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        {t('bpRecordsList.empty.subtitle')}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={records}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={[colors.accent]}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  errorSubtitle: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});

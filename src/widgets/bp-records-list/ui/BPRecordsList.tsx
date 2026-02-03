import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useBPRecords } from '../../../features/record-bp';
import { BPRecordCard } from '../../bp-record-card';
import type { BPRecord } from '../../../shared/api';

interface BPRecordsListProps {
  limit?: number;
}

export function BPRecordsList({ limit }: BPRecordsListProps) {
  const { data: records, isLoading, isError, refetch, isRefetching } = useBPRecords(limit);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading records...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error loading records</Text>
        <Text style={styles.errorSubtitle}>Pull down to retry</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: BPRecord }) => (
    <BPRecordCard record={item} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💓</Text>
      <Text style={styles.emptyTitle}>
        No readings yet
      </Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your blood pressure by adding your first reading
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
          colors={['#3b82f6']}
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
    color: '#6b7280',
    marginTop: 8,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    marginBottom: 8,
  },
  errorSubtitle: {
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    color: '#9ca3af',
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#4b5563',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});

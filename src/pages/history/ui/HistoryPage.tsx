import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BPRecordsList } from '../../../widgets/bp-records-list';
import { useBPRecords } from '../../../features/record-bp';

export function HistoryPage() {
  const { data: records } = useBPRecords();

  const recordCount = records?.length ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>
          {recordCount} {recordCount === 1 ? 'reading' : 'readings'} recorded
        </Text>
      </View>

      {/* Records List */}
      <BPRecordsList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: 14,
  },
});

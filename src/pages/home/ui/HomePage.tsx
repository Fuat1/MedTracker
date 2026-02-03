import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { BPEntryForm } from '../../../widgets/bp-entry-form';
import { useLatestBPRecord } from '../../../features/record-bp';
import {
  classifyBP,
  getBPCategoryColor,
  getBPCategoryLabel,
} from '../../../entities/blood-pressure';
import { getRelativeTime, useSettingsStore } from '../../../shared/lib';
import type { RootStackParamList } from '../../../app/navigation';

interface HomePageProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

export function HomePage({ navigation }: HomePageProps) {
  const { data: latestRecord } = useLatestBPRecord();
  const { guideline } = useSettingsStore();

  const latestCategory = latestRecord
    ? classifyBP(latestRecord.systolic, latestRecord.diastolic, guideline)
    : null;
  const latestColor = latestCategory ? getBPCategoryColor(latestCategory) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MedTracker</Text>
          <Text style={styles.subtitle}>Blood Pressure Monitor</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings-outline" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('History')}
          >
            <Text style={styles.historyButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Reading Summary */}
      {latestRecord && (
        <View style={styles.lastReadingCard}>
          <Text style={styles.lastReadingLabel}>Last Reading</Text>
          <View style={styles.lastReadingRow}>
            <View style={styles.lastReadingValues}>
              <Text
                style={[styles.lastReadingBP, { color: latestColor || '#1f2937' }]}
              >
                {latestRecord.systolic}/{latestRecord.diastolic}
              </Text>
              <Text style={styles.lastReadingUnit}>mmHg</Text>
              {latestRecord.pulse && (
                <Text style={styles.lastReadingPulse}>
                  {latestRecord.pulse} BPM
                </Text>
              )}
            </View>
            <Text style={styles.lastReadingTime}>
              {getRelativeTime(latestRecord.timestamp)}
            </Text>
          </View>
          {latestCategory && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: latestColor + '20' },
              ]}
            >
              <Text style={[styles.categoryText, { color: latestColor }]}>
                {getBPCategoryLabel(latestCategory)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Entry Form */}
      <View style={styles.formContainer}>
        <View style={styles.formHandle}>
          <View style={styles.handle} />
        </View>
        <Text style={styles.formTitle}>New Reading</Text>
        <BPEntryForm />
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  historyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  lastReadingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  lastReadingLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 8,
  },
  lastReadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastReadingValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  lastReadingBP: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastReadingUnit: {
    color: '#9ca3af',
    marginLeft: 4,
  },
  lastReadingPulse: {
    color: '#6b7280',
    marginLeft: 12,
  },
  lastReadingTime: {
    color: '#9ca3af',
    fontSize: 14,
  },
  categoryBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formHandle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 48,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
});

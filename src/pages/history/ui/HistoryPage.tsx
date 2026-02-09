import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { BPRecordsList } from '../../../widgets/bp-records-list';
import { useBPRecords } from '../../../features/record-bp';
import { useTheme } from '../../../shared/lib/use-theme';

type FilterType = 'all' | 'week' | 'month' | 'year';

export function HistoryPage() {
  const { t } = useTranslation('pages');
  const { data: records } = useBPRecords();
  const [filter, setFilter] = useState<FilterType>('all');
  const { colors } = useTheme();

  const recordCount = records?.length ?? 0;

  // Calculate time-based statistics
  const stats = React.useMemo(() => {
    if (!records || records.length === 0) {
      return null;
    }

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const weekRecords = records.filter(r => now - r.timestamp < oneWeek);
    const monthRecords = records.filter(r => now - r.timestamp < oneMonth);

    const avgSystolic = Math.round(
      records.reduce((sum, r) => sum + r.systolic, 0) / records.length
    );
    const avgDiastolic = Math.round(
      records.reduce((sum, r) => sum + r.diastolic, 0) / records.length
    );

    const maxSystolic = Math.max(...records.map(r => r.systolic));
    const minSystolic = Math.min(...records.map(r => r.systolic));

    return {
      avgSystolic,
      avgDiastolic,
      maxSystolic,
      minSystolic,
      weekCount: weekRecords.length,
      monthCount: monthRecords.length,
      totalCount: records.length,
    };
  }, [records]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      >
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('history.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('history.recordCount', { count: records?.length || 0 })}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.surfaceSecondary }]}
          activeOpacity={0.8}
        >
          <Icon name="download-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </Animated.View>

      {/* Statistics Summary */}
      {stats && (
        <Animated.View
          entering={FadeInDown.delay(100).duration(500)}
          style={[styles.statsCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.statsCardTitle, { color: colors.textPrimary }]}>
            {t('history.overview')}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stats.avgSystolic}/{stats.avgDiastolic}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('history.stats.averageBP')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stats.maxSystolic}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('history.stats.highestSystolic')}
              </Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stats.weekCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('history.stats.thisWeek')}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Filter Tabs */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {([
            { key: 'all' as FilterType, icon: 'infinite', label: t('history.filters.allTime') },
            { key: 'week' as FilterType, icon: 'calendar-outline', label: t('history.filters.thisWeek') },
            { key: 'month' as FilterType, icon: 'calendar', label: t('history.filters.thisMonth') },
            { key: 'year' as FilterType, icon: 'timer-outline', label: t('history.filters.thisYear') },
          ]).map(item => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterTab,
                {
                  backgroundColor: filter === item.key ? colors.accent : colors.surface,
                  borderColor: filter === item.key ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setFilter(item.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={item.icon}
                size={16}
                color={filter === item.key ? '#ffffff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === item.key ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Records List */}
      <BPRecordsList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statsCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 12,
  },
  filterContainer: {
    marginBottom: 12,
  },
  filterScroll: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

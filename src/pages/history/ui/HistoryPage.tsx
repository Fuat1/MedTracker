import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../app/navigation';
import { PageHeader } from '../../../widgets/page-header';
import { BPRecordsList } from '../../../widgets/bp-records-list';
import { BPRecordCard } from '../../../widgets/bp-record-card';
import { CircadianCard } from '../../../widgets/circadian-card';
import { CorrelationCard } from '../../../widgets/correlation-card';
import { useBPRecords } from '../../../features/record-bp';
import { useRelationships } from '../../../entities/family-sharing';
import { useFirebaseAuth } from '../../../features/auth';
import { useExportPdf } from '../../../features/export-pdf';
import { useTagsForRecords } from '../../../features/manage-tags';
import { classifyBP, calculatePulsePressure, calculateMAP } from '../../../entities/blood-pressure';
import { computeTagCorrelations } from '../../../entities/lifestyle-tag';
import { calculateBMI, getBMICategory, formatWeight, calculateAge } from '../../../entities/user-profile';
import { useTheme } from '../../../shared/lib/use-theme';
import {
  useSettingsStore,
  filterRecords,
  groupRecordsByTimePeriod,
  computeWeeklyAverage,
  computeAmPmComparison,
  computeWeightTrend,
  computeWeightBPCorrelation,
} from '../../../shared/lib';
import {
  DerivedMetricsModal,
  BPTrendChart,
  OptionChip,
  DateTimePicker,
  ProfileBadgeRow,
} from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import type { HistoryFilterType } from '../../../shared/lib';
import type { BPRecord } from '../../../shared/api';
import { getLinkedUsers } from '../../../shared/api/bp-repository';

type TabKey = 'records' | 'analytics';
type PeriodKey = '7d' | '14d' | '30d' | '90d' | 'all' | 'custom';

const filterOptions: Array<{ key: HistoryFilterType; labelKey: string }> = [
  { key: 'all', labelKey: 'history.filters.all' },
  { key: 'morning', labelKey: 'history.filters.morning' },
  { key: 'evening', labelKey: 'history.filters.evening' },
  { key: 'highAlert', labelKey: 'history.filters.highAlert' },
];

export function HistoryPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, typography } = useTheme();
  const { guideline, height: userHeight, weightUnit, dateOfBirth, gender, seniorMode } = useSettingsStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: allRecordsRaw, isLoading, isError, refetch, isRefetching } = useBPRecords();
  const { relationships } = useRelationships();
  const { user: firebaseUser } = useFirebaseAuth();
  const currentUid = firebaseUser?.uid ?? null;

  // Owner filter: null = my records, string UID = linked user's records, 'all' = everything
  const [selectedOwner, setSelectedOwner] = useState<string | null | 'all'>(null);

  // Active linked UIDs for the owner chips
  const linkedUids = useMemo(() => {
    if (!currentUid) return [];
    return relationships
      .filter((r) => r.status === 'active')
      .map((r) => (r.initiatorUid === currentUid ? r.recipientUid! : r.initiatorUid))
      .filter(Boolean);
  }, [relationships, currentUid]);

  const hasLinkedUsers = linkedUids.length > 0;

  const [linkedUserNames, setLinkedUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void getLinkedUsers().then((users) => {
      const names: Record<string, string> = {};
      for (const u of users) {
        names[u.uid] = u.display_name;
      }
      setLinkedUserNames(names);
    });
  }, [relationships]);

  // Apply owner filter
  const allRecords = useMemo(() => {
    if (!allRecordsRaw) return allRecordsRaw;
    if (!hasLinkedUsers || selectedOwner === 'all') return allRecordsRaw;
    if (selectedOwner === null) return allRecordsRaw.filter((r) => r.ownerUid === null);
    return allRecordsRaw.filter((r) => r.ownerUid === selectedOwner);
  }, [allRecordsRaw, selectedOwner, hasLinkedUsers]);
  const { exportPdf, downloadPdf, isExporting, activeAction } = useExportPdf();
  const { width: screenWidth } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();

  // Segment control
  const [activeTab, setActiveTab] = useState<TabKey>('records');

  // History state
  const [filter, setFilter] = useState<HistoryFilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'pp' | 'map'>('pp');
  const [modalValue, setModalValue] = useState(0);

  // Analytics state
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [customStart, setCustomStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [customEnd, setCustomEnd] = useState<Date>(() => new Date());
  const [doctorNote, setDoctorNote] = useState('');
  const [showPP, setShowPP] = useState(false);
  const [showMAP, setShowMAP] = useState(false);
  const [includePPMAPInExport, setIncludePPMAPInExport] = useState(false);

  // History callbacks
  const handlePPPress = useCallback((value: number) => {
    setModalType('pp');
    setModalValue(value);
    setModalVisible(true);
  }, []);

  const handleMAPPress = useCallback((value: number) => {
    setModalType('map');
    setModalValue(value);
    setModalVisible(true);
  }, []);

  // Senior Mode confirmation handler for edit/delete navigation
  const handleRecordPress = useCallback((recordId: string) => {
    if (seniorMode) {
      Alert.alert(
        t('history.deleteConfirm.title'),
        t('history.deleteConfirm.message'),
        [
          { text: t('history.deleteConfirm.cancel'), style: 'cancel' },
          {
            text: t('history.deleteConfirm.confirm'),
            style: 'default',
            onPress: () => {
              navigation.navigate('EditReading', { recordId });
            },
          },
        ]
      );
    } else {
      navigation.navigate('EditReading', { recordId });
    }
  }, [seniorMode, navigation, t]);

  const isHighAlert = useCallback(
    (record: BPRecord) => {
      const category = classifyBP(record.systolic, record.diastolic, guideline);
      return category === 'stage_2' || category === 'crisis';
    },
    [guideline],
  );

  const sections = useMemo(() => {
    if (!allRecords || allRecords.length === 0) return [];
    const filtered = filterRecords(allRecords, filter, isHighAlert);
    const grouped = groupRecordsByTimePeriod(filtered);
    return grouped.map(s => ({
      ...s,
      title: t(s.titleKey as any) as string,
    }));
  }, [allRecords, filter, isHighAlert, t]);

  // Analytics computed data
  const filterByPeriod = useCallback(
    (recs: BPRecord[]): BPRecord[] => {
      const nowSec = Math.floor(Date.now() / 1000);
      if (period === 'all') return recs;
      if (period === 'custom') {
        const startSec = Math.floor(customStart.getTime() / 1000);
        const endSec = Math.floor(customEnd.getTime() / 1000);
        return recs.filter(r => r.timestamp >= startSec && r.timestamp <= endSec);
      }
      const daysMap: Record<string, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
      const cutoffSec = nowSec - daysMap[period] * 86400;
      return recs.filter(r => r.timestamp >= cutoffSec);
    },
    [period, customStart, customEnd],
  );

  const records = useMemo(
    () => filterByPeriod(allRecords ?? []),
    [filterByPeriod, allRecords],
  );

  const getPeriodLabel = (): string => {
    if (period === 'all') return t('analytics.period.all');
    if (period === 'custom') {
      return `${customStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} \u2013 ${customEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    const keyMap: Record<string, string> = { '7d': 'days7', '14d': 'days14', '30d': 'days30', '90d': 'days90' };
    return t(`analytics.period.${keyMap[period]}` as any);
  };

  const chartData = useMemo(() => {
    if (!records || records.length === 0) return [];
    return [...records].reverse().map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
      pp: calculatePulsePressure(r.systolic, r.diastolic),
      map: calculateMAP(r.systolic, r.diastolic),
    }));
  }, [records]);

  const weeklyAvg = useMemo(() => computeWeeklyAverage(records), [records]);
  const amPm = useMemo(() => computeAmPmComparison(records), [records]);
  const weightTrend = useMemo(() => computeWeightTrend(records), [records]);
  const weightCorrelation = useMemo(() => computeWeightBPCorrelation(records), [records]);

  const recordIds = useMemo(() => (allRecords ?? []).map(r => r.id), [allRecords]);
  const analyticsRecordIds = useMemo(() => records.map(r => r.id), [records]);
  const { data: tagMap } = useTagsForRecords(recordIds);
  const { data: analyticsTagMap } = useTagsForRecords(analyticsRecordIds);

  const correlations = useMemo(
    () => (analyticsTagMap ? computeTagCorrelations(records, analyticsTagMap) : []),
    [records, analyticsTagMap],
  );

  const chartWidth = screenWidth - 80;

  const profileAge = useMemo(() => calculateAge(dateOfBirth), [dateOfBirth]);
  const profileBmi = useMemo(() => {
    const avgW = weightTrend?.avgWeight ?? null;
    const bmi = calculateBMI(avgW, userHeight);
    return bmi != null ? { value: bmi, category: getBMICategory(bmi) } : null;
  }, [weightTrend, userHeight]);

  const hasProfileData = profileAge != null || gender != null || profileBmi != null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <PageHeader variant="title" title={t('history.title')} />

      {/* Owner filter chips — only visible when there are linked users */}
      {hasLinkedUsers && (
        <Animated.View entering={FadeInDown.duration(400)} style={styles.ownerFilterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {/* All */}
            <Pressable
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedOwner === 'all' ? colors.accent : 'transparent',
                  borderColor: selectedOwner === 'all' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedOwner('all')}
              accessibilityRole="button"
              accessibilityLabel={t('familySharing.ownerAll')}
            >
              <Text style={[styles.filterTabText, { color: selectedOwner === 'all' ? colors.surface : colors.textSecondary, fontSize: typography.sm }]}>
                {t('familySharing.ownerAll')}
              </Text>
            </Pressable>

            {/* Me */}
            <Pressable
              style={[
                styles.filterTab,
                {
                  backgroundColor: selectedOwner === null ? colors.accent : 'transparent',
                  borderColor: selectedOwner === null ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedOwner(null)}
              accessibilityRole="button"
              accessibilityLabel={t('familySharing.ownerMe')}
            >
              <Text style={[styles.filterTabText, { color: selectedOwner === null ? colors.surface : colors.textSecondary, fontSize: typography.sm }]}>
                {t('familySharing.ownerMe')}
              </Text>
            </Pressable>

            {/* One chip per linked user */}
            {linkedUids.map((uid, idx) => (
              <Pressable
                key={uid}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: selectedOwner === uid ? colors.accent : 'transparent',
                    borderColor: selectedOwner === uid ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setSelectedOwner(uid)}
                accessibilityRole="button"
                accessibilityLabel={linkedUserNames[uid] ?? `Person ${idx + 1}`}
              >
                <Icon name="person-outline" size={12} color={selectedOwner === uid ? colors.surface : colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.filterTabText, { color: selectedOwner === uid ? colors.surface : colors.textSecondary, fontSize: typography.sm }]}>
                  {linkedUserNames[uid] ?? `Person ${idx + 1}`}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Segment Control */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surfaceSecondary }]}>
        <Pressable
          style={[
            styles.segmentTab,
            activeTab === 'records' && [styles.segmentTabActive, { backgroundColor: colors.surface, shadowColor: colors.shadow }],
          ]}
          onPress={() => setActiveTab('records')}
          accessibilityRole="tab"
          accessibilityLabel={t('history.tabs.records')}
          accessibilityState={{ selected: activeTab === 'records' }}
        >
          <Icon
            name={activeTab === 'records' ? 'list' : 'list-outline'}
            size={16}
            color={activeTab === 'records' ? colors.accent : colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentLabel,
              {
                color: activeTab === 'records' ? colors.accent : colors.textTertiary,
                fontSize: typography.sm,
              },
            ]}
          >
            {t('history.tabs.records')}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.segmentTab,
            activeTab === 'analytics' && [styles.segmentTabActive, { backgroundColor: colors.surface, shadowColor: colors.shadow }],
          ]}
          onPress={() => setActiveTab('analytics')}
          accessibilityRole="tab"
          accessibilityLabel={t('history.tabs.analytics')}
          accessibilityState={{ selected: activeTab === 'analytics' }}
        >
          <Icon
            name={activeTab === 'analytics' ? 'bar-chart' : 'bar-chart-outline'}
            size={16}
            color={activeTab === 'analytics' ? colors.accent : colors.textTertiary}
          />
          <Text
            style={[
              styles.segmentLabel,
              {
                color: activeTab === 'analytics' ? colors.accent : colors.textTertiary,
                fontSize: typography.sm,
              },
            ]}
          >
            {t('history.tabs.analytics')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'records' ? (
        /* ===== RECORDS TAB ===== */
        <>
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
                const textStyle = { color: isActive ? colors.surface : colors.textSecondary };
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.filterTab, tabStyle]}
                    onPress={() => setFilter(item.key)}
                    accessibilityRole="button"
                    accessibilityLabel={t(item.labelKey as any)}
                  >
                    <Text style={[styles.filterTabText, textStyle, { fontSize: typography.sm }]}>
                      {t(item.labelKey as any)}
                    </Text>
                  </Pressable>
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
            renderCard={(record) => (
              <BPRecordCard
                record={record}
                variant="compact"
                tags={tagMap?.[record.id]}
                onPPPress={handlePPPress}
                onMAPPress={handleMAPPress}
                onPress={() => handleRecordPress(record.id)}
              />
            )}
          />

          {/* PP / MAP info modal */}
          <DerivedMetricsModal
            visible={modalVisible}
            type={modalType}
            value={modalValue}
            onClose={() => setModalVisible(false)}
            bottomOffset={tabBarHeight}
          />
        </>
      ) : (
        /* ===== ANALYTICS TAB ===== */
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.analyticsScrollContent}
          nestedScrollEnabled={true}
        >
          {/* Profile Context Row */}
          {hasProfileData && (
            <Animated.View entering={FadeInUp.delay(30).duration(400)} style={styles.profileRow}>
              <ProfileBadgeRow
                badges={[
                  ...(profileAge != null ? [{ icon: 'person-outline', label: t('analytics.profile.age', { age: profileAge }) }] : []),
                  ...(gender != null ? [{ icon: 'male-female-outline', label: t(`settings.personalization.gender${gender.charAt(0).toUpperCase() + gender.slice(1)}` as any) }] : []),
                  ...(profileBmi != null ? [{ icon: 'body-outline', label: `BMI ${profileBmi.value.toFixed(1)} · ${tCommon(`bmi.${profileBmi.category}` as any)}` }] : []),
                ]}
              />
            </Animated.View>
          )}

          {/* Period Selector */}
          <Animated.View
            entering={FadeInUp.delay(50).duration(500)}
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('analytics.period.title')}
            </Text>
            <View style={styles.chipsRow}>
              {(['7d', '14d', '30d', '90d', 'all', 'custom'] as PeriodKey[]).map(p => (
                <OptionChip
                  key={p}
                  label={
                    p === '7d' ? t('analytics.period.days7') :
                    p === '14d' ? t('analytics.period.days14') :
                    p === '30d' ? t('analytics.period.days30') :
                    p === '90d' ? t('analytics.period.days90') :
                    p === 'all' ? t('analytics.period.all') :
                    t('analytics.period.custom')
                  }
                  selected={period === p}
                  onPress={() => setPeriod(p)}
                />
              ))}
            </View>
            {period === 'custom' && (
              <View style={styles.customRangeRow}>
                <Text style={[styles.rangeLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                  {t('analytics.customRange.from')}
                </Text>
                <DateTimePicker value={customStart} onChange={setCustomStart} />
                <Text style={[styles.rangeLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                  {t('analytics.customRange.to')}
                </Text>
                <DateTimePicker value={customEnd} onChange={setCustomEnd} />
              </View>
            )}
          </Animated.View>

          {/* BP Trends Card */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(500)}
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('analytics.bpTrends')}
            </Text>

            {/* PP/MAP Toggles */}
            <View style={styles.togglesRow}>
              <View style={styles.toggleItem}>
                <Text style={[styles.toggleLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                  {t('analytics.toggles.showPP')}
                </Text>
                <Switch
                  value={showPP}
                  onValueChange={setShowPP}
                  trackColor={{ false: colors.toggleTrackInactive, true: colors.ppColor }}
                  thumbColor={colors.toggleThumb}
                  accessibilityRole="switch"
                  accessibilityLabel={t('analytics.toggles.showPP')}
                />
              </View>
              <View style={styles.toggleItem}>
                <Text style={[styles.toggleLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                  {t('analytics.toggles.showMAP')}
                </Text>
                <Switch
                  value={showMAP}
                  onValueChange={setShowMAP}
                  trackColor={{ false: colors.toggleTrackInactive, true: colors.mapColor }}
                  thumbColor={colors.toggleThumb}
                  accessibilityRole="switch"
                  accessibilityLabel={t('analytics.toggles.showMAP')}
                />
              </View>
            </View>

            <BPTrendChart
              data={chartData}
              width={chartWidth}
              height={220}
              emptyText={t('analytics.noData')}
              showPP={showPP}
              showMAP={showMAP}
              zoneLabels={{
                normal: t('analytics.zones.normal'),
                elevated: t('analytics.zones.elevated'),
                high: t('analytics.zones.high'),
              }}
              legendLabels={{
                systolic: t('analytics.legend.systolic'),
                diastolic: t('analytics.legend.diastolic'),
                pp: 'PP',
                map: 'MAP',
              }}
            />
          </Animated.View>

          {/* Stats Row */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.statsRow}>
            {/* Weekly Average */}
            <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
                <Icon name="trending-up" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('analytics.weeklyAverage')}
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
                  {t('analytics.noData')}
                </Text>
              )}
            </View>

            {/* Morning vs Evening */}
            <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <View style={[styles.statIconCircle, { backgroundColor: colors.accent + '15' }]}>
                <Icon name="sunny" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.statLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                {t('analytics.morningVsEvening')}
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
                  {t('analytics.noData')}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Circadian Patterns Card */}
          <CircadianCard records={records} allRecords={allRecords ?? []} />

          {/* Weight Trend Card */}
          {weightTrend.hasData && (
            <Animated.View
              entering={FadeInUp.delay(270).duration(500)}
              style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
            >
              <View style={styles.weightTitleRow}>
                <Icon name="scale-outline" size={20} color={colors.accent} />
                <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg, marginBottom: 0 }]}>
                  {t('analytics.weightTrend.title')}
                </Text>
              </View>

              {/* Weight Stats Grid */}
              <View style={styles.weightStatsGrid}>
                <View style={[styles.weightStatItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.weightStatLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    {t('analytics.weightTrend.avgWeight')}
                  </Text>
                  <Text style={[styles.weightStatValue, { color: colors.textPrimary, fontSize: typography.lg }]}>
                    {formatWeight(weightTrend.avgWeight!, weightUnit)}
                  </Text>
                </View>
                <View style={[styles.weightStatItem, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                  <Text style={[styles.weightStatLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    {t('analytics.weightTrend.weightRange')}
                  </Text>
                  <Text style={[styles.weightStatValue, { color: colors.textPrimary, fontSize: typography.lg }]}>
                    {formatWeight(weightTrend.minWeight!, weightUnit)} – {formatWeight(weightTrend.maxWeight!, weightUnit)}
                  </Text>
                </View>
              </View>

              {/* BMI from average weight */}
              {userHeight != null && weightTrend.avgWeight != null && (() => {
                const avgBmi = calculateBMI(weightTrend.avgWeight, userHeight);
                if (avgBmi == null) return null;
                const cat = getBMICategory(avgBmi);
                return (
                  <View style={[styles.bmiTrendRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                    <Icon name="body-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.bmiTrendLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
                      {t('analytics.weightTrend.bmiTrend')}
                    </Text>
                    <Text style={[styles.bmiTrendValue, { color: colors.textPrimary, fontSize: typography.md }]}>
                      {avgBmi}
                    </Text>
                    <View style={[styles.bmiCategoryChip, { backgroundColor: colors.accent + '15' }]}>
                      <Text style={[styles.bmiCategoryText, { color: colors.accent, fontSize: typography.xs }]}>
                        {tCommon(`bmi.${cat}` as any)}
                      </Text>
                    </View>
                  </View>
                );
              })()}

              {/* Weight-BP Correlation */}
              {weightCorrelation.hasData && (
                <View style={styles.correlationSection}>
                  <Text style={[styles.correlationTitle, { color: colors.textPrimary, fontSize: typography.md }]}>
                    {t('analytics.weightTrend.correlation')}
                  </Text>
                  <View style={styles.correlationRow}>
                    <View style={styles.correlationItem}>
                      <Text style={[styles.correlationLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                        {tCommon('common.systolic')}
                      </Text>
                      <Text style={[styles.correlationValue, { color: colors.textPrimary, fontSize: typography.lg }]}>
                        {weightCorrelation.systolicCorrelation?.toFixed(2) ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.correlationItem}>
                      <Text style={[styles.correlationLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                        {tCommon('common.diastolic')}
                      </Text>
                      <Text style={[styles.correlationValue, { color: colors.textPrimary, fontSize: typography.lg }]}>
                        {weightCorrelation.diastolicCorrelation?.toFixed(2) ?? '—'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.correlationDisclaimer, { color: colors.textTertiary, fontSize: typography.xs }]}>
                    {t('analytics.weightTrend.correlationDisclaimer')}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Lifestyle Insights */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)}>
            <CorrelationCard correlations={correlations} />
          </Animated.View>

          {/* Doctor Notes */}
          <Animated.View
            entering={FadeInUp.delay(280).duration(500)}
            style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('analytics.doctorNote.label')}
            </Text>
            <TextInput
              value={doctorNote}
              onChangeText={setDoctorNote}
              placeholder={t('analytics.doctorNote.placeholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              style={[
                styles.notesInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: colors.border,
                  fontSize: typography.sm,
                },
              ]}
            />
          </Animated.View>

          {/* Medical Disclaimer */}
          <Text style={[styles.disclaimerText, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('analytics.disclaimer')}
          </Text>

          {/* Export PDF Button */}
          <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.exportContainer}>
            {/* Include PP/MAP Checkbox */}
            <Pressable
              style={styles.checkboxRow}
              onPress={() => setIncludePPMAPInExport(!includePPMAPInExport)}
              accessibilityRole="checkbox"
              accessibilityLabel={t('analytics.export.includePPMAP')}
              accessibilityState={{ checked: includePPMAPInExport }}
            >
              <View style={[styles.checkbox, { borderColor: colors.border }]}>
                {includePPMAPInExport && (
                  <Icon name="checkmark" size={18} color={colors.accent} />
                )}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary, fontSize: typography.md }]}>
                {t('analytics.export.includePPMAP')}
              </Text>
            </Pressable>

            <View style={styles.exportButtonsRow}>
              {/* Save to Device */}
              <Pressable
                style={[
                  styles.exportButton,
                  styles.exportButtonSecondary,
                  {
                    backgroundColor: isExporting ? colors.border : colors.surfaceSecondary,
                    borderColor: isExporting ? colors.border : colors.accent,
                  },
                ]}
                onPress={() =>
                  downloadPdf(records, {
                    period: getPeriodLabel(),
                    doctorNote: doctorNote.trim() || undefined,
                    includePPMAP: includePPMAPInExport,
                  })
                }
                disabled={isExporting}
                accessibilityRole="button"
                accessibilityLabel={t('analytics.savePdf')}
                accessibilityState={{ disabled: isExporting }}
              >
                <Icon
                  name="download-outline"
                  size={22}
                  color={isExporting ? colors.textTertiary : colors.accent}
                />
                <Text
                  style={[
                    styles.exportButtonText,
                    { color: isExporting ? colors.textTertiary : colors.accent, fontSize: typography.md },
                  ]}
                >
                  {activeAction === 'save' ? t('analytics.savingPdf') : t('analytics.savePdf')}
                </Text>
              </Pressable>

              {/* Share PDF */}
              <Pressable
                style={[
                  styles.exportButton,
                  { backgroundColor: isExporting ? colors.border : colors.accent },
                ]}
                onPress={() =>
                  exportPdf(records, {
                    period: getPeriodLabel(),
                    doctorNote: doctorNote.trim() || undefined,
                    includePPMAP: includePPMAPInExport,
                  })
                }
                disabled={isExporting}
                accessibilityRole="button"
                accessibilityLabel={t('analytics.exportPdf')}
                accessibilityState={{ disabled: isExporting }}
              >
                <Icon name="share-outline" size={22} color={colors.surface} />
                <Text style={[styles.exportButtonText, { color: colors.surface, fontSize: typography.md }]}>
                  {activeAction === 'share' ? t('analytics.generatingPdf') : t('analytics.exportPdf')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Segment control
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentTabActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // Owner filter
  ownerFilterContainer: {
    marginBottom: 4,
  },

  // History filters
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
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // Analytics scroll
  analyticsScrollContent: {
    paddingBottom: 100,
  },

  // Chart card / generic card
  card: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 12,
  },

  // Period selector chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  customRangeRow: {
    marginTop: 14,
    gap: 8,
  },
  rangeLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 4,
  },

  // Doctor notes
  notesInput: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlignVertical: 'top',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: '46%',
    borderRadius: 20,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  statNoData: {
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  amPmContainer: {
    marginTop: 4,
  },
  amPmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amPmLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  amPmValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  amPmDivider: {
    height: 1,
    marginVertical: 6,
  },

  // Toggles
  togglesRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },

  // Weight Trend
  weightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  weightStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  weightStatItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weightStatLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 4,
  },
  weightStatValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  bmiTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  bmiTrendLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    flex: 1,
  },
  bmiTrendValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginRight: 6,
  },
  bmiCategoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bmiCategoryText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  correlationSection: {
    marginTop: 4,
  },
  correlationTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 10,
  },
  correlationRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  correlationItem: {
    flex: 1,
    alignItems: 'center',
  },
  correlationLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 4,
  },
  correlationValue: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  correlationDisclaimer: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Disclaimer
  disclaimerText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 32,
    marginBottom: 16,
  },

  // Export
  exportContainer: {
    paddingHorizontal: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  exportButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  exportButtonSecondary: {
    borderWidth: 1.5,
  },
  exportButtonText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },

  // Profile context row
  profileRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useLatestBPRecord, useBPRecords } from '../../../features/record-bp';
import {
  classifyBP,
  getBPCategoryLabel,
} from '../../../entities/blood-pressure';
import { useSettingsStore } from '../../../shared/lib';
import { useTheme } from '../../../shared/lib/use-theme';
import { LineChart } from '../../../shared/ui/LineChart';

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting.morning' as const;
  if (hour < 18) return 'home.greeting.afternoon' as const;
  return 'home.greeting.evening' as const;
}

export function HomePage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { width: screenWidth } = useWindowDimensions();
  const { data: latestRecord } = useLatestBPRecord();
  const { data: recentRecords } = useBPRecords(7);
  const { guideline } = useSettingsStore();
  const { colors } = useTheme();

  const latestCategory = latestRecord
    ? classifyBP(latestRecord.systolic, latestRecord.diastolic, guideline)
    : null;

  const categoryLabel = latestCategory
    ? getBPCategoryLabel(latestCategory)
    : '';

  // Prepare chart data (reverse so oldest is first)
  const chartData = useMemo(() => {
    if (!recentRecords || recentRecords.length === 0) return [];
    return [...recentRecords].reverse().map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
    }));
  }, [recentRecords]);

  const chartWidth = screenWidth - 40; // 20px margin on each side

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.greetingSection}>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              {t(getGreetingKey())},
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {t('home.userName')}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Icon name="shield-checkmark" size={20} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              {t('home.encryptedOffline')}
            </Text>
          </View>
        </Animated.View>

        {/* Main BP Reading Card */}
        <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.bpCardWrapper}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bpCard}
          >
            {/* Decorative wave overlay */}
            <View style={styles.cardOverlay} />

            <Text style={styles.bpCardLabel}>{t('home.bpReadings')}</Text>

            <View style={styles.bpValueRow}>
              <Text style={styles.bpValueLarge}>
                {latestRecord
                  ? `${latestRecord.systolic}/${latestRecord.diastolic}`
                  : '---/---'}
              </Text>
            </View>
            <Text style={styles.bpUnit}>{tCommon('units.mmhg')}</Text>

            <View style={styles.bpCardBottom}>
              {/* Category label */}
              <View style={styles.categoryRow}>
                {latestCategory ? (
                  <>
                    <Icon name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.categoryText}>{categoryLabel}</Text>
                  </>
                ) : (
                  <Text style={styles.categoryTextEmpty}>
                    {t('home.noReadingsYet')}
                  </Text>
                )}
              </View>

              {/* Pulse badge */}
              {latestRecord?.pulse ? (
                <View style={styles.pulseBadge}>
                  <Icon name="heart" size={18} color="#ffffff" />
                  <Text style={styles.pulseValue}>{latestRecord.pulse}</Text>
                  <Text style={styles.pulseUnit}>{tCommon('units.bpm')}</Text>
                </View>
              ) : null}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* 7-Day Trend Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={[styles.trendCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.trendTitle, { color: colors.textPrimary }]}>
            {t('home.last7Days')}
          </Text>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={160}
            emptyText={t('home.addFirstReading')}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingSection: {
    flex: 1,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '400',
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // BP Card
  bpCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  bpCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    minHeight: 220,
  },
  cardOverlay: {
    position: 'absolute',
    top: 40,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bpCardLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 12,
  },
  bpValueRow: {
    marginBottom: 2,
  },
  bpValueLarge: {
    fontSize: 56,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  bpUnit: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 20,
  },
  bpCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
  categoryTextEmpty: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  pulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
  },
  pulseValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  pulseUnit: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Trend Card
  trendCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});

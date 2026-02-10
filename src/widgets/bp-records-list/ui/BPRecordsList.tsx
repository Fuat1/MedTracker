import React from 'react';
import { View, Text, SectionList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BPRecordCard } from '../../bp-record-card';
import type { BPRecord } from '../../../shared/api';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';

interface BPRecordsListProps {
  sections: Array<{ title: string; data: BPRecord[] }>;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
}

export function BPRecordsList({ sections, isLoading, isError, isRefetching, onRefresh }: BPRecordsListProps) {
  const { t } = useTranslation('widgets');
  const { colors } = useTheme();

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
    <BPRecordCard record={item} variant="compact" />
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
    </View>
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
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          colors={[colors.accent]}
          tintColor={colors.accent}
        />
      }
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
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
    fontFamily: FONTS.regular,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontFamily: FONTS.regular,
  },
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
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});

import React, { useCallback } from 'react';
import { View, Text, SectionList, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BPRecord } from '../../../shared/api';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';

interface BPRecordsListProps {
  sections: Array<{ title: string; data: BPRecord[] }>;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  renderCard: (record: BPRecord) => React.ReactElement;
}

export function BPRecordsList({ sections, isLoading, isError, isRefetching, onRefresh, renderCard }: BPRecordsListProps) {
  const { t } = useTranslation('widgets');
  const { colors, fontScale, typography } = useTheme();

  // Hooks MUST be declared before any early returns (Rules of Hooks)
  const renderItem = useCallback(({ item }: { item: BPRecord }) => (
    renderCard(item)
  ), [renderCard]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: typography.sm }]}>
        {section.title}
      </Text>
    </View>
  ), [colors.textSecondary, typography.sm]);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { fontSize: Math.round(60 * fontScale) }]}>💓</Text>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
        {t('bpRecordsList.empty.title')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        {t('bpRecordsList.empty.subtitle')}
      </Text>
    </View>
  ), [colors.textPrimary, colors.textTertiary, t, fontScale, typography.lg]);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: typography.sm }]}>
          {t('bpRecordsList.loading')}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.errorTitle, { color: colors.error, fontSize: typography.lg }]}>
          {t('bpRecordsList.error.title')}
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
          {t('bpRecordsList.error.subtitle')}
        </Text>
      </View>
    );
  }

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
    marginBottom: 16,
  },
  emptyTitle: {
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

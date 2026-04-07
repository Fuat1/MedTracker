import React, { useCallback } from 'react';
import { SectionList, RefreshControl, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { BPRecord } from '../../../shared/api';
import { useTheme } from '../../../shared/lib/use-theme';
import { EmptyState, LoadingState, ErrorState, SectionHeader } from '../../../shared/ui';

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
  const { colors } = useTheme();

  const renderItem = useCallback(({ item }: { item: BPRecord }) => (
    renderCard(item)
  ), [renderCard]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
    <SectionHeader title={section.title} />
  ), []);

  const renderEmpty = useCallback(() => (
    <EmptyState
      icon="💓"
      title={t('bpRecordsList.empty.title')}
      subtitle={t('bpRecordsList.empty.subtitle')}
    />
  ), [t]);

  if (isLoading) {
    return <LoadingState message={t('bpRecordsList.loading')} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t('bpRecordsList.error.title')}
        subtitle={t('bpRecordsList.error.subtitle')}
      />
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
});

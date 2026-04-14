/**
 * MetricNewReadingPage
 *
 * Generic new-reading screen. Uses the active MetricConfig to render
 * MetricEntryForm, which dispatches to the metric's EntryForm override
 * (e.g., BPReadingForm for blood-pressure) or GenericEntryForm.
 *
 * For BP: MetricEntryForm → BPReadingForm (handles submission internally).
 * For other metrics: MetricEntryForm → GenericEntryForm → calls onSubmit.
 *
 * Extra props (variant, title, autoAdvance) are forwarded to the BP override.
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MetricEntryForm } from '../../../widgets/metric-entry-form';
import { getActiveMetricConfig } from '../../../shared/config/metric-registry';
import { useRecordMetric } from '../../../features/record-metric';
import type { RecordMetricInput } from '../../../features/record-metric';

export function MetricNewReadingPage() {
  const { t } = useTranslation('pages');
  const navigation = useNavigation();
  const config = useMemo(() => getActiveMetricConfig(), []);
  const { mutate, isPending } = useRecordMetric(config);

  const handleSubmit = useCallback(
    (values: Record<string, unknown>, tags?: string[]) => {
      const input: RecordMetricInput = { fieldValues: values, tags };
      mutate(input, { onSuccess: () => navigation.goBack() });
    },
    [mutate, navigation],
  );

  const handleDismiss = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <MetricEntryForm
      config={config}
      onSubmit={handleSubmit}
      isLoading={isPending}
      onDismiss={handleDismiss}
      // BP-specific props forwarded to BPReadingForm via {...rest} spread in MetricEntryForm.
      // BPReadingForm handles its own submission internally and ignores onSubmit.
      variant="full"
      title={t('newReading.title')}
      autoAdvance={false}
    />
  );
}

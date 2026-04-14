/**
 * MetricEntryForm
 *
 * Override-aware entry form. If the metric config registers a custom EntryForm
 * component (e.g., BPReadingForm for blood-pressure), it renders that.
 * Otherwise falls back to GenericEntryForm.
 */

import React from 'react';
import { GenericEntryForm } from './GenericEntryForm';
import type { MetricConfig } from '../../../shared/config/metric-types';

interface MetricEntryFormProps<TValues extends Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<any, TValues>;
  onSubmit: (values: Partial<TValues>, tags?: string[]) => void;
  isLoading?: boolean;
  onDismiss?: () => void;
  /** Any extra props forwarded to the override component */
  [key: string]: unknown;
}

export function MetricEntryForm<TValues extends Record<string, unknown>>({
  config,
  onSubmit,
  isLoading,
  onDismiss,
  ...rest
}: MetricEntryFormProps<TValues>) {
  const Override = config.components?.EntryForm;

  if (Override) {
    return (
      <Override
        config={config}
        onSubmit={onSubmit}
        isLoading={isLoading}
        onDismiss={onDismiss}
        {...rest}
      />
    );
  }

  return (
    <GenericEntryForm
      config={config}
      onSubmit={onSubmit}
      isLoading={isLoading}
      onDismiss={onDismiss}
    />
  );
}

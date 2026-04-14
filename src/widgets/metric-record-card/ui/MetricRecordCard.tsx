/**
 * MetricRecordCard
 *
 * Override-aware record card. If the metric config registers a custom RecordCard
 * component (e.g., BPRecordCard for blood-pressure), it renders that.
 * Otherwise falls back to GenericRecordCard.
 */

import React from 'react';
import { GenericRecordCard } from './GenericRecordCard';
import type { MetricConfig } from '../../../shared/config/metric-types';

interface MetricRecordCardProps<TRecord> {
  record: TRecord;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<TRecord, any>;
  variant?: 'full' | 'compact';
  tags?: string[];
  onPress?: () => void;
  /** Any extra props forwarded to the override component */
  [key: string]: unknown;
}

export function MetricRecordCard<TRecord extends { id: string; timestamp: number }>({
  record,
  config,
  variant,
  tags,
  onPress,
  ...rest
}: MetricRecordCardProps<TRecord>) {
  const Override = config.components?.RecordCard;

  if (Override) {
    return (
      <Override
        record={record}
        variant={variant}
        tags={tags}
        onPress={onPress}
        {...rest}
      />
    );
  }

  return (
    <GenericRecordCard
      record={record}
      config={config}
      variant={variant}
      tags={tags}
      onPress={onPress}
    />
  );
}

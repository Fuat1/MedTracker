/**
 * BP component overrides.
 *
 * This file lives in app/ (not entities/) so it can freely import from widgets/
 * without violating FSD — entities/ cannot import from widgets/.
 *
 * These overrides are merged with bpConfig at registerMetric() call time.
 */

import React from 'react';
import { useWindowDimensions } from 'react-native';
import { BPReadingForm } from '../../widgets/bp-reading-form';
import { BPRecordCard } from '../../widgets/bp-record-card';
import { CircadianCard } from '../../widgets/circadian-card';
import { BPTrendChart } from '../../shared/ui';
import type { BPRecord } from '../../shared/api';
import type { ComponentOverrides } from '../../shared/config/metric-types';

/**
 * Adapts `records: BPRecord[]` to the DataPoint[] shape expected by BPTrendChart.
 * Receives records + width from MetricTrendChart's generic spread.
 */
const BPTrendChartOverride: React.FC<{ records: BPRecord[]; width?: number }> = React.memo(
  ({ records, width: widthProp }) => {
    const { width: screenWidth } = useWindowDimensions();
    const chartWidth = widthProp ?? screenWidth - 40;
    const data = records.map(r => ({
      systolic: r.systolic,
      diastolic: r.diastolic,
      pp: r.systolic - r.diastolic,
    }));
    return React.createElement(BPTrendChart, { data, width: chartWidth, height: 160 });
  },
);

export const bpComponents: ComponentOverrides = {
  /**
   * Replaces GenericEntryForm for blood-pressure.
   * BPReadingForm has a dual-numpad, guided breathing, auto-advance, and
   * tag/context selection — all BP-specific.
   */
  EntryForm: BPReadingForm as ComponentOverrides['EntryForm'],

  /**
   * Replaces GenericRecordCard for blood-pressure.
   * BPRecordCard shows systolic/diastolic/pulse, classification badge, tags,
   * weight, BMI, and pulse-pressure chip — all BP-specific.
   */
  RecordCard: BPRecordCard as ComponentOverrides['RecordCard'],

  /**
   * Adapts records array to BPTrendChart's DataPoint[] format.
   * MetricTrendChart passes records + width as props.
   */
  TrendChart: BPTrendChartOverride as ComponentOverrides['TrendChart'],

  /**
   * Renders inside MetricCircadianCard on the home page.
   * Only consulted when config.circadian.enabled === true (which it is for BP).
   */
  CircadianCard: CircadianCard as ComponentOverrides['CircadianCard'],
};

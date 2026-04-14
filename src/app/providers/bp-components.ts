/**
 * BP component overrides.
 *
 * This file lives in app/ (not entities/) so it can freely import from widgets/
 * without violating FSD — entities/ cannot import from widgets/.
 *
 * These overrides are merged with bpConfig at registerMetric() call time.
 */

import { BPReadingForm } from '../../widgets/bp-reading-form';
import { BPRecordCard } from '../../widgets/bp-record-card';
import { CircadianCard } from '../../widgets/circadian-card';
import type { ComponentOverrides } from '../../shared/config/metric-types';

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
   * Renders inside MetricCircadianCard on the home page.
   * Only consulted when config.circadian.enabled === true (which it is for BP).
   */
  CircadianCard: CircadianCard as ComponentOverrides['CircadianCard'],
};

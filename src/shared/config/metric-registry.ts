/**
 * MetricRegistry — Runtime registry for health metric configurations.
 *
 * Metrics are registered at app startup (in app/providers/) and then looked
 * up by generic screens, widgets, and repository functions.
 *
 * This module is intentionally free of React dependencies so it can be
 * used in non-React contexts (background sync, PDF export, etc.).
 *
 * Usage:
 *   // app/providers/index.tsx
 *   import { registerMetric } from '@/shared/config/metric-registry';
 *   import { bpConfig } from '@/entities/blood-pressure/config';
 *   import { bpComponents } from '@/entities/blood-pressure/components';
 *   registerMetric({ ...bpConfig, components: bpComponents });
 *
 *   // anywhere else
 *   import { getMetricConfig } from '@/shared/config/metric-registry';
 *   const config = getMetricConfig('blood-pressure');
 */

import type { MetricConfig } from './metric-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMetricConfig = MetricConfig<any, any>;

const registry = new Map<string, AnyMetricConfig>();

/**
 * Register a metric config.
 * Must be called before `initDatabase()` and before any generic screen/widget
 * attempts to read the config.
 *
 * Typically called once per metric in `app/providers/index.tsx`.
 *
 * @throws if a config with the same `id` is already registered
 */
export function registerMetric(config: AnyMetricConfig): void {
  if (registry.has(config.id)) {
    throw new Error(
      `[MetricRegistry] A metric with id "${config.id}" is already registered. ` +
        'Check your app/providers/ for duplicate registerMetric() calls.',
    );
  }
  registry.set(config.id, config);
}

/**
 * Look up a registered metric config by ID.
 *
 * @throws if no metric with the given ID has been registered
 */
export function getMetricConfig(metricId: string): AnyMetricConfig {
  const config = registry.get(metricId);
  if (!config) {
    throw new Error(
      `[MetricRegistry] No metric found with id "${metricId}". ` +
        `Registered metrics: [${Array.from(registry.keys()).join(', ')}]. ` +
        'Make sure registerMetric() is called before any usage.',
    );
  }
  return config;
}

/**
 * Look up a registered metric config by ID, typed.
 * Use this when you know the concrete TRecord/TValues types.
 *
 * @throws if no metric with the given ID has been registered
 */
export function getTypedMetricConfig<
  TRecord extends Record<string, unknown>,
  TValues extends Record<string, unknown>,
>(metricId: string): MetricConfig<TRecord, TValues> {
  return getMetricConfig(metricId) as MetricConfig<TRecord, TValues>;
}

/**
 * Returns all registered metric configs in registration order.
 */
export function getAllMetricConfigs(): ReadonlyArray<AnyMetricConfig> {
  return Array.from(registry.values());
}

/**
 * Returns the ID of the currently "active" metric.
 *
 * For now this always returns the first registered metric.
 * In the future this could read from a settings store or navigation param.
 */
export function getActiveMetricId(): string {
  const first = registry.keys().next();
  if (first.done) {
    throw new Error(
      '[MetricRegistry] No metrics registered. Call registerMetric() in app/providers/ first.',
    );
  }
  return first.value;
}

/**
 * Returns the active metric config (first registered metric).
 *
 * @throws if no metrics have been registered
 */
export function getActiveMetricConfig(): AnyMetricConfig {
  return getMetricConfig(getActiveMetricId());
}

/**
 * Clears the registry. Intended for use in unit tests only.
 */
export function _clearRegistry_testOnly(): void {
  registry.clear();
}

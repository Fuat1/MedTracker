import type { TFunction } from 'i18next';
import type { WeatherCorrelation, WeatherMetric } from '../types';

type ConditionLabel = { above: string; below: string };

function getConditionLabels(
  metric: WeatherMetric,
  t: TFunction<'widgets'>,
): ConditionLabel {
  switch (metric) {
    case 'temperature':
      return {
        above: t('weatherCorrelation.conditions.warm'),
        below: t('weatherCorrelation.conditions.cold'),
      };
    case 'pressure':
      return {
        above: t('weatherCorrelation.conditions.highPressure'),
        below: t('weatherCorrelation.conditions.lowPressure'),
      };
    case 'humidity':
      return {
        above: t('weatherCorrelation.conditions.humid'),
        below: t('weatherCorrelation.conditions.dry'),
      };
    case 'windSpeed':
      return {
        above: t('weatherCorrelation.conditions.windy'),
        below: t('weatherCorrelation.conditions.calm'),
      };
  }
}

/**
 * Convert a WeatherCorrelation into a human-readable insight string.
 * Uses the widgets i18n namespace.
 */
export function getWeatherInsightText(
  correlation: WeatherCorrelation,
  t: TFunction<'widgets'>,
): string {
  const delta = Math.abs(correlation.avgSystolicDelta);
  const labels = getConditionLabels(correlation.metric, t);

  // Positive delta: BP higher when metric above median
  if (correlation.avgSystolicDelta > 0) {
    return t('weatherCorrelation.higher', {
      delta,
      condition: labels.above,
    });
  }

  // Negative delta: BP higher when metric below median
  return t('weatherCorrelation.higher', {
    delta,
    condition: labels.below,
  });
}

/**
 * Get the Ionicons icon name for a weather metric.
 */
export function getMetricIcon(metric: WeatherMetric): string {
  switch (metric) {
    case 'temperature':
      return 'thermometer-outline';
    case 'pressure':
      return 'speedometer-outline';
    case 'humidity':
      return 'water-outline';
    case 'windSpeed':
      return 'flag-outline';
  }
}

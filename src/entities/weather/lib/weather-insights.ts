import type { WeatherMetric } from '../types';

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

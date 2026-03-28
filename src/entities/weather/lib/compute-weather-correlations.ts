import type { BPRecord } from '../../../shared/api/bp-repository';
import type { WeatherReading, WeatherMetric, WeatherCorrelation } from '../types';

const MIN_SAMPLE_SIZE = 5;
const MIN_SYSTOLIC_DELTA = 3; // mmHg

interface RecordWithWeather {
  systolic: number;
  diastolic: number;
  weather: WeatherReading;
}

function getMetricValue(weather: WeatherReading, metric: WeatherMetric): number | null {
  switch (metric) {
    case 'temperature':
      return weather.temperature;
    case 'pressure':
      return weather.pressure;
    case 'humidity':
      return weather.humidity;
    case 'windSpeed':
      return weather.windSpeed;
  }
}

function getMetricUnit(metric: WeatherMetric, tempUnit: 'celsius' | 'fahrenheit'): string {
  switch (metric) {
    case 'temperature':
      return tempUnit === 'fahrenheit' ? '°F' : '°C';
    case 'pressure':
      return 'hPa';
    case 'humidity':
      return '%';
    case 'windSpeed':
      return 'm/s';
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function computeForMetric(
  pairs: RecordWithWeather[],
  metric: WeatherMetric,
  tempUnit: 'celsius' | 'fahrenheit',
): WeatherCorrelation | null {
  // Collect valid pairs for this metric
  const valid = pairs.filter(p => getMetricValue(p.weather, metric) != null);
  if (valid.length < MIN_SAMPLE_SIZE * 2) return null;

  const values = valid.map(p => getMetricValue(p.weather, metric)!);
  const med = median(values);

  const above = valid.filter(p => getMetricValue(p.weather, metric)! >= med);
  const below = valid.filter(p => getMetricValue(p.weather, metric)! < med);

  if (above.length < MIN_SAMPLE_SIZE || below.length < MIN_SAMPLE_SIZE) return null;

  const avgSysAbove = Math.round(above.reduce((s, p) => s + p.systolic, 0) / above.length);
  const avgDiaAbove = Math.round(above.reduce((s, p) => s + p.diastolic, 0) / above.length);
  const avgSysBelow = Math.round(below.reduce((s, p) => s + p.systolic, 0) / below.length);
  const avgDiaBelow = Math.round(below.reduce((s, p) => s + p.diastolic, 0) / below.length);

  const sysDelta = avgSysAbove - avgSysBelow;
  const diaDelta = avgDiaAbove - avgDiaBelow;

  if (Math.abs(sysDelta) < MIN_SYSTOLIC_DELTA) return null;

  return {
    metric,
    avgSystolicDelta: sysDelta,
    avgDiastolicDelta: diaDelta,
    aboveCount: above.length,
    belowCount: below.length,
    medianValue: Math.round(med * 10) / 10,
    unit: getMetricUnit(metric, tempUnit),
  };
}

/**
 * Compute weather-BP correlations using median-split analysis.
 *
 * For each weather metric, splits readings into above/below median groups
 * and computes average BP delta between groups.
 */
export function computeWeatherCorrelations(
  records: BPRecord[],
  weatherMap: Record<string, WeatherReading>,
  temperatureUnit: 'celsius' | 'fahrenheit' = 'celsius',
): WeatherCorrelation[] {
  // Build paired data
  const pairs: RecordWithWeather[] = [];
  for (const record of records) {
    const weather = weatherMap[record.id];
    if (weather) {
      pairs.push({
        systolic: record.systolic,
        diastolic: record.diastolic,
        weather,
      });
    }
  }

  if (pairs.length < MIN_SAMPLE_SIZE * 2) return [];

  const metrics: WeatherMetric[] = ['temperature', 'pressure', 'humidity', 'windSpeed'];
  const results: WeatherCorrelation[] = [];

  for (const metric of metrics) {
    const correlation = computeForMetric(pairs, metric, temperatureUnit);
    if (correlation) {
      results.push(correlation);
    }
  }

  // Sort by absolute systolic delta (most significant first)
  results.sort((a, b) => Math.abs(b.avgSystolicDelta) - Math.abs(a.avgSystolicDelta));

  return results;
}

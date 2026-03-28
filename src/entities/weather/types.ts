export interface WeatherReading {
  id: string;
  recordId: string;
  temperature: number; // °C
  feelsLike: number | null; // °C
  pressure: number; // hPa
  humidity: number; // 0-100 %
  windSpeed: number | null; // m/s
  weatherCode: number; // WMO weather interpretation code
  weatherDesc: string; // Human-readable description
  latitude: number;
  longitude: number;
  cityName: string | null;
  fetchedAt: number; // Unix seconds
  createdAt: number; // Unix seconds
}

export interface WeatherReadingInput {
  recordId: string;
  temperature: number;
  feelsLike?: number | null;
  pressure: number;
  humidity: number;
  windSpeed?: number | null;
  weatherCode: number;
  weatherDesc: string;
  latitude: number;
  longitude: number;
  cityName?: string | null;
}

export type WeatherMetric = 'temperature' | 'pressure' | 'humidity' | 'windSpeed';

export interface WeatherCorrelation {
  metric: WeatherMetric;
  avgSystolicDelta: number; // mmHg
  avgDiastolicDelta: number; // mmHg
  aboveCount: number;
  belowCount: number;
  medianValue: number; // The split point
  unit: string; // '°C'/'°F', 'hPa', '%', 'm/s'
}

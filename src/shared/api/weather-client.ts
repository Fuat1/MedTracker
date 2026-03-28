import {
  WEATHER_API_BASE,
  GEOCODING_API_BASE,
  WEATHER_API_TIMEOUT,
  WEATHER_CURRENT_PARAMS,
  GEOCODING_MAX_RESULTS,
} from '../config/weather';

export interface OpenMeteoCurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  surface_pressure: number;
  wind_speed_10m: number;
  weather_code: number;
}

export interface OpenMeteoWeatherResponse {
  current: OpenMeteoCurrentWeather;
}

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

interface GeocodingResponse {
  results?: GeocodingResult[];
}

/**
 * Fetch current weather from Open-Meteo.
 * Throws on network error or timeout.
 */
export async function fetchCurrentWeather(
  lat: number,
  lon: number,
): Promise<OpenMeteoCurrentWeather> {
  const url = `${WEATHER_API_BASE}?latitude=${lat}&longitude=${lon}&current=${WEATHER_CURRENT_PARAMS}&timezone=auto`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    const data = (await response.json()) as OpenMeteoWeatherResponse;
    return data.current;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search cities via Open-Meteo geocoding API.
 * Returns empty array on failure (non-throwing).
 */
export async function searchCities(
  query: string,
): Promise<GeocodingResult[]> {
  if (!query.trim()) return [];

  const url = `${GEOCODING_API_BASE}?name=${encodeURIComponent(query)}&count=${GEOCODING_MAX_RESULTS}&language=en`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_API_TIMEOUT);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];
    const data = (await response.json()) as GeocodingResponse;
    return data.results ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

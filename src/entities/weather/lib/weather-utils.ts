/**
 * Convert Celsius to Fahrenheit.
 */
export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

/**
 * Format temperature with unit symbol.
 */
export function formatTemperature(
  celsius: number,
  unit: 'celsius' | 'fahrenheit',
): string {
  if (unit === 'fahrenheit') {
    return `${celsiusToFahrenheit(celsius)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * WMO Weather Interpretation Code → human-readable description.
 * See: https://open-meteo.com/en/docs#weathervariables
 */
const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing light drizzle',
  57: 'Freezing dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing light rain',
  67: 'Freezing heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function weatherCodeToDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}

/**
 * WMO Weather Code → Ionicons icon name.
 */
export function weatherCodeToIcon(code: number): string {
  if (code === 0) return 'sunny-outline';
  if (code <= 2) return 'partly-sunny-outline';
  if (code === 3) return 'cloud-outline';
  if (code <= 48) return 'cloud-outline'; // fog
  if (code <= 57) return 'rainy-outline'; // drizzle
  if (code <= 67) return 'rainy-outline'; // rain
  if (code <= 77) return 'snow-outline'; // snow
  if (code <= 82) return 'rainy-outline'; // showers
  if (code <= 86) return 'snow-outline'; // snow showers
  return 'thunderstorm-outline'; // thunderstorm
}

export const WEATHER_API_BASE = 'https://api.open-meteo.com/v1/forecast';
export const GEOCODING_API_BASE = 'https://geocoding-api.open-meteo.com/v1/search';

export const WEATHER_API_TIMEOUT = 5000; // ms
export const GPS_TIMEOUT = 10000; // ms
export const GEOCODING_MAX_RESULTS = 5;

export const WEATHER_CURRENT_PARAMS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'surface_pressure',
  'wind_speed_10m',
  'weather_code',
].join(',');

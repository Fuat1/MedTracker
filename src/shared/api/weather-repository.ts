import { getDatabase } from './db';
import { generateUUID, getCurrentTimestamp } from '../lib';
import type { WeatherReading, WeatherReadingInput } from '../../entities/weather';

// Database row type
interface WeatherReadingRow {
  id: string;
  record_id: string;
  temperature: number;
  feels_like: number | null;
  pressure: number;
  humidity: number;
  wind_speed: number | null;
  weather_code: number;
  weather_desc: string;
  latitude: number;
  longitude: number;
  city_name: string | null;
  fetched_at: number;
  created_at: number;
}

function rowToWeatherReading(row: WeatherReadingRow): WeatherReading {
  return {
    id: row.id,
    recordId: row.record_id,
    temperature: row.temperature,
    feelsLike: row.feels_like,
    pressure: row.pressure,
    humidity: row.humidity,
    windSpeed: row.wind_speed,
    weatherCode: row.weather_code,
    weatherDesc: row.weather_desc,
    latitude: row.latitude,
    longitude: row.longitude,
    cityName: row.city_name,
    fetchedAt: row.fetched_at,
    createdAt: row.created_at,
  };
}

export async function insertWeatherReading(
  input: WeatherReadingInput,
): Promise<void> {
  const db = getDatabase();
  const now = getCurrentTimestamp();
  const id = generateUUID();

  await db.execute(
    `INSERT INTO weather_readings (
      id, record_id, temperature, feels_like, pressure, humidity,
      wind_speed, weather_code, weather_desc, latitude, longitude,
      city_name, fetched_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.recordId,
      input.temperature,
      input.feelsLike ?? null,
      input.pressure,
      input.humidity,
      input.windSpeed ?? null,
      input.weatherCode,
      input.weatherDesc,
      input.latitude,
      input.longitude,
      input.cityName ?? null,
      now,
      now,
    ],
  );
}

export async function getWeatherForRecord(
  recordId: string,
): Promise<WeatherReading | null> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM weather_readings WHERE record_id = ?',
    [recordId],
  );
  const rows = (result.rows ?? []) as unknown as WeatherReadingRow[];
  return rows.length > 0 ? rowToWeatherReading(rows[0]) : null;
}

export async function getWeatherForRecords(
  recordIds: string[],
): Promise<Record<string, WeatherReading>> {
  if (recordIds.length === 0) return {};

  const db = getDatabase();
  const placeholders = recordIds.map(() => '?').join(',');
  const result = await db.execute(
    `SELECT * FROM weather_readings WHERE record_id IN (${placeholders})`,
    recordIds,
  );
  const rows = (result.rows ?? []) as unknown as WeatherReadingRow[];
  const map: Record<string, WeatherReading> = {};
  for (const row of rows) {
    map[row.record_id] = rowToWeatherReading(row);
  }
  return map;
}

export async function getAllWeatherReadings(): Promise<WeatherReading[]> {
  const db = getDatabase();
  const result = await db.execute(
    'SELECT * FROM weather_readings ORDER BY created_at DESC',
  );
  const rows = (result.rows ?? []) as unknown as WeatherReadingRow[];
  return rows.map(rowToWeatherReading);
}

export async function deleteWeatherForRecord(
  recordId: string,
): Promise<void> {
  const db = getDatabase();
  await db.execute(
    'DELETE FROM weather_readings WHERE record_id = ?',
    [recordId],
  );
}

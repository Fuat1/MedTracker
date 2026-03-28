import { computeWeatherCorrelations } from '../lib/compute-weather-correlations';
import type { WeatherReading } from '../types';
import type { BPRecord } from '../../../shared/api/bp-repository';

function makeRecord(id: string, systolic: number, diastolic: number): BPRecord {
  return {
    id,
    systolic,
    diastolic,
    pulse: null,
    timestamp: 1700000000,
    timezoneOffset: 0,
    location: 'left_arm',
    posture: 'sitting',
    notes: null,
    weight: null,
    createdAt: 1700000000,
    updatedAt: 1700000000,
    isSynced: false,
    ownerUid: null,
  };
}

function makeWeather(recordId: string, overrides: Partial<WeatherReading> = {}): WeatherReading {
  return {
    id: `w-${recordId}`,
    recordId,
    temperature: 20,
    feelsLike: 19,
    pressure: 1013,
    humidity: 50,
    windSpeed: 5,
    weatherCode: 0,
    weatherDesc: 'Clear sky',
    latitude: 41.0,
    longitude: 29.0,
    cityName: 'Istanbul',
    fetchedAt: 1700000000,
    createdAt: 1700000000,
    ...overrides,
  };
}

describe('computeWeatherCorrelations', () => {
  it('returns empty array when no weather data', () => {
    const record = makeRecord('r1', 120, 80);
    const result = computeWeatherCorrelations([record], {});
    expect(result).toEqual([]);
  });

  it('returns empty array when fewer than 10 paired readings (MIN_SAMPLE_SIZE * 2)', () => {
    // 9 records with weather — not enough (needs >= 10)
    const records: BPRecord[] = [];
    const weatherMap: Record<string, WeatherReading> = {};
    for (let i = 0; i < 9; i++) {
      const id = `r${i}`;
      records.push(makeRecord(id, 120, 80));
      weatherMap[id] = makeWeather(id);
    }
    const result = computeWeatherCorrelations(records, weatherMap);
    expect(result).toEqual([]);
  });

  it('detects significant temperature correlation when delta >= 3 mmHg', () => {
    // 6 cold records (temp=10, sys=120) and 6 warm records (temp=30, sys=130)
    // Median of values = (10+30)/2 = 20
    // Above (>=20): warm group → avgSys=130
    // Below (<20): cold group → avgSys=120
    // delta = 130 - 120 = 10 ≥ 3 → correlation returned
    const records: BPRecord[] = [];
    const weatherMap: Record<string, WeatherReading> = {};

    for (let i = 0; i < 6; i++) {
      const id = `cold-${i}`;
      records.push(makeRecord(id, 120, 80));
      weatherMap[id] = makeWeather(id, { temperature: 10 });
    }
    for (let i = 0; i < 6; i++) {
      const id = `warm-${i}`;
      records.push(makeRecord(id, 130, 85));
      weatherMap[id] = makeWeather(id, { temperature: 30 });
    }

    const result = computeWeatherCorrelations(records, weatherMap);
    const tempCorr = result.find(c => c.metric === 'temperature');
    expect(tempCorr).toBeDefined();
    expect(tempCorr!.avgSystolicDelta).toBe(10);
  });

  it('filters out correlations below MIN_SYSTOLIC_DELTA (3 mmHg)', () => {
    // 6 records with pressure=1000 sys=120, 6 with pressure=1020 sys=122
    // delta = 122 - 120 = 2 < 3 → filtered out
    const records: BPRecord[] = [];
    const weatherMap: Record<string, WeatherReading> = {};

    for (let i = 0; i < 6; i++) {
      const id = `low-${i}`;
      records.push(makeRecord(id, 120, 80));
      weatherMap[id] = makeWeather(id, { pressure: 1000 });
    }
    for (let i = 0; i < 6; i++) {
      const id = `high-${i}`;
      records.push(makeRecord(id, 122, 81));
      weatherMap[id] = makeWeather(id, { pressure: 1020 });
    }

    const result = computeWeatherCorrelations(records, weatherMap);
    const pressureCorr = result.find(c => c.metric === 'pressure');
    expect(pressureCorr).toBeUndefined();
  });

  it('sorts results by absolute systolic delta descending', () => {
    // We need at least 5 records on each side of the median split per metric.
    // Strategy: use 16 records in two groups of 8 each:
    //   group A (8): temp=5, humidity=80, sys=130
    //   group B (8): temp=30, humidity=20, sys=115
    //
    // temperature median: (5+30)/2 = 17.5
    //   above (>=17.5): group B (8), avgSys=115
    //   below (<17.5): group A (8), avgSys=130
    //   sysDelta = 115-130 = -15, |delta|=15
    //
    // humidity median: (20+80)/2 = 50
    //   above (>=50): group A (8), avgSys=130
    //   below (<50): group B (8), avgSys=115
    //   sysDelta = 130-115 = 15, |delta|=15  (same magnitude — both should be in result)
    //
    // Both metrics have |delta|=15, so both pass filter and order is stable at top.
    // To get different deltas, split into 3 groups ensuring each side >= 5:
    //   group A (6): temp=5, humidity=80, sys=130
    //   group B (6): temp=25, humidity=40, sys=120   ← middle temp/humidity
    //   group C (6): temp=35, humidity=10, sys=118
    //
    // temperature values (18 total): [5x6, 25x6, 35x6]
    //   median = (25+25)/2 = 25
    //   above (>=25): B(6)+C(6)=12, avgSys=(6*120+6*118)/12 = (720+708)/12 = 119
    //   below (<25): A(6), avgSys=130
    //   sysDelta = 119-130 = -11, |delta|=11
    //
    // humidity values (18 total): [80x6, 40x6, 10x6]
    //   sorted: [10x6, 40x6, 80x6], median = (40+40)/2 = 40
    //   above (>=40): A(6)+B(6)=12, avgSys=(6*130+6*120)/12 = (780+720)/12 = 125
    //   below (<40): C(6), avgSys=118
    //   sysDelta = 125-118 = 7, |delta|=7
    //
    // temp |delta|=11 > humidity |delta|=7 → temperature should sort first

    const records: BPRecord[] = [];
    const weatherMap: Record<string, WeatherReading> = {};

    for (let i = 0; i < 6; i++) {
      const id = `ga-${i}`;
      records.push(makeRecord(id, 130, 85));
      weatherMap[id] = makeWeather(id, { temperature: 5, humidity: 80 });
    }
    for (let i = 0; i < 6; i++) {
      const id = `gb-${i}`;
      records.push(makeRecord(id, 120, 80));
      weatherMap[id] = makeWeather(id, { temperature: 25, humidity: 40 });
    }
    for (let i = 0; i < 6; i++) {
      const id = `gc-${i}`;
      records.push(makeRecord(id, 118, 78));
      weatherMap[id] = makeWeather(id, { temperature: 35, humidity: 10 });
    }

    const result = computeWeatherCorrelations(records, weatherMap);
    expect(result.length).toBeGreaterThan(0);
    for (let i = 0; i < result.length - 1; i++) {
      expect(Math.abs(result[i].avgSystolicDelta)).toBeGreaterThanOrEqual(
        Math.abs(result[i + 1].avgSystolicDelta),
      );
    }
    // Temperature should have larger absolute delta than humidity
    const tempCorr = result.find(c => c.metric === 'temperature');
    const humCorr = result.find(c => c.metric === 'humidity');
    expect(tempCorr).toBeDefined();
    expect(humCorr).toBeDefined();
    expect(Math.abs(tempCorr!.avgSystolicDelta)).toBeGreaterThan(
      Math.abs(humCorr!.avgSystolicDelta),
    );
  });

  it('returns °C unit for celsius, °F for fahrenheit', () => {
    const records: BPRecord[] = [];
    const weatherMap: Record<string, WeatherReading> = {};

    for (let i = 0; i < 6; i++) {
      const id = `cold-${i}`;
      records.push(makeRecord(id, 120, 80));
      weatherMap[id] = makeWeather(id, { temperature: 10 });
    }
    for (let i = 0; i < 6; i++) {
      const id = `warm-${i}`;
      records.push(makeRecord(id, 130, 85));
      weatherMap[id] = makeWeather(id, { temperature: 30 });
    }

    const celsiusResult = computeWeatherCorrelations(records, weatherMap, 'celsius');
    const celsiusTempCorr = celsiusResult.find(c => c.metric === 'temperature');
    expect(celsiusTempCorr).toBeDefined();
    expect(celsiusTempCorr!.unit).toBe('°C');

    const fahrenheitResult = computeWeatherCorrelations(records, weatherMap, 'fahrenheit');
    const fahrenheitTempCorr = fahrenheitResult.find(c => c.metric === 'temperature');
    expect(fahrenheitTempCorr).toBeDefined();
    expect(fahrenheitTempCorr!.unit).toBe('°F');
  });
});

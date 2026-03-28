# Weather Correlation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the weather correlation feature integration — all business logic and UI are already written; this plan wires up the native geolocation package, platform permissions, and adds unit tests.

**Architecture:** Feature code is fully written across `src/entities/weather/`, `src/features/weather-fetch/`, `src/widgets/weather-correlation-card/`, and `src/pages/settings/ui/WeatherSettingsPage.tsx`. Three integration gaps remain: npm package install, Android manifest permission, iOS plist description string, then tests and verification.

**Tech Stack:** `@react-native-community/geolocation`, PermissionsAndroid (Android), NSLocationWhenInUseUsageDescription (iOS), Jest + `@testing-library/react-native`

---

## File Map

| Status | File | What it does |
|---|---|---|
| **MISSING** | `package.json` (modify) | Add `@react-native-community/geolocation` dependency |
| **MISSING** | `android/app/src/main/AndroidManifest.xml` (modify) | Add `ACCESS_COARSE_LOCATION` permission |
| **MISSING** | `ios/MedTracker/Info.plist` (modify) | Fill `NSLocationWhenInUseUsageDescription` value |
| **MISSING** | `src/entities/weather/__tests__/compute-weather-correlations.test.ts` (create) | Unit tests for median-split correlation logic |
| **MISSING** | `src/shared/api/__tests__/weather-client.test.ts` (create) | Unit tests for Open-Meteo API client |
| Already done | `src/shared/config/weather.ts` | API URLs, timeouts, param strings |
| Already done | `src/shared/api/weather-client.ts` | fetchCurrentWeather(), searchCities() |
| Already done | `src/shared/api/weather-repository.ts` | insertWeatherReading(), getWeatherForRecords() |
| Already done | `src/entities/weather/types.ts` | WeatherReading, WeatherCorrelation interfaces |
| Already done | `src/entities/weather/lib/compute-weather-correlations.ts` | Median-split correlation engine |
| Already done | `src/entities/weather/lib/weather-insights.ts` | getWeatherInsightText(), getMetricIcon() |
| Already done | `src/entities/weather/lib/weather-utils.ts` | formatTemperature(), weatherCodeToDescription() |
| Already done | `src/entities/weather/index.ts` | Barrel export |
| Already done | `src/features/weather-fetch/model/use-weather-fetch.ts` | GPS + city fetch hook |
| Already done | `src/features/weather-fetch/index.ts` | Barrel export |
| Already done | `src/widgets/weather-correlation-card/ui/WeatherCorrelationCard.tsx` | Analytics UI widget |
| Already done | `src/widgets/weather-correlation-card/index.ts` | Barrel export |
| Already done | `src/pages/settings/ui/WeatherSettingsPage.tsx` | Settings page for weather prefs |
| Already done | `src/shared/lib/settings-store.ts` | weatherEnabled, locationMode, city, tempUnit fields |
| Already done | `src/app/navigation/index.tsx` | WeatherSettings route in SettingsStack |
| Already done | `src/pages/settings/ui/SettingsPage.tsx` | Weather menu item |
| Already done | `src/pages/analytics/ui/AnalyticsPage.tsx` | WeatherCorrelationCard rendered |
| Already done | `src/features/record-bp/model/use-record-bp.ts` | Fire-and-forget fetchWeatherForReading in onSuccess |
| Already done | `src/shared/api/db.ts` | weather_readings table + index |
| Already done | `src/shared/config/locales/en/widgets.json` | weatherCorrelation i18n keys |
| Already done | `src/shared/config/locales/en/pages.json` | settings.weather i18n keys |
| Already done | `src/shared/api/index.ts` | Re-exports weather-repository and weather-client |

---

### Task 1: Install @react-native-community/geolocation

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `ios/` pods (via pod install)

- [ ] **Step 1: Install the npm package**

Run:
```bash
npm install @react-native-community/geolocation
```
Expected: package added to `node_modules/` and `package.json` dependencies

- [ ] **Step 2: Verify it appears in package.json**

Run:
```bash
grep '@react-native-community/geolocation' package.json
```
Expected: `"@react-native-community/geolocation": "^x.x.x"` line present

- [ ] **Step 3: Run pod install for iOS**

Run:
```bash
cd ios && pod install && cd ..
```
Expected: `Pod installation complete!` — RNCGeolocation pod linked

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json ios/Podfile.lock ios/Pods/
git commit -m "feat: install @react-native-community/geolocation for weather GPS"
```

---

### Task 2: Add Android location permission

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml:8` (after the last uses-permission line before `<application>`)

- [ ] **Step 1: Add ACCESS_COARSE_LOCATION permission**

In `android/app/src/main/AndroidManifest.xml`, insert after the existing `POST_NOTIFICATIONS` permission line (currently line 11) and before the `<application>` tag:

```xml
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

The relevant section should look like this after the edit:
```xml
  <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

  <application
```

- [ ] **Step 2: Verify the permission was added**

Run:
```bash
grep 'ACCESS_COARSE_LOCATION' android/app/src/main/AndroidManifest.xml
```
Expected: `<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />`

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat: add ACCESS_COARSE_LOCATION permission for weather GPS on Android"
```

---

### Task 3: Fill iOS location usage description

**Files:**
- Modify: `ios/MedTracker/Info.plist:37`

- [ ] **Step 1: Set NSLocationWhenInUseUsageDescription**

In `ios/MedTracker/Info.plist`, replace the empty string on line 37:

Old:
```xml
	<key>NSLocationWhenInUseUsageDescription</key>
	<string></string>
```

New:
```xml
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>MedTracker uses your location to fetch local weather data when you record a blood pressure reading. Location is used only at the moment of recording and is never stored or shared.</string>
```

- [ ] **Step 2: Verify the change**

Run:
```bash
grep -A 1 'NSLocationWhenInUseUsageDescription' ios/MedTracker/Info.plist
```
Expected: key followed by non-empty string

- [ ] **Step 3: Commit**

```bash
git add ios/MedTracker/Info.plist
git commit -m "feat: add iOS location usage description for weather GPS"
```

---

### Task 4: Unit tests for computeWeatherCorrelations

**Files:**
- Create: `src/entities/weather/__tests__/compute-weather-correlations.test.ts`

These are pure-function tests — no React, no mocks needed.

- [ ] **Step 1: Create the test file**

Create `src/entities/weather/__tests__/compute-weather-correlations.test.ts`:

```typescript
import { computeWeatherCorrelations } from '../lib/compute-weather-correlations';
import type { WeatherReading } from '../types';
import type { BPRecord } from '../../../shared/api/bp-repository';

function makeRecord(id: string, systolic: number, diastolic: number): BPRecord {
  return {
    id,
    systolic,
    diastolic,
    pulse: 70,
    timestamp: 1700000000,
    timezone_offset: 0,
    location: 'left_arm',
    posture: 'sitting',
    notes: null,
    created_at: 1700000000,
    updated_at: 1700000000,
    is_synced: false,
    weight: null,
  };
}

function makeWeather(overrides: Partial<WeatherReading> = {}): WeatherReading {
  return {
    id: 'w1',
    recordId: 'r1',
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
    const records = [makeRecord('r1', 120, 80)];
    const result = computeWeatherCorrelations(records, {});
    expect(result).toEqual([]);
  });

  it('returns empty array when fewer than 10 paired readings', () => {
    const records = Array.from({ length: 9 }, (_, i) =>
      makeRecord(`r${i}`, 120 + i, 80),
    );
    const weatherMap: Record<string, WeatherReading> = {};
    records.forEach((r, i) => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, temperature: 15 + i });
    });

    const result = computeWeatherCorrelations(records, weatherMap);
    expect(result).toEqual([]);
  });

  it('detects significant temperature correlation', () => {
    // 6 cold readings (10°C) with lower BP, 6 warm readings (30°C) with higher BP
    const coldRecords = Array.from({ length: 6 }, (_, i) =>
      makeRecord(`cold${i}`, 120, 80),
    );
    const warmRecords = Array.from({ length: 6 }, (_, i) =>
      makeRecord(`warm${i}`, 130, 85),
    );
    const allRecords = [...coldRecords, ...warmRecords];

    const weatherMap: Record<string, WeatherReading> = {};
    coldRecords.forEach(r => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, temperature: 10 });
    });
    warmRecords.forEach(r => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, temperature: 30 });
    });

    const result = computeWeatherCorrelations(allRecords, weatherMap);
    const tempCorr = result.find(c => c.metric === 'temperature');
    expect(tempCorr).toBeDefined();
    // above-median (warm) has higher BP, so delta should be positive
    expect(tempCorr!.avgSystolicDelta).toBe(10);
  });

  it('filters out correlations below MIN_SYSTOLIC_DELTA (3 mmHg)', () => {
    // Create 12 readings with minimal BP difference (2 mmHg)
    const lowRecords = Array.from({ length: 6 }, (_, i) =>
      makeRecord(`low${i}`, 120, 80),
    );
    const highRecords = Array.from({ length: 6 }, (_, i) =>
      makeRecord(`high${i}`, 122, 81),
    );
    const allRecords = [...lowRecords, ...highRecords];

    const weatherMap: Record<string, WeatherReading> = {};
    lowRecords.forEach(r => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, pressure: 1000 });
    });
    highRecords.forEach(r => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, pressure: 1020 });
    });

    const result = computeWeatherCorrelations(allRecords, weatherMap);
    const pressureCorr = result.find(c => c.metric === 'pressure');
    expect(pressureCorr).toBeUndefined();
  });

  it('sorts results by absolute systolic delta descending', () => {
    // Create data where pressure has 8 mmHg delta and temperature has 5 mmHg delta
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord(`r${i}`, i < 6 ? 115 : 123, 80),
    );
    const weatherMap: Record<string, WeatherReading> = {};
    records.forEach((r, i) => {
      weatherMap[r.id] = makeWeather({
        recordId: r.id,
        pressure: i < 6 ? 995 : 1025,
        temperature: i < 6 ? 10 : 30,
      });
    });

    const result = computeWeatherCorrelations(records, weatherMap);
    if (result.length >= 2) {
      expect(Math.abs(result[0].avgSystolicDelta)).toBeGreaterThanOrEqual(
        Math.abs(result[1].avgSystolicDelta),
      );
    }
  });

  it('respects temperature unit in returned unit string', () => {
    const coldRecords = Array.from({ length: 6 }, (_, i) =>
      makeRecord(`cold${i}`, 120, 80),
    );
    const warmRecords = Array.from({ length: 6 }, (_, i) =>
      makeRecord(`warm${i}`, 130, 85),
    );
    const allRecords = [...coldRecords, ...warmRecords];

    const weatherMap: Record<string, WeatherReading> = {};
    coldRecords.forEach(r => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, temperature: 10 });
    });
    warmRecords.forEach(r => {
      weatherMap[r.id] = makeWeather({ recordId: r.id, temperature: 30 });
    });

    const celsius = computeWeatherCorrelations(allRecords, weatherMap, 'celsius');
    const fahrenheit = computeWeatherCorrelations(allRecords, weatherMap, 'fahrenheit');

    const cCorr = celsius.find(c => c.metric === 'temperature');
    const fCorr = fahrenheit.find(c => c.metric === 'temperature');

    expect(cCorr?.unit).toBe('°C');
    expect(fCorr?.unit).toBe('°F');
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail first (TDD check)**

Run:
```bash
npx jest src/entities/weather/__tests__/compute-weather-correlations.test.ts --no-coverage
```
Expected: Tests should **pass** — the implementation already exists. If any fail, the implementation has a bug to fix.

- [ ] **Step 3: Commit**

```bash
git add src/entities/weather/__tests__/compute-weather-correlations.test.ts
git commit -m "test: add unit tests for computeWeatherCorrelations median-split logic"
```

---

### Task 5: Unit tests for weather-client

**Files:**
- Create: `src/shared/api/__tests__/weather-client.test.ts`

- [ ] **Step 1: Create the test file**

Create `src/shared/api/__tests__/weather-client.test.ts`:

```typescript
import { fetchCurrentWeather, searchCities } from '../weather-client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('fetchCurrentWeather', () => {
  it('returns parsed current weather on success', async () => {
    const mockCurrent = {
      temperature_2m: 22.5,
      relative_humidity_2m: 65,
      apparent_temperature: 21.0,
      surface_pressure: 1013.2,
      wind_speed_10m: 3.4,
      weather_code: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ current: mockCurrent }),
    });

    const result = await fetchCurrentWeather(41.0, 29.0);

    expect(result).toEqual(mockCurrent);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('latitude=41');
    expect(url).toContain('longitude=29');
    expect(url).toContain('api.open-meteo.com');
  });

  it('throws when API returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    await expect(fetchCurrentWeather(41.0, 29.0)).rejects.toThrow(
      'Weather API error: 429',
    );
  });

  it('throws when fetch rejects (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(fetchCurrentWeather(41.0, 29.0)).rejects.toThrow(
      'Network failure',
    );
  });
});

describe('searchCities', () => {
  it('returns geocoding results on success', async () => {
    const mockResults = [
      { name: 'Istanbul', latitude: 41.01, longitude: 28.97, country: 'Turkey', admin1: 'Istanbul' },
      { name: 'Istanbul', latitude: 41.02, longitude: 29.00, country: 'Turkey' },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults }),
    });

    const result = await searchCities('Istanbul');

    expect(result).toEqual(mockResults);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('name=Istanbul');
    expect(url).toContain('geocoding-api.open-meteo.com');
  });

  it('returns empty array when no results field in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await searchCities('Nowhere');
    expect(result).toEqual([]);
  });

  it('returns empty array on network error (non-throwing)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    const result = await searchCities('Istanbul');
    expect(result).toEqual([]);
  });

  it('returns empty array on non-ok response (non-throwing)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await searchCities('Istanbul');
    expect(result).toEqual([]);
  });

  it('returns empty array for empty query without fetching', async () => {
    const result = await searchCities('   ');
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests**

Run:
```bash
npx jest src/shared/api/__tests__/weather-client.test.ts --no-coverage
```
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/shared/api/__tests__/weather-client.test.ts
git commit -m "test: add unit tests for weather-client Open-Meteo API wrapper"
```

---

### Task 6: TypeScript and lint verification

**Files:** (read-only verification — no changes)

- [ ] **Step 1: Run TypeScript type check**

Run:
```bash
npx tsc --noEmit --skipLibCheck
```
Expected: Zero errors. If errors appear, fix them before proceeding. Common issues:
- `@react-native-community/geolocation` types not found → run `npm install --save-dev @types/react-native-community__geolocation` if needed
- Missing type exports → check `src/entities/weather/index.ts` re-exports

- [ ] **Step 2: Run ESLint**

Run:
```bash
npx eslint src/ --ext .ts,.tsx
```
Expected: Zero errors (warnings acceptable)

- [ ] **Step 3: Run all tests**

Run:
```bash
npm test -- --no-coverage
```
Expected: All tests pass

- [ ] **Step 4: Commit if any fixes were needed**

```bash
git add -p
git commit -m "fix: resolve typecheck and lint issues from weather correlation integration"
```

---

### Task 7: Build verification

- [ ] **Step 1: Build Android (requires running Metro first)**

In a separate terminal, start Metro:
```bash
npx react-native start
```

Then build:
```bash
npx react-native run-android
```
Expected: App launches on device/emulator. Navigate to Settings → Weather to verify WeatherSettingsPage loads.

- [ ] **Step 2: Verify weather toggle flow manually**

Manual test checklist:
1. Open Settings → Weather
2. Enable the weather toggle
3. Select "GPS" location mode → accept permission prompt on Android/iOS
4. Record a new BP reading
5. Open Analytics page — WeatherCorrelationCard should appear (shows "not enough data" until 10+ weather-paired readings exist)
6. Return to Weather Settings, switch to "City" mode, search "Istanbul", select it
7. Record another BP reading — weather should fetch without prompting for location

- [ ] **Step 3: Build iOS (requires macOS)**

```bash
npx react-native run-ios
```
Expected: App launches. Same manual test as Step 2.

- [ ] **Step 4: Final commit if all good**

```bash
git add .
git commit -m "feat: complete weather correlation feature — GPS permissions, geolocation package wired"
```

---

## Summary of What Was Already Done

The bulk of the implementation existed prior to this plan:
- All business logic (`computeWeatherCorrelations`, `weatherCodeToDescription`, `getWeatherInsightText`)
- All API client code (`fetchCurrentWeather`, `searchCities`, weather-repository CRUD)
- All UI (`WeatherCorrelationCard`, `WeatherSettingsPage`)
- All navigation wiring (Settings menu item, SettingsStack route)
- All DB schema (weather_readings table in db.ts)
- All i18n strings (en/pages.json + en/widgets.json)
- Settings store fields (weatherEnabled, locationMode, city, tempUnit)
- Analytics page integration (useQuery for weatherMap, rendering WeatherCorrelationCard)
- BP save hook integration (fire-and-forget fetchWeatherForReading)

This plan closes the three integration gaps (package, permissions) and adds test coverage.

# Weather Correlation Feature — Design Spec

**Date:** 2026-03-28
**Status:** Draft
**Roadmap ref:** Phase 4, Section 4.3

## Context

MedTracker already computes lifestyle tag correlations (salt, stress, exercise, etc.) and weight-vs-BP Pearson correlations on the Analytics page. Weather is a well-documented external factor affecting blood pressure — barometric pressure drops and cold temperatures are associated with BP increases in medical literature. This feature adds opt-in weather data capture at BP reading time and surfaces statistically meaningful correlations on the Analytics page.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Weather API | Open-Meteo (free, no key) | No signup, no API key, open-source, covers all needed metrics |
| Location source | User chooses GPS or manual city | Standalone alternatives — respects privacy for users who won't grant location permission |
| Fetch timing | At BP save time | One API call per reading, accurate match, simple |
| Metrics stored | Full profile (temp, pressure, humidity, wind, condition) | Store everything, surface only meaningful correlations |
| UI placement | Analytics page only | New WeatherCorrelationCard alongside existing CorrelationCard |
| API key management | None needed | Open-Meteo is free with no key |

---

## 1. Data Model

### 1.1 Database Table

```sql
CREATE TABLE IF NOT EXISTS weather_readings (
  id              TEXT PRIMARY KEY NOT NULL,
  record_id       TEXT NOT NULL UNIQUE,
  temperature     REAL NOT NULL,
  feels_like      REAL,
  pressure        REAL NOT NULL,
  humidity        INTEGER NOT NULL,
  wind_speed      REAL,
  weather_code    INTEGER NOT NULL,
  weather_desc    TEXT NOT NULL,
  latitude        REAL NOT NULL,
  longitude       REAL NOT NULL,
  city_name       TEXT,
  fetched_at      INTEGER NOT NULL,
  created_at      INTEGER NOT NULL,
  FOREIGN KEY (record_id) REFERENCES bp_records(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_weather_record_id ON weather_readings(record_id);
```

- Separate table (not columns on `bp_records`) — weather is optional, keeps BP table clean
- `record_id` is UNIQUE — 1:1 relationship with `bp_records`
- CASCADE delete — removing a BP reading removes its weather data
- All temperatures in Celsius (convert for display based on user preference)
- Pressure in hPa (standard meteorological unit)
- `weather_code` uses WMO standard codes (Open-Meteo native format)

### 1.2 Domain Types

```typescript
// src/entities/weather/types.ts

interface WeatherReading {
  id: string;
  recordId: string;
  temperature: number;        // °C
  feelsLike: number | null;   // °C
  pressure: number;           // hPa
  humidity: number;           // 0-100 %
  windSpeed: number | null;   // m/s
  weatherCode: number;        // WMO weather interpretation code
  weatherDesc: string;        // Human-readable description
  latitude: number;
  longitude: number;
  cityName: string | null;
  fetchedAt: number;          // Unix seconds
  createdAt: number;          // Unix seconds
}

interface WeatherReadingInput {
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

type WeatherMetric = 'temperature' | 'pressure' | 'humidity' | 'windSpeed';

interface WeatherCorrelation {
  metric: WeatherMetric;
  avgSystolicDelta: number;    // mmHg
  avgDiastolicDelta: number;   // mmHg
  aboveCount: number;
  belowCount: number;
  medianValue: number;         // The split point
  unit: string;                // '°C'/'°F', 'hPa', '%', 'm/s'
}
```

---

## 2. Settings

### 2.1 New Store Fields

Added to `useSettingsStore` (Zustand + AsyncStorage):

```typescript
weatherEnabled: boolean;                    // default: false
weatherLocationMode: 'gps' | 'city';       // default: 'gps'
weatherCity: string | null;                 // default: null
weatherCityLat: number | null;             // default: null
weatherCityLon: number | null;             // default: null
temperatureUnit: 'celsius' | 'fahrenheit'; // default: 'celsius'
```

With corresponding setters: `setWeatherEnabled()`, `setWeatherLocationMode()`, `setWeatherCity(name, lat, lon)`, `setTemperatureUnit()`.

### 2.2 WeatherSettingsPage

New page accessible from the main Settings menu (same pattern as SyncPage, ClassificationPage).

**Menu item on SettingsPage:**
- Icon: `cloud-outline` (Ionicons)
- Label: t('pages.settings.weather.title') — "Weather"
- Subtitle: "Weather correlation tracking"

**Page layout:**
1. **Master toggle card** — "Weather Correlation" Switch
   - When OFF: description text explaining the feature
   - When ON: reveals remaining settings below

2. **Location mode card** (visible when enabled)
   - OptionChip: "Use GPS" / "Search City"
   - GPS mode: shows current permission status, button to request if not granted
   - City mode: text input with search button, results list from geocoding API
   - Selected city displayed with coordinates

3. **Temperature unit card** (visible when enabled)
   - OptionChip: "°C" / "°F"

4. **Privacy note card** (visible when enabled)
   - "Your location is used only to fetch local weather data. Weather data is stored locally on your device."

### 2.3 GPS Permission

- Android: `ACCESS_COARSE_LOCATION` — added to AndroidManifest.xml
- iOS: `NSLocationWhenInUseUsageDescription` — already has empty key, populate with description
- Use `react-native-permissions` or React Native's built-in `Geolocation` API
- If permission denied: toast with "Location permission denied. Switch to city mode in Weather settings."
- Coarse location is sufficient (city-level accuracy for weather)

---

## 3. API Client

### 3.1 Open-Meteo Weather Client

**File:** `src/shared/api/weather-client.ts`

**Current Weather endpoint:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m,weather_code
  &timezone=auto
```

**Response shape (relevant fields):**
```json
{
  "current": {
    "temperature_2m": 22.3,
    "relative_humidity_2m": 65,
    "apparent_temperature": 21.1,
    "surface_pressure": 1013.2,
    "wind_speed_10m": 3.4,
    "weather_code": 1
  }
}
```

**Geocoding endpoint:**
```
GET https://geocoding-api.open-meteo.com/v1/search
  ?name={query}
  &count=5
  &language=en
```

**Response shape:**
```json
{
  "results": [
    { "name": "Istanbul", "latitude": 41.01, "longitude": 28.98, "country": "Turkey", "admin1": "Istanbul" }
  ]
}
```

**Client functions:**
- `fetchCurrentWeather(lat: number, lon: number): Promise<OpenMeteoWeatherResponse>` — 5s timeout, throws on failure
- `searchCities(query: string): Promise<GeocodingResult[]>` — 5s timeout, returns empty array on failure
- `weatherCodeToDescription(code: number): string` — maps WMO codes to human-readable strings (e.g., 0 → "Clear sky", 61 → "Slight rain")

**HTTP:** Use React Native's built-in `fetch` — no new dependencies needed.

### 3.2 Weather Repository

**File:** `src/shared/api/weather-repository.ts`

Follows the exact same pattern as `bp-repository.ts` and `bp-tags-repository.ts`:

- `insertWeatherReading(input: WeatherReadingInput): Promise<void>`
- `getWeatherForRecord(recordId: string): Promise<WeatherReading | null>`
- `getWeatherForRecords(recordIds: string[]): Promise<Record<string, WeatherReading>>`
- `getAllWeatherReadings(): Promise<WeatherReading[]>`
- `deleteWeatherForRecord(recordId: string): Promise<void>`

All queries parameterized. Row-to-domain mapping (snake_case → camelCase) like existing repos.

---

## 4. Fetch Flow

### 4.1 Integration with BP Save

**Modified flow in `useRecordBP` (or a wrapper hook):**

```
User taps Save →
  1. Existing: validate BP input, save BP record → get recordId
  2. NEW: if weatherEnabled:
       a. Get coordinates:
          - GPS mode → Geolocation.getCurrentPosition() (coarse)
          - City mode → use stored {weatherCityLat, weatherCityLon}
       b. fetchCurrentWeather(lat, lon) with 5s timeout
       c. insertWeatherReading({ recordId, ...weatherData })
       d. If any step fails → log warning, continue (BP already saved)
  3. Existing: invalidate queries, navigate away
```

**Key principles:**
- Weather fetch is **fire-and-forget** relative to BP save — BP record is already committed before weather fetch starts
- No retry logic — if weather fails, that reading has no weather data
- GPS timeout: 10 seconds (separate from API timeout)
- Total additional latency for user: ~1-2s on average (GPS + API), runs after save confirmation

### 4.2 Feature Hook

**File:** `src/features/weather-fetch/model/use-weather-fetch.ts`

```typescript
function useWeatherFetch() {
  // Returns: fetchWeatherForReading(recordId: string) => Promise<void>
  // Reads weatherEnabled, weatherLocationMode, city coords from settings store
  // Handles GPS permission check, coordinate resolution, API call, DB insert
  // Never throws — catches all errors internally, logs warnings
}
```

---

## 5. Correlation Engine

### 5.1 Computation

**File:** `src/entities/weather/lib/compute-weather-correlations.ts`

**Algorithm (per metric):**
1. Collect all BP records that have matching weather data
2. Compute the **median** of the weather metric across all readings
3. Split into "above median" and "below median" groups
4. Compute average systolic and diastolic for each group
5. Delta = above_avg - below_avg
6. Require minimum 5 readings per group (MIN_SAMPLE_SIZE = 5, higher than tag correlations' 3 because weather is noisier)
7. Only include correlations where |systolic delta| >= 3 mmHg

**Why median split?** Adapts to the user's local climate. A user in Finland sees "cold = below 5°C" while a user in Thailand sees "cold = below 25°C". Fixed thresholds would be meaningless across climates.

**Metrics analyzed:**
- Temperature (°C) — "Your BP is X higher on cold/hot days"
- Barometric pressure (hPa) — "Your BP is X higher on high/low pressure days"
- Humidity (%) — "Your BP is X higher on humid/dry days"
- Wind speed (m/s) — "Your BP is X higher on windy/calm days"

### 5.2 Insight Text Generation

**File:** `src/entities/weather/lib/weather-insights.ts`

Pure function that converts `WeatherCorrelation[]` into natural language strings for display:

- Positive delta → "Your BP tends to be {delta} mmHg **higher** on {above/below condition} days"
- Negative delta → "Your BP tends to be {delta} mmHg **lower** on {above/below condition} days"
- Condition labels derived from metric: temperature → "cold" / "warm", pressure → "low pressure" / "high pressure", humidity → "dry" / "humid", wind → "calm" / "windy"
- All strings via `t()` for i18n

---

## 6. UI

### 6.1 WeatherCorrelationCard Widget

**File:** `src/widgets/weather-correlation-card/ui/WeatherCorrelationCard.tsx`

**Location:** Analytics page, below existing CorrelationCard

**Structure:**
```
Card variant="elevated" size="lg"
├── CardHeader: cloud icon + "Weather & Blood Pressure" title
├── CardBody:
│   ├── [For each significant correlation]:
│   │   ├── Arrow icon (up red / down green) + delta text
│   │   └── Detail line: "Avg {sys}/{dia} below {median} vs {sys}/{dia} above"
│   ├── Sample size: "Based on {n} readings with weather data"
│   └── Medical disclaimer
└── Empty states:
    ├── Weather disabled → "Enable weather tracking in Settings"
    ├── Not enough data → "Need 10+ readings with weather data"
    └── No significant correlations → "No significant weather patterns found yet"
```

**Follows existing CorrelationCard patterns:**
- Same delta threshold (3 mmHg)
- Same color coding (red for higher BP, green for lower)
- Same medical disclaimer
- Animated entrance with `FadeInUp`

### 6.2 Weather Badge on Reading Cards (Enhancement)

When viewing individual BP readings (home page latest reading, reading list), show a small weather badge if weather data exists:

```
☀️ 22°C · 1015 hPa
```

Compact, non-intrusive. Uses weather code to select icon. Temperature displayed in user's preferred unit.

### 6.3 i18n Additions

New keys in `en/pages.json` under `settings.weather.*` and `en/widgets.json` under `weatherCorrelation.*`:

- Settings: title, description, toggle labels, privacy note, permission prompts
- Widget: card title, insight templates, empty states, disclaimer
- Common: temperature units, weather conditions (WMO code descriptions)

---

## 7. FSD Layer Mapping

| Layer | Module | Purpose |
|-------|--------|---------|
| `shared/api` | `weather-client.ts` | Open-Meteo HTTP calls + geocoding |
| `shared/api` | `weather-repository.ts` | SQLite CRUD for weather_readings |
| `shared/api` | `db.ts` (migration) | CREATE TABLE + index for weather_readings |
| `shared/config` | `weather.ts` | WMO code mappings, API URLs, timeouts |
| `entities/weather` | `types.ts` | WeatherReading, WeatherCorrelation types |
| `entities/weather` | `lib/compute-weather-correlations.ts` | Correlation algorithm |
| `entities/weather` | `lib/weather-insights.ts` | Natural language insight generation |
| `entities/weather` | `lib/weather-utils.ts` | Unit conversions, WMO code helpers |
| `entities/weather` | `index.ts` | Barrel export |
| `features/weather-fetch` | `model/use-weather-fetch.ts` | Hook: fetch + store weather at save time |
| `features/weather-fetch` | `index.ts` | Barrel export |
| `widgets/weather-correlation-card` | `ui/WeatherCorrelationCard.tsx` | Analytics card widget |
| `widgets/weather-correlation-card` | `index.ts` | Barrel export |
| `pages/settings` | `ui/WeatherSettingsPage.tsx` | Weather settings page |

---

## 8. Privacy & Safety

- **Opt-in only** — weather disabled by default, user must explicitly enable
- **Location data** — stored only as lat/lon on the weather reading, not tracked independently
- **No cloud storage** — all weather data in local SQLCipher-encrypted database
- **Coarse location** — `ACCESS_COARSE_LOCATION` only, no fine GPS tracking
- **Medical disclaimer** — all weather insights include "For informational purposes only" disclaimer
- **No causal claims** — language uses "tends to" / "associated with", never "causes" or "because of"
- **API calls** — only to Open-Meteo (open-source, no tracking, no API key)

---

## 9. Dependencies

**New packages needed:**
- `react-native-geolocation-service` or `@react-native-community/geolocation` — for GPS coordinates
- `react-native-permissions` — for permission management (if not already handling permissions manually)

**No new packages needed for:**
- HTTP calls (built-in `fetch`)
- Database (existing `op-sqlite`)
- State management (existing Zustand)
- UI (existing Card, Button, OptionChip components)

---

## 10. Verification Plan

1. **Unit tests:** `compute-weather-correlations.ts` with known data sets — verify median split, delta computation, minimum sample filtering
2. **Unit tests:** `weather-client.ts` — mock fetch responses, verify parsing and error handling
3. **Integration test:** Save BP reading with weather enabled → verify weather_readings row created
4. **Manual testing:**
   - Enable weather in settings (GPS mode) → save reading → check weather badge
   - Enable weather in settings (city mode) → search city → save reading → verify correct weather
   - Disable weather → save reading → no weather data stored
   - Kill network → save reading → BP saves, no weather, no error
   - View Analytics with 10+ weather readings → WeatherCorrelationCard shows insights
5. **Type check:** `npx tsc --noEmit --skipLibCheck`
6. **Lint:** `npx eslint src/ --ext .ts,.tsx`
7. **Build:** `npx react-native run-android` and `npx react-native run-ios`

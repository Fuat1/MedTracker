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
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('latitude=41');
    expect(url).toContain('longitude=29');
    expect(url).toContain('api.open-meteo.com');
  });

  it('throws when API returns non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(fetchCurrentWeather(41.0, 29.0)).rejects.toThrow('Weather API error: 429');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    await expect(fetchCurrentWeather(41.0, 29.0)).rejects.toThrow('Network failure');
  });
});

describe('searchCities', () => {
  it('returns geocoding results on success', async () => {
    const mockResults = [
      { name: 'Istanbul', latitude: 41.01, longitude: 28.97, country: 'Turkey', admin1: 'Istanbul' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: mockResults }),
    });
    const result = await searchCities('Istanbul');
    expect(result).toEqual(mockResults);
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('name=Istanbul');
    expect(url).toContain('geocoding-api.open-meteo.com');
  });

  it('returns empty array when no results field', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    expect(await searchCities('Nowhere')).toEqual([]);
  });

  it('returns empty array on network error (non-throwing)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    expect(await searchCities('Istanbul')).toEqual([]);
  });

  it('returns empty array on non-ok response (non-throwing)', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    expect(await searchCities('Istanbul')).toEqual([]);
  });

  it('returns empty array for whitespace-only query without fetching', async () => {
    expect(await searchCities('   ')).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

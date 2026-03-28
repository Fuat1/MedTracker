import { useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useToastStore } from '../../../shared/lib/toast-store';
import { fetchCurrentWeather } from '../../../shared/api/weather-client';
import { insertWeatherReading } from '../../../shared/api/weather-repository';
import { weatherCodeToDescription } from '../../../entities/weather';
import { GPS_TIMEOUT } from '../../../shared/config/weather';
import i18n from '../../../shared/lib/i18n';

interface Coordinates {
  latitude: number;
  longitude: number;
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization(
        () => resolve(true),
        () => resolve(false),
      );
    });
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function getGPSCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: false,
        timeout: GPS_TIMEOUT,
        maximumAge: 300000, // 5 min cache
      },
    );
  });
}

/**
 * Hook that returns a function to fetch and store weather data for a BP reading.
 * Fire-and-forget — never throws. BP is already saved before this runs.
 */
export function useWeatherFetch() {
  const weatherEnabled = useSettingsStore((s) => s.weatherEnabled);
  const locationMode = useSettingsStore((s) => s.weatherLocationMode);
  const cityLat = useSettingsStore((s) => s.weatherCityLat);
  const cityLon = useSettingsStore((s) => s.weatherCityLon);
  const cityName = useSettingsStore((s) => s.weatherCity);
  const showToast = useToastStore((s) => s.showToast);

  const fetchWeatherForReading = useCallback(
    async (recordId: string): Promise<void> => {
      if (!weatherEnabled) return;

      try {
        // 1. Get coordinates
        let coords: Coordinates;

        if (locationMode === 'city') {
          if (cityLat == null || cityLon == null) {
            if (__DEV__) console.warn('Weather: city mode but no city set');
            return;
          }
          coords = { latitude: cityLat, longitude: cityLon };
        } else {
          const hasPermission = await requestLocationPermission();
          if (!hasPermission) {
            if (__DEV__) console.warn('Weather: location permission denied');
            showToast(
              i18n.t('settings.weather.location.permissionDeniedToast', { ns: 'pages' }),
              'warning',
            );
            return;
          }
          coords = await getGPSCoordinates();
        }

        // 2. Fetch weather
        const current = await fetchCurrentWeather(
          coords.latitude,
          coords.longitude,
        );

        // 3. Store
        await insertWeatherReading({
          recordId,
          temperature: current.temperature_2m,
          feelsLike: current.apparent_temperature,
          pressure: current.surface_pressure,
          humidity: current.relative_humidity_2m,
          windSpeed: current.wind_speed_10m,
          weatherCode: current.weather_code,
          weatherDesc: weatherCodeToDescription(current.weather_code),
          latitude: coords.latitude,
          longitude: coords.longitude,
          cityName: locationMode === 'city' ? cityName : null,
        });

        if (__DEV__) console.log('Weather: saved for record', recordId);
      } catch (error) {
        // Fire-and-forget — BP already saved, just log
        if (__DEV__) console.warn('Weather fetch failed:', error);
      }
    },
    [weatherEnabled, locationMode, cityLat, cityLon, cityName, showToast],
  );

  return { fetchWeatherForReading };
}

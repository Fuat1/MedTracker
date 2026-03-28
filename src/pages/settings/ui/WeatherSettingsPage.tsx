import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  useSettingsStore,
  type WeatherLocationMode,
  type TemperatureUnit,
} from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { OptionChip, Card, CardBody } from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import { searchCities, type GeocodingResult } from '../../../shared/api/weather-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type Props = NativeStackScreenProps<SettingsStackParamList, 'WeatherSettings'>;

export function WeatherSettingsPage({ navigation }: Props) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    weatherEnabled,
    weatherLocationMode,
    weatherCity,
    temperatureUnit,
    setWeatherEnabled,
    setWeatherLocationMode,
    setWeatherCity,
    setTemperatureUnit,
  } = useSettingsStore();

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const showSavedToast = useCallback(
    (setting: string) => {
      Toast.show({
        type: 'success',
        text1: t('settings.toast.saved'),
        text2: t('settings.toast.preferenceUpdated', { setting }),
        position: 'bottom',
        visibilityTime: 2000,
      });
    },
    [t],
  );

  const handleToggle = (value: boolean) => {
    setWeatherEnabled(value);
    showSavedToast(t('settings.weather.toggle.label'));
  };

  const handleLocationMode = (mode: WeatherLocationMode) => {
    setWeatherLocationMode(mode);
    showSavedToast(t('settings.weather.location.title'));
  };

  const handleTemperatureUnit = (unit: TemperatureUnit) => {
    setTemperatureUnit(unit);
    showSavedToast(t('settings.weather.temperature.title'));
  };

  const handleCitySearch = async () => {
    if (!cityQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchCities(cityQuery.trim());
      setCityResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCitySelect = (city: GeocodingResult) => {
    setWeatherCity(city.name, city.latitude, city.longitude);
    setCityResults([]);
    setCityQuery('');
    showSavedToast(t('settings.weather.location.title'));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.back')}
        >
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.textPrimary, fontSize: typography.xl },
          ]}
        >
          {t('settings.weather.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Master Toggle Card */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.cardMargin}>
          <Card variant="elevated" size="lg" style={styles.cardRadius}>
            <CardBody>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { color: colors.textPrimary, fontSize: typography.sm },
                    ]}
                  >
                    {t('settings.weather.toggle.label')}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary, fontSize: typography.xs },
                    ]}
                  >
                    {t('settings.weather.toggle.description')}
                  </Text>
                </View>
                <Switch
                  value={weatherEnabled}
                  onValueChange={handleToggle}
                  trackColor={{
                    false: colors.toggleTrackInactive,
                    true: colors.toggleTrackActive,
                  }}
                  thumbColor={colors.toggleThumb}
                  accessibilityRole="switch"
                  accessibilityLabel={t('settings.weather.toggle.label')}
                />
              </View>
            </CardBody>
          </Card>
        </Animated.View>

        {weatherEnabled && (
          <>
            {/* Location Mode Card */}
            <Animated.View
              entering={FadeInUp.delay(100).duration(400)}
              style={styles.cardMargin}
            >
              <Card variant="elevated" size="lg" style={styles.cardRadius}>
                <CardBody>
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: colors.iconCircleBg },
                      ]}
                    >
                      <Icon name="location-outline" size={20} color={colors.accent} />
                    </View>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.textPrimary, fontSize: typography.lg },
                      ]}
                    >
                      {t('settings.weather.location.title')}
                    </Text>
                  </View>

                  <View style={styles.chipRow}>
                    <OptionChip
                      label={t('settings.weather.location.gps')}
                      selected={weatherLocationMode === 'gps'}
                      onPress={() => handleLocationMode('gps')}
                    />
                    <OptionChip
                      label={t('settings.weather.location.city')}
                      selected={weatherLocationMode === 'city'}
                      onPress={() => handleLocationMode('city')}
                    />
                  </View>

                  {weatherLocationMode === 'city' && (
                    <View style={styles.citySection}>
                      <View style={styles.searchRow}>
                        <TextInput
                          value={cityQuery}
                          onChangeText={setCityQuery}
                          placeholder={t(
                            'settings.weather.location.citySearch.placeholder',
                          )}
                          placeholderTextColor={colors.textSecondary}
                          style={[
                            styles.searchInput,
                            {
                              color: colors.textPrimary,
                              backgroundColor: colors.background,
                              borderColor: colors.border,
                              fontSize: typography.sm,
                            },
                          ]}
                          onSubmitEditing={handleCitySearch}
                          returnKeyType="search"
                          accessibilityLabel={t(
                            'settings.weather.location.citySearch.placeholder',
                          )}
                        />
                        <Pressable
                          onPress={handleCitySearch}
                          style={[
                            styles.searchButton,
                            { backgroundColor: colors.accent },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'settings.weather.location.citySearch.search',
                          )}
                        >
                          {isSearching ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Icon name="search" size={18} color="#fff" />
                          )}
                        </Pressable>
                      </View>

                      {cityResults.length > 0 && (
                        <View style={styles.resultsContainer}>
                          {cityResults.map((city, index) => (
                            <Pressable
                              key={`${city.name}-${city.latitude}-${city.longitude}-${index}`}
                              onPress={() => handleCitySelect(city)}
                              style={[
                                styles.cityResult,
                                { borderBottomColor: colors.borderLight },
                              ]}
                              accessibilityRole="button"
                              accessibilityLabel={`${city.name}, ${city.country}`}
                            >
                              <Icon
                                name="location"
                                size={16}
                                color={colors.accent}
                              />
                              <Text
                                style={[
                                  styles.cityName,
                                  {
                                    color: colors.textPrimary,
                                    fontSize: typography.sm,
                                  },
                                ]}
                              >
                                {city.name}
                                {city.admin1 ? `, ${city.admin1}` : ''}
                              </Text>
                              <Text
                                style={[
                                  styles.cityCountry,
                                  {
                                    color: colors.textSecondary,
                                    fontSize: typography.xs,
                                  },
                                ]}
                              >
                                {city.country}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      )}

                      {cityResults.length === 0 &&
                        cityQuery.length > 0 &&
                        !isSearching && (
                          <Text
                            style={[
                              styles.noResults,
                              {
                                color: colors.textTertiary,
                                fontSize: typography.xs,
                              },
                            ]}
                          >
                            {t('settings.weather.location.citySearch.noResults')}
                          </Text>
                        )}

                      {weatherCity && (
                        <Text
                          style={[
                            styles.selectedCity,
                            { color: colors.accent, fontSize: typography.sm },
                          ]}
                        >
                          {t('settings.weather.location.citySearch.selected', {
                            city: weatherCity,
                          })}
                        </Text>
                      )}
                    </View>
                  )}
                </CardBody>
              </Card>
            </Animated.View>

            {/* Temperature Unit Card */}
            <Animated.View
              entering={FadeInUp.delay(200).duration(400)}
              style={styles.cardMargin}
            >
              <Card variant="elevated" size="lg" style={styles.cardRadius}>
                <CardBody>
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: colors.iconCircleBg },
                      ]}
                    >
                      <Icon
                        name="thermometer-outline"
                        size={20}
                        color={colors.accent}
                      />
                    </View>
                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.textPrimary, fontSize: typography.lg },
                      ]}
                    >
                      {t('settings.weather.temperature.title')}
                    </Text>
                  </View>

                  <View style={styles.chipRow}>
                    <OptionChip
                      label={t('settings.weather.temperature.celsius')}
                      selected={temperatureUnit === 'celsius'}
                      onPress={() => handleTemperatureUnit('celsius')}
                    />
                    <OptionChip
                      label={t('settings.weather.temperature.fahrenheit')}
                      selected={temperatureUnit === 'fahrenheit'}
                      onPress={() => handleTemperatureUnit('fahrenheit')}
                    />
                  </View>
                </CardBody>
              </Card>
            </Animated.View>

            {/* Privacy Note Card */}
            <Animated.View
              entering={FadeInUp.delay(300).duration(400)}
              style={styles.cardMargin}
            >
              <Card variant="elevated" size="lg" style={styles.cardRadius}>
                <CardBody>
                  <View style={styles.privacyRow}>
                    <Icon
                      name="shield-checkmark-outline"
                      size={20}
                      color={colors.accent}
                    />
                    <Text
                      style={[
                        styles.privacyText,
                        { color: colors.textSecondary, fontSize: typography.xs },
                      ]}
                    >
                      {t('settings.weather.privacy.note')}
                    </Text>
                  </View>
                </CardBody>
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardMargin: {
    marginBottom: 16,
  },
  cardRadius: {
    borderRadius: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  settingDescription: {
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  citySection: {
    marginTop: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    marginTop: 8,
  },
  cityResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  cityName: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  cityCountry: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
  },
  noResults: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  selectedCity: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginTop: 12,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontWeight: '400',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

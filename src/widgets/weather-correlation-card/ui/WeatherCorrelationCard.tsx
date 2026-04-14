import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { Card, CardBody } from '../../../shared/ui';
import { FONTS } from '../../../shared/config/theme';
import {
  computeWeatherCorrelations,
  getMetricIcon,
  type WeatherCorrelation,
  type WeatherReading,
} from '../../../entities/weather';
import type { BPRecord } from '../../../shared/api/bp-repository';

const MIN_READINGS_FOR_INSIGHTS = 10;

interface WeatherCorrelationCardProps {
  records: BPRecord[];
  weatherMap: Record<string, WeatherReading>;
}

export function WeatherCorrelationCard({
  records,
  weatherMap,
}: WeatherCorrelationCardProps) {
  const { t } = useTranslation('widgets');
  const { colors, typography } = useTheme();
  const weatherEnabled = useSettingsStore((s) => s.weatherEnabled);
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);

  const weatherCount = Object.keys(weatherMap).length;

  const correlations = useMemo(
    () => computeWeatherCorrelations(records, weatherMap, temperatureUnit),
    [records, weatherMap, temperatureUnit],
  );

  // Empty state logic
  const renderEmptyState = () => {
    let message: string;
    if (!weatherEnabled) {
      message = t('weatherCorrelation.empty.disabled');
    } else if (weatherCount < MIN_READINGS_FOR_INSIGHTS) {
      message = t('weatherCorrelation.empty.notEnoughData');
    } else {
      message = t('weatherCorrelation.empty.noSignificant');
    }
    return (
      <Text
        style={[
          styles.noData,
          { color: colors.textTertiary, fontSize: typography.sm },
        ]}
      >
        {message}
      </Text>
    );
  };

  return (
    <View style={styles.cardMargin}>
      <Card variant="elevated" size="lg" style={styles.cardRadius}>
        <CardBody>
          <View style={styles.titleRow}>
            <Icon name="cloud-outline" size={20} color={colors.accent} />
            <Text
              style={[
                styles.title,
                { color: colors.textPrimary, fontSize: typography.lg },
              ]}
            >
              {t('weatherCorrelation.title')}
            </Text>
          </View>

          {correlations.length === 0 ? (
            renderEmptyState()
          ) : (
            <>
              {correlations.map((c) => (
                <CorrelationRow
                  key={c.metric}
                  correlation={c}
                  colors={colors}
                  typography={typography}
                />
              ))}

              <Text
                style={[
                  styles.sampleSize,
                  { color: colors.textTertiary, fontSize: typography.xs },
                ]}
              >
                {t('weatherCorrelation.sampleSize', { count: weatherCount })}
              </Text>
            </>
          )}

          <Text
            style={[
              styles.disclaimer,
              { color: colors.textTertiary, fontSize: typography.xs },
            ]}
          >
            {t('weatherCorrelation.disclaimer')}
          </Text>
        </CardBody>
      </Card>
    </View>
  );
}

interface CorrelationRowProps {
  correlation: WeatherCorrelation;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
}

function CorrelationRow({ correlation, colors, typography }: CorrelationRowProps) {
  const { t } = useTranslation('widgets');
  const isHigher = correlation.avgSystolicDelta > 0;
  const delta = Math.abs(correlation.avgSystolicDelta);
  const icon = getMetricIcon(correlation.metric);

  // Determine condition label
  const conditionKey = isHigher
    ? getAboveConditionKey(correlation.metric)
    : getBelowConditionKey(correlation.metric);
  const condition = t(`weatherCorrelation.conditions.${conditionKey}` as any);

  const insightKey = isHigher
    ? 'weatherCorrelation.higher'
    : 'weatherCorrelation.lower';

  return (
    <View
      style={[styles.row, { borderBottomColor: colors.borderLight }]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor:
              (isHigher ? colors.error : colors.successText) + '15',
          },
        ]}
      >
        <Icon
          name={icon}
          size={18}
          color={isHigher ? colors.error : colors.successText}
        />
      </View>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.insightText,
            { color: colors.textPrimary, fontSize: typography.sm },
          ]}
        >
          {t(insightKey as any, { delta, condition })}
        </Text>
        <Text
          style={[
            styles.medianText,
            { color: colors.textTertiary, fontSize: typography.xs },
          ]}
        >
          {t('weatherCorrelation.medianLabel', {
            value: correlation.medianValue,
            unit: correlation.unit,
          })}
        </Text>
      </View>
      <View
        style={[
          styles.deltaChip,
          {
            backgroundColor:
              (isHigher ? colors.error : colors.successText) + '15',
          },
        ]}
      >
        <Icon
          name={isHigher ? 'arrow-up' : 'arrow-down'}
          size={12}
          color={isHigher ? colors.error : colors.successText}
        />
        <Text
          style={[
            styles.deltaText,
            {
              color: isHigher ? colors.error : colors.successText,
              fontSize: typography.xs,
            },
          ]}
        >
          {delta}
        </Text>
      </View>
    </View>
  );
}

function getAboveConditionKey(metric: string): string {
  switch (metric) {
    case 'temperature': return 'warm';
    case 'pressure': return 'highPressure';
    case 'humidity': return 'humid';
    case 'windSpeed': return 'windy';
    default: return 'warm';
  }
}

function getBelowConditionKey(metric: string): string {
  switch (metric) {
    case 'temperature': return 'cold';
    case 'pressure': return 'lowPressure';
    case 'humidity': return 'dry';
    case 'windSpeed': return 'calm';
    default: return 'cold';
  }
}

const styles = StyleSheet.create({
  cardMargin: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardRadius: {
    borderRadius: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  noData: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
  },
  insightText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  medianText: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 2,
  },
  deltaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  deltaText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  sampleSize: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    marginTop: 10,
    textAlign: 'center',
  },
  disclaimer: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

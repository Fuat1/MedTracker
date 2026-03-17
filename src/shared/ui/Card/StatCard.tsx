import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../lib/use-theme';
import {FONTS} from '../../config/theme';
import {Card, CardBody} from './Card';
import type {StatCardProps} from './types';

const TREND_ICONS = {
  up: 'arrow-up',
  down: 'arrow-down',
  stable: 'remove',
} as const;

export function StatCard({
  value,
  unit,
  label,
  trend,
  trendValue,
  trendColor,
  testID,
}: StatCardProps) {
  const {colors, typography} = useTheme();
  const {t} = useTranslation();
  const resolvedTrendColor = trendColor || colors.textSecondary;

  const a11yLabel =
    trend && trendValue
      ? t('shared.statCard.a11yWithTrend', {
          label,
          value,
          unit: unit || '',
          trend,
          trendValue,
        })
      : t('shared.statCard.a11y', {label, value, unit: unit || ''});

  return (
    <Card testID={testID}>
      <CardBody>
        <View accessibilityLabel={a11yLabel} accessible>
          <View style={styles.valueRow}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography['2xl'],
                fontFamily: FONTS.extraBold,
                fontWeight: '800',
              }}>
              {value}
            </Text>
            {unit && (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.sm,
                  fontFamily: FONTS.medium,
                  fontWeight: '500',
                  marginLeft: 4,
                  alignSelf: 'flex-end',
                  marginBottom: 4,
                }}>
                {unit}
              </Text>
            )}
            {trend && trendValue && (
              <View
                style={[
                  styles.trendBadge,
                  {backgroundColor: resolvedTrendColor + '15'},
                ]}>
                <Icon
                  name={TREND_ICONS[trend]}
                  size={12}
                  color={resolvedTrendColor}
                />
                <Text
                  style={{
                    color: resolvedTrendColor,
                    fontSize: typography.xs,
                    fontFamily: FONTS.semiBold,
                    fontWeight: '600',
                    marginLeft: 2,
                  }}>
                  {trendValue}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.sm,
              fontFamily: FONTS.medium,
              fontWeight: '500',
              marginTop: 4,
            }}>
            {label}
          </Text>
        </View>
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: 'center',
  },
});

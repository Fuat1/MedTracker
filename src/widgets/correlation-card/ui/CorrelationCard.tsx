import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import { LIFESTYLE_TAGS } from '../../../entities/lifestyle-tag';
import { useCustomTags } from '../../../features/manage-tags';
import { isCustomTagKey, getCustomTagId } from '../../../shared/types/custom-tag';
import type { TagCorrelation } from '../../../entities/lifestyle-tag';

const MIN_DELTA = 3; // Only show correlations with |delta| >= 3 mmHg

interface CorrelationCardProps {
  correlations: TagCorrelation[];
}

export function CorrelationCard({ correlations }: CorrelationCardProps) {
  const { t } = useTranslation('widgets');
  const { t: tCommon } = useTranslation('common');
  const { colors, typography } = useTheme();

  const { data: customTags = [] } = useCustomTags();

  const significant = correlations.filter(c => Math.abs(c.avgSystolicDelta) >= MIN_DELTA);

  /** Resolve icon + label for any TagKey (built-in or custom) */
  const resolveTagDisplay = (tagKey: string): { icon: string; label: string } | null => {
    if (isCustomTagKey(tagKey)) {
      const id = getCustomTagId(tagKey);
      const ct = customTags.find(c => c.id === id);
      if (!ct) return null;
      return { icon: ct.icon, label: ct.label };
    }
    const meta = LIFESTYLE_TAGS.find(m => m.key === tagKey);
    if (!meta) return null;
    return { icon: meta.icon, label: tCommon(meta.labelKey as any) };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
      <View style={styles.titleRow}>
        <Icon name="analytics-outline" size={20} color={colors.accent} />
        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.lg }]}>
          {t('correlationCard.title')}
        </Text>
      </View>

      {significant.length === 0 ? (
        <Text style={[styles.noData, { color: colors.textTertiary, fontSize: typography.sm }]}>
          {t('correlationCard.noData')}
        </Text>
      ) : (
        significant.map(c => {
          const display = resolveTagDisplay(c.tag);
          if (!display) return null;
          const isHigher = c.avgSystolicDelta > 0;
          const delta = Math.abs(c.avgSystolicDelta);

          return (
            <View key={c.tag} style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <View style={[styles.iconCircle, { backgroundColor: (isHigher ? colors.error : colors.successText) + '15' }]}>
                <Icon name={display.icon} size={18} color={isHigher ? colors.error : colors.successText} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.insightText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                  {isHigher
                    ? t('correlationCard.higher', { delta, tag: display.label })
                    : t('correlationCard.lower', { delta, tag: display.label })}
                </Text>
                <Text style={[styles.countText, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  {t('correlationCard.readingsCount', { count: c.taggedCount })}
                </Text>
              </View>
              <View style={[styles.deltaChip, { backgroundColor: (isHigher ? colors.error : colors.successText) + '15' }]}>
                <Icon
                  name={isHigher ? 'arrow-up' : 'arrow-down'}
                  size={12}
                  color={isHigher ? colors.error : colors.successText}
                />
                <Text style={[styles.deltaText, { color: isHigher ? colors.error : colors.successText, fontSize: typography.xs }]}>
                  {delta}
                </Text>
              </View>
            </View>
          );
        })
      )}

      {/* Medical disclaimer */}
      <Text style={[styles.disclaimer, { color: colors.textTertiary, fontSize: typography.xs }]}>
        {t('correlationCard.disclaimer')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
  countText: {
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
  disclaimer: {
    fontFamily: FONTS.regular,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 10,
    textAlign: 'center',
  },
});

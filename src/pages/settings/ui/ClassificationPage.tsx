import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { OptionChip } from '../../../shared/ui';
import { BP_UNITS, BP_GUIDELINES } from '../../../shared/config/settings';
import { FONTS, BP_COLORS_LIGHT, BP_COLORS_DARK } from '../../../shared/config/theme';
import { getLocales } from 'react-native-localize';
import { getSettingsForRegion } from '../../../shared/lib/region-settings';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../../app/navigation/index';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Classification'>;

export function ClassificationPage({ navigation }: Props) {
  const { t } = useTranslation('pages');
  const { t: tMedical } = useTranslation('medical');
  const { t: tCommon } = useTranslation('common');
  const { colors, isDark, typography } = useTheme();
  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;

  const {
    unit,
    guideline,
    setUnit,
    setGuideline,
  } = useSettingsStore();

  const insets = useSafeAreaInsets();

  const showSavedToast = useCallback((setting: string) => {
    Toast.show({
      type: 'success',
      text1: t('settings.toast.saved'),
      text2: t('settings.toast.preferenceUpdated', { setting }),
      position: 'bottom',
      visibilityTime: 2000,
    });
  }, [t]);

  const handleGuidelineChange = (newGuideline: typeof BP_GUIDELINES[keyof typeof BP_GUIDELINES]) => {
    setGuideline(newGuideline);
    showSavedToast(t('settings.guideline.title'));
  };

  const handleUnitChange = (newUnit: typeof BP_UNITS[keyof typeof BP_UNITS]) => {
    setUnit(newUnit);
    showSavedToast(t('settings.unit.title'));
  };

  const handleDetectRegion = () => {
    const locales = getLocales();
    const countryCode = locales[0]?.countryCode ?? '';
    const recommended = getSettingsForRegion(countryCode);

    const changed = recommended.guideline !== guideline || recommended.unit !== unit;
    if (changed) {
      if (recommended.guideline !== guideline) setGuideline(recommended.guideline);
      if (recommended.unit !== unit) setUnit(recommended.unit);
      Toast.show({
        type: 'success',
        text1: t('settings.detectRegion.updated'),
        position: 'bottom',
        visibilityTime: 2500,
      });
    } else {
      Toast.show({
        type: 'info',
        text1: t('settings.detectRegion.noChange'),
        position: 'bottom',
        visibilityTime: 2500,
      });
    }
  };

  const guidelineNameMap: Record<string, string> = {
    [BP_GUIDELINES.AHA_ACC]: tMedical('guidelines.ahaAcc.name'),
    [BP_GUIDELINES.ESC_ESH]: tMedical('guidelines.escEsh.name'),
    [BP_GUIDELINES.JSH]: tMedical('guidelines.jsh.name'),
    [BP_GUIDELINES.WHO]: tMedical('guidelines.who.name'),
  };
  const guidelineName = guidelineNameMap[guideline] || 'AHA/ACC';

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
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {t('settings.guideline.title')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Guideline Card */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="medical-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('settings.guideline.title')}
            </Text>
          </View>
          <Pressable
            style={[styles.detectRegionButton, { borderColor: colors.accent }]}
            onPress={handleDetectRegion}
            accessibilityRole="button"
            accessibilityLabel={t('settings.detectRegion.button')}
          >
            <Icon name="earth-outline" size={18} color={colors.accent} />
            <Text style={[styles.detectRegionText, { color: colors.accent, fontSize: typography.sm }]}>
              {t('settings.detectRegion.button')}
            </Text>
          </Pressable>
          <View style={styles.chipRow}>
            {([
              { value: BP_GUIDELINES.AHA_ACC, label: tMedical('guidelines.ahaAcc.name') },
              { value: BP_GUIDELINES.ESC_ESH, label: tMedical('guidelines.escEsh.name') },
              { value: BP_GUIDELINES.JSH, label: tMedical('guidelines.jsh.name') },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={guideline === opt.value}
                onPress={() => handleGuidelineChange(opt.value)}
              />
            ))}
          </View>
          <Text style={[styles.guidelineNote, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {t('settings.guideline.note')}
          </Text>
        </Animated.View>

        {/* Unit Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.iconCircleBg }]}>
              <Icon name="speedometer-outline" size={20} color={colors.accent} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {t('settings.unit.title')}
            </Text>
          </View>
          <View style={styles.chipRow}>
            {([
              { value: BP_UNITS.MMHG, label: 'mmHg' },
              { value: BP_UNITS.KPA, label: 'kPa' },
            ]).map((opt) => (
              <OptionChip
                key={opt.value}
                label={opt.label}
                selected={unit === opt.value}
                onPress={() => handleUnitChange(opt.value)}
              />
            ))}
          </View>
        </Animated.View>

        {/* BP Legend Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg, marginBottom: 16 }]}>
            {t('settings.bpLegend.title', { guideline: guidelineName })}
          </Text>

          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.normal }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.normal')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.elevated }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.elevated')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.stage_1 }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.stage1')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: bpColors.stage_2 }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {t('settings.bpLegend.stage2')}
              </Text>
            </View>
          </View>
        </Animated.View>
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
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
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
  guidelineNote: {
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginTop: 12,
  },
  detectRegionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 48,
  },
  detectRegionText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '45%',
    paddingVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});

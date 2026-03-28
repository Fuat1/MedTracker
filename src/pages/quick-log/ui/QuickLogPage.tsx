import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Numpad, DateTimePicker, Toast, CrisisModal, SaveButton, Card, CardBody } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useBPInput, useToast } from '../../../shared/lib';
import { isCrisisReading, useBPClassification } from '../../../entities/blood-pressure';
import { FONTS } from '../../../shared/config/theme';
import { BP_LIMITS } from '../../../shared/config';
import { useRecordBP, BP_RECORDS_QUERY_KEY } from '../../../features/record-bp';
import { useQueryClient } from '@tanstack/react-query';
import type { BPRecord } from '../../../shared/api/bp-repository';
import { detectMorningSurge } from '../../../shared/lib';
import { TagPickerModal } from '../../../widgets/tag-selector';
import type { TagKey } from '../../../shared/api/bp-tags-repository';
import { getWeightDisplayValue, parseWeightToKg } from '../../../entities/user-profile';

export function QuickLogPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { t: tValidation } = useTranslation('validation');
  const { t: tWidgets } = useTranslation('widgets');
  const { colors, fontScale, typography } = useTheme();
  const navigation = useNavigation();
  const { guideline, defaultLocation, defaultPosture, defaultWeight, weightUnit } = useSettingsStore();
  const recordBP = useRecordBP();
  const queryClient = useQueryClient();

  const { systolic, diastolic, pulse, activeField, setActiveField, handleNumpadChange, getCurrentValue } = useBPInput({ autoAdvance: true });
  const { toastMsg, toastType, toastVisible, showToast, hideToast } = useToast();
  const { systolicNum, diastolicNum, pulseNum, validation, category, categoryColor, categoryLabel } =
    useBPClassification(systolic, diastolic, pulse, guideline);

  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagKey[]>([]);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [weightText, setWeightText] = useState(() => {
    if (defaultWeight == null) return '';
    return String(getWeightDisplayValue(defaultWeight, weightUnit));
  });
  const [weightFocused, setWeightFocused] = useState(false);

  const handleSubmit = async () => {
    if (!validation.isValid || !systolicNum || !diastolicNum) {
      showToast(validation.errors[0] ?? tValidation('errors.validationError'));
      return;
    }
    if (isCrisisReading(systolicNum, diastolicNum, guideline)) {
      setCrisisVisible(true);
      return;
    }
    await saveRecord();
  };

  const saveRecord = async () => {
    try {
      const parsedWeight = weightText.trim() ? parseFloat(weightText) : NaN;
      const weightKg = !isNaN(parsedWeight) ? parseWeightToKg(parsedWeight, weightUnit) : null;

      await recordBP.mutateAsync({
        systolic: systolicNum!,
        diastolic: diastolicNum!,
        pulse: pulseNum,
        timestamp: Math.floor(measurementTime.getTime() / 1000),
        location: defaultLocation,
        posture: defaultPosture,
        weight: weightKg,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      // Detect morning surge after save (separate try-catch to avoid misleading error)
      try {
        const latestRecords = queryClient.getQueryData<BPRecord[]>(BP_RECORDS_QUERY_KEY) ?? [];
        const surge = detectMorningSurge(latestRecords);
        if (surge.hasSurge) {
          showToast(
            tCommon('morningSurgeAlert', { delta: surge.delta }),
            'warning',
          );
          // Brief delay to allow toast entrance animation before navigation
          await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
        }
      } catch (surgeError) {
        if (__DEV__) console.warn('Surge detection failed:', surgeError);
        // Continue to navigation even if surge detection fails
      }

      navigation.goBack();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('quickLog.alerts.error.message'),
      );
    }
  };

  const isValid = validation.isValid && !!systolic && !!diastolic;
  const hasCategory = !!(category && validation.isValid);

  // Per-field range warnings
  const sysOutOfRange = systolicNum != null && (systolicNum < BP_LIMITS.systolic.min || systolicNum > BP_LIMITS.systolic.max);
  const diaOutOfRange = diastolicNum != null && (diastolicNum < BP_LIMITS.diastolic.min || diastolicNum > BP_LIMITS.diastolic.max);
  const pulseOutOfRange = pulseNum != null && (pulseNum < BP_LIMITS.pulse.min || pulseNum > BP_LIMITS.pulse.max);
  const sysLeDia = systolicNum != null && diastolicNum != null && systolicNum <= diastolicNum;

  const fieldWarning = sysOutOfRange
    ? tCommon('common.systolic') + ': ' + tValidation('errors.systolicRange', { min: BP_LIMITS.systolic.min, max: BP_LIMITS.systolic.max })
    : diaOutOfRange
    ? tCommon('common.diastolic') + ': ' + tValidation('errors.diastolicRange', { min: BP_LIMITS.diastolic.min, max: BP_LIMITS.diastolic.max })
    : pulseOutOfRange
    ? tCommon('common.pulse') + ': ' + tValidation('errors.pulseRange', { min: BP_LIMITS.pulse.min, max: BP_LIMITS.pulse.max })
    : sysLeDia
    ? tValidation('errors.systolicGreater')
    : null;

  const hasTags = selectedTags.length > 0;
  const tagPillBg = hasTags ? colors.accent + '15' : 'transparent';
  const tagPillBorder = hasTags ? colors.accent : colors.border;
  const tagPillColor = hasTags ? colors.accent : colors.textSecondary;
  const hasWeight = weightText.trim().length > 0;
  const weightPillBg = weightFocused ? colors.accent + '10' : hasWeight ? colors.accent + '15' : 'transparent';
  const weightPillBorder = weightFocused || hasWeight ? colors.accent : colors.border;
  const weightPillColor = weightFocused || hasWeight ? colors.accent : colors.textSecondary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
            {t('quickLog.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}>
            {t('quickLog.subtitle')}
          </Text>
        </View>
        <Pressable
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.close' as any)}
        >
          <Icon name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>

        {/* Floating toast – top-right */}
        <Toast
          message={toastMsg}
          type={toastType}
          visible={toastVisible}
          onHide={hideToast}
        />

        {/* ── Top section: datetime + value cards + category ── */}
        <View style={styles.topSection}>

          <View style={styles.dateTimeWrapper}>
            <DateTimePicker
              value={measurementTime}
              onChange={setMeasurementTime}
              disabled={recordBP.isPending}
            />
            <View style={styles.pillsRow}>
              <Pressable
                style={[styles.weightPill, { backgroundColor: weightPillBg, borderColor: weightPillBorder }]}
                onPress={() => setWeightFocused(true)}
                disabled={recordBP.isPending}
                accessibilityRole="button"
                accessibilityLabel={tCommon('weight.label')}
              >
                <Icon name="scale-outline" size={13} color={weightPillColor} />
                <Text style={[styles.weightInput, { color: weightText ? weightPillColor : colors.textTertiary, fontSize: 12 * fontScale }]}>
                  {weightText || '--'}
                </Text>
                <Text style={[styles.weightUnitText, { color: weightPillColor, fontSize: 12 * fontScale }]}>
                  {tCommon(`weight.${weightUnit}`)}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tagPill, { backgroundColor: tagPillBg, borderColor: tagPillBorder }]}
                onPress={() => setTagPickerVisible(true)}
                disabled={recordBP.isPending}
                accessibilityRole="button"
                accessibilityLabel={tWidgets('tagSelector.title')}
              >
                <Icon name="pricetags-outline" size={13} color={tagPillColor} />
                <Text style={[styles.tagPillText, { color: tagPillColor, fontSize: 12 * fontScale }]}>
                  {hasTags
                    ? tWidgets('tagSelector.tagCount', { count: selectedTags.length })
                    : tWidgets('tagSelector.addTags')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Unified BP display */}
          <View style={styles.bpCardWrapper}>
            <Card variant="elevated" size="lg">
              <CardBody>
                {/* Labels row */}
                <View style={styles.bpLabelsRow}>
                  <Text style={[styles.bpLabel, { color: colors.textSecondary, fontSize: typography.md }]}>
                    {tCommon('common.systolic')}
                  </Text>
                  <View style={styles.bpLabelSpacer} />
                  <Text style={[styles.bpLabel, { color: colors.textSecondary, fontSize: typography.md }]}>
                    {tCommon('common.diastolic')}
                  </Text>
                </View>

                {/* Main BP numbers row */}
                <View style={styles.bpNumbersRow}>
                  <Pressable
                    style={[
                      styles.bpTapArea,
                      activeField === 'systolic' && !sysOutOfRange && !sysLeDia && { backgroundColor: colors.accent + '20', borderRadius: 14, borderWidth: 2, borderColor: colors.accent },
                      (sysOutOfRange || sysLeDia) && activeField === 'systolic' && { backgroundColor: colors.error + '30', borderRadius: 14, borderWidth: 2.5, borderColor: colors.error },
                      (sysOutOfRange || sysLeDia) && activeField !== 'systolic' && { backgroundColor: colors.error + '10', borderRadius: 14, borderWidth: 1.5, borderColor: colors.error + '60' },
                    ]}
                    onPress={() => { setWeightFocused(false); setActiveField('systolic'); }}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon('common.systolic')}
                  >
                    <Text
                      style={[
                        styles.bpNumber,
                        {
                          color:
                            systolic && validation.isValid
                              ? categoryColor
                              : activeField === 'systolic'
                              ? colors.accent
                              : colors.textPrimary,
                          fontSize: typography.hero,
                        },
                      ]}
                    >
                      {systolic || '---'}
                    </Text>
                  </Pressable>

                  <Text style={[styles.bpSlash, { color: colors.textTertiary, fontSize: typography['3xl'] }]}>/</Text>

                  <Pressable
                    style={[
                      styles.bpTapArea,
                      activeField === 'diastolic' && !diaOutOfRange && !sysLeDia && { backgroundColor: colors.accent + '20', borderRadius: 14, borderWidth: 2, borderColor: colors.accent },
                      (diaOutOfRange || sysLeDia) && activeField === 'diastolic' && { backgroundColor: colors.error + '30', borderRadius: 14, borderWidth: 2.5, borderColor: colors.error },
                      (diaOutOfRange || sysLeDia) && activeField !== 'diastolic' && { backgroundColor: colors.error + '10', borderRadius: 14, borderWidth: 1.5, borderColor: colors.error + '60' },
                    ]}
                    onPress={() => { setWeightFocused(false); setActiveField('diastolic'); }}
                    accessibilityRole="button"
                    accessibilityLabel={tCommon('common.diastolic')}
                  >
                    <Text
                      style={[
                        styles.bpNumber,
                        {
                          color:
                            diastolic && validation.isValid
                              ? categoryColor
                              : activeField === 'diastolic'
                              ? colors.accent
                              : colors.textPrimary,
                          fontSize: typography.hero,
                        },
                      ]}
                    >
                      {diastolic || '---'}
                    </Text>
                  </Pressable>
                </View>

                {/* mmHg unit */}
                <Text style={[styles.bpUnit, { color: colors.textTertiary, fontSize: typography.md }]}>mmHg</Text>

                {/* Pulse row */}
                <Pressable
                  style={[
                    styles.pulseRow,
                    {
                      backgroundColor: pulseOutOfRange
                        ? colors.error + '15'
                        : activeField === 'pulse' ? colors.accent + '20' : colors.surfaceSecondary,
                      borderColor: pulseOutOfRange
                        ? colors.error
                        : activeField === 'pulse' ? colors.accent : colors.border,
                      borderWidth: activeField === 'pulse' || pulseOutOfRange ? 2 : 1,
                    },
                  ]}
                  onPress={() => { setWeightFocused(false); setActiveField('pulse'); }}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('common.pulse')}
                >
                  <Icon name="heart" size={20 * fontScale} color={activeField === 'pulse' ? colors.accent : colors.textSecondary} />
                  <Text
                    style={[
                      styles.pulseText,
                      {
                        color: activeField === 'pulse' ? colors.accent : colors.textPrimary,
                        fontSize: typography.xl,
                      },
                    ]}
                  >
                    {pulse || '--'}
                  </Text>
                  <Text style={[styles.pulseUnit, { color: colors.textTertiary, fontSize: typography.md }]}>
                    {tCommon('units.bpm')}
                  </Text>
                </Pressable>

                {/* Category badge or field warning */}
                {fieldWarning ? (
                  <View style={styles.categoryRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: colors.error + '15', borderColor: colors.error },
                      ]}
                    >
                      <Icon name="warning" size={14 * fontScale} color={colors.error} />
                      <Text
                        style={[styles.categoryText, { color: colors.error, fontSize: typography.sm }]}
                        numberOfLines={2}
                      >
                        {fieldWarning}
                      </Text>
                    </View>
                  </View>
                ) : category && validation.isValid ? (
                  <View style={styles.categoryRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        { backgroundColor: categoryColor + '18', borderColor: categoryColor },
                      ]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                      <Text
                        style={[styles.categoryText, { color: categoryColor, fontSize: typography.sm }]}
                        numberOfLines={1}
                      >
                        {categoryLabel}
                      </Text>
                    </View>
                  </View>
                ) : null}
              </CardBody>
            </Card>
          </View>
        </View>

        {/* ── Bottom section: numpad + save ── */}
        <View style={styles.bottomSection}>
          <Numpad
            value={weightFocused ? weightText : getCurrentValue()}
            onValueChange={weightFocused ? setWeightText : handleNumpadChange}
            maxLength={weightFocused ? 6 : 3}
            allowDecimal={weightFocused}
            disabled={recordBP.isPending}
            compact={false}
          />
          <View style={styles.saveRow}>
            <SaveButton
              label={recordBP.isPending ? t('quickLog.saving') : t('quickLog.saveReading')}
              isValid={isValid}
              isLoading={recordBP.isPending}
              onPress={handleSubmit}
              fontScale={fontScale}
            />
          </View>
        </View>
      </View>

      {/* ── Crisis modal overlay ── */}
      <CrisisModal
        visible={crisisVisible}
        systolic={systolicNum ?? 0}
        diastolic={diastolicNum ?? 0}
        onCancel={() => setCrisisVisible(false)}
        onConfirm={() => { setCrisisVisible(false); saveRecord(); }}
      />

      {/* ── Lifestyle tag picker ── */}
      <TagPickerModal
        visible={tagPickerVisible}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        onClose={() => setTagPickerVisible(false)}
        disabled={recordBP.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Content wrapper ──
  content: { flex: 1 },

  // ── Top section ──
  topSection: { flex: 1, justifyContent: 'center', paddingTop: 4 },
  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  // ── Unified BP display ──
  bpCardWrapper: {
    paddingHorizontal: 16,
  },
  bpLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  bpLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
    flex: 1,
  },
  bpLabelSpacer: {
    width: 32,
  },
  bpNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bpTapArea: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  bpNumber: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
  },
  bpSlash: {
    fontFamily: FONTS.regular,
    marginHorizontal: 4,
  },
  bpUnit: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  pulseText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  pulseUnit: {
    fontFamily: FONTS.regular,
  },

  // ── Pills row ──
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  weightInput: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  weightUnitText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },

  // ── Category badge ──
  categoryRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagPillText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  categoryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  categoryText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },

  // ── Bottom section ──
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  // ── Save row ──
  saveRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
});

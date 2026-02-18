import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Numpad, DateTimePicker, Toast, CrisisModal, SaveButton } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useBPInput, useToast } from '../../../shared/lib';
import { isCrisisReading, useBPClassification } from '../../../entities/blood-pressure';
import { FONTS } from '../../../shared/config/theme';
import { useRecordBP, BP_RECORDS_QUERY_KEY } from '../../../features/record-bp';
import { useQueryClient } from '@tanstack/react-query';
import type { BPRecord } from '../../../shared/api/bp-repository';
import { detectMorningSurge } from '../../../shared/lib';
import { TagPickerModal } from '../../../widgets/tag-selector';
import type { LifestyleTag } from '../../../shared/types/lifestyle-tag';

export function NewReadingPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { t: tValidation } = useTranslation('validation');
  const { t: tWidgets } = useTranslation('widgets');
  const { colors, fontScale, typography } = useTheme();
  const navigation = useNavigation();
  const { guideline, defaultLocation, defaultPosture } = useSettingsStore();
  const recordBP = useRecordBP();
  const queryClient = useQueryClient();

  const { systolic, diastolic, pulse, activeField, setActiveField, handleNumpadChange, getCurrentValue } = useBPInput();
  const { toastMsg, toastType, toastVisible, showToast, hideToast } = useToast();
  const { systolicNum, diastolicNum, pulseNum, validation, category, categoryColor, categoryLabel } =
    useBPClassification(systolic, diastolic, pulse, guideline);

  const [measurementTime, setMeasurementTime] = useState(new Date());
  const [crisisVisible, setCrisisVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState<LifestyleTag[]>([]);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);

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
      await recordBP.mutateAsync({
        systolic: systolicNum!,
        diastolic: diastolicNum!,
        pulse: pulseNum,
        timestamp: Math.floor(measurementTime.getTime() / 1000),
        location: defaultLocation,
        posture: defaultPosture,
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
        console.warn('Surge detection failed:', surgeError);
        // Continue to navigation even if surge detection fails
      }

      navigation.goBack();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('newReading.alerts.error.message'),
      );
    }
  };

  const isValid = validation.isValid && !!systolic && !!diastolic;
  const hasCategory = !!(category && validation.isValid);
  const hasTags = selectedTags.length > 0;
  const tagPillBg = hasTags ? colors.accent + '15' : 'transparent';
  const tagPillBorder = hasTags ? colors.accent : colors.border;
  const tagPillColor = hasTags ? colors.accent : colors.textSecondary;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: typography.xl }]}>
          {t('newReading.title')}
        </Text>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
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

          {/* Value cards row */}
          <View style={styles.valuesRow}>

            {/* Systolic */}
            <TouchableOpacity
              style={[
                styles.valueBox,
                {
                  backgroundColor:
                    activeField === 'systolic' ? colors.accent + '10' : colors.surface,
                  borderColor: activeField === 'systolic' ? colors.accent : colors.border,
                  shadowColor: colors.shadow,
                  shadowOpacity: colors.shadowOpacity,
                },
              ]}
              onPress={() => setActiveField('systolic')}
              activeOpacity={0.85}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: Math.round(10 * fontScale) }]}>
                {tCommon('common.systolic')}
              </Text>
              <Text
                style={[
                  styles.valueText,
                  {
                    color:
                      systolic && validation.isValid
                        ? categoryColor
                        : activeField === 'systolic'
                        ? colors.accent
                        : colors.textPrimary,
                    fontSize: 32 * fontScale,
                  },
                ]}
              >
                {systolic || '---'}
              </Text>
              <Text style={[styles.valueUnit, { color: colors.textTertiary, fontSize: Math.round(9 * fontScale) }]}>mmHg</Text>
            </TouchableOpacity>

            {/* "/" divider */}
            <View style={styles.divider}>
              <Text style={[styles.dividerText, { color: colors.textTertiary, fontSize: typography.xl }]}>/</Text>
            </View>

            {/* Diastolic */}
            <TouchableOpacity
              style={[
                styles.valueBox,
                {
                  backgroundColor:
                    activeField === 'diastolic' ? colors.accent + '10' : colors.surface,
                  borderColor: activeField === 'diastolic' ? colors.accent : colors.border,
                  shadowColor: colors.shadow,
                  shadowOpacity: colors.shadowOpacity,
                },
              ]}
              onPress={() => setActiveField('diastolic')}
              activeOpacity={0.85}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: Math.round(10 * fontScale) }]}>
                {tCommon('common.diastolic')}
              </Text>
              <Text
                style={[
                  styles.valueText,
                  {
                    color:
                      diastolic && validation.isValid
                        ? categoryColor
                        : activeField === 'diastolic'
                        ? colors.accent
                        : colors.textPrimary,
                    fontSize: 32 * fontScale,
                  },
                ]}
              >
                {diastolic || '---'}
              </Text>
              <Text style={[styles.valueUnit, { color: colors.textTertiary, fontSize: Math.round(9 * fontScale) }]}>mmHg</Text>
            </TouchableOpacity>

            {/* Pulse */}
            <TouchableOpacity
              style={[
                styles.valueBoxPulse,
                {
                  backgroundColor:
                    activeField === 'pulse' ? colors.accent + '10' : colors.surface,
                  borderColor: activeField === 'pulse' ? colors.accent : colors.border,
                  shadowColor: colors.shadow,
                  shadowOpacity: colors.shadowOpacity,
                },
              ]}
              onPress={() => setActiveField('pulse')}
              activeOpacity={0.85}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: Math.round(10 * fontScale) }]}>
                {tCommon('common.pulse')}
              </Text>
              <Text
                style={[
                  styles.valueText,
                  {
                    color: activeField === 'pulse' ? colors.accent : colors.textPrimary,
                    fontSize: 32 * fontScale,
                  },
                ]}
              >
                {pulse || '--'}
              </Text>
              <Text style={[styles.valueUnit, { color: colors.textTertiary, fontSize: Math.round(9 * fontScale) }]}>
                {tCommon('units.bpm')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Category badge row */}
          {category && validation.isValid ? (
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: categoryColor + '18', borderColor: categoryColor },
                ]}
              >
                <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
                <Text
                  style={[styles.categoryText, { color: categoryColor, fontSize: 13 * fontScale }]}
                  numberOfLines={1}
                >
                  {categoryLabel}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ── Bottom section: numpad + save ── */}
        <View style={styles.bottomSection}>
          <Numpad
            value={getCurrentValue()}
            onValueChange={handleNumpadChange}
            maxLength={3}
            disabled={recordBP.isPending}
            compact={hasCategory}
          />
          <View style={styles.saveRow}>
            <SaveButton
              label={recordBP.isPending ? t('newReading.saving') : t('newReading.saveMeasurement')}
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
  topSection: { paddingTop: 8 },
  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  // ── Value cards ──
  valuesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    alignItems: 'center',
  },
  valueBox: {
    flex: 2,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  valueBoxPulse: {
    flex: 1.4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  divider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    width: 14,
  },
  dividerText: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
  },
  valueLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  valueText: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
  },
  valueUnit: {
    fontFamily: FONTS.regular,
    marginTop: 2,
  },

  // ── Category badge ──
  categoryRow: {
    paddingHorizontal: 16,
    marginTop: 10,
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

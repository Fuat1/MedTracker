import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Numpad, DateTimePicker, Toast, CrisisModal, SaveButton, Card, CardBody} from '../../../shared/ui';
import {useTheme} from '../../../shared/lib/use-theme';
import {FONTS} from '../../../shared/config/theme';
import {BP_LIMITS} from '../../../shared/config';
import {TagPickerModal} from '../../tag-selector';
import {useBPReadingForm} from '../lib/use-bp-reading-form';

interface BPReadingFormProps {
  variant: 'full' | 'compact';
  title: string;
  subtitle?: string;
  autoAdvance: boolean;
  onDismiss: () => void;
}

export function BPReadingForm({variant, title, subtitle, autoAdvance, onDismiss}: BPReadingFormProps) {
  const {colors, fontScale, typography} = useTheme();

  const {
    systolic, diastolic, pulse,
    activeField, setActiveField, handleNumpadChange, getCurrentValue,
    systolicNum, diastolicNum, pulseNum,
    validation, category, categoryColor, categoryLabel, isValid,
    measurementTime, setMeasurementTime,
    crisisVisible, setCrisisVisible,
    selectedTags, setSelectedTags, tagPickerVisible, setTagPickerVisible, hasTags,
    weightText, setWeightText, weightFocused, setWeightFocused, hasWeight, weightUnit,
    toastMsg, toastType, toastVisible, hideToast,
    handleSubmit, saveRecord,
    isSaving,
    t, tCommon, tWidgets,
  } = useBPReadingForm({autoAdvance, onDismiss});

  const hasCategory = !!(category && validation.isValid);

  // Pill colors
  const tagPillBg = hasTags ? colors.accent + '15' : 'transparent';
  const tagPillBorder = hasTags ? colors.accent : colors.border;
  const tagPillColor = hasTags ? colors.accent : colors.textSecondary;
  const weightPillBg = weightFocused ? colors.accent + '10' : hasWeight ? colors.accent + '15' : 'transparent';
  const weightPillBorder = weightFocused || hasWeight ? colors.accent : colors.border;
  const weightPillColor = weightFocused || hasWeight ? colors.accent : colors.textSecondary;

  // compact-only: per-field range warnings
  const sysOutOfRange = systolicNum != null && (systolicNum < BP_LIMITS.systolic.min || systolicNum > BP_LIMITS.systolic.max);
  const diaOutOfRange = diastolicNum != null && (diastolicNum < BP_LIMITS.diastolic.min || diastolicNum > BP_LIMITS.diastolic.max);
  const pulseOutOfRange = pulseNum != null && (pulseNum < BP_LIMITS.pulse.min || pulseNum > BP_LIMITS.pulse.max);
  const sysLeDia = systolicNum != null && diastolicNum != null && systolicNum <= diastolicNum;

  const {t: tValidation} = require('react-i18next').useTranslation('validation');
  const fieldWarning = sysOutOfRange
    ? tCommon('common.systolic') + ': ' + tValidation('errors.systolicRange', {min: BP_LIMITS.systolic.min, max: BP_LIMITS.systolic.max})
    : diaOutOfRange
    ? tCommon('common.diastolic') + ': ' + tValidation('errors.diastolicRange', {min: BP_LIMITS.diastolic.min, max: BP_LIMITS.diastolic.max})
    : pulseOutOfRange
    ? tCommon('common.pulse') + ': ' + tValidation('errors.pulseRange', {min: BP_LIMITS.pulse.min, max: BP_LIMITS.pulse.max})
    : sysLeDia
    ? tValidation('errors.systolicGreater')
    : null;

  const saveLabel = isSaving
    ? (variant === 'full' ? t('newReading.saving') : t('quickLog.saving'))
    : (variant === 'full' ? t('newReading.saveMeasurement') : t('quickLog.saveReading'));

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View>
          <Text style={[styles.headerTitle, {color: colors.textPrimary, fontSize: typography.xl}]}>
            {title}
          </Text>
          {subtitle != null && (
            <Text style={[styles.headerSubtitle, {color: colors.textSecondary, fontSize: typography.xs}]}>
              {subtitle}
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.closeButton, {backgroundColor: colors.surfaceSecondary}]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={tCommon('buttons.close' as any)}
        >
          <Icon name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>

        {/* Floating toast */}
        <Toast
          message={toastMsg}
          type={toastType}
          visible={toastVisible}
          onHide={hideToast}
        />

        {/* ── Top section ── */}
        <View style={variant === 'compact' ? styles.topSectionCompact : styles.topSectionFull}>

          <View style={styles.dateTimeWrapper}>
            <DateTimePicker
              value={measurementTime}
              onChange={setMeasurementTime}
              disabled={isSaving}
            />
            <View style={styles.pillsRow}>
              <Pressable
                style={[styles.weightPill, {backgroundColor: weightPillBg, borderColor: weightPillBorder}]}
                onPress={() => setWeightFocused(true)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel={tCommon('weight.label')}
              >
                <Icon name="scale-outline" size={13} color={weightPillColor} />
                <Text style={[styles.weightInput, {color: weightText ? weightPillColor : colors.textTertiary, fontSize: 12 * fontScale}]}>
                  {weightText || '--'}
                </Text>
                <Text style={[styles.weightUnitText, {color: weightPillColor, fontSize: 12 * fontScale}]}>
                  {tCommon(`weight.${weightUnit}`)}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tagPill, {backgroundColor: tagPillBg, borderColor: tagPillBorder}]}
                onPress={() => setTagPickerVisible(true)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel={tWidgets('tagSelector.title')}
              >
                <Icon name="pricetags-outline" size={13} color={tagPillColor} />
                <Text style={[styles.tagPillText, {color: tagPillColor, fontSize: 12 * fontScale}]}>
                  {hasTags
                    ? tWidgets('tagSelector.tagCount', {count: selectedTags.length})
                    : tWidgets('tagSelector.addTags')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── Value display: full variant ── */}
          {variant === 'full' && (
            <>
              <View style={styles.valuesRow}>
                {/* Systolic */}
                <Pressable
                  style={[
                    styles.valueBox,
                    {
                      backgroundColor: activeField === 'systolic' ? colors.accent + '10' : colors.surface,
                      borderColor: activeField === 'systolic' ? colors.accent : colors.border,
                      shadowColor: colors.shadow,
                      shadowOpacity: colors.shadowOpacity,
                    },
                  ]}
                  onPress={() => { setWeightFocused(false); setActiveField('systolic'); }}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('common.systolic')}
                >
                  <Text style={[styles.valueLabel, {color: colors.textSecondary, fontSize: Math.round(10 * fontScale)}]}>
                    {tCommon('common.systolic')}
                  </Text>
                  <Text
                    style={[
                      styles.valueText,
                      {
                        color: systolic && validation.isValid
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
                  <Text style={[styles.valueUnit, {color: colors.textTertiary, fontSize: Math.round(9 * fontScale)}]}>mmHg</Text>
                </Pressable>

                <View style={styles.divider}>
                  <Text style={[styles.dividerText, {color: colors.textTertiary, fontSize: typography.xl}]}>/</Text>
                </View>

                {/* Diastolic */}
                <Pressable
                  style={[
                    styles.valueBox,
                    {
                      backgroundColor: activeField === 'diastolic' ? colors.accent + '10' : colors.surface,
                      borderColor: activeField === 'diastolic' ? colors.accent : colors.border,
                      shadowColor: colors.shadow,
                      shadowOpacity: colors.shadowOpacity,
                    },
                  ]}
                  onPress={() => { setWeightFocused(false); setActiveField('diastolic'); }}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('common.diastolic')}
                >
                  <Text style={[styles.valueLabel, {color: colors.textSecondary, fontSize: Math.round(10 * fontScale)}]}>
                    {tCommon('common.diastolic')}
                  </Text>
                  <Text
                    style={[
                      styles.valueText,
                      {
                        color: diastolic && validation.isValid
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
                  <Text style={[styles.valueUnit, {color: colors.textTertiary, fontSize: Math.round(9 * fontScale)}]}>mmHg</Text>
                </Pressable>

                {/* Pulse */}
                <Pressable
                  style={[
                    styles.valueBoxPulse,
                    {
                      backgroundColor: activeField === 'pulse' ? colors.accent + '10' : colors.surface,
                      borderColor: activeField === 'pulse' ? colors.accent : colors.border,
                      shadowColor: colors.shadow,
                      shadowOpacity: colors.shadowOpacity,
                    },
                  ]}
                  onPress={() => { setWeightFocused(false); setActiveField('pulse'); }}
                  accessibilityRole="button"
                  accessibilityLabel={tCommon('common.pulse')}
                >
                  <Text style={[styles.valueLabel, {color: colors.textSecondary, fontSize: Math.round(10 * fontScale)}]}>
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
                  <Text style={[styles.valueUnit, {color: colors.textTertiary, fontSize: Math.round(9 * fontScale)}]}>
                    {tCommon('units.bpm')}
                  </Text>
                </Pressable>
              </View>

              {/* Category badge (full variant) */}
              {category && validation.isValid ? (
                <View style={styles.categoryRowFull}>
                  <View style={[styles.categoryBadge, {backgroundColor: categoryColor + '18', borderColor: categoryColor}]}>
                    <View style={[styles.categoryDot, {backgroundColor: categoryColor}]} />
                    <Text style={[styles.categoryText, {color: categoryColor, fontSize: 13 * fontScale}]} numberOfLines={1}>
                      {categoryLabel}
                    </Text>
                  </View>
                </View>
              ) : null}
            </>
          )}

          {/* ── Value display: compact variant ── */}
          {variant === 'compact' && (
            <View style={styles.bpCardWrapper}>
              <Card variant="elevated" size="lg">
                <CardBody>
                  {/* Labels row */}
                  <View style={styles.bpLabelsRow}>
                    <Text style={[styles.bpLabel, {color: colors.textSecondary, fontSize: typography.md}]}>
                      {tCommon('common.systolic')}
                    </Text>
                    <View style={styles.bpLabelSpacer} />
                    <Text style={[styles.bpLabel, {color: colors.textSecondary, fontSize: typography.md}]}>
                      {tCommon('common.diastolic')}
                    </Text>
                  </View>

                  {/* Main BP numbers row */}
                  <View style={styles.bpNumbersRow}>
                    <Pressable
                      style={[
                        styles.bpTapArea,
                        activeField === 'systolic' && !sysOutOfRange && !sysLeDia && {backgroundColor: colors.accent + '20', borderRadius: 14, borderWidth: 2, borderColor: colors.accent},
                        (sysOutOfRange || sysLeDia) && activeField === 'systolic' && {backgroundColor: colors.error + '30', borderRadius: 14, borderWidth: 2.5, borderColor: colors.error},
                        (sysOutOfRange || sysLeDia) && activeField !== 'systolic' && {backgroundColor: colors.error + '10', borderRadius: 14, borderWidth: 1.5, borderColor: colors.error + '60'},
                      ]}
                      onPress={() => { setWeightFocused(false); setActiveField('systolic'); }}
                      accessibilityRole="button"
                      accessibilityLabel={tCommon('common.systolic')}
                    >
                      <Text
                        style={[
                          styles.bpNumber,
                          {
                            color: systolic && validation.isValid
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

                    <Text style={[styles.bpSlash, {color: colors.textTertiary, fontSize: typography['3xl']}]}>/</Text>

                    <Pressable
                      style={[
                        styles.bpTapArea,
                        activeField === 'diastolic' && !diaOutOfRange && !sysLeDia && {backgroundColor: colors.accent + '20', borderRadius: 14, borderWidth: 2, borderColor: colors.accent},
                        (diaOutOfRange || sysLeDia) && activeField === 'diastolic' && {backgroundColor: colors.error + '30', borderRadius: 14, borderWidth: 2.5, borderColor: colors.error},
                        (diaOutOfRange || sysLeDia) && activeField !== 'diastolic' && {backgroundColor: colors.error + '10', borderRadius: 14, borderWidth: 1.5, borderColor: colors.error + '60'},
                      ]}
                      onPress={() => { setWeightFocused(false); setActiveField('diastolic'); }}
                      accessibilityRole="button"
                      accessibilityLabel={tCommon('common.diastolic')}
                    >
                      <Text
                        style={[
                          styles.bpNumber,
                          {
                            color: diastolic && validation.isValid
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

                  <Text style={[styles.bpUnit, {color: colors.textTertiary, fontSize: typography.md}]}>mmHg</Text>

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
                    <Text style={[styles.pulseText, {color: activeField === 'pulse' ? colors.accent : colors.textPrimary, fontSize: typography.xl}]}>
                      {pulse || '--'}
                    </Text>
                    <Text style={[styles.pulseUnit, {color: colors.textTertiary, fontSize: typography.md}]}>
                      {tCommon('units.bpm')}
                    </Text>
                  </Pressable>

                  {/* Category badge or field warning */}
                  {fieldWarning ? (
                    <View style={styles.categoryRowCompact}>
                      <View style={[styles.categoryBadge, {backgroundColor: colors.error + '15', borderColor: colors.error}]}>
                        <Icon name="warning" size={14 * fontScale} color={colors.error} />
                        <Text style={[styles.categoryText, {color: colors.error, fontSize: typography.sm}]} numberOfLines={2}>
                          {fieldWarning}
                        </Text>
                      </View>
                    </View>
                  ) : category && validation.isValid ? (
                    <View style={styles.categoryRowCompact}>
                      <View style={[styles.categoryBadge, {backgroundColor: categoryColor + '18', borderColor: categoryColor}]}>
                        <View style={[styles.categoryDot, {backgroundColor: categoryColor}]} />
                        <Text style={[styles.categoryText, {color: categoryColor, fontSize: typography.sm}]} numberOfLines={1}>
                          {categoryLabel}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </CardBody>
              </Card>
            </View>
          )}
        </View>

        {/* ── Bottom section: numpad + save ── */}
        <View style={styles.bottomSection}>
          <Numpad
            value={weightFocused ? weightText : getCurrentValue()}
            onValueChange={weightFocused ? setWeightText : handleNumpadChange}
            maxLength={weightFocused ? 6 : 3}
            allowDecimal={weightFocused}
            disabled={isSaving}
            compact={variant === 'full' ? hasCategory : false}
          />
          <View style={styles.saveRow}>
            <SaveButton
              label={saveLabel}
              isValid={isValid}
              isLoading={isSaving}
              onPress={handleSubmit}
              fontScale={fontScale}
            />
          </View>
        </View>
      </View>

      {/* ── Crisis modal ── */}
      <CrisisModal
        visible={crisisVisible}
        systolic={systolicNum ?? 0}
        diastolic={diastolicNum ?? 0}
        onCancel={() => setCrisisVisible(false)}
        onConfirm={() => { setCrisisVisible(false); saveRecord(); }}
      />

      {/* ── Tag picker ── */}
      <TagPickerModal
        visible={tagPickerVisible}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        onClose={() => setTagPickerVisible(false)}
        disabled={isSaving}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},

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

  // ── Content ──
  content: {flex: 1},

  // ── Top sections ──
  topSectionFull: {paddingTop: 8},
  topSectionCompact: {flex: 1, justifyContent: 'center', paddingTop: 4},

  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },

  // ── Pills ──
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

  // ── Full variant: value boxes ──
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
    shadowOffset: {width: 0, height: 2},
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
    shadowOffset: {width: 0, height: 2},
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
  categoryRowFull: {
    paddingHorizontal: 16,
    marginTop: 10,
  },

  // ── Compact variant: unified card ──
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
  categoryRowCompact: {
    alignItems: 'center',
    marginTop: 12,
  },

  // ── Shared category badge ──
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
  saveRow: {paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8},
});

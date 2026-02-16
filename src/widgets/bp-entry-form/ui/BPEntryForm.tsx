import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Numpad } from '../../../shared/ui';
import {
  MEASUREMENT_LOCATIONS,
  MEASUREMENT_POSTURES,
  type MeasurementLocation,
  type MeasurementPosture,
} from '../../../shared/config';
import {
  validateBPValues,
  classifyBP,
  getBPCategoryColor,
  getBPCategoryLabel,
  isCrisisReading,
} from '../../../entities/blood-pressure';
import { useRecordBP } from '../../../features/record-bp';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';

type ActiveField = 'systolic' | 'diastolic' | 'pulse' | null;

export function BPEntryForm() {
  const { t } = useTranslation('widgets');
  const { t: tCommon } = useTranslation('common');
  const { t: tMedical } = useTranslation('medical');
  const { t: tValidation } = useTranslation('validation');
  const { colors, fontScale, typography } = useTheme();
  const { defaultLocation, defaultPosture, setDefaultLocation, setDefaultPosture } = useSettingsStore();

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [location, setLocation] = useState<MeasurementLocation>(defaultLocation);
  const [posture, setPosture] = useState<MeasurementPosture>(defaultPosture);
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const recordBP = useRecordBP();

  // Sync with store defaults when they change
  useEffect(() => {
    setLocation(defaultLocation);
    setPosture(defaultPosture);
  }, [defaultLocation, defaultPosture]);

  const systolicNum = systolic ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic ? parseInt(diastolic, 10) : null;
  const pulseNum = pulse ? parseInt(pulse, 10) : null;

  const validation = validateBPValues(systolicNum, diastolicNum, pulseNum);

  const category =
    systolicNum && diastolicNum ? classifyBP(systolicNum, diastolicNum) : null;

  const categoryColor = category ? getBPCategoryColor(category) : colors.textTertiary;
  const categoryLabel = category ? getBPCategoryLabel(category) : '';

  const handleFieldPress = useCallback((field: ActiveField) => {
    setActiveField(field);
  }, []);

  const handleNumpadChange = useCallback(
    (value: string) => {
      switch (activeField) {
        case 'systolic':
          setSystolic(value);
          break;
        case 'diastolic':
          setDiastolic(value);
          break;
        case 'pulse':
          setPulse(value);
          break;
      }
    },
    [activeField],
  );

  const getCurrentValue = (): string => {
    switch (activeField) {
      case 'systolic':
        return systolic;
      case 'diastolic':
        return diastolic;
      case 'pulse':
        return pulse;
      default:
        return '';
    }
  };

  const handleLocationChange = useCallback(
    (newLocation: MeasurementLocation) => {
      setLocation(newLocation);
      setDefaultLocation(newLocation); // Save to store
    },
    [setDefaultLocation],
  );

  const handlePostureChange = useCallback(
    (newPosture: MeasurementPosture) => {
      setPosture(newPosture);
      setDefaultPosture(newPosture); // Save to store
    },
    [setDefaultPosture],
  );

  const handleSubmit = async () => {
    if (!validation.isValid || !systolicNum || !diastolicNum) {
      Alert.alert(tValidation('errors.validationError'), validation.errors.join('\n'));
      return;
    }

    // Crisis warning
    if (isCrisisReading(systolicNum, diastolicNum)) {
      Alert.alert(
        tMedical('crisis.title'),
        tMedical('crisis.message'),
        [
          { text: tCommon('buttons.cancel'), style: 'cancel' },
          {
            text: tCommon('buttons.saveAnyway'),
            style: 'destructive',
            onPress: () => saveRecord(),
          },
        ],
      );
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
        location,
        posture,
      });

      // Reset form
      setSystolic('');
      setDiastolic('');
      setPulse('');
      setActiveField(null);

      Alert.alert(t('bpEntry.alerts.success.title'), t('bpEntry.alerts.success.message'));
    } catch (error) {
      Alert.alert(
        t('bpEntry.alerts.error.title'),
        error instanceof Error ? error.message : t('bpEntry.alerts.error.message'),
      );
    }
  };

  const locationLabels: Record<MeasurementLocation, string> = {
    left_arm: tCommon('location.leftArm'),
    right_arm: tCommon('location.rightArm'),
    left_wrist: tCommon('location.leftWrist'),
    right_wrist: tCommon('location.rightWrist'),
  };

  const postureLabels: Record<MeasurementPosture, string> = {
    sitting: tCommon('posture.sitting'),
    standing: tCommon('posture.standing'),
    lying: tCommon('posture.lying'),
  };

  const isFormValid = validation.isValid && !!systolic && !!diastolic;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* BP Values Display */}
        <View
          style={[styles.valuesContainer, { backgroundColor: categoryColor + '20' }]}
        >
          <View style={styles.bpRow}>
            <Pressable
              style={[
                styles.valueBox,
                styles.valueBoxLeft,
                activeField === 'systolic' && { backgroundColor: colors.surface },
              ]}
              onPress={() => handleFieldPress('systolic')}
              accessibilityRole="button"
              accessibilityLabel={t('bpEntry.systolic')}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>{t('bpEntry.systolic')}</Text>
              <Text
                style={[styles.valueText, { color: categoryColor, fontSize: typography['3xl'] }]}
              >
                {systolic || '---'}
              </Text>
            </Pressable>

            <Text style={[styles.separator, { color: colors.textTertiary, fontSize: Math.round(24 * fontScale) }]}>/</Text>

            <Pressable
              style={[
                styles.valueBox,
                styles.valueBoxRight,
                activeField === 'diastolic' && { backgroundColor: colors.surface },
              ]}
              onPress={() => handleFieldPress('diastolic')}
              accessibilityRole="button"
              accessibilityLabel={t('bpEntry.diastolic')}
            >
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>{t('bpEntry.diastolic')}</Text>
              <Text
                style={[styles.valueText, { color: categoryColor, fontSize: typography['3xl'] }]}
              >
                {diastolic || '---'}
              </Text>
            </Pressable>
          </View>

          {/* Pulse */}
          <Pressable
            style={[
              styles.pulseBox,
              activeField === 'pulse' && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleFieldPress('pulse')}
            accessibilityRole="button"
            accessibilityLabel={t('bpEntry.pulse')}
          >
            <Text style={[styles.pulseLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>{t('bpEntry.pulse')}</Text>
            <Text style={[styles.pulseText, { color: colors.textPrimary, fontSize: Math.round(24 * fontScale) }]}>
              {pulse ? `${pulse} ${tCommon('units.bpm')}` : `--- ${tCommon('units.bpm')}`}
            </Text>
          </Pressable>

          {/* Category Label */}
          {category && (
            <View style={styles.categoryContainer}>
              <View
                style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
              >
                <Text style={[styles.categoryText, { color: colors.surface }]}>{categoryLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* More Info Collapsible Section */}
        <View style={[styles.moreInfoSection, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Pressable
            style={styles.moreInfoHeader}
            onPress={() => setShowMoreInfo(!showMoreInfo)}
            accessibilityRole="button"
            accessibilityLabel={showMoreInfo ? t('bpEntry.hideOptions') : t('bpEntry.showOptions')}
          >
            <Text style={[styles.moreInfoTitle, { color: colors.textPrimary, fontSize: typography.md }]}>{tCommon('common.moreInfo')}</Text>
            <Text style={[styles.moreInfoArrow, { color: colors.textSecondary, fontSize: typography.sm }]}>{showMoreInfo ? '▲' : '▼'}</Text>
          </Pressable>

          {showMoreInfo && (
            <View style={styles.moreInfoContent}>
              {/* Location Selector */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  {t('bpEntry.location')}
                </Text>
                <View style={styles.optionsRow}>
                  {Object.entries(MEASUREMENT_LOCATIONS).map(([key, value]) => (
                    <Pressable
                      key={key}
                      style={[
                        styles.optionButton,
                        styles.optionButtonMargin,
                        { backgroundColor: location === value ? colors.accent : colors.surfaceSecondary },
                      ]}
                      onPress={() => handleLocationChange(value)}
                      accessibilityRole="button"
                      accessibilityLabel={locationLabels[value]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: location === value ? colors.surface : colors.textPrimary },
                        ]}
                      >
                        {locationLabels[value]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Posture Selector */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('bpEntry.posture')}</Text>
                <View style={styles.optionsRow}>
                  {Object.entries(MEASUREMENT_POSTURES).map(([key, value]) => (
                    <Pressable
                      key={key}
                      style={[
                        styles.optionButton,
                        styles.optionButtonMarginRight,
                        { backgroundColor: posture === value ? colors.accent : colors.surfaceSecondary },
                      ]}
                      onPress={() => handlePostureChange(value)}
                      accessibilityRole="button"
                      accessibilityLabel={postureLabels[value]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          { color: posture === value ? colors.surface : colors.textPrimary },
                        ]}
                      >
                        {postureLabels[value]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: isFormValid ? colors.accent : colors.border },
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || recordBP.isPending}
          accessibilityRole="button"
          accessibilityLabel={t('bpEntry.saveReading')}
          accessibilityState={{ disabled: !isFormValid || recordBP.isPending }}
        >
          <Text style={[styles.submitButtonText, { color: colors.surface, fontSize: typography.lg }]}>
            {recordBP.isPending ? t('bpEntry.saving') : t('bpEntry.saveReading')}
          </Text>
        </Pressable>

        {/* Validation Errors */}
        {!validation.isValid && systolic && diastolic && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground }]}>
            {validation.errors.map((error, index) => (
              <Text key={index} style={[styles.errorText, { color: colors.error, fontSize: typography.sm }]}>
                • {error}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Numpad Modal */}
      <Modal
        visible={activeField !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveField(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          onPress={() => setActiveField(null)}
        >
          <View style={styles.modalSpacer} />
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle}>
              <View style={[styles.modalHandleBar, { backgroundColor: colors.border }]} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              {activeField === 'systolic'
                ? t('bpEntry.modals.enterSystolic')
                : activeField === 'diastolic'
                  ? t('bpEntry.modals.enterDiastolic')
                  : t('bpEntry.modals.enterPulse')}
            </Text>
            <Text style={[styles.modalValue, { color: colors.textPrimary, fontSize: Math.round(30 * fontScale) }]}>
              {getCurrentValue() || '0'}
            </Text>
            <Numpad
              value={getCurrentValue()}
              onValueChange={handleNumpadChange}
              maxLength={3}
            />
            <Pressable
              style={[styles.modalDoneButton, { backgroundColor: colors.accent }]}
              onPress={() => setActiveField(null)}
              accessibilityRole="button"
              accessibilityLabel={tCommon('buttons.done')}
            >
              <Text style={[styles.modalDoneText, { color: colors.surface, fontSize: typography.lg }]}>{tCommon('buttons.done')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    paddingVertical: 8,
  },
  valuesContainer: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  bpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  valueBoxLeft: {
    marginRight: 8,
  },
  valueBoxRight: {
    marginLeft: 8,
  },
  valueLabel: {
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  valueText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  separator: {
    fontFamily: FONTS.regular,
  },
  pulseBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  pulseLabel: {
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
  pulseText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  categoryContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  categoryText: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  moreInfoSection: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  moreInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  moreInfoTitle: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  moreInfoArrow: {
  },
  moreInfoContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
  },
  optionButtonMargin: {
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonMarginRight: {
    marginRight: 8,
  },
  optionText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
  },
  errorText: {
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
  },
  modalSpacer: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingBottom: 32,
  },
  modalHandle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHandleBar: {
    width: 48,
    height: 4,
    borderRadius: 9999,
  },
  modalTitle: {
    textAlign: 'center',
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  modalValue: {
    textAlign: 'center',
    fontFamily: FONTS.bold,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalDoneButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
});

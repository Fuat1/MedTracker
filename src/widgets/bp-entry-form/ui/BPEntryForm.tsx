import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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

type ActiveField = 'systolic' | 'diastolic' | 'pulse' | null;

export function BPEntryForm() {
  const { t } = useTranslation('widgets');
  const { t: tCommon } = useTranslation('common');
  const { t: tMedical } = useTranslation('medical');
  const { t: tValidation } = useTranslation('validation');
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

  const categoryColor = category ? getBPCategoryColor(category) : '#9ca3af';
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

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* BP Values Display */}
        <View
          style={[styles.valuesContainer, { backgroundColor: categoryColor + '20' }]}
        >
          <View style={styles.bpRow}>
            <TouchableOpacity
              style={[
                styles.valueBox,
                styles.valueBoxLeft,
                activeField === 'systolic' && styles.valueBoxActive,
              ]}
              onPress={() => handleFieldPress('systolic')}
              accessibilityRole="button"
              accessibilityLabel="Systolic input"
            >
              <Text style={styles.valueLabel}>{t('bpEntry.systolic')}</Text>
              <Text
                style={[styles.valueText, { color: categoryColor }]}
              >
                {systolic || '---'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.separator}>/</Text>

            <TouchableOpacity
              style={[
                styles.valueBox,
                styles.valueBoxRight,
                activeField === 'diastolic' && styles.valueBoxActive,
              ]}
              onPress={() => handleFieldPress('diastolic')}
              accessibilityRole="button"
              accessibilityLabel="Diastolic input"
            >
              <Text style={styles.valueLabel}>{t('bpEntry.diastolic')}</Text>
              <Text
                style={[styles.valueText, { color: categoryColor }]}
              >
                {diastolic || '---'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pulse */}
          <TouchableOpacity
            style={[
              styles.pulseBox,
              activeField === 'pulse' && styles.pulseBoxActive,
            ]}
            onPress={() => handleFieldPress('pulse')}
            accessibilityRole="button"
            accessibilityLabel="Pulse input"
          >
            <Text style={styles.pulseLabel}>{t('bpEntry.pulse')}</Text>
            <Text style={styles.pulseText}>
              {pulse ? `${pulse} ${tCommon('units.bpm')}` : `--- ${tCommon('units.bpm')}`}
            </Text>
          </TouchableOpacity>

          {/* Category Label */}
          {category && (
            <View style={styles.categoryContainer}>
              <View
                style={[styles.categoryBadge, { backgroundColor: categoryColor }]}
              >
                <Text style={styles.categoryText}>{categoryLabel}</Text>
              </View>
            </View>
          )}
        </View>

        {/* More Info Collapsible Section */}
        <View style={styles.moreInfoSection}>
          <TouchableOpacity
            style={styles.moreInfoHeader}
            onPress={() => setShowMoreInfo(!showMoreInfo)}
            accessibilityRole="button"
            accessibilityLabel={showMoreInfo ? 'Hide more options' : 'Show more options'}
          >
            <Text style={styles.moreInfoTitle}>{tCommon('common.moreInfo')}</Text>
            <Text style={styles.moreInfoArrow}>{showMoreInfo ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showMoreInfo && (
            <View style={styles.moreInfoContent}>
              {/* Location Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {t('bpEntry.location')}
                </Text>
                <View style={styles.optionsRow}>
                  {Object.entries(MEASUREMENT_LOCATIONS).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.optionButton,
                        styles.optionButtonMargin,
                        location === value ? styles.optionButtonActive : styles.optionButtonInactive,
                      ]}
                      onPress={() => handleLocationChange(value)}
                    >
                      <Text
                        style={location === value ? styles.optionTextActive : styles.optionTextInactive}
                      >
                        {locationLabels[value]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Posture Selector */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('bpEntry.posture')}</Text>
                <View style={styles.optionsRow}>
                  {Object.entries(MEASUREMENT_POSTURES).map(([key, value]) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.optionButton,
                        styles.optionButtonMarginRight,
                        posture === value ? styles.optionButtonActive : styles.optionButtonInactive,
                      ]}
                      onPress={() => handlePostureChange(value)}
                    >
                      <Text
                        style={posture === value ? styles.optionTextActive : styles.optionTextInactive}
                      >
                        {postureLabels[value]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            validation.isValid && systolic && diastolic
              ? styles.submitButtonActive
              : styles.submitButtonInactive,
          ]}
          onPress={handleSubmit}
          disabled={!validation.isValid || !systolic || !diastolic || recordBP.isPending}
        >
          <Text style={styles.submitButtonText}>
            {recordBP.isPending ? t('bpEntry.saving') : t('bpEntry.saveReading')}
          </Text>
        </TouchableOpacity>

        {/* Validation Errors */}
        {!validation.isValid && systolic && diastolic && (
          <View style={styles.errorContainer}>
            {validation.errors.map((error, index) => (
              <Text key={index} style={styles.errorText}>
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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveField(null)}
        >
          <View style={styles.modalSpacer} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle}>
              <View style={styles.modalHandleBar} />
            </View>
            <Text style={styles.modalTitle}>
              {activeField === 'systolic'
                ? t('bpEntry.modals.enterSystolic')
                : activeField === 'diastolic'
                  ? t('bpEntry.modals.enterDiastolic')
                  : t('bpEntry.modals.enterPulse')}
            </Text>
            <Text style={styles.modalValue}>
              {getCurrentValue() || '0'}
            </Text>
            <Numpad
              value={getCurrentValue()}
              onValueChange={handleNumpadChange}
              maxLength={3}
            />
            <TouchableOpacity
              style={styles.modalDoneButton}
              onPress={() => setActiveField(null)}
            >
              <Text style={styles.modalDoneText}>{tCommon('buttons.done')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  valueBoxActive: {
    backgroundColor: '#ffffff',
  },
  valueLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  separator: {
    fontSize: 24,
    color: '#9ca3af',
  },
  pulseBox: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  pulseBoxActive: {
    backgroundColor: '#ffffff',
  },
  pulseLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginBottom: 4,
  },
  pulseText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#374151',
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
    color: '#ffffff',
    fontWeight: '600',
  },
  moreInfoSection: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  moreInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  moreInfoTitle: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  moreInfoArrow: {
    color: '#6b7280',
    fontSize: 14,
  },
  moreInfoContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#4b5563',
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
  optionButtonActive: {
    backgroundColor: '#3b82f6',
  },
  optionButtonInactive: {
    backgroundColor: '#f3f4f6',
  },
  optionTextActive: {
    color: '#ffffff',
  },
  optionTextInactive: {
    color: '#374151',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonActive: {
    backgroundColor: '#3b82f6',
  },
  submitButtonInactive: {
    backgroundColor: '#d1d5db',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalSpacer: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#d1d5db',
    borderRadius: 9999,
  },
  modalTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  modalValue: {
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalDoneButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

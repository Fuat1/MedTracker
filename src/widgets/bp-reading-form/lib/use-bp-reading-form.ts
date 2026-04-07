import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {useQueryClient} from '@tanstack/react-query';
import {useBPInput, useToast} from '../../../shared/lib';
import {isCrisisReading, useBPClassification} from '../../../entities/blood-pressure';
import {useSettingsStore} from '../../../shared/lib/settings-store';
import {useRecordBP, BP_RECORDS_QUERY_KEY} from '../../../features/record-bp';
import {getWeightDisplayValue, parseWeightToKg} from '../../../entities/user-profile';
import {detectMorningSurge} from '../../../shared/lib';
import type {TagKey} from '../../../shared/api/bp-tags-repository';
import type {BPRecord} from '../../../shared/api/bp-repository';

interface UseBPReadingFormOptions {
  autoAdvance: boolean;
  onDismiss: () => void;
}

export function useBPReadingForm({autoAdvance, onDismiss}: UseBPReadingFormOptions) {
  const {t} = useTranslation('pages');
  const {t: tCommon} = useTranslation('common');
  const {t: tValidation} = useTranslation('validation');
  const {t: tWidgets} = useTranslation('widgets');
  const {guideline, defaultLocation, defaultPosture, defaultWeight, weightUnit} =
    useSettingsStore();
  const recordBP = useRecordBP();
  const queryClient = useQueryClient();

  const {systolic, diastolic, pulse, activeField, setActiveField, handleNumpadChange, getCurrentValue} =
    useBPInput({autoAdvance});
  const {toastMsg, toastType, toastVisible, showToast, hideToast} = useToast();
  const {systolicNum, diastolicNum, pulseNum, validation, category, categoryColor, categoryLabel} =
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
      try {
        const latestRecords =
          queryClient.getQueryData<BPRecord[]>(BP_RECORDS_QUERY_KEY) ?? [];
        const surge = detectMorningSurge(latestRecords);
        if (surge.hasSurge) {
          showToast(tCommon('morningSurgeAlert', {delta: surge.delta}), 'warning');
          await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
        }
      } catch (surgeError) {
        if (__DEV__) console.warn('Surge detection failed:', surgeError);
      }
      onDismiss();
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : t('newReading.alerts.error.message'),
      );
    }
  };

  const isValid = validation.isValid && !!systolic && !!diastolic;
  const hasTags = selectedTags.length > 0;
  const hasWeight = weightText.trim().length > 0;

  return {
    // BP values
    systolic, diastolic, pulse,
    activeField, setActiveField, handleNumpadChange, getCurrentValue,
    systolicNum, diastolicNum, pulseNum,
    validation, category, categoryColor, categoryLabel, isValid,
    // Time
    measurementTime, setMeasurementTime,
    // Crisis
    crisisVisible, setCrisisVisible,
    // Tags
    selectedTags, setSelectedTags, tagPickerVisible, setTagPickerVisible, hasTags,
    // Weight
    weightText, setWeightText, weightFocused, setWeightFocused, hasWeight, weightUnit,
    // Toast
    toastMsg, toastType, toastVisible, hideToast,
    // Actions
    handleSubmit, saveRecord,
    isSaving: recordBP.isPending,
    // i18n
    t, tCommon, tWidgets,
  };
}

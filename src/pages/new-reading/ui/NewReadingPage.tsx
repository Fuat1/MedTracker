import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Numpad, DateTimePicker } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import {
  validateBPValues,
  classifyBP,
  getBPCategoryLabel,
  isCrisisReading,
} from '../../../entities/blood-pressure';
import { BP_COLORS_LIGHT, BP_COLORS_DARK, FONTS } from '../../../shared/config/theme';
import { useRecordBP } from '../../../features/record-bp';

type ActiveField = 'systolic' | 'diastolic' | 'pulse';

export function NewReadingPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const { t: tMedical } = useTranslation('medical');
  const { t: tValidation } = useTranslation('validation');
  const { colors, isDark, fontScale } = useTheme();
  const navigation = useNavigation();
  const { guideline, defaultLocation, defaultPosture } = useSettingsStore();
  const recordBP = useRecordBP();

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [pulse, setPulse] = useState('');
  const [activeField, setActiveField] = useState<ActiveField>('systolic');
  const [measurementTime, setMeasurementTime] = useState(new Date());

  const systolicNum = systolic ? parseInt(systolic, 10) : null;
  const diastolicNum = diastolic ? parseInt(diastolic, 10) : null;
  const pulseNum = pulse ? parseInt(pulse, 10) : null;

  const validation = validateBPValues(systolicNum, diastolicNum, pulseNum);
  const category =
    systolicNum && diastolicNum ? classifyBP(systolicNum, diastolicNum, guideline) : null;

  const bpColors = isDark ? BP_COLORS_DARK : BP_COLORS_LIGHT;
  const categoryColor = category ? bpColors[category] : colors.textTertiary;
  const categoryLabel = category ? getBPCategoryLabel(category) : '';

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
    }
  };

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
        timestamp: Math.floor(measurementTime.getTime() / 1000), // Convert to Unix timestamp
        location: defaultLocation,
        posture: defaultPosture,
      });

      // Navigate back
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t('newReading.alerts.error.title'),
        error instanceof Error ? error.message : t('newReading.alerts.error.message'),
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t('newReading.title')}
        </Text>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Date/Time Picker */}
        <View style={styles.dateTimeContainer}>
          <DateTimePicker
            value={measurementTime}
            onChange={setMeasurementTime}
            disabled={recordBP.isPending}
          />
        </View>

        {/* Value Input Row */}
        <View style={styles.valuesRow}>
          {/* Systolic */}
          <TouchableOpacity
            style={[
              styles.valueBox,
              {
                backgroundColor: colors.surface,
                borderColor: activeField === 'systolic' ? colors.accent : colors.border,
                shadowColor: colors.shadow,
                shadowOpacity: colors.shadowOpacity,
              },
            ]}
            onPress={() => setActiveField('systolic')}
            activeOpacity={0.9}
          >
            <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: 14 * fontScale }]}>
              {tCommon('common.systolic')}
            </Text>
            <Text
              style={[
                styles.valueText,
                {
                  color: systolic && validation.isValid ? categoryColor : colors.textPrimary,
                  fontSize: 32 * fontScale,
                },
              ]}
            >
              {systolic || '---'}
            </Text>
          </TouchableOpacity>

          {/* Diastolic */}
          <TouchableOpacity
            style={[
              styles.valueBox,
              {
                backgroundColor: colors.surface,
                borderColor: activeField === 'diastolic' ? colors.accent : colors.border,
                shadowColor: colors.shadow,
                shadowOpacity: colors.shadowOpacity,
              },
            ]}
            onPress={() => setActiveField('diastolic')}
            activeOpacity={0.9}
          >
            <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: 14 * fontScale }]}>
              {tCommon('common.diastolic')}
            </Text>
            <Text
              style={[
                styles.valueText,
                {
                  color: diastolic && validation.isValid ? categoryColor : colors.textPrimary,
                  fontSize: 32 * fontScale,
                },
              ]}
            >
              {diastolic || '---'}
            </Text>
          </TouchableOpacity>

          {/* Pulse */}
          <TouchableOpacity
            style={[
              styles.valueBox,
              {
                backgroundColor: colors.surface,
                borderColor: activeField === 'pulse' ? colors.accent : colors.border,
                shadowColor: colors.shadow,
                shadowOpacity: colors.shadowOpacity,
              },
            ]}
            onPress={() => setActiveField('pulse')}
            activeOpacity={0.9}
          >
            <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: 14 * fontScale }]}>
              {tCommon('common.pulse')}
            </Text>
            <Text style={[styles.valueText, { color: colors.textPrimary, fontSize: 32 * fontScale }]}>
              {pulse || '---'}
            </Text>
            <Text style={[styles.valueUnit, { color: colors.textTertiary }]}>
              {tCommon('units.bpm')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Badge */}
        {category && validation.isValid && (
          <View style={styles.categoryContainer}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: categoryColor + '20',
                  borderColor: categoryColor,
                },
              ]}
            >
              <Text style={[styles.categoryText, { color: categoryColor, fontSize: 14 * fontScale }]}>
                {categoryLabel}
              </Text>
            </View>
          </View>
        )}

        {/* Numpad */}
        <View style={styles.numpadContainer}>
          <Numpad
            value={getCurrentValue()}
            onValueChange={handleNumpadChange}
            maxLength={3}
            disabled={recordBP.isPending}
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              {
                backgroundColor:
                  validation.isValid && systolic && diastolic
                    ? colors.accent
                    : colors.border,
              },
            ]}
            onPress={handleSubmit}
            disabled={!validation.isValid || !systolic || !diastolic || recordBP.isPending}
            activeOpacity={0.85}
          >
            <Icon name="checkmark-circle" size={22} color="#ffffff" />
            <Text style={[styles.saveButtonText, { fontSize: 18 * fontScale }]}>
              {recordBP.isPending ? t('newReading.saving') : t('newReading.saveMeasurement')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Validation Errors */}
        {!validation.isValid && systolic && diastolic && (
          <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground }]}>
            {validation.errors.map((error, index) => (
              <Text key={index} style={[styles.errorText, { color: colors.error }]}>
                • {error}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  valuesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  valueBox: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    minHeight: 100,
    justifyContent: 'center',
  },
  valueLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  valueText: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
  },
  valueUnit: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  categoryContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  categoryText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  numpadContainer: {
    marginTop: 12,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  errorContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    marginBottom: 4,
  },
});

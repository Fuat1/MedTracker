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

export function QuickLogPage() {
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
          // Auto-advance to diastolic when systolic is complete (3 digits)
          if (value.length === 3) {
            setActiveField('diastolic');
          }
          break;
        case 'diastolic':
          setDiastolic(value);
          // Auto-advance to pulse when diastolic is complete
          if (value.length === 3) {
            setActiveField('pulse');
          }
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

    // Crisis warning (no bypass in quick log)
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
        timestamp: Math.floor(measurementTime.getTime() / 1000),
        location: defaultLocation,
        posture: defaultPosture,
      });

      // Navigate back
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        t('quickLog.alerts.error.title'),
        error instanceof Error ? error.message : t('quickLog.alerts.error.message'),
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('quickLog.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('quickLog.subtitle')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Date/Time Picker */}
        <View style={styles.dateTimeContainer}>
          <DateTimePicker
            value={measurementTime}
            onChange={setMeasurementTime}
            disabled={recordBP.isPending}
          />
        </View>

        {/* Value Input Cards (Larger for seniors) */}
        <View style={styles.valuesColumn}>
          {/* Systolic */}
          <TouchableOpacity
            style={[
              styles.valueCard,
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
            <View style={styles.valueCardHeader}>
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: 14 * fontScale }]}>
                {tCommon('common.systolic')}
              </Text>
              {activeField === 'systolic' && (
                <Icon name="arrow-down" size={20} color={colors.accent} />
              )}
            </View>
            <Text
              style={[
                styles.valueTextLarge,
                {
                  color: systolic && validation.isValid ? categoryColor : colors.textPrimary,
                  fontSize: 44 * fontScale,
                },
              ]}
            >
              {systolic || '---'}
            </Text>
          </TouchableOpacity>

          {/* Diastolic */}
          <TouchableOpacity
            style={[
              styles.valueCard,
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
            <View style={styles.valueCardHeader}>
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: 14 * fontScale }]}>
                {tCommon('common.diastolic')}
              </Text>
              {activeField === 'diastolic' && (
                <Icon name="arrow-down" size={20} color={colors.accent} />
              )}
            </View>
            <Text
              style={[
                styles.valueTextLarge,
                {
                  color: diastolic && validation.isValid ? categoryColor : colors.textPrimary,
                  fontSize: 44 * fontScale,
                },
              ]}
            >
              {diastolic || '---'}
            </Text>
          </TouchableOpacity>

          {/* Pulse */}
          <TouchableOpacity
            style={[
              styles.valueCard,
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
            <View style={styles.valueCardHeader}>
              <Text style={[styles.valueLabel, { color: colors.textSecondary, fontSize: 14 * fontScale }]}>
                {tCommon('common.pulse')} {tCommon('common.pulseOptional')}
              </Text>
              {activeField === 'pulse' && (
                <Icon name="arrow-down" size={20} color={colors.accent} />
              )}
            </View>
            <View style={styles.pulseRow}>
              <Text style={[styles.valueTextLarge, { color: colors.textPrimary, fontSize: 44 * fontScale }]}>
                {pulse || '---'}
              </Text>
              <Text style={[styles.pulseUnit, { color: colors.textTertiary }]}>
                {tCommon('units.bpm')}
              </Text>
            </View>
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
              <Icon name="medical" size={18} color={categoryColor} />
              <Text style={[styles.categoryText, { color: categoryColor, fontSize: 16 * fontScale }]}>
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
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
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
          <Icon name="checkmark-circle" size={26} color="#ffffff" />
          <Text style={[styles.saveButtonText, { fontSize: 18 * fontScale }]}>
            {recordBP.isPending ? t('quickLog.saving') : t('quickLog.saveReading')}
          </Text>
        </TouchableOpacity>

        {/* Validation Errors */}
        {!validation.isValid && systolic && diastolic && (
          <View style={[styles.errorBanner, { backgroundColor: colors.errorBackground }]}>
            <Icon name="alert-circle" size={18} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {validation.errors[0]}
            </Text>
          </View>
        )}
      </View>
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
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  dateTimeContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  valuesColumn: {
    paddingHorizontal: 20,
    gap: 12,
  },
  valueCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    minHeight: 90,
  },
  valueCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  valueLabel: {
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueTextLarge: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -1,
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  pulseUnit: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
  categoryContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    gap: 8,
  },
  categoryText: {
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  numpadContainer: {
    marginTop: 16,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontFamily: FONTS.bold,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
  },
});

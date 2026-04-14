/**
 * GenericEntryForm
 *
 * Data-driven entry form for simple single- or multi-field metrics.
 * Steps through config.fields one at a time using <Numpad />.
 * BP uses BPReadingForm as an override (registered via bpComponents).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Numpad, SaveButton } from '../../../shared/ui';
import { useTheme } from '../../../shared/lib/use-theme';
import { FONTS } from '../../../shared/config/theme';
import type { MetricConfig } from '../../../shared/config/metric-types';

interface GenericEntryFormProps<TValues extends Record<string, unknown>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: MetricConfig<any, TValues>;
  onSubmit: (values: Partial<TValues>, tags?: string[]) => void;
  isLoading?: boolean;
  onDismiss?: () => void;
}

export function GenericEntryForm<TValues extends Record<string, unknown>>({
  config,
  onSubmit,
  isLoading,
  onDismiss,
}: GenericEntryFormProps<TValues>) {
  const { t } = useTranslation('common');
  const { colors, fontScale, typography } = useTheme();

  // String values keyed by field key — numpad produces strings
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(config.fields.map(f => [f.key, ''])),
  );
  const [stepIndex, setStepIndex] = useState(0);

  const requiredFields = config.fields.filter(f => f.required !== false);
  const currentField = config.fields[stepIndex];
  const isLastStep = stepIndex === config.fields.length - 1;

  const currentValue = fieldValues[currentField?.key ?? ''] ?? '';

  const handleValueChange = useCallback(
    (value: string) => {
      if (!currentField) return;
      setFieldValues(prev => ({ ...prev, [currentField.key]: value }));
    },
    [currentField],
  );

  const canAdvance = useCallback(() => {
    if (!currentField) return false;
    if (currentField.required === false) return true; // optional fields can be skipped
    return currentValue.trim().length > 0;
  }, [currentField, currentValue]);

  const handleNext = useCallback(() => {
    if (stepIndex < config.fields.length - 1) {
      setStepIndex(i => i + 1);
    }
  }, [stepIndex, config.fields.length]);

  const handleSkip = useCallback(() => {
    if (!currentField) return;
    setFieldValues(prev => ({ ...prev, [currentField.key]: '' }));
    if (stepIndex < config.fields.length - 1) {
      setStepIndex(i => i + 1);
    }
  }, [currentField, stepIndex, config.fields.length]);

  const handleSave = useCallback(() => {
    const converted: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = fieldValues[field.key] ?? '';
      if (raw.trim() === '') {
        converted[field.key] = null;
      } else {
        const num = parseFloat(raw);
        converted[field.key] = isNaN(num) ? null : num;
      }
    }
    onSubmit(converted as Partial<TValues>);
  }, [config.fields, fieldValues, onSubmit]);

  const hasRequiredValues = requiredFields.every(
    f => (fieldValues[f.key] ?? '').trim().length > 0,
  );

  if (!currentField) return null;

  const fieldLabel = t(currentField.labelKey as any, { defaultValue: currentField.key });
  const unitLabel = currentField.unit ? ` (${currentField.unit})` : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          {onDismiss && (
            <View style={styles.dismissRow}>
              <Text
                onPress={onDismiss}
                style={[styles.dismissText, { color: colors.textTertiary, fontSize: typography.sm }]}
                accessibilityRole="button"
                accessible
                accessibilityLabel={t('common.cancel', { defaultValue: 'Cancel' })}
              >
                ✕
              </Text>
            </View>
          )}

          {/* Step indicator */}
          {config.fields.length > 1 && (
            <View style={styles.stepRow}>
              {config.fields.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: i <= stepIndex ? colors.accent : colors.border,
                      width: i === stepIndex ? 20 : 8,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Field label + value display */}
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm }]}>
            {fieldLabel}{unitLabel}
          </Text>

          <Text
            style={[
              styles.valueDisplay,
              {
                color: currentValue ? colors.textPrimary : colors.border,
                fontSize: Math.round(52 * fontScale),
              },
            ]}
          >
            {currentValue || (currentField.min !== undefined ? String(currentField.min) : '—')}
          </Text>

          {currentField.unit && (
            <Text style={[styles.unitLabel, { color: colors.textTertiary, fontSize: typography.sm }]}>
              {currentField.unit}
            </Text>
          )}
        </View>

        {/* Numpad */}
        <Numpad
          value={currentValue}
          onValueChange={handleValueChange}
          maxLength={currentField.max !== undefined ? String(Math.floor(currentField.max)).length + 1 : 4}
          allowDecimal={currentField.type === 'float'}
        />

        {/* Navigation buttons */}
        <View style={styles.actions}>
          {currentField.required === false && (
            <Text
              onPress={handleSkip}
              style={[styles.skipText, { color: colors.textTertiary, fontSize: typography.sm }]}
              accessibilityRole="button"
              accessible
            >
              {t('common.skip', { defaultValue: 'Skip' })}
            </Text>
          )}

          {isLastStep ? (
            <SaveButton
              label={t('common.save' as any)}
              isValid={hasRequiredValues}
              isLoading={isLoading ?? false}
              onPress={handleSave}
              fontScale={fontScale}
            />
          ) : (
            <SaveButton
              label={t('common.next', { defaultValue: 'Next' })}
              isValid={canAdvance()}
              isLoading={false}
              onPress={handleNext}
              fontScale={fontScale}
            />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  dismissRow: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  dismissText: {
    fontFamily: FONTS.regular,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  valueDisplay: {
    fontFamily: FONTS.extraBold,
    fontWeight: '800',
    letterSpacing: -2,
    textAlign: 'center',
  },
  unitLabel: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  skipText: {
    fontFamily: FONTS.medium,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

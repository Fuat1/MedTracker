import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../../app/navigation';
import { validateBPValues } from '../../../entities/blood-pressure';
import { useRecordBP } from '../../../features/record-bp';
import { useSettingsStore } from '../../../shared/lib/settings-store';
import { useToast } from '../../../shared/lib/use-toast';
import { parseVoiceQuery } from '../../../shared/lib/voice-query-parser';
import { Button, ButtonText, ButtonSpinner, Card, Toast, Numpad } from '../../../shared/ui';

type VoiceConfirmationRouteProp = RouteProp<RootStackParamList, 'VoiceConfirmation'>;

export function VoiceConfirmationPage() {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const navigation = useNavigation();
  const route = useRoute<VoiceConfirmationRouteProp>();
  const { toastMsg, toastType, toastVisible, showToast, hideToast } = useToast();
  const { mutateAsync: recordBP, isPending } = useRecordBP();
  const { voiceLoggingEnabled } = useSettingsStore();

  // Resolve initial values: explicit params take priority, then query parsing
  const parsed = route.params?.query ? parseVoiceQuery(route.params.query) : {};

  const [sysStr, setSysStr] = useState(
    route.params?.sys ?? (parsed.sys !== undefined ? String(parsed.sys) : ''),
  );
  const [diaStr, setDiaStr] = useState(
    route.params?.dia ?? (parsed.dia !== undefined ? String(parsed.dia) : ''),
  );
  const [pulseStr, _setPulseStr] = useState(
    route.params?.pulse ?? (parsed.pulse !== undefined ? String(parsed.pulse) : ''),
  );

  const systolic = parseInt(sysStr, 10);
  const diastolic = parseInt(diaStr, 10);
  const pulse = pulseStr ? parseInt(pulseStr, 10) : undefined;

  const sysMissing = sysStr === '';
  const diaMissing = diaStr === '';

  const handleSave = async () => {
    if (!voiceLoggingEnabled) {
      showToast(t('voiceConfirmation.disabledToast'), 'warning');
      return;
    }

    if (isNaN(systolic) || isNaN(diastolic)) {
      showToast(t('voiceConfirmation.invalidValuesToast'), 'error');
      return;
    }

    const validation = validateBPValues(systolic, diastolic, pulse);
    if (!validation.isValid) {
      showToast(validation.errors.join(', '), 'error');
      return;
    }

    try {
      await recordBP({
        systolic,
        diastolic,
        pulse,
      });
      navigation.goBack();
    } catch {
      showToast(t('voiceConfirmation.saveError'), 'error');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-surface-base">
      <Toast
        message={toastMsg}
        type={toastType}
        visible={toastVisible}
        onHide={hideToast}
      />
      {!voiceLoggingEnabled ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-xl font-bold mb-4 text-center text-text-primary">
            {t('voiceConfirmation.disabledTitle')}
          </Text>
          <Text className="text-base text-center text-text-secondary mb-8">
            {t('voiceConfirmation.disabledDescription')}
          </Text>
          <Button
            variant="primary"
            size="lg"
            onPress={() => navigation.goBack()}
          >
            <ButtonText>{t('voiceConfirmation.goBack')}</ButtonText>
          </Button>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-6">
          <Text className="text-2xl font-bold mb-2 text-center text-text-primary">
            {t('voiceConfirmation.title')}
          </Text>
          <Text className="text-base mb-6 text-center text-text-secondary">
            {sysMissing || diaMissing
              ? t('voiceConfirmation.subtitleMissing')
              : t('voiceConfirmation.subtitleConfirm')}
          </Text>

          <Card style={{ padding: 24, marginBottom: 16, alignItems: 'center' }}>
            <Text className="text-4xl font-bold text-text-primary mb-2">
              {sysStr || '--'} / {diaStr || '--'}
            </Text>
            <Text className="text-sm text-text-secondary">
              {tCommon('common.bloodPressure')} (mmHg)
            </Text>

            {pulse !== undefined && !isNaN(pulse) ? (
              <View className="mt-4 items-center">
                <Text className="text-2xl font-bold text-text-primary mb-1">
                  {pulse}
                </Text>
                <Text className="text-sm text-text-secondary">
                  {tCommon('common.pulse')} (BPM)
                </Text>
              </View>
            ) : null}
          </Card>

          {sysMissing && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-text-primary text-center mb-2">
                {t('voiceConfirmation.systolicLabel')}
              </Text>
              <Numpad
                value={sysStr}
                onValueChange={setSysStr}
                maxLength={3}
                compact
              />
            </View>
          )}

          {diaMissing && (
            <View className="mb-4">
              <Text className="text-base font-semibold text-text-primary text-center mb-2">
                {t('voiceConfirmation.diastolicLabel')}
              </Text>
              <Numpad
                value={diaStr}
                onValueChange={setDiaStr}
                maxLength={3}
                compact
              />
            </View>
          )}

          <View className="gap-y-4 mt-2">
            <Button
              variant="primary"
              size="lg"
              onPress={handleSave}
              isDisabled={isPending || sysMissing || diaMissing}
            >
              <ButtonText>{tCommon('buttons.save')}</ButtonText>
              {isPending ? <ButtonSpinner /> : null}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onPress={() => navigation.goBack()}
              isDisabled={isPending}
            >
              <ButtonText>{tCommon('buttons.cancel')}</ButtonText>
            </Button>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

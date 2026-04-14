import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useSettingsStore} from '../../../shared/lib/settings-store';
import {BPReadingForm} from '../../../widgets/bp-reading-form';

export function NewReadingPage() {
  const {t} = useTranslation('pages');
  const navigation = useNavigation();
  const {guideline} = useSettingsStore();

  return (
    <BPReadingForm
      variant="full"
      title={t('newReading.title')}
      subtitle={guideline.replace('_', '/').toUpperCase()}
      autoAdvance={false}
      onDismiss={() => navigation.goBack()}
    />
  );
}

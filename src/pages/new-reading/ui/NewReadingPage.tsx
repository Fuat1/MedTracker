import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BPReadingForm } from '../../../widgets/bp-reading-form';

export function NewReadingPage() {
  const { t } = useTranslation('pages');
  const navigation = useNavigation();

  return (
    <BPReadingForm
      variant="full"
      autoAdvance={false}
      title={t('newReading.title')}
      onDismiss={() => navigation.goBack()}
    />
  );
}

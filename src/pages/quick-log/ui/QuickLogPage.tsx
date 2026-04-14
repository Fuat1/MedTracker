import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {BPReadingForm} from '../../../widgets/bp-reading-form';

export function QuickLogPage() {
  const { t } = useTranslation('pages');
  const navigation = useNavigation();

  return (
    <BPReadingForm
      variant="compact"
      title={t('quickLog.title')}
      subtitle={t('quickLog.subtitle')}
      autoAdvance={true}
      onDismiss={() => navigation.goBack()}
    />
  );
}

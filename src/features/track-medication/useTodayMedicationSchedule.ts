import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMedications,
  getMedicationLogsByDateRange,
  insertMedicationLog,
  MedicationLogInput,
} from '../../shared/api/medication-repository';
import { MEDICATIONS_QUERY_KEY } from './useManageMedications';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export const TODAY_LOGS_QUERY_KEY = ['medication-logs', 'today'];

function getTodayRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
  };
}

/**
 * Exposes today's medication schedule (derived from medication reminder_times)
 * and a mutation to log a taken/skipped dose.
 */
export function useTodayMedicationSchedule() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { start, end } = getTodayRange();

  // All medications
  const medicationsQuery = useQuery({
    queryKey: MEDICATIONS_QUERY_KEY,
    queryFn: getMedications,
  });

  // Today's logs
  const logsQuery = useQuery({
    queryKey: [...TODAY_LOGS_QUERY_KEY, start],
    queryFn: () => getMedicationLogsByDateRange(start, end),
  });

  const logDoseMutation = useMutation({
    mutationFn: (input: MedicationLogInput) => insertMedicationLog(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODAY_LOGS_QUERY_KEY });
      Toast.show({
        type: 'success',
        text1: t('medication:doseLogged', 'Dose logged ✓'),
      });
    },
    onError: () => {
      Toast.show({
        type: 'error',
        text1: t('medication:doseLogError', 'Failed to log dose'),
      });
    },
  });

  return {
    medications: medicationsQuery.data || [],
    todayLogs: logsQuery.data || [],
    isLoading: medicationsQuery.isLoading || logsQuery.isLoading,
    logDose: logDoseMutation.mutateAsync,
    isLogging: logDoseMutation.isPending,
  };
}

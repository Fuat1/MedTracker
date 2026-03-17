import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMedications,
  insertMedication,
  updateMedication,
  deleteMedication,
  MedicationInput,
  Medication,
} from '../../shared/api/medication-repository';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { syncMedicationReminders, cancelMedicationReminders } from './useMedicationReminders';

export const MEDICATIONS_QUERY_KEY = ['medications'];

export function useManageMedications() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const query = useQuery({
    queryKey: MEDICATIONS_QUERY_KEY,
    queryFn: getMedications,
  });

  const addMutation = useMutation({
    mutationFn: (input: MedicationInput) => insertMedication(input),
    onSuccess: (newMedication) => {
      syncMedicationReminders(newMedication);
      queryClient.invalidateQueries({ queryKey: MEDICATIONS_QUERY_KEY });
      Toast.show({
        type: 'success',
        text1: t('medication:success.added', 'Medication added successfully'),
      });
    },
    onError: (error) => {
      console.error('Failed to add medication:', error);
      Toast.show({
        type: 'error',
        text1: t('medication:error.addFailed', 'Failed to add medication'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MedicationInput> }) => {
       await updateMedication(id, updates);
       return id;
    },
    onSuccess: (id) => {
      // Refresh the query then force resync triggers 
      queryClient.invalidateQueries({ queryKey: MEDICATIONS_QUERY_KEY }).then(() => {
         const allMeds = queryClient.getQueryData<Medication[]>(MEDICATIONS_QUERY_KEY);
         const updated = allMeds?.find(m => m.id === id);
         if (updated) syncMedicationReminders(updated);
      });
      Toast.show({
        type: 'success',
        text1: t('medication:success.updated', 'Medication updated successfully'),
      });
    },
    onError: (error) => {
      console.error('Failed to update medication:', error);
      Toast.show({
        type: 'error',
        text1: t('medication:error.updateFailed', 'Failed to update medication'),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
       await cancelMedicationReminders(id);
       await deleteMedication(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDICATIONS_QUERY_KEY });
      Toast.show({
        type: 'success',
        text1: t('medication:success.deleted', 'Medication deleted'),
      });
    },
    onError: (error) => {
      console.error('Failed to delete medication:', error);
      Toast.show({
        type: 'error',
        text1: t('medication:error.deleteFailed', 'Failed to delete medication'),
      });
    },
  });

  return {
    medications: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    addMedication: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateMedication: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteMedication: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

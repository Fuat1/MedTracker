import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertBPRecord, type BPRecordInput } from '../../../shared/api';
import { validateBPValues } from '../../../entities/blood-pressure';

export const BP_RECORDS_QUERY_KEY = ['bp-records'];

export function useRecordBP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BPRecordInput) => {
      // Validate before inserting
      const validation = validateBPValues(
        input.systolic,
        input.diastolic,
        input.pulse,
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      return insertBPRecord(input);
    },
    onSuccess: () => {
      // Invalidate and refetch BP records
      queryClient.invalidateQueries({ queryKey: BP_RECORDS_QUERY_KEY });
    },
  });
}

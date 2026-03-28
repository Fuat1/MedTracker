import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertBPRecord, saveTagsForRecord, type BPRecordInput } from '../../../shared/api';
import { validateBPValues } from '../../../entities/blood-pressure';
import { useWeatherFetch } from '../../weather-fetch';
import { useUploadRecord } from '../../sync';
import { useCrisisAlert } from '../../sync';
import type { TagKey } from '../../../shared/api/bp-tags-repository';

import { BP_RECORDS_QUERY_KEY } from '@/shared/config';
export { BP_RECORDS_QUERY_KEY };

interface RecordBPInput extends BPRecordInput {
  tags?: TagKey[];
}

export function useRecordBP() {
  const queryClient = useQueryClient();
  const { fetchWeatherForReading } = useWeatherFetch();
  const { uploadRecord } = useUploadRecord();
  const { checkAndAlert } = useCrisisAlert();

  return useMutation({
    mutationFn: async (input: RecordBPInput) => {
      // Validate before inserting
      const validation = validateBPValues(
        input.systolic,
        input.diastolic,
        input.pulse,
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const { tags, ...recordInput } = input;
      const record = await insertBPRecord(recordInput);

      // Save tags if provided
      if (tags && tags.length > 0) {
        await saveTagsForRecord(record.id, tags);
      }

      return record;
    },
    onSuccess: (record) => {
      // Invalidate and refetch BP records + tags
      queryClient.invalidateQueries({ queryKey: BP_RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['bp-tags'] });

      // Fire-and-forget weather fetch — BP is already saved
      fetchWeatherForReading(record.id);

      // Fire-and-forget Firestore sync — never blocks BP save
      void uploadRecord(record.id);

      // Fire-and-forget crisis alert — notify linked family members if threshold crossed
      checkAndAlert(record.systolic, record.diastolic);
    },
  });
}

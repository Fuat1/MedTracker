import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertBPRecord, saveTagsForRecord, type BPRecordInput } from '../../../shared/api';
import { validateBPValues } from '../../../entities/blood-pressure';
import type { TagKey } from '../../../shared/api/bp-tags-repository';

export const BP_RECORDS_QUERY_KEY = ['bp-records'];

interface RecordBPInput extends BPRecordInput {
  tags?: TagKey[];
}

export function useRecordBP() {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      // Invalidate and refetch BP records + tags
      queryClient.invalidateQueries({ queryKey: BP_RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['bp-tags'] });
    },
  });
}

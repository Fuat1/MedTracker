import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBPRecord } from '../../../shared/api/bp-repository';
import { saveTagsForRecord } from '../../../shared/api/bp-tags-repository';
import { validateBPValues } from '../../../entities/blood-pressure';
import { BP_RECORDS_QUERY_KEY } from '../../record-bp';
import { BP_TAGS_QUERY_KEY } from '../../manage-tags';
import type { MeasurementLocation, MeasurementPosture } from '../../../shared/config';
import type { TagKey } from '../../../shared/api/bp-tags-repository';

export interface EditBPInput {
  id: string;
  systolic: number;
  diastolic: number;
  pulse?: number | null;
  timestamp: number;
  location: MeasurementLocation;
  posture: MeasurementPosture;
  notes?: string | null;
  weight?: number | null;
  tags?: TagKey[];
}

export function useEditBP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditBPInput) => {
      const { id, systolic, diastolic, pulse, timestamp, location, posture, notes, weight, tags } = input;

      const validation = validateBPValues(systolic, diastolic, pulse ?? null);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const updated = await updateBPRecord(id, {
        systolic,
        diastolic,
        pulse: pulse ?? null,
        timestamp,
        location,
        posture,
        notes: notes ?? null,
        weight: weight ?? null,
      });

      await saveTagsForRecord(id, tags ?? []);

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BP_RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BP_TAGS_QUERY_KEY });
    },
  });
}

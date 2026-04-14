import { useEditMetric } from '../../edit-metric';
import { bpConfig } from '../../../entities/blood-pressure/config';
import { useUploadRecord } from '../../sync';
import type { MeasurementLocation, MeasurementPosture } from '../../../shared/config';
import type { TagKey } from '../../../shared/api/bp-tags-repository';
import type { BPRecord } from '../../../shared/api/bp-repository';

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
  const { uploadRecord } = useUploadRecord();

  const mutation = useEditMetric<BPRecord>(bpConfig, {
    onAfterUpdate: (updated) => {
      // Fire-and-forget Firestore sync — never blocks BP edit
      if (updated) {
        void uploadRecord(updated.id);
      }
    },
  });

  return {
    ...mutation,
    mutate: (input: EditBPInput) =>
      mutation.mutate({
        id: input.id,
        updates: {
          systolic:  input.systolic,
          diastolic: input.diastolic,
          pulse:     input.pulse ?? null,
          timestamp: input.timestamp,
          location:  input.location,
          posture:   input.posture,
          notes:     input.notes ?? null,
          weight:    input.weight ?? null,
        },
        tags: input.tags,
      }),
    mutateAsync: (input: EditBPInput) =>
      mutation.mutateAsync({
        id: input.id,
        updates: {
          systolic:  input.systolic,
          diastolic: input.diastolic,
          pulse:     input.pulse ?? null,
          timestamp: input.timestamp,
          location:  input.location,
          posture:   input.posture,
          notes:     input.notes ?? null,
          weight:    input.weight ?? null,
        },
        tags: input.tags,
      }),
  };
}

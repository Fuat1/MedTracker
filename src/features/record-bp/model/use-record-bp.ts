import { useWeatherFetch } from '../../weather-fetch';
import { useUploadRecord, useCrisisAlert } from '../../sync';
import { useRecordMetric } from '../../record-metric';
import { bpConfig } from '../../../entities/blood-pressure/config';
import { getTimezoneOffset } from '../../../shared/lib';
import type { BPRecordInput } from '../../../shared/api';
import type { TagKey } from '../../../shared/api/bp-tags-repository';
import type { BPRecord } from '../../../shared/api/bp-repository';

import { BP_RECORDS_QUERY_KEY } from '@/shared/config';
export { BP_RECORDS_QUERY_KEY };

interface RecordBPInput extends BPRecordInput {
  tags?: TagKey[];
}

export function useRecordBP() {
  const { fetchWeatherForReading } = useWeatherFetch();
  const { uploadRecord } = useUploadRecord();
  const { checkAndAlert } = useCrisisAlert();

  const mutation = useRecordMetric<BPRecord>(bpConfig, {
    onAfterInsert: (record) => {
      // Fire-and-forget weather fetch — BP is already saved
      fetchWeatherForReading(record.id);
      // Fire-and-forget Firestore sync — never blocks BP save
      void uploadRecord(record.id);
      // Fire-and-forget crisis alert — notify linked family members
      checkAndAlert(record.systolic, record.diastolic);
    },
  });

  return {
    ...mutation,
    mutate: (input: RecordBPInput) =>
      mutation.mutate({
        fieldValues: {
          systolic:        input.systolic,
          diastolic:       input.diastolic,
          pulse:           input.pulse ?? null,
          timestamp:       input.timestamp,
          timezone_offset: getTimezoneOffset(),
          location:        input.location ?? 'left_arm',
          posture:         input.posture ?? 'sitting',
          notes:           input.notes ?? null,
          weight:          input.weight ?? null,
          isSynced:        false,
          owner_uid:       input.ownerUid ?? null,
        },
        tags: input.tags,
      }),
    mutateAsync: (input: RecordBPInput) =>
      mutation.mutateAsync({
        fieldValues: {
          systolic:        input.systolic,
          diastolic:       input.diastolic,
          pulse:           input.pulse ?? null,
          timestamp:       input.timestamp,
          timezone_offset: getTimezoneOffset(),
          location:        input.location ?? 'left_arm',
          posture:         input.posture ?? 'sitting',
          notes:           input.notes ?? null,
          weight:          input.weight ?? null,
          isSynced:        false,
          owner_uid:       input.ownerUid ?? null,
        },
        tags: input.tags,
      }),
  };
}

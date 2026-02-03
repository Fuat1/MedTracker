import { useQuery } from '@tanstack/react-query';
import { getBPRecords, getLatestBPRecord } from '../../../shared/api';
import { BP_RECORDS_QUERY_KEY } from './use-record-bp';

export function useBPRecords(limit?: number) {
  return useQuery({
    queryKey: limit ? [...BP_RECORDS_QUERY_KEY, { limit }] : BP_RECORDS_QUERY_KEY,
    queryFn: () => getBPRecords(limit),
  });
}

export function useLatestBPRecord() {
  return useQuery({
    queryKey: [...BP_RECORDS_QUERY_KEY, 'latest'],
    queryFn: getLatestBPRecord,
  });
}

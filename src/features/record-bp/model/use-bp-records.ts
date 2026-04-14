import { useQuery } from '@tanstack/react-query';
import { useMetricRecords } from '../../../entities/health-metric';
import { getLatestMetricRecord } from '../../../shared/api/metric-repository';
import { bpConfig } from '../../../entities/blood-pressure/config';
import { BP_RECORDS_QUERY_KEY } from './use-record-bp';
import type { BPRecord } from '../../../shared/api/bp-repository';

export function useBPRecords(limit?: number) {
  return useMetricRecords<BPRecord>(bpConfig, limit);
}

export function useLatestBPRecord() {
  return useQuery({
    queryKey: [...BP_RECORDS_QUERY_KEY, 'latest'],
    queryFn: () => getLatestMetricRecord<BPRecord>(bpConfig),
  });
}

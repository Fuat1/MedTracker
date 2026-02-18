import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTagsForRecord,
  saveTagsForRecord,
  getTagsForRecords,
} from '../../../shared/api';
import type { LifestyleTag } from '../../../shared/types/lifestyle-tag';

export const BP_TAGS_QUERY_KEY = ['bp-tags'];

export function useTagsForRecord(recordId: string | undefined) {
  return useQuery({
    queryKey: [...BP_TAGS_QUERY_KEY, recordId],
    queryFn: () => getTagsForRecord(recordId!),
    enabled: !!recordId,
  });
}

export function useSaveTagsForRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, tags }: { recordId: string; tags: LifestyleTag[] }) => {
      return saveTagsForRecord(recordId, tags);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [...BP_TAGS_QUERY_KEY, variables.recordId] });
      queryClient.invalidateQueries({ queryKey: [...BP_TAGS_QUERY_KEY, 'batch'] });
    },
  });
}

export function useTagsForRecords(recordIds: string[]) {
  return useQuery({
    queryKey: [...BP_TAGS_QUERY_KEY, 'batch', ...recordIds.slice(0, 10)],
    queryFn: () => getTagsForRecords(recordIds),
    enabled: recordIds.length > 0,
  });
}

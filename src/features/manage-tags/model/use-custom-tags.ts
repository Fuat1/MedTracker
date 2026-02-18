import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomTags,
  createCustomTag,
  deleteCustomTag,
} from '../../../shared/api';
import { BP_TAGS_QUERY_KEY } from './use-tags';

export const CUSTOM_TAGS_QUERY_KEY = ['custom-tags'];

export function useCustomTags() {
  return useQuery({
    queryKey: CUSTOM_TAGS_QUERY_KEY,
    queryFn: getCustomTags,
  });
}

export function useCreateCustomTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ label, icon }: { label: string; icon: string }) =>
      createCustomTag(label, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_TAGS_QUERY_KEY });
    },
  });
}

export function useDeleteCustomTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_TAGS_QUERY_KEY });
      // Invalidate all tag queries since bp_tags rows may have been deleted
      queryClient.invalidateQueries({ queryKey: BP_TAGS_QUERY_KEY });
    },
  });
}

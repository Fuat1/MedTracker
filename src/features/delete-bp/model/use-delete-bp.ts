import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBPRecord } from '../../../shared/api/bp-repository';
import { BP_RECORDS_QUERY_KEY } from '../../record-bp';
import { BP_TAGS_QUERY_KEY } from '../../manage-tags';

export function useDeleteBP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const success = await deleteBPRecord(id);
      if (!success) {
        throw new Error('Delete failed');
      }
      return id;
    },
    onSuccess: () => {
      // bp_tags rows cascade-delete automatically via FK ON DELETE CASCADE
      queryClient.invalidateQueries({ queryKey: BP_RECORDS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: BP_TAGS_QUERY_KEY });
    },
  });
}

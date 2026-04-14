import { useDeleteMetric } from '../../delete-metric';
import { bpConfig } from '../../../entities/blood-pressure/config';

export function useDeleteBP() {
  // Tags cascade-delete automatically via FK ON DELETE CASCADE.
  // useDeleteMetric invalidates both config.queryKey and config.db.tagsTableName.
  return useDeleteMetric(bpConfig);
}

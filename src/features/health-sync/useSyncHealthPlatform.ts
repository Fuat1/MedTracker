import { useMutation, useQueryClient } from '@tanstack/react-query';
import { healthPlatform } from '../../shared/api/health-platform';
import { getBPRecords, insertBPRecord, updateBPRecord } from '../../shared/api/bp-repository';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

export function useSyncHealthPlatform() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('common');

  return useMutation({
    mutationFn: async () => {
      const isAvailable = await healthPlatform.isAvailable();
      if (!isAvailable) {
        throw new Error(t('errors.healthPlatformNotAvailable', 'Health Platform not available on this device.'));
      }

      const hasPermissions = await healthPlatform.requestPermissions();
      if (!hasPermissions) {
        throw new Error(t('errors.healthPlatformPermissionDenied', 'Permission to read/write health data was denied.'));
      }

      const localRecords = await getBPRecords();
      let exportCount = 0;
      let importCount = 0;

      // 1. Export local unsynced records
      const unsynced = localRecords.filter(r => !r.isSynced);
      for (const record of unsynced) {
        const extId = await healthPlatform.saveBloodPressure(record);
        if (extId) {
          await updateBPRecord(record.id, { isSynced: true });
          exportCount++;
        }
      }

      // 2. Import external records (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);
      
      const externalRecords = await healthPlatform.getBloodPressureRecords(startDate, endDate);

      for (const extRecord of externalRecords) {
        // Conflict resolution: Check if a record with the same timestamp (down to the minute) and values exists
        const isDuplicate = localRecords.some(local => {
          const timeDiff = Math.abs(local.timestamp - extRecord.timestamp);
          const isSameMinute = timeDiff < 60000;
          return isSameMinute && local.systolic === extRecord.systolic && local.diastolic === extRecord.diastolic;
        });

        if (!isDuplicate) {
          await insertBPRecord({
            systolic: extRecord.systolic,
            diastolic: extRecord.diastolic,
            pulse: extRecord.pulse,
            timestamp: extRecord.timestamp,
            location: extRecord.location,
            posture: extRecord.posture,
            notes: extRecord.notes,
            weight: extRecord.weight,
            isSynced: true, // Mark as synced since it came from Health Platform
          });
          importCount++;
        }
      }

      return { exportCount, importCount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bpRecords'] });
      Toast.show({
        type: 'success',
        text1: t('settings.cloudSync.syncSuccess', 'Sync Complete'),
        text2: `Exported: ${data.exportCount}, Imported: ${data.importCount}`,
      });
    },
    onError: (error) => {
      Toast.show({
        type: 'error',
        text1: t('settings.cloudSync.syncFailed', 'Sync Failed'),
        text2: error instanceof Error ? error.message : String(error),
      });
    },
  });
}

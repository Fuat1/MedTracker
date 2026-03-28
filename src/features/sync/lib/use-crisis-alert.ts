/**
 * useCrisisAlert — fire-and-forget call to the sendCrisisAlert Cloud Function.
 *
 * Called from useRecordBP onSuccess when a reading crosses the crisis threshold.
 * Never blocks the BP save — failures are logged and swallowed.
 */

import { useCallback } from 'react';
import functions from '@react-native-firebase/functions';
import auth from '@react-native-firebase/auth';
import { isCrisisReading } from '@/entities/blood-pressure';
import { useSettingsStore } from '@/shared/lib/settings-store';
import { CRISIS_ALERT_FUNCTION_NAME } from '@/shared/config';

export function useCrisisAlert() {
  const guideline = useSettingsStore((s) => s.guideline);

  const checkAndAlert = useCallback(
    (systolic: number, diastolic: number): void => {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return;
      }

      if (!isCrisisReading(systolic, diastolic, guideline)) {
        return;
      }

      // Fire-and-forget — BP is already saved, this never blocks UI
      void functions()
        .httpsCallable(CRISIS_ALERT_FUNCTION_NAME)({
          senderUid: currentUser.uid,
          systolic,
          diastolic,
        })
        .catch(() => {
          // Silently swallow — network failure should not surface to user
          // The reading is already saved locally
        });
    },
    [guideline],
  );

  return { checkAndAlert };
}

import i18n from '../../shared/lib/i18n';
import { Medication } from '../../shared/api/medication-repository';
import {
  scheduleReminder,
  cancelReminders,
  NotificationType,
  RepeatFrequency,
} from '../../shared/lib/notification-service';

/**
 * Syncs a medication's parsed reminder_times to scheduled local notifications.
 * Title and body use t() from i18n. Note: Notifee bakes strings at schedule-time —
 * if the user changes language after scheduling, existing notifications retain
 * the old language until the medication is re-synced.
 */
export async function syncMedicationReminders(medication: Medication): Promise<void> {
  await cancelMedicationReminders(medication.id);

  try {
    const times: string[] = JSON.parse(medication.reminder_times);
    if (!times || times.length === 0) return;

    for (let i = 0; i < times.length; i++) {
      const timeStr = times[i];
      const [hours, minutes] = timeStr.split(':').map(Number);

      const triggerDate = new Date();
      triggerDate.setHours(hours, minutes, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (triggerDate.getTime() <= Date.now()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      await scheduleReminder({
        id: `${medication.id}-${i}`,
        type: NotificationType.MEDICATION,
        title: i18n.t('medication:notification.title'),
        body: i18n.t('medication:notification.body', {
          dosage: medication.dosage,
          name: medication.name,
        }),
        targetScreen: 'Medications',
        triggerTimestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      });
    }
  } catch (error) {
    console.error('Failed to sync medication reminders:', error);
  }
}

export async function cancelMedicationReminders(medicationId: string): Promise<void> {
  await cancelReminders(medicationId);
}

import notifee, { TriggerType, RepeatFrequency, TimestampTrigger, AndroidImportance } from '@notifee/react-native';
import { Medication } from '../../shared/api/medication-repository';
import { Platform } from 'react-native';

const CHANNEL_ID = 'medication-reminders';

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Medication Reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default'
    });
  }
}

/**
 * Syncs a medication's parsed reminder_times to scheduled local notifications.
 */
export async function syncMedicationReminders(medication: Medication) {
  // First, cancel any existing triggers for this specific medication
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

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      };

      await notifee.createTriggerNotification(
        {
          id: `${medication.id}-${i}`,
          title: 'Medication Reminder',
          body: `It's time to take ${medication.dosage} of ${medication.name}`,
          android: {
            channelId: CHANNEL_ID,
            pressAction: {
              id: 'default',
            },
          },
        },
        trigger,
      );
    }
  } catch (error) {
    console.error('Failed to sync medication reminders:', error);
  }
}

export async function cancelMedicationReminders(medicationId: string) {
  // We prefixed the notification ID with medicationId
  const triggerIds = await notifee.getTriggerNotificationIds();
  const idsToCancel = triggerIds.filter(id => id.startsWith(medicationId));
  
  if (idsToCancel.length > 0) {
    await notifee.cancelTriggerNotifications(idsToCancel);
  }
}

export async function requestNotificationPermissions() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus;
}

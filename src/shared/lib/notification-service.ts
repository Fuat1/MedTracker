import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
} from '@notifee/react-native';
import type { TimestampTrigger, Notification } from '@notifee/react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';

// ── Types ────────────────────────────────────────────────────────────

export enum NotificationType {
  MEDICATION = 'medication',
}

interface ChannelConfig {
  id: string;
  name: string;
  importance: AndroidImportance;
  sound?: string;
}

export interface ScheduleReminderParams {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetScreen: string;
  triggerTimestamp: number;
  repeatFrequency?: RepeatFrequency;
}

// Re-export for callers that need it
export { RepeatFrequency };

// ── Navigation ref (owned here, consumed by app/navigation) ─────────

// We use `any` for the param list here because the full RootStackParamList
// lives in app/navigation (upper layer). The navigation component passes
// the concrete-typed ref via <NavigationContainer ref={navigationRef}>.
export const navigationRef = createNavigationContainerRef<any>();

let pendingNavigation: string | null = null;

export function consumePendingNavigation(): string | null {
  const target = pendingNavigation;
  pendingNavigation = null;
  return target;
}

// ── Channel registry ────────────────────────────────────────────────

const CHANNELS: Record<NotificationType, ChannelConfig> = {
  [NotificationType.MEDICATION]: {
    id: 'medication-reminders',
    name: 'Medication Reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  },
};

// ── Exported functions ──────────────────────────────────────────────

export async function initialize(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      const entries = Object.values(CHANNELS);
      for (const channel of entries) {
        await notifee.createChannel({
          id: channel.id,
          name: channel.name,
          importance: channel.importance,
          sound: channel.sound,
        });
      }
    }

    await notifee.requestPermission();
  } catch (error) {
    // Degrade gracefully — notifications won't work but app should still launch
    console.error('Failed to initialize notifications:', error);
  }
}

export async function scheduleReminder(params: ScheduleReminderParams): Promise<void> {
  const channel = CHANNELS[params.type];

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: params.triggerTimestamp,
    ...(params.repeatFrequency != null && { repeatFrequency: params.repeatFrequency }),
  };

  await notifee.createTriggerNotification(
    {
      id: params.id,
      title: params.title,
      body: params.body,
      data: {
        type: params.type,
        targetScreen: params.targetScreen,
      },
      android: {
        channelId: channel.id,
        pressAction: { id: 'default' },
        sound: channel.sound,
      },
    },
    trigger,
  );
}

export async function cancelReminders(idPrefix: string): Promise<void> {
  const triggerIds = await notifee.getTriggerNotificationIds();
  const idsToCancel = triggerIds.filter(id => id.startsWith(idPrefix));

  if (idsToCancel.length > 0) {
    await notifee.cancelTriggerNotifications(idsToCancel);
  }
}

export function handleNotificationPress(notification: Notification): void {
  const targetScreen = notification.data?.targetScreen as string | undefined;
  if (!targetScreen) return;

  if (navigationRef.isReady()) {
    navigationRef.navigate('Main', { screen: targetScreen });
  } else {
    pendingNavigation = targetScreen;
  }
}

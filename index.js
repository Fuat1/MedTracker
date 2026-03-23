/**
 * @format
 */

import 'react-native-get-random-values'; // Must be first — polyfills crypto.getRandomValues
import { AppRegistry } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import { handleNotificationPress } from './src/shared/lib/notification-service';
import App from './src/app';
import { name as appName } from './app.json';

// Must be registered before AppRegistry — handles notification taps when app is killed
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail.notification) {
    handleNotificationPress(detail.notification);
  }
});

AppRegistry.registerComponent(appName, () => App);

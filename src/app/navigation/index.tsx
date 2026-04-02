import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer, type LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { NavigatorScreenParams } from '@react-navigation/native';
import BootSplash from 'react-native-bootsplash';
import notifee, { EventType } from '@notifee/react-native';
import { Toast } from '../../shared/ui';
import { useToastStore } from '../../shared/lib/toast-store';
import { HomePage, HistoryPage, SettingsPage, NewReadingPage, EditReadingPage, MedicationPage, VoiceConfirmationPage } from '../../pages';
import { PersonalInfoPage } from '../../pages/settings/ui/PersonalInfoPage';
import { ClassificationPage } from '../../pages/settings/ui/ClassificationPage';
import { AppSettingsPage } from '../../pages/settings/ui/AppSettingsPage';
import { SyncPage } from '../../pages/settings/ui/SyncPage';
import { WeatherSettingsPage } from '../../pages/settings/ui/WeatherSettingsPage';
import { PreMeasurementPage } from '../../pages/pre-measurement';
import { QuickLogPage } from '../../pages/quick-log';
import { SharingSettingsPage, InvitePage, AcceptInvitePage } from '../../pages/family-sharing';
import { CustomTabBar } from './CustomTabBar';
import { ErrorBoundary } from '../providers/ErrorBoundary';
import {
  navigationRef,
  consumePendingNavigation,
  handleNotificationPress,
} from '../../shared/lib/notification-service';
import { useDownloadRecords, useRetryUploadQueue } from '../../features/sync';
import { getFirebaseUser } from '../../shared/lib/safe-firebase-auth';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  PersonalInfo: undefined;
  Classification: undefined;
  AppSettings: undefined;
  Sync: undefined;
  WeatherSettings: undefined;
  FamilySharing: undefined;
  InvitePerson: { inviteCode: string; expiresAt: number };
};

export type RootTabParamList = {
  Home: undefined;
  History: undefined;
  Medications: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: NavigatorScreenParams<RootTabParamList>;
  QuickLog: undefined;
  PreMeasurement: undefined;
  NewReading: undefined;
  EditReading: { recordId: string };
  VoiceConfirmation: { sys?: string; dia?: string; pulse?: string; query?: string };
  AcceptInvite: { code?: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

/**
 * SyncManagerInner — sync side-effects (download + retry upload).
 * Only mounted when the user is authenticated (gated by SyncManager).
 */
function SyncManagerInner() {
  const { downloadAll } = useDownloadRecords();
  const { retryAll } = useRetryUploadQueue();

  // On mount, do an initial sync pass
  React.useEffect(() => {
    void downloadAll();
    void retryAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

/**
 * SyncManager — offline-first gate. Only mounts sync hooks when the user
 * is signed in to Firebase. Without this, auth() calls crash on startup.
 */
function SyncManager() {
  const [hasUser, setHasUser] = React.useState(() => !!getFirebaseUser());

  React.useEffect(() => {
    try {
      const { getAuth, onAuthStateChanged } = require('@react-native-firebase/auth');
      const authInstance = getAuth();
      const unsubscribe = onAuthStateChanged(
        authInstance,
        (user: { uid: string } | null) => setHasUser(!!user),
      );
      return unsubscribe;
    } catch {
      // Firebase not available — stay in offline mode
      return undefined;
    }
  }, []);

  if (!hasUser) { return null; }
  return <SyncManagerInner />;
}

function renderTabBar(props: BottomTabBarProps) {
  return <CustomTabBar {...props} />;
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <SettingsStack.Screen name="SettingsHome" component={SettingsPage} />
      <SettingsStack.Screen name="PersonalInfo" component={PersonalInfoPage} />
      <SettingsStack.Screen name="Classification" component={ClassificationPage} />
      <SettingsStack.Screen name="AppSettings" component={AppSettingsPage} />
      <SettingsStack.Screen name="Sync" component={SyncPage} />
      <SettingsStack.Screen name="WeatherSettings" component={WeatherSettingsPage} />
      <SettingsStack.Screen name="FamilySharing" component={SharingSettingsPage} />
      <SettingsStack.Screen name="InvitePerson" component={InvitePage} />
    </SettingsStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={renderTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="History" component={HistoryPage} />
      <Tab.Screen name="Medications" component={MedicationPage} />
      <Tab.Screen name="Settings" component={SettingsNavigator} />
    </Tab.Navigator>
  );
}

function GlobalToast() {
  const { message, type, visible, hideToast } = useToastStore();
  return (
    <Toast message={message} type={type} visible={visible} onHide={hideToast} />
  );
}

export function Navigation() {
  const linking: LinkingOptions<RootStackParamList> = {
    prefixes: ['medtracker://'],
    config: {
      screens: {
        VoiceConfirmation: 'log',
        AcceptInvite: {
          path: 'invite',
          parse: { code: (code: string) => code },
        },
      },
    },
  };

  useEffect(() => {
    return notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && detail.notification) {
        handleNotificationPress(detail.notification);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <View style={styles.container}>
      <NavigationContainer
        linking={linking}
        ref={navigationRef}
        onReady={() => {
          BootSplash.hide({ fade: true });
          const pending = consumePendingNavigation();
          if (pending) {
            navigationRef.navigate('Main', { screen: pending as keyof RootTabParamList });
          }
        }}
      >
        <SyncManager />
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen
            name="QuickLog"
            component={QuickLogPage}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="PreMeasurement"
            component={PreMeasurementPage}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="NewReading"
            component={NewReadingPage}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="EditReading"
            component={EditReadingPage}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="VoiceConfirmation"
            component={VoiceConfirmationPage}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="AcceptInvite"
            component={AcceptInvitePage}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <GlobalToast />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

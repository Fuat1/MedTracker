import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomePage, HistoryPage, SettingsPage, NewReadingPage, EditReadingPage, MedicationPage } from '../../pages';
import { PersonalInfoPage } from '../../pages/settings/ui/PersonalInfoPage';
import { ClassificationPage } from '../../pages/settings/ui/ClassificationPage';
import { AppSettingsPage } from '../../pages/settings/ui/AppSettingsPage';
import { SyncPage } from '../../pages/settings/ui/SyncPage';
import { PreMeasurementPage } from '../../pages/pre-measurement';
import { QuickLogPage } from '../../pages/quick-log';
import { CustomTabBar } from './CustomTabBar';
import { ErrorBoundary } from '../providers/ErrorBoundary';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export type SettingsStackParamList = {
  SettingsHome: undefined;
  PersonalInfo: undefined;
  Classification: undefined;
  AppSettings: undefined;
  Sync: undefined;
};

export type RootTabParamList = {
  Home: undefined;
  History: undefined;
  Medications: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  QuickLog: undefined;
  PreMeasurement: undefined;
  NewReading: undefined;
  EditReading: { recordId: string };
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

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

import BootSplash from 'react-native-bootsplash';

export function Navigation() {
  return (
    <ErrorBoundary>
      <NavigationContainer onReady={() => BootSplash.hide({ fade: true })}>
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
      </Stack.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
  );
}

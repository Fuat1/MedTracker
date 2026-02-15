import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomePage, HistoryPage, AnalyticsPage, SettingsPage, NewReadingPage } from '../../pages';
import { PreMeasurementPage } from '../../pages/pre-measurement';
import { QuickLogPage } from '../../pages/quick-log';
import { CustomTabBar } from './CustomTabBar';
import { ErrorBoundary } from '../providers/ErrorBoundary';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export type RootTabParamList = {
  Home: undefined;
  History: undefined;
  Analytics: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  QuickLog: undefined;
  PreMeasurement: undefined;
  NewReading: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function renderTabBar(props: BottomTabBarProps) {
  return <CustomTabBar {...props} />;
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
      <Tab.Screen name="Analytics" component={AnalyticsPage} />
      <Tab.Screen name="Settings" component={SettingsPage} />
    </Tab.Navigator>
  );
}

export function Navigation() {
  return (
    <ErrorBoundary>
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
  );
}

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomePage, HistoryPage, SettingsPage } from '../../pages';

export type RootStackParamList = {
  Home: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#f9fafb' },
        }}
      >
        <Stack.Screen name="Home" component={HomePage} />
        <Stack.Screen
          name="History"
          component={HistoryPage}
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsPage}
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackTitle: 'Back',
            headerShadowVisible: false,
            headerStyle: { backgroundColor: '#ffffff' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Providers } from './providers';
import { Navigation } from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <Providers>
        <Navigation />
      </Providers>
    </SafeAreaProvider>
  );
}

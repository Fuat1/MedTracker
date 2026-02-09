import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Providers } from './providers';
import { Navigation } from './navigation';
import { useTheme } from '../shared/lib/use-theme';

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Navigation />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Providers>
        <AppContent />
      </Providers>
      <Toast />
    </SafeAreaProvider>
  );
}

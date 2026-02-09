import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { initDatabase, closeDatabase } from '../../shared/api';
import '../../shared/lib/i18n'; // Initialize i18n
import '../../shared/lib/i18n-types'; // Import type definitions
import { useSettingsStore } from '../../shared/lib/settings-store';
import i18n from '../../shared/lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const language = useSettingsStore((state) => state.language);

  useEffect(() => {
    async function init() {
      try {
        // Sync i18n with persisted language preference
        await i18n.changeLanguage(language);
        await initDatabase();
        setIsReady(true);
      } catch (e) {
        console.error('Failed to initialize database:', e);
        setError(e instanceof Error ? e.message : 'Failed to initialize');
      }
    }

    init();

    return () => {
      closeDatabase();
    };
  }, [language]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Initialization Error
        </Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#ef4444',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    color: '#6b7280',
    marginTop: 16,
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { initDatabase, closeDatabase } from '../../shared/api';
import '../../shared/lib/i18n'; // Initialize i18n
import '../../shared/lib/i18n-types'; // Import type definitions
import { useSettingsStore } from '../../shared/lib/settings-store';
import { useTheme } from '../../shared/lib/use-theme';
import { FONTS } from '../../shared/config/theme';
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
  const { colors } = useTheme();
  const { t } = useTranslation('common');

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
      <View style={[styles.errorContainer, { backgroundColor: colors.errorBackground }]}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>
          {t('initialization.error')}
        </Text>
        <Text style={[styles.errorMessage, { color: colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('initialization.loading')}
        </Text>
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
    padding: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorMessage: {
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.regular,
    marginTop: 16,
  },
});

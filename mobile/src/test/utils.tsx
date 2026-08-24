import React from 'react';
import { TamaguiProvider } from 'tamagui';
import config from '../../tamagui.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeContext, type Theme } from '../theme';
import { ToastProvider } from '../components/shared/GlassToast';

const theme: Theme = { name: 'light', colors: config.themes.light as unknown as Theme['colors'] };

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <ThemeContext.Provider value={theme}>
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ToastProvider>
      </ThemeContext.Provider>
    </TamaguiProvider>
  );
}
import React from 'react';
import { TamaguiProvider } from 'tamagui';
import config from '../../tamagui.config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeContext, type Theme } from '../theme';
import { ToastProvider } from '../components/shared/GlassToast';
import { palettes } from '../theme/colors';
import { textStyle, semanticText } from '../theme/typography';
import { spacing, semanticSpacing, radius, semanticRadius, borderWidth, elevation, hitTarget } from '../theme/spacing';
import { componentTokens } from '../theme/colors';

// Create a complete test theme with all semantic tokens
const testColors = palettes.light;

const theme: Theme = {
  name: 'light',
  colors: testColors,
  legacy: testColors.legacy,
  text: textStyle,
  semanticText: semanticText,
  spacing,
  semanticSpacing,
  radius,
  semanticRadius,
  borderWidth,
  elevation,
  hitTarget,
  componentTokens,
};

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
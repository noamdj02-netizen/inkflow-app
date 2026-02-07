'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: 'system' | 'light' | 'dark';
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

/**
 * Enveloppe l'app pour fournir le thème (light/dark) via next-themes.
 * Nécessaire avec les Server Components pour éviter les mismatches d'hydratation.
 * disableTransitionOnChange évite les flashes lors du switch dark/light.
 */
export function ThemeProvider({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = true, // évite les mismatches d'hydratation
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      {children}
    </NextThemesProvider>
  );
}

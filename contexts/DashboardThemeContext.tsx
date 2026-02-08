import React, { createContext, useContext, useState, useEffect } from 'react';

export type DashboardTheme = 'light' | 'dark';

const STORAGE_KEY = 'inkflow-dashboard-theme';

interface DashboardThemeContextValue {
  theme: DashboardTheme;
  setTheme: (t: DashboardTheme) => void;
  toggleTheme: () => void;
  isLight: boolean;
}

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(STORAGE_KEY) as DashboardTheme | null;
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (t: DashboardTheme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  const isLight = theme === 'light';

  return (
    <DashboardThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLight }}>
      {children}
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    return {
      theme: 'light' as DashboardTheme,
      setTheme: () => {},
      toggleTheme: () => {},
      isLight: true,
    };
  }
  return ctx;
}

/**
 * Dashboard Appearance – intensité des néons et couleurs du fond.
 * Persisté en localStorage, modifiable depuis le Widget Store (onglet Apparence).
 */

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';

const STORAGE_KEY = 'inkflow-dashboard-appearance';

export interface DashboardAppearanceState {
  /** Opacité des halos (0.05–0.25) */
  glowIntensity: number;
  /** Opacité du voile noir pour lisibilité (0.2–0.6) */
  overlayOpacity: number;
  /** Couleur du néon haut/gauche (hex) */
  glowLeftColor: string;
  /** Couleur du néon bas/droite (hex) */
  glowRightColor: string;
}

const DEFAULT: DashboardAppearanceState = {
  glowIntensity: 0.12,
  overlayOpacity: 0.4,
  glowLeftColor: '#0891b2',
  glowRightColor: '#4f46e5',
};

function load(): DashboardAppearanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw) as Partial<DashboardAppearanceState>;
    return {
      glowIntensity: clamp(parsed.glowIntensity ?? DEFAULT.glowIntensity, 0.05, 0.25),
      overlayOpacity: clamp(parsed.overlayOpacity ?? DEFAULT.overlayOpacity, 0.2, 0.6),
      glowLeftColor: typeof parsed.glowLeftColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed.glowLeftColor)
        ? parsed.glowLeftColor
        : DEFAULT.glowLeftColor,
      glowRightColor: typeof parsed.glowRightColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(parsed.glowRightColor)
        ? parsed.glowRightColor
        : DEFAULT.glowRightColor,
    };
  } catch {
    return { ...DEFAULT };
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type SetState = React.Dispatch<React.SetStateAction<DashboardAppearanceState>>;

interface DashboardAppearanceContextValue {
  appearance: DashboardAppearanceState;
  setAppearance: SetState;
  setGlowIntensity: (v: number) => void;
  setOverlayOpacity: (v: number) => void;
  setGlowLeftColor: (v: string) => void;
  setGlowRightColor: (v: string) => void;
  resetToDefault: () => void;
}

const Ctx = createContext<DashboardAppearanceContextValue | null>(null);

export function DashboardAppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<DashboardAppearanceState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance));
    } catch {
      // ignore
    }
  }, [appearance]);

  const setGlowIntensity = useCallback((v: number) => {
    setAppearanceState((prev) => ({ ...prev, glowIntensity: clamp(v, 0.05, 0.25) }));
  }, []);

  const setOverlayOpacity = useCallback((v: number) => {
    setAppearanceState((prev) => ({ ...prev, overlayOpacity: clamp(v, 0.2, 0.6) }));
  }, []);

  const setGlowLeftColor = useCallback((v: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) setAppearanceState((prev) => ({ ...prev, glowLeftColor: v }));
  }, []);

  const setGlowRightColor = useCallback((v: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) setAppearanceState((prev) => ({ ...prev, glowRightColor: v }));
  }, []);

  const resetToDefault = useCallback(() => {
    setAppearanceState({ ...DEFAULT });
  }, []);

  const value = useMemo(
    () => ({
      appearance,
      setAppearance: setAppearanceState,
      setGlowIntensity,
      setOverlayOpacity,
      setGlowLeftColor,
      setGlowRightColor,
      resetToDefault,
    }),
    [
      appearance,
      setGlowIntensity,
      setOverlayOpacity,
      setGlowLeftColor,
      setGlowRightColor,
      resetToDefault,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useDashboardAppearance(): DashboardAppearanceContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboardAppearance must be used within DashboardAppearanceProvider');
  return ctx;
}

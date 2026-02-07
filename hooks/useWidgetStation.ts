/**
 * Hook pour gérer les widgets actifs de la Widget Station (colonne de droite).
 * Persiste la configuration dans localStorage (clé: widget_station_active).
 */

import { useState, useCallback, useEffect } from 'react';

export const WIDGET_STATION_IDS = [
  'revenue',
  'vibe',
  'inbox',
  'timer',
  'note',
] as const;

export type WidgetStationId = (typeof WIDGET_STATION_IDS)[number];

const STORAGE_KEY = 'widget_station_active';

const DEFAULT_ACTIVE: WidgetStationId[] = ['revenue', 'inbox', 'note'];

function parseStored(value: string | null): WidgetStationId[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter((id): id is WidgetStationId =>
      typeof id === 'string' && WIDGET_STATION_IDS.includes(id as WidgetStationId)
    );
    const unique = [...new Set(valid)];
    return unique.length > 0 ? unique : null;
  } catch {
    return null;
  }
}

export function useWidgetStation() {
  const [activeWidgets, setActiveWidgetsState] = useState<WidgetStationId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ACTIVE;
    const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
    return stored ?? DEFAULT_ACTIVE;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  const setActiveWidgets = useCallback((next: WidgetStationId[] | ((prev: WidgetStationId[]) => WidgetStationId[])) => {
    setActiveWidgetsState((prev) => {
      const nextList = typeof next === 'function' ? next(prev) : next;
      const valid = nextList.filter((id) => WIDGET_STATION_IDS.includes(id));
      return [...new Set(valid)];
    });
  }, []);

  const toggleWidget = useCallback((id: WidgetStationId) => {
    setActiveWidgetsState((prev) => {
      const has = prev.includes(id);
      if (has) {
        const next = prev.filter((w) => w !== id);
        return next.length > 0 ? next : prev;
      }
      return [...prev, id];
    });
  }, []);

  const isActive = useCallback(
    (id: WidgetStationId) => activeWidgets.includes(id),
    [activeWidgets]
  );

  const resetToDefault = useCallback(() => {
    setActiveWidgetsState(DEFAULT_ACTIVE);
  }, []);

  return {
    activeWidgets,
    setActiveWidgets,
    toggleWidget,
    isActive,
    resetToDefault,
  };
}

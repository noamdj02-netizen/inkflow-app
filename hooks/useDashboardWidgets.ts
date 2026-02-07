/**
 * Hook pour gérer les widgets actifs du Dashboard (Widget Store).
 * S'appuie sur le Widget Registry ; persiste dans localStorage.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ALL_WIDGET_IDS,
  DEFAULT_ACTIVE_WIDGET_IDS,
  getWidgetById,
  type WidgetId,
} from '../config/widgetRegistry';

const STORAGE_KEY = 'dashboard_active_widgets';

function parseStored(value: string | null): WidgetId[] | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter((id): id is WidgetId =>
      typeof id === 'string' && ALL_WIDGET_IDS.includes(id as WidgetId)
    );
    const unique = [...new Set(valid)];
    return unique.length > 0 ? unique : null;
  } catch {
    return null;
  }
}

export type { WidgetId };
export { ALL_WIDGET_IDS, getWidgetById };

export function useDashboardWidgets() {
  const [activeWidgets, setActiveWidgetsState] = useState<WidgetId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ACTIVE_WIDGET_IDS;
    const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
    return stored ?? DEFAULT_ACTIVE_WIDGET_IDS;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  const setActiveWidgets = useCallback((next: WidgetId[] | ((prev: WidgetId[]) => WidgetId[])) => {
    setActiveWidgetsState((prev) => {
      const nextList = typeof next === 'function' ? next(prev) : next;
      const valid = nextList.filter((id) => ALL_WIDGET_IDS.includes(id));
      return [...new Set(valid)];
    });
  }, []);

  const toggleWidget = useCallback((id: WidgetId) => {
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
    (id: WidgetId) => activeWidgets.includes(id),
    [activeWidgets]
  );

  const resetToDefault = useCallback(() => {
    setActiveWidgetsState(DEFAULT_ACTIVE_WIDGET_IDS);
  }, []);

  /** Réordonner les widgets (après drag & drop). */
  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setActiveWidgetsState((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  /** Liste des définitions dans l'ordre affiché (ordre des activeWidgets = ordre personnalisable par drag). */
  const activeDefinitions = activeWidgets
    .map((id) => getWidgetById(id))
    .filter((w): w is NonNullable<typeof w> => w != null);

  return {
    activeWidgets,
    activeDefinitions,
    setActiveWidgets,
    toggleWidget,
    isActive,
    resetToDefault,
    reorderWidgets,
  };
}

/**
 * Hook : liste, création et suppression de templates de disponibilités (localStorage).
 */
import { useState, useCallback, useEffect } from 'react';
import type { AvailabilityTemplate, DisponibilitesState } from '../types/calendar';

const STORAGE_KEY = 'inkflow_availability_templates';

function loadTemplates(): AvailabilityTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: AvailabilityTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('[useTemplates] save:', e);
  }
}

/** Nombre d'heures disponibles dans un schedule (1 slot = 1h). */
export function getTemplateTotalHours(schedule: DisponibilitesState): number {
  return Object.values(schedule).filter((v) => v === true).length;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const createTemplate = useCallback(
    (params: { name: string; schedule: DisponibilitesState; recurrence?: 'weekly' }) => {
      const template: AvailabilityTemplate = {
        id: crypto.randomUUID?.() ?? `t-${Date.now()}`,
        name: params.name.trim() || 'Semaine type',
        schedule: { ...params.schedule },
        recurrence: params.recurrence ?? 'weekly',
        createdAt: new Date().toISOString(),
      };
      setTemplates((prev) => {
        const next = [...prev, template];
        saveTemplates(next);
        return next;
      });
      return template;
    },
    []
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTemplates(next);
      return next;
    });
  }, []);

  return {
    templates,
    createTemplate,
    deleteTemplate,
    getTemplateTotalHours,
  };
}

/**
 * Détecte les conflits entre disponibilités peintes et RDV existants.
 * Un conflit = un RDV dont le créneau de début est marqué indisponible (bloqué).
 */
import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useCalendar, type CalendarEventInput } from './useCalendar';
import { slotKey } from './useDisponibilites';
import type { DisponibilitesState } from '../types/calendar';
import type { AvailabilityConflict } from '../types/calendar';

/** Lundi = 0, Dimanche = 6 (aligné avec useDisponibilites) */
function dayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function detectConflicts(
  disponibilites: DisponibilitesState,
  events: CalendarEventInput[]
): AvailabilityConflict[] {
  const conflicts: AvailabilityConflict[] = [];
  for (const apt of events) {
    const start = apt.start;
    const day = dayOfWeek(start);
    const hour = start.getHours();
    const slot = slotKey(day, hour);
    if (disponibilites[slot] !== true) {
      conflicts.push({
        id: apt.id,
        bookingId: apt.id,
        clientName: apt.extendedProps?.clientName ?? null,
        date: start,
        day,
        hour,
        slot,
        title: apt.title,
      });
    }
  }
  return conflicts;
}

export interface UseSyncAvailabilityOptions {
  artistId: string | undefined;
  disponibilites: DisponibilitesState;
  setSlot: (day: number, hour: number, isAvailable: boolean) => void;
  /** Désactiver le toast automatique (pour tests ou UI custom) */
  silent?: boolean;
}

export interface UseSyncAvailabilityReturn {
  conflicts: AvailabilityConflict[];
  resolverOpen: boolean;
  openConflictResolver: (list?: AvailabilityConflict[]) => void;
  closeConflictResolver: () => void;
  markSlotAsAvailable: (day: number, hour: number) => void;
}

export function useSyncAvailability({
  artistId,
  disponibilites,
  setSlot,
  silent = false,
}: UseSyncAvailabilityOptions): UseSyncAvailabilityReturn {
  const { events } = useCalendar(artistId);
  const [conflicts, setConflicts] = useState<AvailabilityConflict[]>([]);
  const [resolverOpen, setResolverOpen] = useState(false);

  useEffect(() => {
    const next = detectConflicts(disponibilites, events);
    setConflicts(next);
    if (next.length > 0 && !silent) {
      setResolverOpen(true);
      toast(`⚠️ ${next.length} conflit(s) détecté(s). Ouvrez la fenêtre pour résoudre.`, {
        duration: 10000,
      });
    }
  }, [disponibilites, events, silent]);

  const openConflictResolver = useCallback((list?: AvailabilityConflict[]) => {
    if (list) setConflicts(list);
    setResolverOpen(true);
  }, []);

  const closeConflictResolver = useCallback(() => {
    setResolverOpen(false);
  }, []);

  const markSlotAsAvailable = useCallback(
    (day: number, hour: number) => {
      setSlot(day, hour, true);
      setConflicts((prev) => prev.filter((c) => c.day !== day || c.hour !== hour));
    },
    [setSlot]
  );

  return {
    conflicts,
    resolverOpen,
    openConflictResolver,
    closeConflictResolver,
    markSlotAsAvailable,
  };
}

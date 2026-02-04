/**
 * Hook : récupère les créneaux recommandés pour une durée et des préférences.
 */
import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { useDisponibilites } from './useDisponibilites';
import { useCalendar } from './useCalendar';
import { suggestBestSlots } from '../lib/suggestSlots';
import type { ClientPreferences, SuggestedSlot } from '../types/calendar';

export interface UseSuggestedSlotsOptions {
  durationMin: number;
  preferences?: ClientPreferences;
}

export function useSuggestedSlots({
  durationMin,
  preferences,
}: UseSuggestedSlotsOptions): {
  suggestions: SuggestedSlot[];
  isLoading: boolean;
} {
  const { user } = useAuth();
  const artistId = user?.id ?? undefined;
  const { disponibilites } = useDisponibilites();
  const { events, loading } = useCalendar(artistId);

  const suggestions = useMemo(() => {
    if (!artistId || durationMin <= 0) return [];
    return suggestBestSlots(durationMin, preferences, {
      disponibilites,
      appointments: events,
    });
  }, [artistId, durationMin, preferences, disponibilites, events]);

  return { suggestions, isLoading: loading };
}

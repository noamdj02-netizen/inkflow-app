/**
 * Hook calendrier : événements, vérification de créneau, mise à jour (drag & drop)
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { SlotAvailabilityResult, UpdateAppointmentPayload } from '../types/calendar';

export interface CalendarEventInput {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps?: {
    bookingId: string;
    clientName?: string | null;
    clientEmail?: string;
    type?: 'flash' | 'project' | 'manual';
  };
}

export function useCalendar(artistId: string | undefined) {
  const [events, setEvents] = useState<CalendarEventInput[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!artistId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          client_name,
          client_email,
          date_debut,
          date_fin,
          duree_minutes,
          flash_id,
          project_id,
          flashs ( title ),
          projects ( body_part, style )
        `)
        .eq('artist_id', artistId)
        .in('statut_booking', ['pending', 'confirmed'])
        .order('date_debut', { ascending: true });

      if (error) throw error;

      const list: CalendarEventInput[] = ((data || []) as Array<{
        id: string;
        client_name: string | null;
        client_email: string;
        date_debut: string;
        date_fin: string;
        duree_minutes: number;
        flash_id: string | null;
        project_id: string | null;
        flashs?: { title: string } | null;
        projects?: { body_part?: string; style?: string } | null;
      }>).map((b) => {
        const start = new Date(b.date_debut);
        const end = new Date(b.date_fin);
        const title = b.flash_id
          ? `${b.client_name || 'Client'} • ${b.flashs?.title || 'Flash'}`
          : `${b.client_name || 'Client'} • ${b.projects?.body_part || 'Projet'}`;
        return {
          id: b.id,
          title,
          start,
          end,
          extendedProps: {
            bookingId: b.id,
            clientName: b.client_name,
            clientEmail: b.client_email,
            type: b.flash_id ? 'flash' : 'project',
          },
        };
      });
      setEvents(list);
    } catch (err) {
      console.error('[useCalendar] fetchEvents:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const checkSlotAvailability = useCallback(
    async (
      excludeBookingId: string,
      start: Date,
      end: Date
    ): Promise<SlotAvailabilityResult> => {
      if (!artistId) return { available: false, reason: 'Artiste inconnu' };

      const startIso = start.toISOString();
      const endIso = end.toISOString();

      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('artist_id', artistId)
        .neq('id', excludeBookingId)
        .in('statut_booking', ['pending', 'confirmed'])
        .lt('date_debut', endIso)
        .gt('date_fin', startIso)
        .limit(1);

      if (error) return { available: false, reason: error.message };
      if (data && data.length > 0)
        return { available: false, reason: 'Un autre RDV occupe ce créneau' };
      return { available: true };
    },
    [artistId]
  );

  const updateAppointment = useCallback(
    async (
      bookingId: string,
      payload: UpdateAppointmentPayload
    ): Promise<void> => {
      if (!artistId) throw new Error('Artiste inconnu');

      const { error } = await supabase
        .from('bookings')
        .update({
          date_debut: payload.start.toISOString(),
          date_fin: payload.end.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('artist_id', artistId);

      if (error) throw error;
    },
    [artistId]
  );

  return {
    events,
    loading,
    refetch: fetchEvents,
    checkSlotAvailability,
    updateAppointment,
  };
}

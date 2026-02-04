import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import type { ExistingClient } from '../types/calendar';

/**
 * Récupère la liste des clients existants (dérivés des bookings de l'artiste)
 * pour le QuickAdd : sélection rapide par email (distinct).
 */
export function useExistingClients(artistId: string | undefined) {
  const [clients, setClients] = useState<ExistingClient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!artistId) {
      setClients([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('client_name, client_email, client_phone')
          .eq('artist_id', artistId)
          .not('client_email', 'is', null)
          .order('date_debut', { ascending: false });

        if (cancelled) return;
        if (error) {
          setClients([]);
          return;
        }

        const seen = new Set<string>();
        const list: ExistingClient[] = [];
        for (const row of data || []) {
          const email = (row.client_email || '').trim().toLowerCase();
          if (!email || seen.has(email)) continue;
          seen.add(email);
          list.push({
            client_name: row.client_name ?? null,
            client_email: row.client_email ?? '',
            client_phone: row.client_phone ?? null,
          });
        }
        setClients(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artistId]);

  return { clients, loading };
}

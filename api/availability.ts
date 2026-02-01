/**
 * API: créneaux disponibles pour un artiste (vitrine réservation).
 * GET /api/availability?slug=noam
 * Retourne les créneaux sur les 30 prochains jours (par défaut Lun-Ven 9h-18h, hors créneaux déjà réservés).
 */

import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function json(res: any, status: number, body: unknown) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.end(JSON.stringify(body));
}

// Lundi = 1, Vendredi = 5 (ISO weekday)
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5];
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 18;
const SLOT_DURATION_MINUTES = 60;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const slug = (req.query?.slug || '').toString().trim();
  if (!slug) {
    return json(res, 400, { error: 'Missing slug' });
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY') || requireEnv('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, nom_studio')
      .eq('slug_profil', slug)
      .single();

    if (artistError || !artist) {
      return json(res, 404, { error: 'Artiste introuvable' });
    }

    const now = new Date();
    const endRange = new Date(now);
    endRange.setDate(endRange.getDate() + 30);

    const { data: bookings } = await supabase
      .from('bookings')
      .select('date_debut, date_fin')
      .eq('artist_id', artist.id)
      .in('statut_booking', ['confirmed', 'pending'])
      .gte('date_debut', now.toISOString())
      .lte('date_debut', endRange.toISOString());

    const bookedRanges = (bookings || []).map((b: { date_debut: string; date_fin: string }) => ({
      start: new Date(b.date_debut).getTime(),
      end: new Date(b.date_fin).getTime(),
    }));

    const slots: { date: string; time: string; iso: string; displayDate: string }[] = [];

    for (let d = 0; d < 30; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      date.setHours(0, 0, 0, 0);

      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
      if (!DEFAULT_WORK_DAYS.includes(dayOfWeek)) continue;

      for (let hour = DEFAULT_START_HOUR; hour < DEFAULT_END_HOUR; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + SLOT_DURATION_MINUTES * 60 * 1000);

        if (slotStart.getTime() < now.getTime()) continue;

        const isBooked = bookedRanges.some(
          (r: { start: number; end: number }) =>
            (slotStart.getTime() >= r.start && slotStart.getTime() < r.end) ||
            (slotEnd.getTime() > r.start && slotEnd.getTime() <= r.end) ||
            (slotStart.getTime() <= r.start && slotEnd.getTime() >= r.end)
        );
        if (isBooked) continue;

        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        slots.push({
          date: date.toISOString().slice(0, 10),
          time: timeStr,
          iso: slotStart.toISOString(),
          displayDate: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        });
      }
    }

    return json(res, 200, { slots, artistName: artist?.nom_studio ?? null });
  } catch (err: any) {
    console.error('Availability API error:', err);
    return json(res, 500, { error: err.message || 'Erreur serveur' });
  }
}

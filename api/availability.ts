/**
 * API: créneaux disponibles pour un artiste (vitrine réservation).
 * GET /api/availability?slug=noam
 * Retourne les créneaux sur les 30 prochains jours (Lun-Ven 9h-18h dans le fuseau de l'artiste).
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
const DEFAULT_TZ = 'Europe/Paris';

/** Retourne l'offset en heures (local - UTC) pour un jour donné dans un fuseau IANA. */
function getTimezoneOffsetHours(year: number, month: number, day: number, timeZone: string): number {
  try {
    const utcMidnight = Date.UTC(year, month, day, 0, 0, 0);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: '2-digit',
      hour12: false,
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(new Date(utcMidnight));
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    return hour + minute / 60;
  } catch {
    return 1; // fallback Europe/Paris winter
  }
}

/** Crée un Date UTC correspondant à (année, mois, jour, heure locale) dans le fuseau donné. */
function localToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): Date {
  const offsetHours = getTimezoneOffsetHours(year, month, day, timeZone);
  const utcMs = Date.UTC(year, month, day, hour - offsetHours, minute, 0);
  return new Date(utcMs);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const slug = (req.query?.slug || '').toString().trim();
  if (!slug) {
    return json(res, 400, { error: 'Missing slug' });
  }
  if (slug.length > 100 || !/^[a-z0-9_-]+$/i.test(slug)) {
    return json(res, 400, { error: 'Invalid slug format' });
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY') || requireEnv('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, nom_studio, timezone')
      .eq('slug_profil', slug)
      .single();

    if (artistError || !artist) {
      return json(res, 404, { error: 'Artiste introuvable' });
    }

    // timezone : colonne optionnelle (migration-artist-timezone.sql). Sinon Europe/Paris.
    const timeZone =
      (artist as { timezone?: string }).timezone != null
        ? String((artist as { timezone?: string }).timezone).trim() || DEFAULT_TZ
        : DEFAULT_TZ;
    const now = new Date();
    const endRange = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
      const utcDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d, 0, 0, 0));
      const y = utcDay.getUTCFullYear();
      const m = utcDay.getUTCMonth();
      const day = utcDay.getUTCDate();

      const dayOfWeek = utcDay.getUTCDay() === 0 ? 7 : utcDay.getUTCDay();
      if (!DEFAULT_WORK_DAYS.includes(dayOfWeek)) continue;

      for (let hour = DEFAULT_START_HOUR; hour < DEFAULT_END_HOUR; hour++) {
        const slotStart = localToUtc(y, m, day, hour, 0, timeZone);
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
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        slots.push({
          date: dateStr,
          time: timeStr,
          iso: slotStart.toISOString(),
          displayDate: utcDay.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            timeZone,
          }),
        });
      }
    }

    return json(res, 200, {
      slots,
      artistName: artist?.nom_studio ?? null,
      timezone: timeZone,
    });
  } catch (err) {
    console.error('Availability API error:', err);
    return json(res, 500, { error: 'Erreur serveur' });
  }
}

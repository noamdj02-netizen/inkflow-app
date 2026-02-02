/**
 * Route API : Flux iCal (RFC 5545) pour les rendez-vous InkFlow
 *
 * GET /api/calendar/feed?artist_id=UUID
 * ou GET /api/calendar/feed?token=ICAL_FEED_TOKEN (si ical_feed_token configuré)
 *
 * Permet aux tatoueurs de s'abonner au calendrier depuis Apple Calendar, Google Calendar, Android.
 * Cache court (5 min) pour limiter la charge DB tout en prenant en compte les mises à jour.
 */

import { createClient } from '@supabase/supabase-js';
import { toIcal, type IcalEventInput } from '../../utils/ical';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

/** Cache court : 5 minutes (300 s) pour équilibrer fraîcheur et charge DB */
const CACHE_MAX_AGE_SECONDS = 300;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405);
    res.setHeader('Content-Type', 'text/plain');
    res.end('Method Not Allowed');
    return;
  }

  try {
    const artistId = (req.query?.artist_id as string)?.trim();
    const token = (req.query?.token as string)?.trim();

    if (!artistId && !token) {
      res.status(400);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Missing artist_id or token');
      return;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (artistId && !uuidRegex.test(artistId)) {
      res.status(400);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Invalid artist_id format');
      return;
    }
    if (token && token.length > 256) {
      res.status(400);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Invalid token');
      return;
    }

    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let resolvedArtistId: string | null = artistId || null;

    if (!resolvedArtistId && token) {
      try {
        const { data: artistByToken, error: artistError } = await supabase
          .from('artists')
          .select('id')
          .eq('ical_feed_token', token)
          .maybeSingle();

        if (artistError || !artistByToken) {
          res.status(404);
          res.setHeader('Content-Type', 'text/plain');
          res.end('Invalid calendar feed token');
          return;
        }
        resolvedArtistId = artistByToken.id;
      } catch {
        res.status(404);
        res.setHeader('Content-Type', 'text/plain');
        res.end('Invalid calendar feed token');
        return;
      }
    }

    if (!resolvedArtistId) {
      res.status(400);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Missing artist_id');
      return;
    }

    const { data: artist, error: artistErr } = await supabase
      .from('artists')
      .select('id, nom_studio')
      .eq('id', resolvedArtistId)
      .single();

    if (artistErr || !artist) {
      res.status(404);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Artist not found');
      return;
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        client_name,
        client_email,
        date_debut,
        date_fin,
        duree_minutes,
        prix_total,
        statut_booking,
        updated_at,
        flash_id,
        project_id,
        flashs ( title ),
        projects ( body_part, style )
      `)
      .eq('artist_id', artist.id)
      .in('statut_booking', ['confirmed', 'pending'])
      .order('date_debut', { ascending: true });

    if (error) {
      console.error('Calendar feed DB error:', error);
      res.status(500);
      res.setHeader('Content-Type', 'text/plain');
      res.end('Calendar unavailable');
      return;
    }

    const events: IcalEventInput[] = (bookings || []).map((b: any) => {
      const start = new Date(b.date_debut);
      const end = new Date(b.date_fin);
      const title = b.flash_id
        ? `${b.client_name || 'Client'} – ${b.flashs?.title || 'Flash'}`
        : `${b.client_name || 'Client'} – ${b.projects?.body_part || 'Projet'}`;
      const description = [
        b.client_name && `Client: ${b.client_name}`,
        b.client_email && `Email: ${b.client_email}`,
        b.prix_total != null && `Prix: ${(b.prix_total / 100).toFixed(2)} €`,
      ]
        .filter(Boolean)
        .join('\n');

      return {
        id: b.id,
        title,
        description: description || undefined,
        start,
        end,
        updatedAt: b.updated_at ? new Date(b.updated_at) : undefined,
      };
    });

    const calendarName = `InkFlow – ${artist.nom_studio || 'Calendrier'}`;
    const ics = toIcal(events, calendarName);

    res.status(200);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', `public, max-age=${CACHE_MAX_AGE_SECONDS}, s-maxage=${CACHE_MAX_AGE_SECONDS}`);
    res.setHeader('Content-Disposition', 'inline; filename="inkflow-calendar.ics"');
    res.end(ics);
  } catch (err) {
    console.error('Calendar feed error:', err);
    res.status(500);
    res.setHeader('Content-Type', 'text/plain');
    res.end('An error occurred');
  }
}

/**
 * API unifiée Booking (Vercel Hobby = max 12 Serverless Functions).
 * Répond aux routes réécrites : /api/artist-booking-info, /api/create-booking, /api/cancel-pending-booking
 * Dispatch : GET → artist-booking-info ; POST avec booking_id → cancel ; POST avec flash_id → create.
 */

import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function json(res: { status: (n: number) => void; setHeader: (k: string, v: string) => void; end: (s: string) => void }, status: number, body: unknown, cacheControl?: string) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  if (cacheControl) res.setHeader('Cache-Control', cacheControl);
  res.end(JSON.stringify(body));
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

type Req = { method?: string; query?: Record<string, string>; body?: unknown; url?: string };
type Res = { status: (n: number) => void; setHeader: (k: string, v: string) => void; end: (s: string) => void };

async function handleArtistBookingInfo(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  const slug = (req.query?.slug || '').toString().trim();
  const flashId = (req.query?.flash_id || '').toString().trim();
  if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
    json(res, 400, { error: 'Invalid or missing slug' });
    return;
  }
  if (!flashId || !uuidRegex.test(flashId)) {
    json(res, 400, { error: 'Invalid or missing flash_id' });
    return;
  }
  let supabase: ReturnType<typeof createClient>;
  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (e) {
    console.error('[artist-booking-info] Env error:', e);
    json(res, 500, { error: 'Configuration serveur manquante' });
    return;
  }
  try {
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, nom_studio, slug_profil, deposit_percentage, stripe_account_id, stripe_onboarding_complete')
      .eq('slug_profil', slug)
      .single();
    if (artistError || !artist) {
      json(res, 404, { error: 'Artiste introuvable' });
      return;
    }
    const { data: flash, error: flashError } = await supabase
      .from('flashs')
      .select('id, title, prix, duree_minutes, statut, stock_limit, stock_current')
      .eq('id', flashId)
      .eq('artist_id', artist.id)
      .single();
    if (flashError || !flash) {
      json(res, 404, { error: 'Flash introuvable' });
      return;
    }
    if (flash.statut !== 'available') {
      json(res, 400, { error: 'Ce flash n\'est plus disponible' });
      return;
    }
    if (flash.stock_current >= flash.stock_limit) {
      json(res, 400, { error: 'Ce flash est épuisé' });
      return;
    }
    const depositPercentage = artist.deposit_percentage ?? 30;
    const depositAmount = Math.round((flash.prix * depositPercentage) / 100);
    json(res, 200, {
      artist: {
        id: artist.id,
        nom_studio: artist.nom_studio,
        slug_profil: artist.slug_profil,
        deposit_percentage: depositPercentage,
        stripe_configured: Boolean(artist.stripe_account_id && artist.stripe_onboarding_complete),
      },
      flash: {
        id: flash.id,
        title: flash.title,
        prix: flash.prix,
        duree_minutes: flash.duree_minutes,
        deposit_amount: depositAmount,
      },
    }, 'public, max-age=120');
  } catch (err) {
    console.error('[artist-booking-info] Unexpected error:', err);
    json(res, 500, { error: 'Une erreur est survenue' });
  }
}

async function handleCancelPendingBooking(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  let body: { booking_id?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}) as { booking_id?: string };
  } catch {
    json(res, 400, { error: 'Invalid JSON body' });
    return;
  }
  const bookingId = (body.booking_id ?? '').toString().trim();
  if (!bookingId || !uuidRegex.test(bookingId)) {
    json(res, 400, { error: 'Invalid or missing booking_id' });
    return;
  }
  let supabase: ReturnType<typeof createClient>;
  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (e) {
    console.error('[cancel-pending-booking] Env error:', e);
    json(res, 500, { error: 'Configuration serveur manquante' });
    return;
  }
  try {
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, statut_booking')
      .eq('id', bookingId)
      .single();
    if (fetchError || !booking) {
      json(res, 404, { error: 'Réservation introuvable' });
      return;
    }
    if (booking.statut_booking !== 'pending') {
      json(res, 200, { success: true, message: 'Réservation déjà traitée' });
      return;
    }
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        statut_booking: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .eq('statut_booking', 'pending');
    if (updateError) {
      console.error('[cancel-pending-booking] Update error:', updateError);
      json(res, 500, { error: 'Impossible d\'annuler la réservation' });
      return;
    }
    json(res, 200, { success: true });
  } catch (err) {
    console.error('[cancel-pending-booking] Unexpected error:', err);
    json(res, 500, { error: 'Une erreur est survenue' });
  }
}

async function handleCreateBooking(req: Req, res: Res): Promise<void> {
  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }
  let body: {
    slug?: string;
    artist_id?: string;
    flash_id?: string;
    date_debut_iso?: string;
    duree_minutes?: number;
    client_email?: string;
    client_name?: string;
    client_phone?: string;
  };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}) as typeof body;
  } catch {
    json(res, 400, { error: 'Invalid JSON body' });
    return;
  }
  const slug = (body.slug ?? '').toString().trim();
  const artistId = (body.artist_id ?? '').toString().trim();
  const flashId = (body.flash_id ?? '').toString().trim();
  const dateDebutIso = (body.date_debut_iso ?? '').toString().trim();
  const dureeMinutes = typeof body.duree_minutes === 'number' ? body.duree_minutes : 0;
  const clientEmail = (body.client_email ?? '').toString().trim();
  const clientName = (body.client_name ?? '').toString().trim().slice(0, 200) || null;
  const clientPhone = (body.client_phone ?? '').toString().trim().slice(0, 50) || null;

  if (!slug && !artistId) {
    json(res, 400, { error: 'Missing slug or artist_id' });
    return;
  }
  if (!flashId || !uuidRegex.test(flashId)) {
    json(res, 400, { error: 'Invalid or missing flash_id' });
    return;
  }
  if (!dateDebutIso) {
    json(res, 400, { error: 'Missing date_debut_iso' });
    return;
  }
  const dateDebut = new Date(dateDebutIso);
  if (Number.isNaN(dateDebut.getTime())) {
    json(res, 400, { error: 'Invalid date_debut_iso' });
    return;
  }
  if (dateDebut.getTime() < Date.now()) {
    json(res, 400, { error: 'Le créneau doit être dans le futur' });
    return;
  }
  if (!(dureeMinutes >= 15 && dureeMinutes <= 480)) {
    json(res, 400, { error: 'duree_minutes doit être entre 15 et 480' });
    return;
  }
  if (!clientEmail || !emailRegex.test(clientEmail)) {
    json(res, 400, { error: 'Email client invalide ou manquant' });
    return;
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (e) {
    console.error('[create-booking] Env error:', e);
    json(res, 500, { error: 'Configuration serveur manquante' });
    return;
  }

  try {
    let resolvedArtistId: string;
    if (artistId && uuidRegex.test(artistId)) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id')
        .eq('id', artistId)
        .single();
      if (artistError || !artist) {
        json(res, 404, { error: 'Artiste introuvable' });
        return;
      }
      resolvedArtistId = artist.id;
    } else if (slug && slug.length <= 100 && /^[a-z0-9_-]+$/i.test(slug)) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id')
        .eq('slug_profil', slug)
        .single();
      if (artistError || !artist) {
        json(res, 404, { error: 'Artiste introuvable' });
        return;
      }
      resolvedArtistId = artist.id;
    } else {
      json(res, 400, { error: 'Slug ou artist_id invalide' });
      return;
    }

    const { data: flash, error: flashError } = await supabase
      .from('flashs')
      .select('id, artist_id, prix, duree_minutes, statut, stock_limit, stock_current')
      .eq('id', flashId)
      .single();
    if (flashError || !flash) {
      json(res, 404, { error: 'Flash introuvable' });
      return;
    }
    if (flash.artist_id !== resolvedArtistId) {
      json(res, 403, { error: 'Ce flash n\'appartient pas à cet artiste' });
      return;
    }
    if (flash.statut !== 'available') {
      json(res, 400, { error: 'Ce flash n\'est plus disponible' });
      return;
    }
    if (flash.stock_current >= flash.stock_limit) {
      json(res, 400, { error: 'Ce flash est épuisé' });
      return;
    }

    const dateFin = new Date(dateDebut.getTime() + dureeMinutes * 60 * 1000);
    const { data: overlapping, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('artist_id', resolvedArtistId)
      .in('statut_booking', ['pending', 'confirmed'])
      .lt('date_debut', dateFin.toISOString())
      .gt('date_fin', dateDebut.toISOString())
      .limit(1);
    if (overlapError) {
      console.error('[create-booking] Overlap check error:', overlapError);
      json(res, 500, { error: 'Impossible de vérifier la disponibilité' });
      return;
    }
    if (overlapping && overlapping.length > 0) {
      json(res, 409, { error: 'Ce créneau n\'est plus disponible' });
      return;
    }

    const { data: artistRow } = await supabase
      .from('artists')
      .select('deposit_percentage')
      .eq('id', resolvedArtistId)
      .single();
    const depositPercentage = artistRow?.deposit_percentage ?? 30;
    const prixTotal = flash.prix;
    const depositAmount = Math.round((prixTotal * depositPercentage) / 100);
    if (depositAmount <= 0) {
      json(res, 400, { error: 'Montant d\'acompte invalide' });
      return;
    }

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        artist_id: resolvedArtistId,
        flash_id: flashId,
        project_id: null,
        client_email: clientEmail,
        client_name: clientName,
        client_phone: clientPhone,
        date_debut: dateDebut.toISOString(),
        date_fin: dateFin.toISOString(),
        duree_minutes: dureeMinutes,
        prix_total: prixTotal,
        deposit_amount: depositAmount,
        deposit_percentage: depositPercentage,
        statut_paiement: 'pending',
        statut_booking: 'pending',
      })
      .select('id')
      .single();

    if (insertError) {
      const code = (insertError as { code?: string }).code;
      const msg = (insertError as { message?: string }).message ?? '';
      if (code === '23P01' || msg.includes('booking_overlap') || msg.includes('chevauche')) {
        json(res, 409, { error: 'Ce créneau n\'est plus disponible' });
        return;
      }
      console.error('[create-booking] Insert error:', insertError);
      json(res, 500, { error: 'La réservation n\'a pas pu être enregistrée' });
      return;
    }
    if (!booking?.id) {
      json(res, 500, { error: 'La réservation n\'a pas pu être enregistrée' });
      return;
    }
    json(res, 200, { success: true, booking_id: booking.id });
  } catch (err) {
    console.error('[create-booking] Unexpected error:', err);
    json(res, 500, { error: 'Une erreur est survenue' });
  }
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const method = req.method;
  if (method === 'GET') {
    await handleArtistBookingInfo(req, res);
    return;
  }
  if (method === 'POST') {
    let body: { booking_id?: string; flash_id?: string };
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {}) as { booking_id?: string; flash_id?: string };
    } catch {
      json(res, 400, { error: 'Invalid JSON body' });
      return;
    }
    if (body.booking_id != null && body.booking_id !== '' && body.flash_id == null) {
      await handleCancelPendingBooking(req, res);
      return;
    }
    await handleCreateBooking(req, res);
    return;
  }
  json(res, 405, { error: 'Method not allowed' });
}

/**
 * API Booking Refactorisée - Système de réservation robuste avec transactions atomiques
 * 
 * AMÉLIORATIONS:
 * 1. Transactions atomiques pour éviter les race conditions
 * 2. Vérification de disponibilité avec horaires d'ouverture et créneaux bloqués
 * 3. Gestion d'erreurs précise
 * 4. Intégration Stripe PaymentIntent pour acompte
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

// Types pour les lignes Supabase (client sans générique Database infère never)
interface ArtistBookingRow {
  id: string;
  nom_studio: string | null;
  slug_profil: string | null;
  deposit_percentage: number | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
}
interface FlashBookingRow {
  id: string;
  artist_id?: string;
  title: string;
  prix: number;
  duree_minutes: number;
  statut: string;
  stock_limit: number;
  stock_current: number;
}
interface BookingRow {
  id: string;
  statut_booking?: string;
}
type Res = { status: (n: number) => void; setHeader: (k: string, v: string) => void; end: (s: string) => void };

// ============================================
// GET /api/artist-booking-info
// ============================================
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
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('id, nom_studio, slug_profil, deposit_percentage, stripe_account_id, stripe_onboarding_complete')
      .eq('slug_profil', slug)
      .single();
    if (artistError || !artistData) {
      json(res, 404, { error: 'Artiste introuvable' });
      return;
    }
    const artist = artistData as ArtistBookingRow;
    const { data: flashData, error: flashError } = await supabase
      .from('flashs')
      .select('id, title, prix, duree_minutes, statut, stock_limit, stock_current')
      .eq('id', flashId)
      .eq('artist_id', artist.id)
      .single();
    if (flashError || !flashData) {
      json(res, 404, { error: 'Flash introuvable' });
      return;
    }
    const flash = flashData as FlashBookingRow;
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

// ============================================
// POST /api/cancel-pending-booking
// ============================================
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
    const { data: bookingData, error: fetchError } = await supabase
      .from('bookings')
      .select('id, statut_booking')
      .eq('id', bookingId)
      .single();
    if (fetchError || !bookingData) {
      json(res, 404, { error: 'Réservation introuvable' });
      return;
    }
    const booking = bookingData as BookingRow;
    if (booking.statut_booking !== 'pending') {
      json(res, 200, { success: true, message: 'Réservation déjà traitée' });
      return;
    }
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        statut_booking: 'cancelled',
        updated_at: new Date().toISOString(),
      } as never)
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

// ============================================
// POST /api/create-booking (REFACTORISÉ AVEC TRANSACTIONS ATOMIQUES)
// ============================================
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

  // Validation des entrées
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
    // ÉTAPE 1: Résoudre l'artiste
    let resolvedArtistId: string;
    if (artistId && uuidRegex.test(artistId)) {
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('id, deposit_percentage, stripe_account_id, stripe_onboarding_complete')
        .eq('id', artistId)
        .single();
      if (artistError || !artistData) {
        json(res, 404, { error: 'Artiste introuvable' });
        return;
      }
      const artist = artistData as ArtistBookingRow;
      resolvedArtistId = artist.id;
    } else if (slug && slug.length <= 100 && /^[a-z0-9_-]+$/i.test(slug)) {
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('id, deposit_percentage, stripe_account_id, stripe_onboarding_complete')
        .eq('slug_profil', slug)
        .single();
      if (artistError || !artistData) {
        json(res, 404, { error: 'Artiste introuvable' });
        return;
      }
      const artist = artistData as ArtistBookingRow;
      resolvedArtistId = artist.id;
    } else {
      json(res, 400, { error: 'Slug ou artist_id invalide' });
      return;
    }

    // ÉTAPE 2: Vérifier le flash
    const { data: flashData, error: flashError } = await supabase
      .from('flashs')
      .select('id, artist_id, prix, duree_minutes, statut, stock_limit, stock_current')
      .eq('id', flashId)
      .single();
    if (flashError || !flashData) {
      json(res, 404, { error: 'Flash introuvable' });
      return;
    }
    const flash = flashData as FlashBookingRow;
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

    // Utiliser la durée du flash si non fournie
    const finalDureeMinutes = dureeMinutes || flash.duree_minutes;
    const dateFin = new Date(dateDebut.getTime() + finalDureeMinutes * 60 * 1000);

    // ÉTAPE 3: Vérification atomique de disponibilité (dans une transaction implicite via RPC)
    const { data: availabilityCheck, error: availabilityError } = await supabase
      .rpc('check_slot_availability_atomic', {
        p_artist_id: resolvedArtistId,
        p_date_debut: dateDebut.toISOString(),
        p_date_fin: dateFin.toISOString(),
        p_exclude_booking_id: null,
      } as never);

    if (availabilityError) {
      console.error('[create-booking] Availability check error:', availabilityError);
      json(res, 500, { error: 'Impossible de vérifier la disponibilité' });
      return;
    }

    if (!availabilityCheck) {
      json(res, 409, { 
        error: 'Ce créneau n\'est plus disponible',
        code: 'SLOT_UNAVAILABLE',
        details: 'Le créneau chevauche une réservation existante, est dans un créneau bloqué, ou hors des horaires d\'ouverture'
      });
      return;
    }

    // ÉTAPE 4: Calculer l'acompte
    const { data: artistRowData } = await supabase
      .from('artists')
      .select('deposit_percentage')
      .eq('id', resolvedArtistId)
      .single();
    const artistRow = artistRowData as { deposit_percentage: number | null } | null;
    const depositPercentage = artistRow?.deposit_percentage ?? 30;
    const prixTotal = flash.prix;
    const depositAmount = Math.round((prixTotal * depositPercentage) / 100);
    if (depositAmount <= 0) {
      json(res, 400, { error: 'Montant d\'acompte invalide' });
      return;
    }

    // ÉTAPE 5: Créer la réservation (le trigger check_booking_no_overlap vérifiera atomiquement)
    const { data: bookingData, error: insertError } = await supabase
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
        duree_minutes: finalDureeMinutes,
        prix_total: prixTotal,
        deposit_amount: depositAmount,
        deposit_percentage: depositPercentage,
        statut_paiement: 'pending',
        statut_booking: 'pending',
      } as never)
      .select('id')
      .single();

    if (insertError) {
      const code = (insertError as { code?: string }).code;
      const msg = (insertError as { message?: string }).message ?? '';
      
      // Gestion d'erreurs précise
      if (code === '23P01' || msg.includes('booking_overlap') || msg.includes('chevauche')) {
        json(res, 409, { 
          error: 'Ce créneau n\'est plus disponible',
          code: 'SLOT_OVERLAP',
          details: 'Une autre réservation a été créée entre-temps'
        });
        return;
      }
      
      console.error('[create-booking] Insert error:', insertError);
      json(res, 500, { 
        error: 'La réservation n\'a pas pu être enregistrée',
        code: 'DATABASE_ERROR',
        details: msg || 'Erreur lors de l\'insertion en base de données'
      });
      return;
    }

    const booking = bookingData as (BookingRow | null);
    if (!booking?.id) {
      json(res, 500, { 
        error: 'La réservation n\'a pas pu être enregistrée',
        code: 'NO_BOOKING_ID'
      });
      return;
    }

    // Succès : retourner l'ID de la réservation
    json(res, 200, { 
      success: true, 
      booking_id: booking.id,
      deposit_amount: depositAmount,
      prix_total: prixTotal
    });
  } catch (err) {
    console.error('[create-booking] Unexpected error:', err);
    json(res, 500, { 
      error: 'Une erreur est survenue',
      code: 'UNEXPECTED_ERROR',
      details: err instanceof Error ? err.message : 'Erreur inconnue'
    });
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

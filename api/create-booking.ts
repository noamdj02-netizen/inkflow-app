/**
 * API: Création d'une réservation (booking) côté serveur.
 * POST /api/create-booking
 *
 * Remplace l'INSERT direct depuis le client (anon) pour respecter la RLS
 * "pas d'INSERT public sur bookings". Toutes les validations et l'insert
 * sont faites avec la service role.
 *
 * Body: {
 *   slug: string,           // slug_profil de l'artiste (ou artist_id en alternative)
 *   flash_id: string,
 *   date_debut_iso: string, // ISO 8601 (ex: slot.iso de /api/availability)
 *   duree_minutes: number,
 *   client_email: string,
 *   client_name?: string,
 *   client_phone?: string,
 * }
 * Returns: { success: true, booking_id: string } ou { error: string }
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
  res.end(JSON.stringify(body));
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
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
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
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
    return json(res, 400, { error: 'Missing slug or artist_id' });
  }
  if (!flashId || !uuidRegex.test(flashId)) {
    return json(res, 400, { error: 'Invalid or missing flash_id' });
  }
  if (!dateDebutIso) {
    return json(res, 400, { error: 'Missing date_debut_iso' });
  }
  const dateDebut = new Date(dateDebutIso);
  if (Number.isNaN(dateDebut.getTime())) {
    return json(res, 400, { error: 'Invalid date_debut_iso' });
  }
  if (dateDebut.getTime() < Date.now()) {
    return json(res, 400, { error: 'Le créneau doit être dans le futur' });
  }
  if (!(dureeMinutes >= 15 && dureeMinutes <= 480)) {
    return json(res, 400, { error: 'duree_minutes doit être entre 15 et 480' });
  }
  if (!clientEmail || !emailRegex.test(clientEmail)) {
    return json(res, 400, { error: 'Email client invalide ou manquant' });
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
    return json(res, 500, { error: 'Configuration serveur manquante' });
  }

  try {
    // 1) Résoudre artist_id
    let resolvedArtistId: string;
    if (artistId && uuidRegex.test(artistId)) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id')
        .eq('id', artistId)
        .single();
      if (artistError || !artist) {
        return json(res, 404, { error: 'Artiste introuvable' });
      }
      resolvedArtistId = artist.id;
    } else if (slug && slug.length <= 100 && /^[a-z0-9_-]+$/i.test(slug)) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id')
        .eq('slug_profil', slug)
        .single();
      if (artistError || !artist) {
        return json(res, 404, { error: 'Artiste introuvable' });
      }
      resolvedArtistId = artist.id;
    } else {
      return json(res, 400, { error: 'Slug ou artist_id invalide' });
    }

    // 2) Récupérer le flash et vérifier qu'il appartient à l'artiste
    const { data: flash, error: flashError } = await supabase
      .from('flashs')
      .select('id, artist_id, prix, duree_minutes, statut, stock_limit, stock_current')
      .eq('id', flashId)
      .single();

    if (flashError || !flash) {
      return json(res, 404, { error: 'Flash introuvable' });
    }
    if (flash.artist_id !== resolvedArtistId) {
      return json(res, 403, { error: 'Ce flash n\'appartient pas à cet artiste' });
    }
    if (flash.statut !== 'available') {
      return json(res, 400, { error: 'Ce flash n\'est plus disponible' });
    }
    if (flash.stock_current >= flash.stock_limit) {
      return json(res, 400, { error: 'Ce flash est épuisé' });
    }

    const dateFin = new Date(dateDebut.getTime() + dureeMinutes * 60 * 1000);

    // 3) Vérifier absence de chevauchement (pending/confirmed)
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
      return json(res, 500, { error: 'Impossible de vérifier la disponibilité' });
    }
    if (overlapping && overlapping.length > 0) {
      return json(res, 409, { error: 'Ce créneau n\'est plus disponible' });
    }

    // 4) Acompte (même logique que PublicArtistPage)
    const { data: artistRow } = await supabase
      .from('artists')
      .select('deposit_percentage')
      .eq('id', resolvedArtistId)
      .single();
    const depositPercentage = artistRow?.deposit_percentage ?? 30;
    const prixTotal = flash.prix;
    const depositAmount = Math.round((prixTotal * depositPercentage) / 100);
    if (depositAmount <= 0) {
      return json(res, 400, { error: 'Montant d\'acompte invalide' });
    }

    // 5) Insert booking (service role → ignore RLS)
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
        return json(res, 409, { error: 'Ce créneau n\'est plus disponible' });
      }
      console.error('[create-booking] Insert error:', insertError);
      return json(res, 500, { error: 'La réservation n\'a pas pu être enregistrée' });
    }

    if (!booking?.id) {
      return json(res, 500, { error: 'La réservation n\'a pas pu être enregistrée' });
    }

    return json(res, 200, { success: true, booking_id: booking.id });
  } catch (err) {
    console.error('[create-booking] Unexpected error:', err);
    return json(res, 500, { error: 'Une erreur est survenue' });
  }
}

/**
 * API: Infos artiste + flash pour la page checkout (récap + Stripe ou non).
 * GET /api/artist-booking-info?slug=xxx&flash_id=xxx
 *
 * Retourne les données publiques nécessaires au récap et au choix Stripe vs résa directe.
 * stripe_configured = true si l'artiste peut accepter le paiement en ligne (sans exposer les IDs Stripe).
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
  res.setHeader('Cache-Control', 'public, max-age=120');
  res.end(JSON.stringify(body));
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const slug = (req.query?.slug || '').toString().trim();
  const flashId = (req.query?.flash_id || '').toString().trim();

  if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
    return json(res, 400, { error: 'Invalid or missing slug' });
  }
  if (!flashId || !uuidRegex.test(flashId)) {
    return json(res, 400, { error: 'Invalid or missing flash_id' });
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
    return json(res, 500, { error: 'Configuration serveur manquante' });
  }

  try {
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, nom_studio, slug_profil, deposit_percentage, stripe_account_id, stripe_onboarding_complete')
      .eq('slug_profil', slug)
      .single();

    if (artistError || !artist) {
      return json(res, 404, { error: 'Artiste introuvable' });
    }

    const { data: flash, error: flashError } = await supabase
      .from('flashs')
      .select('id, title, prix, duree_minutes, statut, stock_limit, stock_current')
      .eq('id', flashId)
      .eq('artist_id', artist.id)
      .single();

    if (flashError || !flash) {
      return json(res, 404, { error: 'Flash introuvable' });
    }
    if (flash.statut !== 'available') {
      return json(res, 400, { error: 'Ce flash n\'est plus disponible' });
    }
    if (flash.stock_current >= flash.stock_limit) {
      return json(res, 400, { error: 'Ce flash est épuisé' });
    }

    const depositPercentage = artist.deposit_percentage ?? 30;
    const depositAmount = Math.round((flash.prix * depositPercentage) / 100);

    return json(res, 200, {
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
    });
  } catch (err) {
    console.error('[artist-booking-info] Unexpected error:', err);
    return json(res, 500, { error: 'Une erreur est survenue' });
  }
}

/**
 * API: Annuler une réservation en statut "pending" (libère le créneau).
 * POST /api/cancel-pending-booking
 *
 * Utilisé quand le client quitte Stripe Checkout (cancel_url) ou quand
 * la création de la session Stripe échoue après create-booking.
 * Body: { booking_id: string }
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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  let body: { booking_id?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const bookingId = (body.booking_id ?? '').toString().trim();
  if (!bookingId || !uuidRegex.test(bookingId)) {
    return json(res, 400, { error: 'Invalid or missing booking_id' });
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
    return json(res, 500, { error: 'Configuration serveur manquante' });
  }

  try {
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, statut_booking')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      return json(res, 404, { error: 'Réservation introuvable' });
    }
    if (booking.statut_booking !== 'pending') {
      return json(res, 200, { success: true, message: 'Réservation déjà traitée' });
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
      return json(res, 500, { error: 'Impossible d\'annuler la réservation' });
    }

    return json(res, 200, { success: true });
  } catch (err) {
    console.error('[cancel-pending-booking] Unexpected error:', err);
    return json(res, 500, { error: 'Une erreur est survenue' });
  }
}

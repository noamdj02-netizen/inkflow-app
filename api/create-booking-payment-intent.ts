/**
 * API: Créer un PaymentIntent Stripe pour l'acompte d'une réservation (booking)
 * 
 * FLOW:
 * 1. Client valide le formulaire → booking créé (status: pending)
 * 2. Cette API génère un PaymentIntent Stripe pour l'acompte
 * 3. Webhook Stripe confirme le paiement → booking passe en confirmed
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

function json(res: any, status: number, body: unknown, headers?: Record<string, string>) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }
  res.end(JSON.stringify(body));
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CreateBookingPaymentIntentBody = {
  booking_id: string;
  return_url?: string; // URL de retour après paiement
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    // Variables d'environnement
    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const siteUrl = process.env.VITE_SITE_URL || process.env.SITE_URL || 'http://localhost:3000';

    // Parse body
    let body: CreateBookingPaymentIntentBody;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    const bookingId = (body.booking_id || '').toString().trim();
    if (!bookingId || !uuidRegex.test(bookingId)) {
      return json(res, 400, { error: 'Invalid or missing booking_id' });
    }

    // Initialiser Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Récupérer la réservation avec les infos de l'artiste
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        id,
        artist_id,
        flash_id,
        client_email,
        client_name,
        deposit_amount,
        prix_total,
        statut_paiement,
        statut_booking,
        artists!inner (
          id,
          nom_studio,
          stripe_account_id,
          stripe_onboarding_complete
        )
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return json(res, 404, { error: 'Réservation introuvable' });
    }

    // Type assertion pour artist (Supabase retourne un array dans les joins)
    const artist = Array.isArray(booking.artists) ? booking.artists[0] : booking.artists;
    if (!artist) {
      return json(res, 404, { error: 'Artiste introuvable pour cette réservation' });
    }

    // Vérifier que la réservation est en attente de paiement
    if (booking.statut_booking !== 'pending' || booking.statut_paiement !== 'pending') {
      return json(res, 400, {
        error: 'Cette réservation n\'est plus en attente de paiement',
        code: 'BOOKING_NOT_PENDING'
      });
    }

    // Vérifier que l'artiste a complété l'onboarding Stripe
    if (!artist.stripe_onboarding_complete || !artist.stripe_account_id) {
      return json(res, 400, {
        error: 'L\'artiste n\'a pas configuré son compte bancaire. Contactez-le directement.',
        code: 'STRIPE_ONBOARDING_INCOMPLETE'
      });
    }

    // Vérifier que le montant de l'acompte est valide
    if (!booking.deposit_amount || booking.deposit_amount <= 0) {
      return json(res, 400, {
        error: 'Montant d\'acompte invalide',
        code: 'INVALID_DEPOSIT_AMOUNT'
      });
    }

    // Initialiser Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    // Récupérer les infos du flash pour la description
    let flashTitle = 'Réservation';
    if (booking.flash_id) {
      const { data: flash } = await supabase
        .from('flashs')
        .select('title')
        .eq('id', booking.flash_id)
        .single();
      if (flash) {
        flashTitle = flash.title;
      }
    }

    // Créer le PaymentIntent avec Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: booking.deposit_amount, // Montant en centimes
      currency: 'eur',
      application_fee_amount: Math.round(booking.deposit_amount * 0.05), // 5% de commission (à ajuster selon votre modèle)
      transfer_data: {
        destination: artist.stripe_account_id, // Compte Stripe Connect de l'artiste
      },
      description: `Acompte - ${flashTitle} - ${artist.nom_studio}`,
      metadata: {
        booking_id: bookingId,
        artist_id: artist.id,
        artist_name: artist.nom_studio,
        client_email: booking.client_email,
        client_name: booking.client_name || '',
        flash_id: booking.flash_id || '',
        deposit_amount: booking.deposit_amount.toString(),
        prix_total: booking.prix_total.toString(),
        type: 'booking_deposit',
      },
      // Méthodes de paiement automatiques
      automatic_payment_methods: {
        enabled: true,
      },
      // URL de retour (pour mobile/web)
      return_url: body.return_url || `${siteUrl}/payment/success?booking_id=${bookingId}`,
    });

    // Mettre à jour la réservation avec l'ID du PaymentIntent
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        stripe_deposit_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking with payment intent:', updateError);
      // On continue quand même car le PaymentIntent est créé
    }

    return json(res, 200, {
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      booking_id: bookingId,
    });

  } catch (error: unknown) {
    console.error('Error creating booking payment intent:', error);

    const err = error as { type?: string; message?: string; code?: string };
    if (err?.type && String(err.type).startsWith('Stripe')) {
      return json(res, 400, {
        error: err.message || 'Erreur Stripe',
        code: err.code || 'STRIPE_ERROR',
      });
    }

    return json(res, 500, {
      error: 'Une erreur est survenue lors de la création du paiement. Réessayez.',
      code: 'INTERNAL_ERROR',
    });
  }
}

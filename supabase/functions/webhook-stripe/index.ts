// @ts-nocheck
// Supabase Edge Function pour gérer les webhooks Stripe
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

// Validate webhook secret is configured
if (!stripeWebhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not configured');
}

serve(async (req) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');

  // Step 1: Verify signature is present
  if (!signature) {
    console.error('Missing stripe-signature header');
    return new Response('No signature provided', { status: 400 });
  }

  // Step 2: Verify webhook secret is configured
  if (!stripeWebhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  try {
    // Step 3: Get raw body (must be raw string, not parsed JSON)
    const body = await req.text();
    
    if (!body || body.length === 0) {
      console.error('Empty request body');
      return new Response('Empty body', { status: 400 });
    }

    // Step 4: Verify Stripe signature using webhook secret
    // This will throw an error if signature is invalid
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );

    // Initialiser Supabase (une seule fois pour tous les événements)
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gérer les événements Stripe
    if (event.type === 'checkout.session.completed') {
      // Checkout Session (ancien flow)
      const session = event.data.object as any;
      const bookingId = session.metadata?.booking_id;

      if (bookingId) {
        // Mettre à jour le booking : acompte payé + réservation confirmée
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            statut_paiement: 'deposit_paid',
            statut_booking: 'confirmed',
            stripe_deposit_intent_id: session.payment_intent ?? session.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .eq('statut_booking', 'pending'); // Seulement si toujours pending (évite les doubles confirmations)

        if (updateError) {
          console.error('Error updating booking from checkout session:', updateError);
        } else {
          // Déclencher l'envoi des emails de façon asynchrone
          const functionsUrl = `${supabaseUrl}/functions/v1/send-booking-notifications`;
          fetch(functionsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ booking_id: bookingId }),
          }).catch((err) => console.error('send-booking-notifications trigger failed:', err));
        }
      }
    } else if (event.type === 'payment_intent.succeeded') {
      // PaymentIntent direct (nouveau flow pour bookings)
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata?.booking_id;
      const paymentType = paymentIntent.metadata?.type; // 'booking_deposit' ou autre

      if (bookingId && paymentType === 'booking_deposit') {
        // Vérifier que la réservation existe et est toujours en attente
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('id, statut_booking, statut_paiement')
          .eq('id', bookingId)
          .single();

        if (fetchError || !booking) {
          console.error('Booking not found for payment_intent.succeeded:', bookingId, fetchError);
        } else if (booking.statut_booking === 'pending' && booking.statut_paiement === 'pending') {
          // Mettre à jour le booking : acompte payé + réservation confirmée (transaction atomique)
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              statut_paiement: 'deposit_paid',
              statut_booking: 'confirmed',
              stripe_deposit_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', bookingId)
            .eq('statut_booking', 'pending') // Condition atomique : seulement si toujours pending
            .eq('statut_paiement', 'pending');

          if (updateError) {
            console.error('Error updating booking from payment_intent:', updateError);
          } else {
            // Enregistrer la transaction Stripe pour traçabilité
            await supabase
              .from('stripe_transactions')
              .insert({
                booking_id: bookingId,
                artist_id: paymentIntent.metadata?.artist_id || '',
                stripe_payment_intent_id: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency || 'eur',
                status: 'succeeded',
                payment_type: 'deposit',
              })
              .catch((err) => console.error('Error inserting stripe_transaction:', err));

            // Déclencher l'envoi des emails de façon asynchrone
            const functionsUrl = `${supabaseUrl}/functions/v1/send-booking-notifications`;
            fetch(functionsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({ booking_id: bookingId }),
            }).catch((err) => console.error('send-booking-notifications trigger failed:', err));
          }
        } else {
          console.log(`Booking ${bookingId} already processed (status: ${booking.statut_booking}, payment: ${booking.statut_paiement})`);
        }
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      // Gérer les échecs de paiement
      const paymentIntent = event.data.object as any;
      const bookingId = paymentIntent.metadata?.booking_id;

      if (bookingId) {
        // Marquer le paiement comme échoué (mais garder la réservation en pending pour réessayer)
        await supabase
          .from('bookings')
          .update({
            statut_paiement: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .eq('statut_booking', 'pending');
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Handle signature verification errors specifically
    if (error.type === 'StripeSignatureVerificationError') {
      console.error('Stripe signature verification failed:', error.message);
      return new Response('Invalid signature', { status: 401 });
    }
    
    // Handle other errors
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed', message: error.message }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});


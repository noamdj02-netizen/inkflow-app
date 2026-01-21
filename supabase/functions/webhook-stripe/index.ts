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

    // Gérer les événements Stripe
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const bookingId = session.metadata?.booking_id;

      if (bookingId) {
        // Mettre à jour le statut du booking dans Supabase
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        await supabase
          .from('bookings')
          .update({
            statut_paiement: 'deposit_paid',
            stripe_deposit_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bookingId);
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


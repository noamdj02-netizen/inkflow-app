/**
 * Vercel Serverless Function: Create Stripe Subscription Checkout Session
 * 
 * Route: POST /api/create-subscription-checkout
 * 
 * Crée une session Stripe Checkout pour un abonnement mensuel
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

type CreateSubscriptionCheckoutBody = {
  plan: 'STARTER' | 'PRO' | 'STUDIO';
  userId: string;
};

const STRIPE_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_ID_STARTER || '',
  PRO: process.env.STRIPE_PRICE_ID_PRO || '',
  STUDIO: process.env.STRIPE_PRICE_ID_STUDIO || '',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');

    let body: CreateSubscriptionCheckoutBody;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    // Validation
    if (!body.plan || !['STARTER', 'PRO', 'STUDIO'].includes(body.plan)) {
      return json(res, 400, { error: 'Invalid plan. Must be STARTER, PRO, or STUDIO' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!body.userId || typeof body.userId !== 'string' || !uuidRegex.test(body.userId)) {
      return json(res, 400, { error: 'Invalid or missing userId' });
    }

    const priceId = STRIPE_PRICE_IDS[body.plan];
    if (!priceId) {
      return json(res, 500, { error: `Price ID not configured for plan ${body.plan}` });
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', body.userId)
      .single();

    if (userError || !user) {
      return json(res, 404, { error: 'User not found' });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    });

    // Récupérer ou créer le Stripe Customer
    let customerId: string;
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', body.userId)
      .single();

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id;
    } else {
      // Créer un nouveau customer Stripe
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: body.userId,
        },
      });
      customerId = customer.id;

      // Sauvegarder le customer ID dans Supabase
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', body.userId);
    }

    // Obtenir l'URL de base
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;

    // Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: body.userId,
        plan: body.plan,
      },
      subscription_data: {
        metadata: {
          userId: body.userId,
          plan: body.plan,
        },
      },
      success_url: `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe?canceled=true`,
    });

    return json(res, 200, {
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Error creating subscription checkout:', error);
    return json(res, 500, {
      error: error.message || 'Failed to create subscription checkout',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

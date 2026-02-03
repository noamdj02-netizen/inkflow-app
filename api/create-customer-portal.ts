/**
 * Vercel Serverless Function: Create Stripe Customer Portal Session
 * 
 * Route: POST /api/create-customer-portal
 * 
 * Crée une session Stripe Customer Portal pour gérer l'abonnement
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

type CreateCustomerPortalBody = {
  userId: string;
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');

    let body: CreateCustomerPortalBody;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    // Validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!body.userId || typeof body.userId !== 'string' || !uuidRegex.test(body.userId)) {
      return json(res, 400, { error: 'Invalid or missing userId' });
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Récupérer le customer ID Stripe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', body.userId)
      .single();

    if (userError || !user) {
      return json(res, 404, { error: 'User not found' });
    }

    if (!user.stripe_customer_id) {
      return json(res, 400, { error: 'No Stripe customer ID found. Please subscribe first.' });
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Obtenir l'URL de base
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;

    // Créer la session Customer Portal
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return json(res, 200, {
      success: true,
      url: portalSession.url,
    });

  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return json(res, 500, {
      error: error.message || 'Failed to create customer portal session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

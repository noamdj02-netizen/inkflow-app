/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 * 
 * Route: POST /api/create-checkout-session
 * 
 * ⚠️ IMPORTANT : Ce projet utilise Vite + Vercel Serverless Functions, pas Next.js
 * 
 * Pour Next.js App Router, ce fichier serait dans :
 * app/api/create-checkout-session/route.ts
 * 
 * Pour Vercel Serverless Functions, il est dans :
 * api/create-checkout-session/route.ts
 */

import { getStripeServer, toStripeAmount } from '../../utils/stripe/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to send JSON response
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

type CreateCheckoutSessionBody = {
  priceId: string; // Stripe Price ID (e.g., price_xxx)
  userId: string; // Supabase user ID (UUID)
  successUrl?: string; // Optional custom success URL
  cancelUrl?: string; // Optional custom cancel URL
  metadata?: Record<string, string>; // Optional metadata
};

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    // Get environment variables
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    
    // Parse request body (Vercel can send string or pre-parsed object)
    let body: CreateCheckoutSessionBody;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    // Validate required fields and formats
    if (!body.priceId || typeof body.priceId !== 'string' || body.priceId.length > 200) {
      return json(res, 400, { error: 'Invalid or missing priceId' });
    }
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

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('artists') // or 'users' depending on your schema
      .select('id, email')
      .eq('id', body.userId)
      .single();

    if (userError || !user) {
      return json(res, 404, { error: 'User not found' });
    }

    // Initialize Stripe
    const stripe = getStripeServer();

    // Get origin for redirect URLs
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:3000';
    const baseUrl = process.env.SITE_URL || origin;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // or 'payment' for one-time payments
      payment_method_types: ['card'],
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email || undefined,
      client_reference_id: body.userId,
      metadata: {
        userId: body.userId,
        ...body.metadata,
      },
      success_url: body.successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: body.cancelUrl || `${baseUrl}/payment/cancel`,
    });

    return json(res, 200, {
      success: true,
      sessionId: session.id,
      url: session.url,
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    
    return json(res, 500, {
      error: error.message || 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

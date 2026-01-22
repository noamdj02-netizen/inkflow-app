import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { calculateApplicationFee, getPlanLimits } from '../config/subscriptions';
import type { PlanType } from '../config/subscriptions';

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

type CreateFlashCheckoutBody = {
  flash_id: string;
  client_email?: string; // Optionnel, pour pré-remplir l'email dans Stripe Checkout
  client_name?: string; // Optionnel
};

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    // Get environment variables
    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY') || requireEnv('SUPABASE_ANON_KEY');
    
    // Parse request body
    let body: CreateFlashCheckoutBody;
    try {
      body = JSON.parse(req.body || '{}');
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    // Validate required fields
    if (!body.flash_id) {
      return json(res, 400, { 
        error: 'Missing required field: flash_id' 
      });
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch the flash with artist information
    const { data: flash, error: flashError } = await supabase
      .from('flashs')
      .select(`
        id,
        title,
        prix,
        deposit_amount,
        statut,
        stock_limit,
        stock_current,
        artist_id,
        artists!inner (
          id,
          email,
          nom_studio,
          stripe_account_id,
          stripe_onboarding_complete,
          user_plan,
          deposit_percentage
        )
      `)
      .eq('id', body.flash_id)
      .single();

    if (flashError || !flash) {
      console.error('Error fetching flash:', flashError);
      return json(res, 404, { error: 'Flash not found' });
    }

    // Type assertion for artist (Supabase returns it as an array in join queries)
    const artist = Array.isArray(flash.artists) ? flash.artists[0] : flash.artists;
    
    if (!artist) {
      return json(res, 404, { error: 'Artist not found for this flash' });
    }

    // Check if flash is available
    if (flash.statut !== 'available') {
      return json(res, 400, { 
        error: 'This flash is no longer available',
        code: 'FLASH_NOT_AVAILABLE'
      });
    }

    // Check stock availability
    if (flash.stock_current >= flash.stock_limit) {
      return json(res, 400, { 
        error: 'This flash is sold out',
        code: 'FLASH_SOLD_OUT'
      });
    }

    // Check if artist has completed Stripe onboarding
    if (!artist.stripe_onboarding_complete || !artist.stripe_account_id) {
      return json(res, 400, { 
        error: 'Artist has not completed Stripe Connect onboarding. Please contact the artist directly.',
        code: 'STRIPE_ONBOARDING_INCOMPLETE'
      });
    }

    // Calculate deposit amount
    // If deposit_amount is set on the flash, use it; otherwise calculate from prix * deposit_percentage
    let depositAmount: number;
    if (flash.deposit_amount !== null && flash.deposit_amount !== undefined) {
      depositAmount = flash.deposit_amount;
    } else {
      const depositPercentage = artist.deposit_percentage || 30; // Default 30%
      depositAmount = Math.round((flash.prix * depositPercentage) / 100);
    }

    if (depositAmount <= 0) {
      return json(res, 400, { 
        error: 'Invalid deposit amount calculated' 
      });
    }

    // Get the plan type (default to FREE if not set)
    const plan: PlanType = (artist.user_plan as PlanType) || 'FREE';

    // Calculate application fee (commission) based on plan
    const applicationFeeAmount = calculateApplicationFee(depositAmount, plan);

    // Get the origin from request headers (for redirect URLs)
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || origin;

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    // Create Checkout Session with Connect
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Acompte - ${flash.title}`,
              description: `Réservation du flash "${flash.title}"`,
            },
            unit_amount: depositAmount, // Deposit amount in centimes
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount, // Commission in centimes
        transfer_data: {
          destination: artist.stripe_account_id, // Stripe Connect account ID
        },
        metadata: {
          flash_id: flash.id,
          artist_id: artist.id,
          artist_email: artist.email,
          flash_title: flash.title,
          plan: plan,
          commission_rate: planLimits.commissionRate.toString(),
          application_fee: applicationFeeAmount.toString(),
        },
      },
      customer_email: body.client_email || undefined,
      metadata: {
        flash_id: flash.id,
        artist_id: artist.id,
        artist_email: artist.email,
        flash_title: flash.title,
        type: 'flash_booking',
        plan: plan,
      },
      success_url: `${baseUrl}/pay/success?session_id={CHECKOUT_SESSION_ID}&flash_id=${flash.id}`,
      cancel_url: `${baseUrl}/pay/${flash.id}?canceled=true`,
    });

    return json(res, 200, {
      success: true,
      url: session.url,
      sessionId: session.id,
      depositAmount: depositAmount,
      applicationFee: applicationFeeAmount,
      commissionRate: planLimits.commissionRate,
      plan: plan,
    });

  } catch (error: any) {
    console.error('Error creating flash checkout session:', error);
    
    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      return json(res, 400, {
        error: error.message || 'Stripe API error',
        code: error.code || 'STRIPE_ERROR',
      });
    }

    return json(res, 500, {
      error: error.message || 'Failed to create checkout session',
    });
  }
}

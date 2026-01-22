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

type CreatePaymentIntentBody = {
  project_id: string;
  amount: number; // Amount in centimes (e.g., 3000 = 30€)
  description?: string;
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
    let body: CreatePaymentIntentBody;
    try {
      body = JSON.parse(req.body || '{}');
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    // Validate required fields
    if (!body.project_id || !body.amount) {
      return json(res, 400, { 
        error: 'Missing required fields: project_id and amount are required' 
      });
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return json(res, 400, { 
        error: 'Invalid amount: must be a positive number in centimes' 
      });
    }

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Fetch the project with artist information
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        artist_id,
        client_email,
        client_name,
        description,
        artist_quoted_price,
        deposit_paid,
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
      .eq('id', body.project_id)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return json(res, 404, { error: 'Project not found' });
    }

    // Type assertion for artist (Supabase returns it as an array in join queries)
    const artist = Array.isArray(project.artists) ? project.artists[0] : project.artists;
    
    if (!artist) {
      return json(res, 404, { error: 'Artist not found for this project' });
    }

    // Check if artist has completed Stripe onboarding
    if (!artist.stripe_onboarding_complete || !artist.stripe_account_id) {
      return json(res, 400, { 
        error: 'Artist has not completed Stripe Connect onboarding. Please configure bank account in settings.',
        code: 'STRIPE_ONBOARDING_INCOMPLETE'
      });
    }

    // Validate that deposit hasn't already been paid
    if (project.deposit_paid) {
      return json(res, 400, { 
        error: 'Deposit has already been paid for this project' 
      });
    }

    // Get the plan type (default to FREE if not set)
    const plan: PlanType = (artist.user_plan as PlanType) || 'FREE';

    // Calculate application fee (commission) based on plan
    const applicationFeeAmount = calculateApplicationFee(body.amount, plan);

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
    });

    // Create Payment Intent with Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: body.amount, // Total amount in centimes
      currency: 'eur',
      application_fee_amount: applicationFeeAmount, // Commission in centimes
      transfer_data: {
        destination: artist.stripe_account_id, // Stripe Connect account ID
      },
      description: body.description || `Acompte pour projet - ${project.description?.substring(0, 50) || 'Projet personnalisé'}`,
      metadata: {
        project_id: body.project_id,
        artist_id: artist.id,
        artist_email: artist.email,
        client_email: project.client_email,
        client_name: project.client_name || '',
        plan: plan,
        commission_rate: planLimits.commissionRate.toString(),
        application_fee: applicationFeeAmount.toString(),
      },
      // Optional: Set automatic payment methods
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return json(res, 200, {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      applicationFee: applicationFeeAmount,
      commissionRate: planLimits.commissionRate,
      plan: plan,
    });

  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    
    // Handle Stripe-specific errors
    if (error.type && error.type.startsWith('Stripe')) {
      return json(res, 400, {
        error: error.message || 'Stripe API error',
        code: error.code || 'STRIPE_ERROR',
      });
    }

    return json(res, 500, {
      error: error.message || 'Failed to create payment intent',
    });
  }
}

/**
 * Vercel Serverless Function for Stripe Connect Onboarding
 * 
 * This function creates a Stripe Connect Express account and returns an onboarding link.
 * 
 * Requirements:
 * - Must be deployed on Vercel (doesn't work in local development)
 * - Environment variables must be set in Vercel Dashboard
 * 
 * @see docs/TROUBLESHOOTING_STRIPE_CONNECT.md for troubleshooting
 */

import Stripe from 'stripe';
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

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    // Get environment variables with better error messages
    let stripeSecretKey: string;
    let supabaseUrl: string;
    let supabaseServiceKey: string;
    
    try {
      stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
    } catch (e) {
      console.error('Missing STRIPE_SECRET_KEY');
      return json(res, 500, { 
        error: 'Configuration serveur manquante: STRIPE_SECRET_KEY. Vérifiez les variables d\'environnement dans Vercel.' 
      });
    }
    
    try {
      supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
      if (!supabaseUrl) {
        throw new Error('Missing Supabase URL');
      }
    } catch (e) {
      console.error('Missing VITE_SUPABASE_URL or SUPABASE_URL');
      return json(res, 500, { 
        error: 'Configuration serveur manquante: VITE_SUPABASE_URL ou SUPABASE_URL. Vérifiez les variables d\'environnement dans Vercel.' 
      });
    }
    
    try {
      supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY') || requireEnv('SUPABASE_ANON_KEY');
      if (!supabaseServiceKey) {
        throw new Error('Missing Supabase Service Key');
      }
    } catch (e) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY');
      return json(res, 500, { 
        error: 'Configuration serveur manquante: SUPABASE_SERVICE_ROLE_KEY. Vérifiez les variables d\'environnement dans Vercel.' 
      });
    }
    
    // Get authorization token from request
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json(res, 401, { error: 'Missing or invalid authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Initialize Supabase with service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json(res, 401, { error: 'Invalid or expired session' });
    }
    
    // Get the artist profile
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, email, stripe_account_id, stripe_onboarding_complete')
      .eq('id', user.id)
      .single();
    
    if (artistError || !artist) {
      return json(res, 404, { error: 'Artist profile not found' });
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    });
    
    let accountId = artist.stripe_account_id;
    
    // If no Stripe account exists, create one
    if (!accountId) {
      try {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'FR', // Default to France, can be made configurable
          email: artist.email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
        });
        
        accountId = account.id;
      } catch (accountError: any) {
        // Handle specific Stripe Connect errors
        if (accountError?.message?.includes('losses') || accountError?.message?.includes('platform-profile')) {
          console.error('Stripe Connect platform configuration error:', accountError);
          return json(res, 400, {
            error: 'Configuration Stripe Connect requise',
            code: 'STRIPE_CONNECT_CONFIG_REQUIRED',
            message: 'Veuillez configurer les responsabilités de gestion des pertes dans votre compte Stripe Dashboard avant de créer des comptes connectés.',
            helpUrl: 'https://dashboard.stripe.com/settings/connect/platform-profile',
          });
        }
        // Re-throw other errors
        throw accountError;
      }
      
      // Save the account ID to the database
      const { error: updateError } = await supabase
        .from('artists')
        .update({
          stripe_account_id: accountId,
          stripe_connected: false,
          stripe_onboarding_complete: false,
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating artist with Stripe account ID:', updateError);
        return json(res, 500, { error: 'Failed to save Stripe account' });
      }
    }
    
    // Get the origin from request headers (for redirect URLs)
    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || origin;
    
    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/dashboard/settings?stripe_refresh=true`,
      return_url: `${baseUrl}/api/stripe-connect-callback?account_id=${accountId}`,
      type: 'account_onboarding',
    });
    
    return json(res, 200, {
      success: true,
      url: accountLink.url,
      accountId: accountId,
    });
    
  } catch (error: any) {
    console.error('Stripe Connect onboarding error:', error);
    
    // Handle specific Stripe Connect configuration errors
    if (error?.message?.includes('losses') || error?.message?.includes('platform-profile')) {
      return json(res, 400, {
        error: 'Configuration Stripe Connect requise',
        code: 'STRIPE_CONNECT_CONFIG_REQUIRED',
        message: 'Veuillez configurer les responsabilités de gestion des pertes dans votre compte Stripe Dashboard avant de créer des comptes connectés.',
        helpUrl: 'https://dashboard.stripe.com/settings/connect/platform-profile',
      });
    }
    
    // Ensure we always return valid JSON, even on unexpected errors
    const errorMessage = error?.message || 'Failed to create Stripe Connect onboarding link';
    
    // Log full error for debugging
    if (error?.stack) {
      console.error('Error stack:', error.stack);
    }
    
    return json(res, 500, {
      error: errorMessage,
      code: error?.code || 'UNKNOWN_ERROR',
    });
  }
}

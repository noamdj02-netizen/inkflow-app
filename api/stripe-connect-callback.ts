import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v.trim();
}

export default async function handler(req: any, res: any) {
  // Only allow GET requests (redirect from Stripe)
  if (req.method !== 'GET') {
    res.status(405).setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY') || requireEnv('SUPABASE_ANON_KEY');
    
    // Get account_id from query params
    const accountId = req.query.account_id as string;
    if (!accountId) {
      return res.redirect('/dashboard/settings?error=missing_account_id');
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    });
    
    // Retrieve the account to check onboarding status
    const account = await stripe.accounts.retrieve(accountId);
    
    // Check if onboarding is complete
    const isComplete = account.charges_enabled && account.details_submitted;
    
    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Find the artist by stripe_account_id
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('stripe_account_id', accountId)
      .single();
    
    if (!artistError && artist) {
      // Update the artist's Stripe status
      await supabase
        .from('artists')
        .update({
          stripe_connected: isComplete,
          stripe_onboarding_complete: isComplete,
        })
        .eq('id', artist.id);
    }
    
    // Redirect back to settings with status
    if (isComplete) {
      return res.redirect('/dashboard/settings?stripe_success=true');
    } else {
      return res.redirect('/dashboard/settings?stripe_incomplete=true');
    }
    
  } catch (error: any) {
    console.error('Stripe Connect callback error:', error);
    return res.redirect('/dashboard/settings?error=callback_failed');
  }
}

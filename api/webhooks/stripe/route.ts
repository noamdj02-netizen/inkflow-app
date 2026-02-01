/**
 * Vercel Serverless Function: Stripe Webhook Handler
 * 
 * Route: POST /api/webhooks/stripe
 * 
 * ⚠️ IMPORTANT : Ce projet utilise Vite + Vercel Serverless Functions, pas Next.js
 * 
 * Pour Next.js App Router, ce fichier serait dans :
 * app/api/webhooks/stripe/route.ts
 * 
 * Pour Vercel Serverless Functions, il est dans :
 * api/webhooks/stripe/route.ts
 * 
 * SECURITY: This endpoint verifies the webhook signature from Stripe
 * to ensure the request is legitimate.
 */

import { getStripeServer, getWebhookSecret, verifyWebhookSignature } from '../../../utils/stripe/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

// Helper function to send JSON response
function json(res: any, status: number, body: unknown) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
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
    // Get webhook secret
    const webhookSecret = getWebhookSecret();
    
    // Get Stripe signature from headers
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      console.error('Missing stripe-signature header');
      return json(res, 400, { error: 'Missing stripe-signature header' });
    }

    // Get raw body (important: must be raw string for signature verification)
    // Vercel Serverless Functions: req.body might be a Buffer or string
    let rawBody: string;
    
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (req.body) {
      // If body is already parsed as JSON, we need to reconstruct it
      // This is not ideal for webhook signature verification
      // In production, ensure Vercel doesn't parse the body
      rawBody = JSON.stringify(req.body);
    } else {
      // Try to read from req if available
      rawBody = '';
    }
    
    // For Vercel, we might need to configure the function to not parse the body
    // Add this to vercel.json or use a different approach

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err);
      return json(res, 400, { error: `Webhook signature verification failed: ${err.message}` });
    }

    // Initialize Supabase
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get userId from metadata or client_reference_id
        const userId = session.metadata?.userId || session.client_reference_id;
        
        if (!userId) {
          console.error('No userId found in checkout session');
          return json(res, 400, { error: 'No userId found in checkout session' });
        }

        // Update user to Premium status
        // Calculate premium until date (30 days from now, adjust based on your subscription)
        const premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
        
        const { error: updateError } = await supabase
          .from('artists') // or 'users' depending on your schema
          .update({
            is_premium: true,
            premium_until: premiumUntil,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string || null,
            stripe_subscription_status: session.subscription ? 'active' : null,
            user_plan: 'pro', // Adjust based on your priceId mapping
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user:', updateError);
          return json(res, 500, { error: 'Failed to update user status' });
        }

        // Optionally: Create a record in a subscriptions/transactions table
        const { error: subscriptionError } = await supabase
          .from('stripe_transactions') // Adjust table name
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            stripe_customer_id: session.customer as string,
            amount: session.amount_total || 0,
            currency: session.currency || 'eur',
            status: 'completed',
            created_at: new Date().toISOString(),
          });

        if (subscriptionError) {
          console.error('Error creating subscription record:', subscriptionError);
          // Don't fail the webhook if this fails, just log it
        }

        console.log(`✅ User ${userId} upgraded to Premium via session ${session.id}`);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number; current_period_start?: number };
        const customerId = subscription.customer as string;
        
        // Get user by Stripe customer ID (if you store it)
        // Or use metadata
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          // Update artists table
          const { error: artistError } = await supabase
            .from('artists')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              stripe_subscription_status: subscription.status,
              is_premium: subscription.status === 'active',
              premium_until: subscription.current_period_end 
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (artistError) {
            console.error('Error updating artist subscription:', artistError);
          }

          // Create/update subscription record
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: customerId,
              stripe_price_id: subscription.items.data[0]?.price.id || null,
              status: subscription.status,
              current_period_start: subscription.current_period_start
                ? new Date(subscription.current_period_start * 1000).toISOString()
                : null,
              current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              canceled_at: subscription.canceled_at
                ? new Date(subscription.canceled_at * 1000).toISOString()
                : null,
              metadata: subscription.metadata || {},
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'stripe_subscription_id',
            });

          if (subscriptionError) {
            console.error('Error upserting subscription:', subscriptionError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription & { current_period_end?: number; current_period_start?: number };
        const userId = subscription.metadata?.userId;
        
        if (userId) {
          // Update artists table
          const { error: artistError } = await supabase
            .from('artists')
            .update({
              is_premium: false,
              stripe_subscription_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          if (artistError) {
            console.error('Error canceling artist subscription:', artistError);
          }

          // Update subscription record
          const { error: subscriptionError } = await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscription.id);

          if (subscriptionError) {
            console.error('Error updating subscription record:', subscriptionError);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success to Stripe
    return json(res, 200, { received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    
    return json(res, 500, {
      error: error.message || 'Webhook processing failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

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

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Si c'est un abonnement (mode: subscription)
        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.userId;
          const plan = session.metadata?.plan as 'STARTER' | 'PRO' | 'STUDIO' | undefined;
          
          if (!userId) {
            console.error('No userId found in checkout session metadata');
            break;
          }

          // Récupérer la subscription complète depuis Stripe
          const stripe = getStripeServer();
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          // Mapper le statut Stripe vers notre enum
          const statusMap: Record<string, string> = {
            'active': 'active',
            'trialing': 'trialing',
            'past_due': 'past_due',
            'canceled': 'canceled',
            'cancelled': 'canceled',
            'incomplete': 'incomplete',
            'incomplete_expired': 'incomplete_expired',
            'unpaid': 'unpaid',
          };
          
          const subscriptionStatus = statusMap[subscription.status] || 'canceled';
          
          // Mapper le plan depuis le price ID ou metadata
          let subscriptionPlan = plan;
          if (!subscriptionPlan) {
            const priceId = subscription.items.data[0]?.price.id;
            const priceIdMap: Record<string, string> = {
              [process.env.STRIPE_PRICE_ID_STARTER || '']: 'STARTER',
              [process.env.STRIPE_PRICE_ID_PRO || '']: 'PRO',
              [process.env.STRIPE_PRICE_ID_STUDIO || '']: 'STUDIO',
            };
            subscriptionPlan = priceIdMap[priceId || ''] as 'STARTER' | 'PRO' | 'STUDIO' | undefined;
          }

          // Mettre à jour la table users
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_plan: subscriptionPlan || null,
              subscription_status: subscriptionStatus,
              subscription_current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating user subscription:', updateError);
          } else {
            console.log(`✅ Subscription created/updated for user ${userId}: ${subscriptionPlan} (${subscriptionStatus})`);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;
        
        if (!userId) {
          // Essayer de trouver l'utilisateur par customer_id
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();
          
          if (!user) {
            console.error('No userId found for subscription:', subscription.id);
            break;
          }
          
          // Mapper le statut et le plan
          const statusMap: Record<string, string> = {
            'active': 'active',
            'trialing': 'trialing',
            'past_due': 'past_due',
            'canceled': 'canceled',
            'cancelled': 'canceled',
            'incomplete': 'incomplete',
            'incomplete_expired': 'incomplete_expired',
            'unpaid': 'unpaid',
          };
          
          const subscriptionStatus = statusMap[subscription.status] || 'canceled';
          
          // Déterminer le plan depuis le price ID
          const priceId = subscription.items.data[0]?.price.id;
          const priceIdMap: Record<string, string> = {
            [process.env.STRIPE_PRICE_ID_STARTER || '']: 'STARTER',
            [process.env.STRIPE_PRICE_ID_PRO || '']: 'PRO',
            [process.env.STRIPE_PRICE_ID_STUDIO || '']: 'STUDIO',
          };
          const subscriptionPlan = priceIdMap[priceId || ''] || subscription.metadata?.plan;

          // Mettre à jour la table users
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_plan: subscriptionPlan || null,
              subscription_status: subscriptionStatus,
              subscription_current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating user subscription:', updateError);
          } else {
            console.log(`✅ Subscription ${event.type} for user ${user.id}: ${subscriptionPlan} (${subscriptionStatus})`);
          }
        } else {
          // Même logique si userId est dans metadata
          const statusMap: Record<string, string> = {
            'active': 'active',
            'trialing': 'trialing',
            'past_due': 'past_due',
            'canceled': 'canceled',
            'cancelled': 'canceled',
            'incomplete': 'incomplete',
            'incomplete_expired': 'incomplete_expired',
            'unpaid': 'unpaid',
          };
          
          const subscriptionStatus = statusMap[subscription.status] || 'canceled';
          
          const priceId = subscription.items.data[0]?.price.id;
          const priceIdMap: Record<string, string> = {
            [process.env.STRIPE_PRICE_ID_STARTER || '']: 'STARTER',
            [process.env.STRIPE_PRICE_ID_PRO || '']: 'PRO',
            [process.env.STRIPE_PRICE_ID_STUDIO || '']: 'STUDIO',
          };
          const subscriptionPlan = priceIdMap[priceId || ''] || subscription.metadata?.plan;

          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              subscription_plan: subscriptionPlan || null,
              subscription_status: subscriptionStatus,
              subscription_current_period_end: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toISOString()
                : null,
            })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating user subscription:', updateError);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const customerId = subscription.customer as string;
        
        // Trouver l'utilisateur par userId ou customerId
        let targetUserId = userId;
        if (!targetUserId) {
          const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();
          
          if (user) {
            targetUserId = user.id;
          }
        }
        
        if (targetUserId) {
          // Mettre à jour la table users
          const { error: updateError } = await supabase
            .from('users')
            .update({
              subscription_status: 'canceled',
              subscription_current_period_end: null,
            })
            .eq('id', targetUserId);

          if (updateError) {
            console.error('Error canceling user subscription:', updateError);
          } else {
            console.log(`✅ Subscription canceled for user ${targetUserId}`);
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

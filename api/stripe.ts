/**
 * Vercel Serverless Function: Unified Stripe API Handler
 * 
 * Route: POST /api/stripe
 * 
 * Cette route unifie toutes les actions Stripe pour réduire le nombre de Serverless Functions.
 * Utilise le paramètre "action" dans le body pour dispatcher vers la bonne logique.
 * 
 * Actions supportées:
 * - subscription-checkout: Créer une session Checkout pour abonnement
 * - customer-portal: Créer une session Customer Portal
 * - checkout-session: Créer une session Checkout générique
 * - flash-checkout: Créer une session Checkout pour flash
 * - payment-intent: Créer un PaymentIntent pour projet
 * - booking-payment-intent: Créer un PaymentIntent pour réservation
 * - connect-onboard: Créer un compte Stripe Connect et lien onboarding
 * - connect-callback: Callback après onboarding Stripe Connect
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getStripeServer, toStripeAmount } from '../utils/stripe/server';

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

type StripeActionBody = {
  action: 'subscription-checkout' | 'customer-portal' | 'checkout-session' | 'flash-checkout' | 'payment-intent' | 'booking-payment-intent' | 'connect-onboard' | 'connect-callback';
  // Pour subscription-checkout
  plan?: 'STARTER' | 'PRO' | 'STUDIO';
  userId?: string;
  // Pour customer-portal
  // userId déjà défini ci-dessus
  // Pour checkout-session
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
  // Pour flash-checkout
  flash_id?: string;
  client_email?: string;
  client_name?: string;
  // Pour payment-intent
  project_id?: string;
  amount?: number;
  description?: string;
  // Pour booking-payment-intent
  booking_id?: string;
  // Pour connect-onboard
  // userId déjà défini ci-dessus
  // Pour connect-callback
  account_id?: string;
};

const STRIPE_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_ID_STARTER || 'price_1SwmmH5JVD1yZUQvapWip4ds',
  PRO: process.env.STRIPE_PRICE_ID_PRO || 'price_1Swmmj5JVD1yZUQvJXiZN5F2',
  STUDIO: process.env.STRIPE_PRICE_ID_STUDIO || 'price_1Swmn35JVD1yZUQvg8ZIGyJk',
};

/** Email admin : bypass Stripe, accès PRO direct. */
const ADMIN_EMAIL_STRICT = 'noamdj02@gmail.com';

/** Emails additionnels (env) pour bypass. */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export default async function handler(req: any, res: any) {
  // CORS preflight : permettre POST depuis n'importe quelle origine (proxy dev, PWA, etc.)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Le callback Stripe Connect peut être appelé en GET avec query params
  if (req.method === 'GET' && req.query?.account_id) {
    try {
      const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');
      const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
      const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2026-01-28.clover',
      });

      const accountId = req.query.account_id as string;
      const account = await stripe.accounts.retrieve(accountId);
      const detailsSubmitted = account.details_submitted;
      const chargesEnabled = account.charges_enabled;

      const { data: artist } = await supabase
        .from('artists')
        .select('id')
        .eq('stripe_account_id', accountId)
        .single();

      if (artist) {
        await supabase
          .from('artists')
          .update({
            stripe_onboarding_complete: detailsSubmitted && chargesEnabled,
          })
          .eq('id', artist.id);
      }

      const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
      const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;
      
      // Rediriger vers le dashboard avec le statut
      const redirectUrl = `${baseUrl}/dashboard/settings?stripe_success=${detailsSubmitted && chargesEnabled}`;
      res.writeHead(302, { Location: redirectUrl });
      res.end();
      return;
    } catch (error: any) {
      console.error('Stripe Connect callback error:', error);
      const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
      const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;
      res.writeHead(302, { Location: `${baseUrl}/dashboard/settings?stripe_incomplete=true` });
      res.end();
      return;
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return json(res, 405, { error: 'Method not allowed. Use POST for this endpoint.' });
  }

  try {
    const supabaseUrl = requireEnv('VITE_SUPABASE_URL') || requireEnv('SUPABASE_URL');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
    const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY');

    let body: StripeActionBody;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    } catch {
      return json(res, 400, { error: 'Invalid JSON body' });
    }

    if (!body.action) {
      return json(res, 400, { error: 'Missing required field: action' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2026-01-28.clover',
    });

    const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/') || 'http://localhost:5173';
    const baseUrl = process.env.SITE_URL || process.env.VITE_SITE_URL || origin;

    // Dispatch selon l'action
    switch (body.action) {
      case 'subscription-checkout': {
        if (!body.plan || !['STARTER', 'PRO', 'STUDIO'].includes(body.plan)) {
          return json(res, 400, { error: 'Invalid plan. Must be STARTER, PRO, or STUDIO' });
        }
        if (!body.userId) {
          return json(res, 400, { error: 'Missing userId' });
        }

        const priceId = STRIPE_PRICE_IDS[body.plan];
        if (!priceId) {
          return json(res, 500, { error: `Price ID not configured for plan ${body.plan}` });
        }

        // ——— 1. RÉCUPÉRATION AUTH (obligatoire) ———
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(body.userId);
        if (authError || !authData?.user) {
          return json(res, 401, {
            error: 'Non connecté ou session expirée. Reconnectez-vous.',
            code: 'AUTH_REQUIRED',
          });
        }
        const authUser = authData.user;
        const authEmail = (authUser.email || '').trim().toLowerCase();
        const authName =
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name as string) ||
          (authEmail ? authEmail.split('@')[0] : '') ||
          'Utilisateur';
        const safeName = authName.slice(0, 255) || 'Utilisateur';

        // ——— 2. ADMIN BYPASS (priorité absolue) — pas de Stripe ———
        const isAdmin =
          authEmail === ADMIN_EMAIL_STRICT || getAdminEmails().includes(authEmail);
        if (isAdmin) {
          const { error: upsertErr } = await supabase
            .from('users')
            .upsert(
              {
                id: authUser.id,
                email: authUser.email || authEmail,
                name: safeName,
                subscription_status: 'active',
                subscription_plan: 'PRO',
                subscription_current_period_end: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000
                ).toISOString(),
              } as never,
              { onConflict: 'id' }
            );
          if (upsertErr) {
            console.error('[stripe] Admin bypass upsert failed:', upsertErr);
            return json(res, 500, { error: 'Échec activation admin' });
          }
          return json(res, 200, {
            success: true,
            bypassPayment: true,
            redirectUrl: `${baseUrl}/dashboard`,
          });
        }

        // ——— 3. FIX "USER NOT FOUND" — upsert garanti (jamais findUnique) ———
        const { data: dbUser, error: upsertErr } = await supabase
          .from('users')
          .upsert(
            {
              id: authUser.id,
              email: authUser.email || authEmail || '',
              name: safeName,
            } as never,
            { onConflict: 'id' }
          )
          .select('id, email, stripe_customer_id')
          .single();

        if (upsertErr || !dbUser) {
          console.error('[stripe] User upsert failed:', upsertErr);
          return json(res, 500, { error: 'Impossible de créer ou récupérer votre compte.' });
        }

        const user = dbUser as { id: string; email: string | null; stripe_customer_id: string | null };

        // ——— 4. SUITE LOGIQUE STRIPE ———
        let customerId: string;
        if (user.stripe_customer_id) {
          customerId = user.stripe_customer_id;
        } else {
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            metadata: { userId: body.userId },
          });
          customerId = customer.id;
          await supabase
            .from('users')
            .update({ stripe_customer_id: customerId } as Record<string, unknown>)
            .eq('id', body.userId);
        }

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: { userId: body.userId, plan: body.plan },
          subscription_data: { metadata: { userId: body.userId, plan: body.plan } },
          success_url: `${baseUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/subscribe?canceled=true`,
        });

        return json(res, 200, { success: true, sessionId: session.id, url: session.url });
      }

      case 'customer-portal': {
        if (!body.userId) {
          return json(res, 400, { error: 'Missing userId' });
        }

        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(body.userId);
        if (authError || !authData?.user) {
          return json(res, 401, {
            error: 'Non connecté ou session expirée. Reconnectez-vous.',
            code: 'AUTH_REQUIRED',
          });
        }
        const authUser = authData.user;
        const authEmail = (authUser.email || '').trim().toLowerCase();
        const authName =
          (authUser.user_metadata?.full_name as string) ||
          (authUser.user_metadata?.name as string) ||
          (authEmail ? authEmail.split('@')[0] : '') ||
          'Utilisateur';

        const { data: dbUser } = await supabase
          .from('users')
          .upsert(
            {
              id: authUser.id,
              email: authUser.email || authEmail || '',
              name: (authName as string).slice(0, 255) || 'Utilisateur',
            } as never,
            { onConflict: 'id' }
          )
          .select('stripe_customer_id')
          .single();

        if (!dbUser?.stripe_customer_id) {
          return json(res, 400, { error: 'Aucun abonnement Stripe. Souscrivez d\'abord à un plan.' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: (dbUser as { stripe_customer_id: string }).stripe_customer_id,
          return_url: `${baseUrl}/dashboard/settings`,
        });

        return json(res, 200, { success: true, url: portalSession.url });
      }

      case 'checkout-session': {
        if (!body.priceId || !body.userId) {
          return json(res, 400, { error: 'Missing priceId or userId' });
        }

        const { data: user } = await supabase
          .from('artists')
          .select('id, email')
          .eq('id', body.userId)
          .single();

        if (!user) {
          return json(res, 404, { error: 'User not found' });
        }

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          payment_method_types: ['card'],
          line_items: [{ price: body.priceId, quantity: 1 }],
          customer_email: user.email || undefined,
          client_reference_id: body.userId,
          metadata: { userId: body.userId, ...body.metadata },
          success_url: body.successUrl || `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: body.cancelUrl || `${baseUrl}/payment/cancel`,
        });

        return json(res, 200, { success: true, sessionId: session.id, url: session.url });
      }

      case 'flash-checkout': {
        if (!body.flash_id) {
          return json(res, 400, { error: 'Missing flash_id' });
        }

        const { data: flash } = await supabase
          .from('flashs')
          .select('*, artists!inner(id, nom_studio, slug_profil, stripe_account_id, stripe_onboarding_complete)')
          .eq('id', body.flash_id)
          .single();

        if (!flash || !flash.artists) {
          return json(res, 404, { error: 'Flash not found' });
        }

        const artist = flash.artists as any;
        if (!artist.stripe_account_id || !artist.stripe_onboarding_complete) {
          return json(res, 400, { error: 'Artist Stripe account not configured' });
        }

        const amount = Math.round((flash.prix as number) * 100);
        const applicationFee = Math.round(amount * 0.02);

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: { name: flash.title || 'Flash' },
              unit_amount: amount,
            },
            quantity: 1,
          }],
          payment_intent_data: {
            application_fee_amount: applicationFee,
            transfer_data: { destination: artist.stripe_account_id },
          },
          customer_email: body.client_email,
          metadata: { flash_id: body.flash_id, artist_id: artist.id },
          success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/payment/cancel`,
        });

        return json(res, 200, { success: true, sessionId: session.id, url: session.url });
      }

      case 'payment-intent': {
        if (!body.project_id || !body.amount) {
          return json(res, 400, { error: 'Missing project_id or amount' });
        }

        const { data: project } = await supabase
          .from('projects')
          .select('*, artists!inner(id, stripe_account_id, stripe_onboarding_complete)')
          .eq('id', body.project_id)
          .single();

        if (!project || !project.artists) {
          return json(res, 404, { error: 'Project not found' });
        }

        const artist = project.artists as any;
        if (!artist.stripe_account_id || !artist.stripe_onboarding_complete) {
          return json(res, 400, { error: 'Artist Stripe account not configured' });
        }

        const amount = Math.round(body.amount);
        const applicationFee = Math.round(amount * 0.02);

        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'eur',
          application_fee_amount: applicationFee,
          transfer_data: { destination: artist.stripe_account_id },
          metadata: { project_id: body.project_id, artist_id: artist.id },
          description: body.description || 'Paiement projet personnalisé',
        });

        return json(res, 200, { success: true, clientSecret: paymentIntent.client_secret });
      }

      case 'booking-payment-intent': {
        if (!body.booking_id) {
          return json(res, 400, { error: 'Missing booking_id' });
        }

        const { data: booking } = await supabase
          .from('bookings')
          .select('*, flashs!inner(id, prix, duree_minutes), artists!inner(id, nom_studio, slug_profil, stripe_account_id, stripe_onboarding_complete, deposit_percentage)')
          .eq('id', body.booking_id)
          .single();

        if (!booking || !booking.flashs || !booking.artists) {
          return json(res, 404, { error: 'Booking not found' });
        }

        const artist = booking.artists as any;
        const flash = booking.flashs as any;

        if (!artist.stripe_account_id || !artist.stripe_onboarding_complete) {
          return json(res, 400, { error: 'Artist Stripe account not configured' });
        }

        const totalAmount = Math.round((flash.prix as number) * 100);
        const depositPercentage = artist.deposit_percentage || 30;
        const depositAmount = Math.round(totalAmount * (depositPercentage / 100));
        const applicationFee = Math.round(depositAmount * 0.02);

        const paymentIntent = await stripe.paymentIntents.create({
          amount: depositAmount,
          currency: 'eur',
          application_fee_amount: applicationFee,
          transfer_data: { destination: artist.stripe_account_id },
          metadata: { booking_id: body.booking_id, artist_id: artist.id, type: 'deposit' },
          description: `Acompte réservation - ${artist.nom_studio}`,
        });

        await supabase
          .from('bookings')
          .update({ stripe_deposit_intent_id: paymentIntent.id })
          .eq('id', body.booking_id);

        return json(res, 200, { success: true, clientSecret: paymentIntent.client_secret });
      }

      case 'connect-onboard': {
        if (!body.userId) {
          return json(res, 400, { error: 'Missing userId' });
        }

        const { data: artist } = await supabase
          .from('artists')
          .select('id, email, stripe_account_id')
          .eq('id', body.userId)
          .single();

        if (!artist) {
          return json(res, 404, { error: 'Artist not found' });
        }

        let accountId = artist.stripe_account_id;

        if (!accountId) {
          const account = await stripe.accounts.create({
            type: 'express',
            country: 'FR',
            email: artist.email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            metadata: { artist_id: artist.id },
          });
          accountId = account.id;

          await supabase
            .from('artists')
            .update({ stripe_account_id: accountId })
            .eq('id', artist.id);
        }

        const accountLink = await stripe.accountLinks.create({
          account: accountId,
          refresh_url: `${baseUrl}/dashboard/settings?stripe_refresh=true`,
          return_url: `${baseUrl}/dashboard/settings?stripe_success=true`,
          type: 'account_onboarding',
        });

        return json(res, 200, { success: true, url: accountLink.url });
      }

      case 'connect-callback': {
        if (!body.account_id) {
          return json(res, 400, { error: 'Missing account_id' });
        }

        const account = await stripe.accounts.retrieve(body.account_id);
        const detailsSubmitted = account.details_submitted;
        const chargesEnabled = account.charges_enabled;

        const { data: artist } = await supabase
          .from('artists')
          .select('id')
          .eq('stripe_account_id', body.account_id)
          .single();

        if (artist) {
          await supabase
            .from('artists')
            .update({
              stripe_onboarding_complete: detailsSubmitted && chargesEnabled,
            })
            .eq('id', artist.id);
        }

        return json(res, 200, {
          success: true,
          detailsSubmitted,
          chargesEnabled,
          onboardingComplete: detailsSubmitted && chargesEnabled,
        });
      }

      default:
        return json(res, 400, { error: `Unknown action: ${body.action}` });
    }
  } catch (error: any) {
    console.error('Stripe API error:', error);
    return json(res, 500, {
      error: error.message || 'Failed to process Stripe request',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}

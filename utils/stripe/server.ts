/**
 * Stripe Server Utilities
 * 
 * ⚠️ IMPORTANT : Ce projet utilise Vite + Vercel Serverless Functions, pas Next.js
 * 
 * Pour utiliser dans les routes API Vercel (dossier api/), importez :
 * import { getStripeServer } from '../../utils/stripe/server';
 * 
 * Pour Next.js App Router, utilisez plutôt :
 * import { getStripeServer } from '@/utils/stripe/server';
 */

import Stripe from 'stripe';

/**
 * Get Stripe instance for server-side operations
 * 
 * This function initializes Stripe with the secret key from environment variables.
 * The secret key should NEVER be exposed to the client.
 * 
 * @returns Stripe instance
 * @throws Error if STRIPE_SECRET_KEY is not configured
 */
export function getStripeServer(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured. ' +
      'Add it to your Vercel Dashboard → Settings → Environment Variables'
    );
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

/**
 * Validate Stripe webhook signature
 * 
 * @param payload - Raw request body as string
 * @param signature - Stripe signature from headers
 * @param webhookSecret - Webhook secret from Stripe Dashboard
 * @returns Stripe event object
 * @throws Error if signature is invalid
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  const stripe = getStripeServer();
  
  try {
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    throw new Error(`Webhook signature verification failed: ${err.message}`);
  }
}

/**
 * Get webhook secret from environment variables
 * 
 * @returns Webhook secret
 * @throws Error if STRIPE_WEBHOOK_SECRET is not configured
 */
export function getWebhookSecret(): string {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET is not configured. ' +
      'Add it to your Vercel Dashboard → Settings → Environment Variables. ' +
      'Get it from Stripe Dashboard → Developers → Webhooks → Your endpoint → Signing secret'
    );
  }

  return webhookSecret;
}

/**
 * Helper to format amount for Stripe (convert to cents)
 * 
 * @param amount - Amount in euros (e.g., 29.99)
 * @returns Amount in cents (e.g., 2999)
 */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Helper to format amount from Stripe (convert from cents)
 * 
 * @param amount - Amount in cents (e.g., 2999)
 * @returns Amount in euros (e.g., 29.99)
 */
export function fromStripeAmount(amount: number): number {
  return amount / 100;
}

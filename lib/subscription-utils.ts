/**
 * Utilitaires pour la gestion des abonnements Stripe
 */

import { SubscriptionPlan, SubscriptionStatus } from '../types/prisma-enums';

// ============================================
// Configuration des Plans Stripe
// ============================================

export const STRIPE_PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_ID_STARTER || 'price_starter_monthly',
  PRO: process.env.STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
  STUDIO: process.env.STRIPE_PRICE_ID_STUDIO || 'price_studio_monthly',
} as const;

export const PLAN_CONFIG = {
  STARTER: {
    name: 'Starter',
    price: 29,
    priceId: STRIPE_PRICE_IDS.STARTER,
    features: [
      '1 artiste maximum',
      '2% de frais Stripe',
      'Réservations illimitées',
      'Calendrier de base',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 49,
    priceId: STRIPE_PRICE_IDS.PRO,
    features: [
      'Artistes illimités',
      '0% de frais Stripe',
      'Formulaire IA',
      'Multi-calendriers',
      'Domaine personnalisé',
    ],
  },
  STUDIO: {
    name: 'Studio',
    price: 99,
    priceId: STRIPE_PRICE_IDS.STUDIO,
    features: [
      'Jusqu\'à 3 artistes',
      '0% de frais Stripe',
      'Formulaire IA',
      'Multi-calendriers',
      'Support prioritaire',
    ],
  },
} as const;

// ============================================
// Mapping Stripe Status → Prisma Status
// ============================================

export function mapStripeStatusToPrisma(
  stripeStatus: string
): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return SubscriptionStatus.active;
    case 'trialing':
      return SubscriptionStatus.trialing;
    case 'past_due':
      return SubscriptionStatus.past_due;
    case 'canceled':
    case 'cancelled':
      return SubscriptionStatus.canceled;
    case 'incomplete':
      return SubscriptionStatus.incomplete;
    case 'incomplete_expired':
      return SubscriptionStatus.incomplete_expired;
    case 'unpaid':
      return SubscriptionStatus.unpaid;
    default:
      return SubscriptionStatus.canceled;
  }
}

// ============================================
// Mapping Stripe Price ID → Plan
// ============================================

export function getPlanFromPriceId(priceId: string): SubscriptionPlan | null {
  if (priceId === STRIPE_PRICE_IDS.STARTER) return SubscriptionPlan.STARTER;
  if (priceId === STRIPE_PRICE_IDS.PRO) return SubscriptionPlan.PRO;
  if (priceId === STRIPE_PRICE_IDS.STUDIO) return SubscriptionPlan.STUDIO;
  return null;
}

// ============================================
// Helpers
// ============================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export function getPlanDisplayName(plan: SubscriptionPlan | null): string {
  if (!plan) return 'Aucun plan';
  return PLAN_CONFIG[plan].name;
}

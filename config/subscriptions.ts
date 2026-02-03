/**
 * Subscription Plans Configuration
 * 
 * Defines the pricing tiers, features, and limits for InkFlow SaaS.
 * Each plan has specific limits and commission rates for Stripe deposits.
 */

export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'STUDIO';

export interface PlanLimits {
  maxArtists: number; // Maximum number of artists (1 for most, 3 for Studio)
  commissionRate: number; // Percentage taken on deposits (e.g. 0.02 for 2%)
  aiBooking: boolean; // Access to AI form
  whiteLabel: boolean; // Remove InkFlow branding
  multiCalendar: boolean; // Multi-calendar support
}

export interface PlanConfig {
  title: string;
  price: number; // Monthly price in EUR
  priceId: string; // Stripe Price ID (placeholder - to be filled with real Stripe IDs)
  description: string;
  features: string[];
  limits: PlanLimits;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    title: 'Essai / Gratuit',
    price: 0,
    priceId: '', // No Stripe price for free tier
    description: 'Pour découvrir InkFlow',
    features: [
      '1 artiste',
      'Calendrier basique'
    ],
    limits: {
      maxArtists: 1,
      commissionRate: 0.05, // 5% commission on free tier
      aiBooking: false,
      whiteLabel: false,
      multiCalendar: false
    }
  },
  STARTER: {
    title: 'Starter',
    price: 29,
    priceId: 'price_1SwmmH5JVD1yZUQvapWip4ds', // Stripe Price ID (Starter)
    description: 'Pour démarrer',
    features: [
      '1 artiste',
      'Flashs illimités',
      'Acomptes Stripe (2%)',
      'Support email'
    ],
    limits: {
      maxArtists: 1,
      commissionRate: 0.02, // 2% Commission
      aiBooking: false,
      whiteLabel: false,
      multiCalendar: false
    }
  },
  PRO: {
    title: 'Pro',
    price: 49,
    priceId: 'price_1Swmmj5JVD1yZUQvJXiZN5F2', // Stripe Price ID (Pro)
    description: 'Pour les établis',
    features: [
      'Tout du Starter',
      'Formulaire projet IA',
      'Acomptes Stripe (0%)',
      'Agenda synchronisé',
      'Support prioritaire'
    ],
    limits: {
      maxArtists: 1,
      commissionRate: 0, // 0% Commission
      aiBooking: true,
      whiteLabel: false,
      multiCalendar: false
    }
  },
  STUDIO: {
    title: 'Studio',
    price: 99,
    priceId: 'price_1Swmn35JVD1yZUQvg8ZIGyJk', // Stripe Price ID (Studio)
    description: 'Pour les équipes',
    features: [
      'Jusqu\'à 3 artistes',
      'Multi-calendriers',
      'Dashboard studio',
      'Marque blanche'
    ],
    limits: {
      maxArtists: 3,
      commissionRate: 0, // 0% Commission
      aiBooking: true,
      whiteLabel: true,
      multiCalendar: true
    }
  }
};

/**
 * Get plan limits for a given plan type
 * @param plan - The plan type
 * @returns PlanLimits object with all limits for the plan
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLANS[plan].limits;
}

/**
 * Calculate application fee (commission) based on plan and deposit amount
 * @param amount - Deposit amount in centimes (e.g., 3000 = 30€)
 * @param plan - The user's plan type
 * @returns Commission amount in centimes
 */
export function calculateApplicationFee(amount: number, plan: PlanType): number {
  const limits = getPlanLimits(plan);
  const commission = Math.round(amount * limits.commissionRate);
  return commission;
}

/**
 * Get plan configuration
 * @param plan - The plan type
 * @returns Full plan configuration
 */
export function getPlan(plan: PlanType): PlanConfig {
  return PLANS[plan];
}

/**
 * Check if a plan has a specific feature
 * @param plan - The plan type
 * @param feature - Feature to check ('aiBooking' | 'whiteLabel' | 'multiCalendar')
 * @returns true if the plan has the feature
 */
export function hasFeature(plan: PlanType, feature: keyof PlanLimits): boolean {
  if (feature === 'maxArtists') {
    return true; // All plans have maxArtists, just different limits
  }
  if (feature === 'commissionRate') {
    return true; // All plans have commissionRate, just different rates
  }
  return getPlanLimits(plan)[feature] === true;
}

/**
 * Get the Stripe Price ID for a plan
 * @param plan - The plan type
 * @returns Stripe Price ID or empty string for FREE
 */
export function getStripePriceId(plan: PlanType): string {
  return PLANS[plan].priceId;
}

/**
 * Check if plan allows multiple artists
 * @param plan - The plan type
 * @returns true if plan supports multiple artists
 */
export function supportsMultipleArtists(plan: PlanType): boolean {
  return getPlanLimits(plan).maxArtists > 1;
}

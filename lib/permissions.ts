/**
 * Système de Feature Gating par Plan d'Abonnement
 * 
 * Ce module définit les limites et permissions pour chaque plan SaaS.
 */

import { SubscriptionPlan, SubscriptionStatus } from '../types/prisma-enums';

// ============================================
// Types & Interfaces
// ============================================

export interface UserSubscription {
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
}

export interface FeatureLimits {
  maxArtists: number | null; // null = illimité
  maxServices: number | null;
  maxBookingsPerMonth: number | null;
  stripeFeePercentage: number; // 0 = pas de frais, 2 = 2%
  hasAIForm: boolean;
  hasMultiCalendar: boolean;
  hasCustomDomain: boolean;
}

export type FeatureName = 
  | 'create_artist'
  | 'use_ai_form'
  | 'multi_calendar'
  | 'custom_domain'
  | 'unlimited_bookings'
  | 'zero_stripe_fees';

// ============================================
// Configuration des Plans
// ============================================

const PLAN_LIMITS: Record<SubscriptionPlan, FeatureLimits> = {
  STARTER: {
    maxArtists: 1,
    maxServices: null, // Illimité
    maxBookingsPerMonth: null, // Illimité
    stripeFeePercentage: 2, // 2% de frais Stripe
    hasAIForm: false,
    hasMultiCalendar: false,
    hasCustomDomain: false,
  },
  PRO: {
    maxArtists: null, // Illimité
    maxServices: null,
    maxBookingsPerMonth: null,
    stripeFeePercentage: 0, // 0% de frais Stripe
    hasAIForm: true,
    hasMultiCalendar: true,
    hasCustomDomain: true,
  },
  STUDIO: {
    maxArtists: 3,
    maxServices: null,
    maxBookingsPerMonth: null,
    stripeFeePercentage: 0,
    hasAIForm: true,
    hasMultiCalendar: true,
    hasCustomDomain: true,
  },
};

// ============================================
// Fonctions Utilitaires
// ============================================

/**
 * Vérifie si l'utilisateur a un abonnement actif
 */
export function hasActiveSubscription(user: UserSubscription): boolean {
  return (
    user.status === SubscriptionStatus.active ||
    user.status === SubscriptionStatus.trialing
  );
}

/**
 * Récupère les limites du plan de l'utilisateur
 */
export function getPlanLimits(user: UserSubscription): FeatureLimits | null {
  if (!user.plan) return null;
  return PLAN_LIMITS[user.plan];
}

/**
 * Vérifie si une fonctionnalité est disponible pour l'utilisateur
 */
export function hasFeatureAccess(
  user: UserSubscription,
  feature: FeatureName
): boolean {
  // Pas d'abonnement actif = pas d'accès
  if (!hasActiveSubscription(user)) {
    return false;
  }

  const limits = getPlanLimits(user);
  if (!limits) return false;

  switch (feature) {
    case 'create_artist':
      // STARTER: max 1 artiste, PRO: illimité, STUDIO: max 3
      return limits.maxArtists === null || limits.maxArtists > 0;
    
    case 'use_ai_form':
      return limits.hasAIForm;
    
    case 'multi_calendar':
      return limits.hasMultiCalendar;
    
    case 'custom_domain':
      return limits.hasCustomDomain;
    
    case 'unlimited_bookings':
      return limits.maxBookingsPerMonth === null;
    
    case 'zero_stripe_fees':
      return limits.stripeFeePercentage === 0;
    
    default:
      return false;
  }
}

/**
 * Vérifie si l'utilisateur peut créer un nouvel artiste
 */
export function canCreateArtist(
  user: UserSubscription,
  currentArtistCount: number
): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(user)) {
    return {
      allowed: false,
      reason: 'Vous devez avoir un abonnement actif pour créer un profil artiste.',
    };
  }

  const limits = getPlanLimits(user);
  if (!limits) {
    return {
      allowed: false,
      reason: 'Plan d\'abonnement invalide.',
    };
  }

  // Si maxArtists est null, c'est illimité
  if (limits.maxArtists === null) {
    return { allowed: true };
  }

  if (currentArtistCount >= limits.maxArtists) {
    const planName = user.plan === SubscriptionPlan.STARTER 
      ? 'Starter' 
      : user.plan === SubscriptionPlan.STUDIO 
      ? 'Studio' 
      : 'Pro';
    
    return {
      allowed: false,
      reason: `Votre plan ${planName} permet un maximum de ${limits.maxArtists} artiste(s). Passez au plan supérieur pour en ajouter plus.`,
    };
  }

  return { allowed: true };
}

/**
 * Vérifie si l'utilisateur peut utiliser le formulaire IA
 */
export function canUseAIForm(user: UserSubscription): { allowed: boolean; reason?: string } {
  if (!hasActiveSubscription(user)) {
    return {
      allowed: false,
      reason: 'Vous devez avoir un abonnement actif.',
    };
  }

  if (!hasFeatureAccess(user, 'use_ai_form')) {
    return {
      allowed: false,
      reason: 'Le formulaire IA est disponible uniquement sur les plans Pro et Studio. Passez à l\'un de ces plans pour y accéder.',
    };
  }

  return { allowed: true };
}

/**
 * Calcule le pourcentage de frais Stripe à appliquer
 */
export function getStripeFeePercentage(user: UserSubscription): number {
  if (!hasActiveSubscription(user)) {
    return 2; // Par défaut, 2% si pas d'abonnement
  }

  const limits = getPlanLimits(user);
  return limits?.stripeFeePercentage ?? 2;
}

/**
 * Vérifie toutes les limites d'un utilisateur
 */
export function checkAllLimits(
  user: UserSubscription,
  currentArtistCount: number
): {
  canCreateArtist: boolean;
  canUseAIForm: boolean;
  canUseMultiCalendar: boolean;
  stripeFeePercentage: number;
  errors: string[];
} {
  const errors: string[] = [];
  
  const artistCheck = canCreateArtist(user, currentArtistCount);
  const aiFormCheck = canUseAIForm(user);
  
  if (!artistCheck.allowed && artistCheck.reason) {
    errors.push(artistCheck.reason);
  }
  
  if (!aiFormCheck.allowed && aiFormCheck.reason) {
    errors.push(aiFormCheck.reason);
  }

  return {
    canCreateArtist: artistCheck.allowed,
    canUseAIForm: aiFormCheck.allowed,
    canUseMultiCalendar: hasFeatureAccess(user, 'multi_calendar'),
    stripeFeePercentage: getStripeFeePercentage(user),
    errors,
  };
}

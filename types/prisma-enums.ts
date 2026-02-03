/**
 * Types Prisma pour utilisation côté client
 * 
 * Ces enums sont copiés depuis le schéma Prisma pour éviter d'importer @prisma/client côté client
 * qui contient du code serveur qui ne peut pas être bundlé par Vite.
 */

// Enum SubscriptionPlan
export enum SubscriptionPlan {
  STARTER = 'STARTER',
  PRO = 'PRO',
  STUDIO = 'STUDIO',
}

// Enum SubscriptionStatus
export enum SubscriptionStatus {
  active = 'active',
  trialing = 'trialing',
  past_due = 'past_due',
  canceled = 'canceled',
  incomplete = 'incomplete',
  incomplete_expired = 'incomplete_expired',
  unpaid = 'unpaid',
}

// Enum BookingStatus (si nécessaire côté client)
export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

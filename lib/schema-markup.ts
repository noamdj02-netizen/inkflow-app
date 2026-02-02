/**
 * Données structurées JSON-LD (Schema.org) pour ink-flow.me.
 * Chaque fonction retourne un objet prêt à être injecté dans <head> via <script type="application/ld+json">.
 *
 * Validation :
 * - Google Rich Results Test : https://search.google.com/test/rich-results
 * - Schema.org Validator : https://validator.schema.org/
 *
 * Types fournis : Organization, WebApplication, SoftwareApplication, BreadcrumbList,
 * FAQPage, AggregateRating, Review, WebSite, LocalBusiness, AboutPage.
 */

import { SITE_URL, absoluteUrl } from '../constants/seo';

const BASE_URL = SITE_URL.replace(/\/$/, '');
const LOGO_URL = `${BASE_URL}/pwa-512x512.png`;

// --- 1. Organization ---

export interface OrganizationSchemaOptions {
  name?: string;
  url?: string;
  description?: string;
  logo?: string;
}

export function getOrganizationSchema(options: OrganizationSchemaOptions = {}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name ?? 'InkFlow',
    url: options.url ?? SITE_URL,
    description: options.description ?? 'Plateforme de gestion et réservation pour tatoueurs professionnels.',
    logo: options.logo ?? LOGO_URL,
  };
}

// --- 2. WebApplication ---

export interface WebApplicationSchemaOptions {
  name?: string;
  url?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  price?: string;
  priceCurrency?: string;
}

export function getWebApplicationSchema(options: WebApplicationSchemaOptions = {}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: options.name ?? 'InkFlow',
    url: options.url ?? SITE_URL,
    description: options.description ?? 'Plateforme de gestion et réservation pour tatoueurs : flashs, agenda, paiements Stripe. Web, iOS, Android.',
    applicationCategory: options.applicationCategory ?? 'BusinessApplication',
    operatingSystem: options.operatingSystem ?? 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: options.price ?? '0',
      priceCurrency: options.priceCurrency ?? 'EUR',
    },
  };
}

// --- 3. SoftwareApplication ---

export interface SoftwareApplicationSchemaOptions {
  name?: string;
  url?: string;
  description?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  price?: string;
  priceCurrency?: string;
}

export function getSoftwareApplicationSchema(options: SoftwareApplicationSchemaOptions = {}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: options.name ?? 'InkFlow',
    applicationCategory: options.applicationCategory ?? 'BusinessApplication',
    operatingSystem: options.operatingSystem ?? 'Web',
    description: options.description ?? 'Plateforme de gestion et réservation pour tatoueurs professionnels : flashs, agenda, paiements Stripe.',
    url: options.url ?? SITE_URL,
    offers: {
      '@type': 'Offer',
      price: options.price ?? '0',
      priceCurrency: options.priceCurrency ?? 'EUR',
    },
  };
}

// --- 4. BreadcrumbList ---

export interface BreadcrumbListItem {
  label: string;
  path?: string;
}

export function getBreadcrumbListSchema(
  items: BreadcrumbListItem[],
  currentPageUrl?: string
): object {
  const fallbackUrl = typeof window !== 'undefined' ? window.location.href : SITE_URL;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.path ? absoluteUrl(item.path) : (currentPageUrl ?? fallbackUrl),
    })),
  };
}

// --- 5. FAQPage ---

export interface FAQItem {
  question: string;
  answer: string;
}

export function getFAQPageSchema(faqItems: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };
}

// --- 6. Review / AggregateRating ---

export interface ReviewInput {
  author: string;
  reviewBody?: string;
  /** 1–5 ou autre échelle selon bestRating */
  ratingValue?: number;
  datePublished?: string;
}

export interface AggregateRatingSchemaOptions {
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
  ratingCount: number;
  reviewCount?: number;
}

/** Schéma AggregateRating seul (pour afficher une note globale). */
export function getAggregateRatingSchema(options: AggregateRatingSchemaOptions): object {
  const { ratingValue, bestRating = 5, worstRating = 1, ratingCount, reviewCount } = options;
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    ratingValue: String(ratingValue),
    bestRating: String(bestRating),
    worstRating: String(worstRating),
    ratingCount: String(ratingCount),
    ...(reviewCount != null && { reviewCount: String(reviewCount) }),
  };
}

/** Un seul avis (Review) avec rating optionnel. */
export function getReviewSchema(review: ReviewInput): object {
  const r: Record<string, unknown> = {
    '@type': 'Review',
    author: { '@type': 'Person', name: review.author },
    ...(review.reviewBody && { reviewBody: review.reviewBody }),
    ...(review.datePublished && { datePublished: review.datePublished }),
  };
  if (review.ratingValue != null) {
    r.reviewRating = {
      '@type': 'Rating',
      ratingValue: review.ratingValue,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return r;
}

/** Combine plusieurs reviews + AggregateRating (pour une page produit/service). */
export function getReviewsWithAggregateSchema(
  reviews: ReviewInput[],
  options: { ratingValue: number; ratingCount: number }
): object[] {
  if (reviews.length === 0) return [];
  const arr: object[] = reviews.map((r) => getReviewSchema(r));
  arr.push(getAggregateRatingSchema({ ...options, ratingCount: options.ratingCount }));
  return arr;
}

/** Pour les témoignages Landing : retourne un schéma AggregateRating basé sur les avis (ex. 5 étoiles, 3 avis). */
export function getTestimonialsAggregateSchema(testimonialCount: number): object | null {
  if (testimonialCount === 0) return null;
  return getAggregateRatingSchema({
    ratingValue: 5,
    bestRating: 5,
    worstRating: 1,
    ratingCount: testimonialCount,
    reviewCount: testimonialCount,
  });
}

// --- WebSite (complément courant à Organization) ---

export function getWebSiteSchema(options: { name?: string; url?: string; description?: string } = {}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options.name ?? 'InkFlow',
    url: options.url ?? SITE_URL,
    description: options.description ?? 'Gestion et réservation pour tatoueurs. Flashs, agenda, paiements.',
    publisher: { '@type': 'Organization', name: options.name ?? 'InkFlow' },
  };
}

// --- LocalBusiness (vitrine artiste) ---

export interface LocalBusinessSchemaOptions {
  name: string;
  description?: string;
  url: string;
  image?: string;
  address?: { addressLocality?: string; addressRegion?: string };
}

export function getLocalBusinessSchema(options: LocalBusinessSchemaOptions): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: options.name,
    description: options.description,
    url: options.url,
    image: options.image,
    ...(options.address && { address: { '@type': 'PostalAddress', ...options.address } }),
  };
}

// --- AboutPage ---

export function getAboutPageSchema(options: { name?: string; url?: string; description?: string } = {}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: options.name ?? 'À propos de InkFlow',
    url: options.url ?? `${BASE_URL}/apropos`,
    description: options.description ?? "L'histoire et les valeurs d'InkFlow.",
  };
}

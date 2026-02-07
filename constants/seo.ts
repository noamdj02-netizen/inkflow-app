/**
 * Constantes SEO pour ink-flow.me
 * SITE_URL : utilisé pour canonical, og:url, sitemap, JSON-LD.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : '') ||
  'https://ink-flow.me';

/** Image par défaut pour partage social (URL absolue). 1200×630 recommandé pour OG. */
export const DEFAULT_OG_IMAGE = `${SITE_URL.replace(/\/$/, '')}/pwa-512x512.png`;

export function absoluteUrl(path: string): string {
  const base = SITE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

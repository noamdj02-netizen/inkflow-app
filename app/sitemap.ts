/**
 * Sitemap dynamique (format Next.js App Router).
 * Utilisé par les crawlers Google pour découvrir les URLs du site.
 * En Vite/Vercel : servi via api/sitemap.ts + rewrite /sitemap.xml → /api/sitemap
 */

const BASE_URL = 'https://ink-flow.me';

export type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

/**
 * Génère la liste des URLs à inclure dans le sitemap.
 * Accueil, Tarifs, Connexion + autres pages publiques.
 */
export default function sitemap(): SitemapEntry[] {
  const now = new Date().toISOString();
  return [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/offres`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/apropos`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/mentions-legales`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}

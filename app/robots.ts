/**
 * Règles robots.txt (format Next.js App Router).
 * Autorise les crawlers sur les pages publiques, bloque /dashboard et /admin.
 * En Vite/Vercel : servi via api/robots.ts + rewrite /robots.txt → /api/robots
 */

const BASE_URL = 'https://ink-flow.me';

export type RobotsRule = {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

export type RobotsConfig = {
  rules: RobotsRule | RobotsRule[];
  sitemap?: string | string[];
  host?: string;
};

/**
 * Retourne la configuration robots pour les crawlers.
 */
export default function robots(): RobotsConfig {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/',
        '/admin',
        '/admin/',
        '/auth/',
        '/onboarding',
        '/payment/',
        '/subscribe/success',
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

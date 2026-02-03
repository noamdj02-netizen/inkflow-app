/**
 * Metadata SEO racine pour InkFlow (Vite / React).
 * Utilisable dans index.html et, si migration Next.js, dans app/layout.tsx.
 *
 * Ciblage : Tatoueur Rouen, Planificateur Tattoo, Réservation Tatouage, Logiciel Tatoueur.
 */

const SITE_URL = 'https://ink-flow.me';
const OG_IMAGE = `${SITE_URL}/pwa-512x512.png`;

export const metadata = {
  title: 'InkFlow - Planificateur Tattoo & Réservation Tatouage pour Tatoueurs à Rouen',
  description:
    'Logiciel tatoueur à Rouen : planificateur tattoo, réservation tatouage en ligne, agenda et paiements. Pour artistes et studios.',
  keywords: [
    'Tatoueur Rouen',
    'Planificateur Tattoo',
    'Réservation Tatouage',
    'Logiciel Tatoueur',
    'agenda tatoueur',
    'réservation en ligne tatouage',
    'studio tattoo Rouen',
    'gestion rendez-vous tatoueur',
  ],
  robots: {
    index: true,
    follow: true,
  },
  canonical: SITE_URL,
  openGraph: {
    type: 'website' as const,
    url: SITE_URL,
    siteName: 'InkFlow',
    title: 'InkFlow - Planificateur Tattoo & Réservation Tatouage | Tatoueurs Rouen',
    description:
      'Logiciel tatoueur à Rouen : planificateur tattoo, réservation tatouage en ligne, agenda et paiements. Pour artistes et studios.',
    images: [
      {
        url: OG_IMAGE,
        width: 512,
        height: 512,
        alt: 'InkFlow - Planificateur et réservation pour tatoueurs',
      },
    ],
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'InkFlow - Planificateur Tattoo & Réservation Tatouage | Tatoueurs Rouen',
    description:
      'Logiciel tatoueur à Rouen : planificateur tattoo, réservation tatouage en ligne, agenda et paiements.',
    image: OG_IMAGE,
  },
} as const;

/** Meta robots content string (pour balise <meta name="robots">). */
export const robotsContent = `${metadata.robots.index ? 'index' : 'noindex'}, ${metadata.robots.follow ? 'follow' : 'nofollow'}`;

/** Keywords en une seule chaîne (pour <meta name="keywords">). */
export const keywordsString = metadata.keywords.join(', ');

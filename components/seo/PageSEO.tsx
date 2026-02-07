/**
 * Composant SEO réutilisable : title, description, OG, Twitter, canonical, JSON-LD.
 * Utilise react-helmet-async (HelmetProvider requis).
 */
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_URL, DEFAULT_OG_IMAGE, absoluteUrl } from '../../constants/seo';

export interface PageSEOProps {
  /** 50–60 caractères recommandé */
  title: string;
  /** 150–160 caractères recommandé */
  description: string;
  /** URL canonique (chemin ou URL absolue). Si vide, utilise pathname courant. */
  canonical?: string;
  /** Image pour OG/Twitter (URL absolue). Par défaut DEFAULT_OG_IMAGE */
  image?: string;
  /** og:type — website par défaut */
  ogType?: 'website' | 'article' | 'profile';
  /** Désactiver l’indexation (ex. login, payment success) */
  noindex?: boolean;
  /** Données structurées JSON-LD (objet ou tableau d’objets) */
  jsonLd?: object | object[];
}

export const PageSEO: React.FC<PageSEOProps> = ({
  title,
  description,
  canonical,
  image = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
}) => {
  const canonicalUrl = canonical
    ? (canonical.startsWith('http') ? canonical : absoluteUrl(canonical))
    : (typeof window !== 'undefined' ? window.location.href : absoluteUrl('/'));
  const imageUrl = image.startsWith('http') ? image : absoluteUrl(image);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="InkFlow" />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {jsonLd != null && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

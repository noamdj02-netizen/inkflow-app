/**
 * SEOHead — composant SEO réutilisable (équivalent conceptuel Next.js Metadata / Head).
 * Projet : Vite + React (pas Next.js) ; métadonnées dynamiques selon la route via Helmet.
 *
 * - Title avec template optionnel : titleTemplate "%s | InkFlow" → "Connexion | InkFlow"
 * - Schema.org WebApplication/SoftwareApplication pour SaaS
 * - Délègue à PageSEO pour meta, OG, Twitter, canonical, JSON-LD personnalisé
 */
import React from 'react';
import { PageSEO, type PageSEOProps } from './PageSEO';
import { getSoftwareApplicationSchema } from '../../lib/schema-markup';

const TITLE_TEMPLATE = '%s | InkFlow';
const DEFAULT_TITLE = 'InkFlow | La Plateforme Premium pour Tatoueurs';

export interface SEOHeadProps extends PageSEOProps {
  /** Si true, le title est formaté avec le template (ex. "Connexion" → "Connexion | InkFlow"). Ignoré si title contient déjà "| InkFlow". */
  useTitleTemplate?: boolean;
  /** Ajouter le schéma JSON-LD SoftwareApplication (SaaS). À combiner avec jsonLd pour d'autres types. */
  addSoftwareApplicationSchema?: boolean;
}

function applyTitleTemplate(title: string, template: string): string {
  if (title.includes('| InkFlow')) return title;
  return template.replace('%s', title.trim());
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  useTitleTemplate = false,
  addSoftwareApplicationSchema = false,
  jsonLd,
  ...rest
}) => {
  const resolvedTitle = useTitleTemplate ? applyTitleTemplate(title, TITLE_TEMPLATE) : title;
  const softwareApp = addSoftwareApplicationSchema ? getSoftwareApplicationSchema({}) : null;
  const mergedJsonLd =
    softwareApp && jsonLd != null
      ? (Array.isArray(jsonLd) ? [...jsonLd, softwareApp] : [jsonLd, softwareApp])
      : softwareApp
        ? softwareApp
        : jsonLd;

  return (
    <PageSEO
      title={resolvedTitle}
      description={description}
      jsonLd={mergedJsonLd}
      {...rest}
    />
  );
};

/** Métadonnées par défaut (équivalent metadataBase + default title). Utiliser pour documenter / fallback. */
export const DEFAULT_METADATA = {
  metadataBase: 'https://ink-flow.me',
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: 'Gestion et réservation pour tatoueurs professionnels. Flashs, agenda, paiements en ligne.',
} as const;

/**
 * Fil d'Ariane (breadcrumbs) avec schema.org BreadcrumbList pour le SEO.
 * Liens internes stratégiques + JSON-LD pour Google/Bing.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { getBreadcrumbListSchema } from '../../lib/schema-markup';
import type { BreadcrumbListItem } from '../../lib/schema-markup';

export interface BreadcrumbItem extends BreadcrumbListItem {}

export interface BreadcrumbsProps {
  /** Liste des niveaux (dernier = page courante, sans path). Ex: [{ label: 'Accueil', path: '/' }, { label: 'À propos' }] */
  items: BreadcrumbItem[];
  /** Classe CSS optionnelle pour le conteneur */
  className?: string;
  /** Inclure le JSON-LD BreadcrumbList (défaut true) */
  withJsonLd?: boolean;
  /** URL de la page courante pour le dernier item du JSON-LD (optionnel) */
  currentUrl?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  withJsonLd = true,
  currentUrl,
}) => {
  if (items.length === 0) return null;

  const jsonLd = withJsonLd ? getBreadcrumbListSchema(items, currentUrl) : null;

  return (
    <>
      {jsonLd != null && (
        <Helmet>
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        </Helmet>
      )}
      <nav
        aria-label="Fil d'Ariane"
        className={`flex flex-wrap items-center gap-1 text-sm text-zinc-400 ${className}`}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight size={14} className="text-zinc-500 shrink-0" aria-hidden />
              )}
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className="hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-white font-medium' : ''} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
};

/** Hook pour générer des breadcrumbs à partir du pathname (ex: /apropos → Accueil > À propos). */
const ROUTE_LABELS: Record<string, string> = {
  '': 'Accueil',
  '/': 'Accueil',
  '/login': 'Connexion',
  '/register': 'Inscription',
  '/apropos': 'À propos',
  '/mentions-legales': 'Mentions légales',
  '/contact': 'Contact',
  '/payment/success': 'Paiement réussi',
  '/payment/cancel': 'Paiement annulé',
};

export function useBreadcrumbsFromPath(slug?: string, pageLabel?: string): BreadcrumbItem[] {
  const location = useLocation();
  const pathname = location.pathname;

  if (slug && pageLabel) {
    return [
      { label: 'Accueil', path: '/' },
      { label: pageLabel, path: `/${slug}` },
      { label: 'Réservation' },
    ];
  }

  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Accueil', path: '/' }];
  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const label = ROUTE_LABELS[acc] || segments[i].charAt(0).toUpperCase() + segments[i].slice(1);
    items.push({ label, path: i < segments.length - 1 ? acc : undefined });
  }
  if (items.length === 1) return []; // Accueil seul, pas besoin de breadcrumb
  return items;
}

# URL slugs SEO-friendly — ink-flow.me

**Domaine** : https://ink-flow.me  
**Stack** : Vite + React (pas Next.js). Métadonnées dynamiques via Helmet / SEOHead.

## Structure des URLs (SEO-friendly)

| Route | Exemple | Usage |
|-------|---------|--------|
| `/` | https://ink-flow.me/ | Accueil |
| `/login` | https://ink-flow.me/login | Connexion |
| `/register` | https://ink-flow.me/register | Inscription |
| `/apropos` | https://ink-flow.me/apropos | À propos |
| `/mentions-legales` | https://ink-flow.me/mentions-legales | Mentions légales |
| `/contact` | https://ink-flow.me/contact | Contact |
| `/:slug` | https://ink-flow.me/noam | Vitrine artiste (slug = identifiant public) |
| `/:slug/booking` | https://ink-flow.me/noam/booking | Réservation (calendrier créneaux) |
| `/p/:slug` | https://ink-flow.me/p/noam | Vitrine artiste (alias court) |
| `/payment/success` | — | Confirmation paiement (noindex) |
| `/payment/cancel` | — | Paiement annulé (noindex) |

## Bonnes pratiques appliquées

- **Slugs courts** : `login`, `register`, `apropos`, `mentions-legales`, `contact`.
- **Vitrine** : `/:slug` (ex. `noam`) — un seul segment lisible.
- **Réservation** : `/:slug/booking` — hiérarchie claire (artiste > booking).
- **Pas de query inutile** pour le contenu principal ; canonical sans query.
- **Ancres** : `/#pricing`, `/#faq`, `/#features` pour liens internes.

## Métadonnées dynamiques selon la route

- **Landing** : SEOHead + Organization, WebSite, FAQPage, SoftwareApplication.
- **À propos** : PageSEO + Organization, AboutPage.
- **Vitrine** : Helmet + canonical, LocalBusiness, og:image (avatar).
- **Booking** : PageSEO avec title/description dynamiques (nom artiste).
- **Login / Register** : PageSEO avec title template optionnel (SEOHead useTitleTemplate).

## Composants SEO

- **SEOHead** : title, description, OG, Twitter, canonical, JSON-LD ; option template + SoftwareApplication.
- **PageSEO** : même chose sans template.
- **Breadcrumbs** : fil d’Ariane + schema.org BreadcrumbList.

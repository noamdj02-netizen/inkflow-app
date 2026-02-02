# Rapport SEO — InkFlow (ink-flow.me)

**Date d'audit** : 2026  
**Domaine cible** : https://ink-flow.me  
**Objectif** : Bonnes pratiques 2026, Google, Bing, réseaux sociaux.

---

## 1. Problèmes détectés

### 1.1 Métadonnées (title, description, OG, Twitter)

| Page | Problème | Gravité |
|------|----------|---------|
| **index.html** | Title générique "InkFlow - Tattoo Booking SaaS" (27 car.) ; description courte ; **aucun og:image, og:url, twitter:image** | Haute |
| **Landing /** | Title OK ; **pas d'og:image** ; **pas de twitter:image, twitter:title, twitter:description** ; description OG plus courte que meta | Moyenne |
| **À propos /apropos** | **Pas d'OG ni Twitter** ; pas de JSON-LD | Moyenne |
| **Login /login** | Aucune balise meta (title/description) ; pas d'OG/Twitter | Moyenne |
| **Register /register** | Idem | Moyenne |
| **Vitrine /:slug** | OG/Twitter OK ; **pas de canonical** ; **pas de JSON-LD** (LocalBusiness/Person) | Moyenne |
| **Booking /:slug/booking** | Aucun Helmet / meta | Moyenne |
| **Payment success/cancel** | Aucun meta ; **noindex recommandé** pour pages de confirmation | Basse |
| **Mentions légales, Contact** | Placeholder : meta basiques manquants | Basse |

### 1.2 Structure sémantique HTML

| Élément | Statut |
|--------|--------|
| **Landing** | `<main id="main-content" role="main">` ✅ ; `<h1>` unique (Hero) ✅ ; sections avec `aria-label` ✅ ; nav présente ✅ |
| **Vitrine** | `<main>` ✅ ; `<h1>` dans ArtistHero (nom studio) ✅ ; sections `<section>` ✅ |
| **Login/Register** | `<main id="main-content" role="main">` ✅ ; `<h1>` unique ✅ |
| **Booking** | `<main>` + `<h1>` ✅ |
| **À propos** | `<header>` (nav) ✅ ; pas de `<main>` explicite (contenu dans div) — **à corriger** |
| **Hiérarchie h1→h2** | Globalement respectée ; quelques pages dashboard avec h1 par vue ✅ |

**Recommandation** : Ajouter `<main>` sur AproposPage et s’assurer qu’une seule balise `<h1>` par page.

### 1.3 Schema.org / JSON-LD

| Page | Statut |
|------|--------|
| **Accueil** | Aucun JSON-LD (Organization, WebSite, FAQPage recommandés) |
| **À propos** | Aucun (Organization, AboutPage) |
| **Vitrine artiste** | Aucun (LocalBusiness ou Person + ItemList pour flashs) |
| **Booking** | Aucun (pas prioritaire) |

### 1.4 Sitemap et robots.txt

| Fichier | Statut |
|---------|--------|
| **sitemap.xml** | **Absent** — à créer (URLs statiques + base pour vitrines si possible) |
| **robots.txt** | **Absent** — à créer (Allow /, Sitemap, règles pour /dashboard, /login, /register si besoin) |

### 1.5 Canonical URLs

| Page | Statut |
|------|--------|
| **Global** | Aucune balise `<link rel="canonical">` n’est définie (SPA : une URL = une page ; éviter duplicate avec trailing slash ou query) |
| **Vitrine** | URL dynamique : canonical = URL courante (déjà en og:url côté PublicArtistPage) ; **ajouter balise canonical** |

### 1.6 Performance (Core Web Vitals)

| Point | Statut |
|-------|--------|
| **LCP** | Favicon, preconnect fonts ✅ ; pas de preload pour LCP image si hero image |
| **CLS** | Structure stable ; `min-height` sur #root ✅ ; dimensions explicites sur images vitrine ✅ |
| **INP/FID** | Code splitting (lazy routes) ✅ ; pas d’audit dédié ici |
| **Fonts** | Plusieurs polices Google (Cinzel, Syne, Space Grotesk, Inter, Playfair) — **nombre élevé**, peut impacter LCP/CLS |

**Recommandations** :  
- Précharger la police principale du hero si possible.  
- Réduire ou subsetter les polices pour limiter le blocage du rendu.

---

## 2. Solutions recommandées

### 2.1 Constantes et composant SEO

- **Constante `SITE_URL`** : `https://ink-flow.me` (ou variable d’environnement `VITE_SITE_URL` en build).
- **Composant réutilisable `PageSEO`** (ou usage systématique de Helmet) avec :
  - `title` (50–60 caractères)
  - `meta description` (150–160 caractères)
  - `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
  - `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`
  - `link rel="canonical"` (URL absolue)
  - **JSON-LD** injecté via script type="application/ld+json"

### 2.2 Par page

- **Accueil** : Title 50–60 car., description 150–160 car., og:image absolue (ex. `https://ink-flow.me/og-default.png` ou `/pwa-512x512.png`), Twitter complet, JSON-LD Organization + WebSite (+ FAQPage si FAQ affichée).
- **À propos** : Title "À propos | InkFlow", description unique, OG/Twitter complets, JSON-LD Organization/AboutPage, `<main>` autour du contenu.
- **Login / Register** : Title + description (ex. "Connexion | InkFlow"), pas d’OG image obligatoire ; `noindex` possible pour éviter indexation des formulaires.
- **Vitrine** : Déjà bon ; ajouter **canonical** (URL courante), **JSON-LD LocalBusiness** (nom, description, image, url).
- **Booking** : Title dynamique "Réserver avec {nom} | InkFlow", description courte, OG/Twitter si partage utile.
- **Payment success/cancel** : Title + meta basiques ; **robots noindex, nofollow** pour éviter indexation des remerciements/annulations.
- **Mentions légales / Contact** : Title + description uniques ; noindex si contenu légal minimal.

### 2.3 Fichiers statiques

- **robots.txt**  
  - `User-agent: *`  
  - `Allow: /`  
  - `Disallow: /dashboard`  
  - `Disallow: /auth/`  
  - `Sitemap: https://ink-flow.me/sitemap.xml`

- **sitemap.xml**  
  - URLs statiques : `/`, `/login`, `/register`, `/apropos`, `/mentions-legales`, `/contact`.  
  - Pas d’URLs dynamiques (vitrines) sauf si génération côté serveur ou build avec liste d’artistes.

### 2.4 index.html

- Title par défaut 50–60 car.  
- Meta description par défaut 150–160 car.  
- Ajouter **og:image** (URL absolue), **og:url** (SITE_URL), **twitter:card** + **twitter:image** pour fallback quand React n’a pas encore hydraté.

---

## 3. Checklist d’implémentation

### Phase 1 — Fondations

- [x] Définir `SITE_URL` via `constants/seo.ts` (fallback `https://ink-flow.me` ; en prod définir `VITE_SITE_URL=https://ink-flow.me`).
- [x] Créer composant `PageSEO` dans `components/seo/PageSEO.tsx` (title, description, og, twitter, canonical, JSON-LD).
- [x] Créer `public/robots.txt`.
- [x] Créer `public/sitemap.xml` (URLs statiques).
- [x] Mettre à jour `index.html` : title, description, og:image, og:url, twitter (fallback).

### Phase 2 — Pages publiques

- [x] **Landing** : PageSEO avec title 50–60 car., description 150–160 car., og:image, Twitter, canonical `/`, JSON-LD Organization + WebSite + FAQPage.
- [x] **À propos** : PageSEO avec title, description, OG/Twitter, canonical `/apropos`, JSON-LD Organization + AboutPage ; `<main>` déjà présent.
- [x] **Login** : PageSEO "Connexion | InkFlow", description, canonical `/login`.
- [x] **Register** : PageSEO "Inscription | InkFlow", description, canonical `/register`.
- [x] **Vitrine /:slug** : Helmet avec canonical (URL courante), JSON-LD LocalBusiness, og:locale.
- [x] **Booking /:slug/booking** : PageSEO avec title/description dynamiques, canonical, og:image optionnelle (avatar artiste).
- [x] **Mentions légales / Contact** : PlaceholderPage avec PageSEO (title + description, canonical via pathname).
- [x] **Payment success/cancel** : PageSEO avec title + description et **noindex**.

### Phase 3 — Qualité

- [ ] Vérifier une seule balise `<h1>` par page.
- [ ] Vérifier `<main>` sur toutes les pages de contenu.
- [ ] Tester partage Facebook (Debugger) et Twitter (Card Validator) avec og:image 1200×630 recommandé.
- [ ] Soumettre sitemap dans Google Search Console et Bing Webmaster Tools.
- [ ] Optionnel : précharge police hero, réduire nombre de polices pour Core Web Vitals.

---

## 4. Variable d’environnement production

Pour que les canonical et OG utilisent bien le domaine **ink-flow.me** en production (Vercel, etc.) :

- **Vercel** : Settings → Environment Variables → `VITE_SITE_URL` = `https://ink-flow.me` (Production + Preview).
- **Build local** : créer un `.env.production` avec `VITE_SITE_URL=https://ink-flow.me`.

Sans cette variable, le code utilise `window.location.origin` (correct en runtime) ou le fallback `https://ink-flow.me` défini dans `constants/seo.ts`.

---

## 5. Références

- [Google Search Central — Meta tags](https://developers.google.com/search/docs/appearance/snippet)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/) — Organization, WebSite, LocalBusiness, Person, FAQPage
- [Core Web Vitals](https://web.dev/vitals/)

---

**Statut** : Audit réalisé et implémentation effectuée (Phase 1 et 2). Phase 3 : validation manuelle (partage social, Search Console).

---

## 6. Optimisations on-page (2026)

### Headers hiérarchiques

- **Landing** : 1 H1 (hero « Maîtrisez votre art »), H2 par section (Fonctionnalités, Portfolio, Témoignages, Tarifs, FAQ, CTA).
- **À propos** : 1 H1 (« Créé par des passionnés »), H2 par section (L’Histoire, Nos Valeurs, Contact).
- **Vitrine** : 1 H1 (nom studio dans ArtistHero), sections en `<section>` sans H2 redondant.
- **Booking** : 1 H1 (« Réserver avec {nom} »), H2 pour Date et Heure.
- **Login / Register / Placeholder** : 1 H1 par page.

### Alt text descriptifs

- **Landing** : images flashs → « Flash tatouage {title} — design réservable sur InkFlow ».
- **Vitrine** : avatar artiste → « Photo de profil de {nom}, tatoueur à {ville} » ; flashs → « Flash tatouage {title} — design réservable en ligne ».

### Liens internes

- **À propos** : lien Accueil (header), liens vers Tarifs (`/#pricing`) et accueil dans la section contact.
- **Landing** : CTA vers Register, lien « Qui sommes-nous ? » vers `/apropos`, ancres #features, #showcase, #pricing, #faq.
- **Breadcrumbs** : Accueil > page courante sur À propos, Booking, Vitrine, Mentions légales / Contact.

### Composants réutilisables

- **SEOHead** : template title optionnel (`%s | InkFlow`), schéma SoftwareApplication (SaaS), délègue à PageSEO.
- **PageSEO** : title, description, OG, Twitter, canonical, noindex, JSON-LD.
- **Breadcrumbs** : fil d’Ariane + schema.org BreadcrumbList ; `useBreadcrumbsFromPath()` pour dériver du pathname.

### URL slugs

Voir **`docs/url-slugs-seo.md`** pour la liste des routes SEO-friendly et bonnes pratiques.

### Données structurées JSON-LD (`lib/schema-markup.ts`)

- **Organization** : `getOrganizationSchema()` — Landing, À propos.
- **WebApplication** : `getWebApplicationSchema()` — Landing (Web, iOS, Android, offre gratuite).
- **SoftwareApplication** : `getSoftwareApplicationSchema()` — Landing (via SEOHead).
- **BreadcrumbList** : `getBreadcrumbListSchema(items, currentUrl)` — Breadcrumbs (À propos, Booking, Vitrine, Placeholder).
- **FAQPage** : `getFAQPageSchema(faqItems)` — Landing.
- **AggregateRating / Review** : `getTestimonialsAggregateSchema(count)`, `getReviewSchema()`, `getAggregateRatingSchema()` — Landing (témoignages = 5 étoiles, 3 avis).
- **LocalBusiness** : `getLocalBusinessSchema()` — Vitrine artiste.
- **AboutPage** : `getAboutPageSchema()` — À propos.

**Validation** : [Google Rich Results Test](https://search.google.com/test/rich-results) — coller l’URL (ex. https://ink-flow.me) ou le HTML généré.

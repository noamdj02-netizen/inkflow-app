# Rapport d’optimisation performance — ink-flow.me

**Stack** : **Vite + React** (pas Next.js). Les exemples ci-dessous sont adaptés à cette stack.

---

## 1. Core Web Vitals — objectifs et mesure

| Métrique | Cible | Mesure |
|----------|--------|--------|
| **LCP** (Largest Contentful Paint) | < 2,5 s | Lighthouse, Chrome DevTools (Performance) |
| **INP** (Interaction to Next Paint) | < 200 ms | Remplaçant FID ; Chrome DevTools |
| **CLS** (Cumulative Layout Shift) | < 0,1 | Lighthouse, Layout Shift dans Performance |
| **FCP** (First Contentful Paint) | < 1,8 s | Lighthouse |

**Comment mesurer** :
- **Lighthouse** : Chrome DevTools → onglet Lighthouse → analyser (Desktop + Mobile).
- **PageSpeed Insights** : https://pagespeed.web.dev/ → URL `https://ink-flow.me`.
- **Chrome User Experience** : `chrome://uxreport`.

---

## 2. Bottlenecks identifiés et recommandations

### 2.1 Bundle JavaScript / CSS

- **Vite** : code splitting automatique par route via `React.lazy()` — déjà en place (Landing non lazy, reste des routes lazy).
- **Analyse du bundle** : `npm run build` puis analyser `dist/assets/*.js` ou utiliser **rollup-plugin-visualizer** :
  ```bash
  npm i -D rollup-plugin-visualizer
  ```
  Dans `vite.config.ts` :
  ```ts
  import { visualizer } from 'rollup-plugin-visualizer';
  plugins: [
    react(),
    visualizer({ open: true, gzipSize: true }),
    // ...
  ]
  ```
- **Tree shaking** : Vite + Rollup le font par défaut ; privilégier les **imports nommés** (`import { X } from 'lib'`) plutôt que `import *`.

### 2.2 Requêtes réseau (waterfall)

- **Preconnect / dns-prefetch** : déjà `preconnect` pour Google Fonts ; ajouter pour `esm.sh` si import map l’utilise.
- **Prefetch de routes** : avec React Router, pas de `prefetch` natif comme Next.js ; possibilité de prefetch au hover sur `<Link>` (voir section Prefetching).
- **API** : regrouper les appels si possible ; SWR limite les doublons (dedupingInterval).

### 2.3 Images

- **Composant existant** : `OptimizedImage` (lazy via Intersection Observer, `priority` pour LCP).
- **Formats modernes** : servir **WebP** (et AVIF si le build le permet) côté backend/CDN ; pour les images hébergées (ex. Supabase Storage), utiliser des URLs avec paramètres de transformation si disponibles.
- **Responsive** : utiliser l’attribut `sizes` partout où c’est pertinent (ex. `(max-width: 768px) 100vw, 50vw`).
- **Hero / LCP** : première image above-the-fold avec `priority={true}` et si possible `loading="eager"`.

### 2.4 Polices

- **Google Fonts** : déjà `preconnect` + `display=swap` dans l’URL (`&display=swap`).
- **Réduction du nombre de polices** : plusieurs familles (Cinzel, Syne, Space Grotesk, Inter, Playfair) augmentent le coût ; envisager de n’en garder que 2–3 pour le premier chargement.

### 2.5 Scripts tiers

- **Import map** (esm.sh) : chargement externe ; prévoir `dns-prefetch` / `preconnect` pour réduire la latence.
- **Stripe / Supabase** : chargés côté client ; pas de blocage du rendu si chargés après l’hydratation.

---

## 3. Caching et headers HTTP

**Fichier** : `vercel.json` (voir section 4 ci-dessous).

- **Assets statiques (hashed)** : `Cache-Control: public, max-age=31536000, immutable`.
- **HTML** : `stale-while-revalidate` ou courte durée pour que les déploiements soient visibles rapidement.
- **PWA / manifest / icônes** : cache long avec révalidation.

---

## 4. Resource hints (preload, preconnect, dns-prefetch)

**Fichier** : `index.html`.

- Déjà en place : `preconnect` pour `fonts.googleapis.com` et `fonts.gstatic.com`.
- À ajouter si utilisé : `dns-prefetch` ou `preconnect` pour l’origine Supabase (optionnel, URL en env) et pour `esm.sh` si l’import map pointe dessus.
- **Preload** d’une image LCP : possible avec `<link rel="preload" as="image" href="/hero.webp" />` si une image hero est critique.

---

## 5. Code splitting (déjà en place)

- **Routes** : `React.lazy()` pour tout sauf la Landing et les pages critiques (Login, Register).
- **Composants lourds** : pour de gros composants (ex. éditeur, graphiques), utiliser `lazy()` + `<Suspense fallback={…}>`.
- **Fallback** : `DelayedFallback` (spinner après 300 ms) évite le flash sur navigations rapides.

---

## 6. Images et assets — rappel code

- **OptimizedImage** (déjà utilisé en vitrine) :
  ```tsx
  <OptimizedImage
    src={url}
    alt="..."
    priority={false}  // true pour LCP
    sizes="(max-width: 768px) 100vw, 50vw"
  />
  ```
- **Img natif** : pour les images non dynamiques, utiliser `loading="lazy"`, `width`/`height` et `sizes` pour limiter le CLS.

---

## 7. PWA et Service Worker

- **vite-plugin-pwa** : déjà configuré (Workbox, `globPatterns` pour js, css, html, ico, png, svg, woff2).
- **Stratégies** : par défaut cache-first pour les assets en build ; possible d’ajouter des routes `networkFirst` pour les API dans la config Workbox si besoin.

---

## 8. Écrans blancs / noirs

- **FOUC** : fond `#0a0a0a` dans `index.html` et `#root` pour correspondre au thème.
- **Suspense** : `DelayedFallback` évite un spinner immédiat ; on peut ajouter des **skeletons** par route (ex. `DashboardSkeleton`, `LandingSkeleton`) pour mieux coller au layout final.
- **ErrorBoundary** : déjà en place pour éviter un écran blanc en cas d’erreur React.

---

## 9. Base de données et API

- **Supabase** : sélectionner uniquement les colonnes nécessaires (`select('id, name')`), utiliser des index sur les colonnes filtrées/triées.
- **API Vercel** : ajouter des headers `Cache-Control` sur les routes GET (ex. `public, s-maxage=60, stale-while-revalidate=120`).
- **Pagination** : privilégier le cursor-based quand c’est pertinent.

---

## 10. Checklist d’optimisation (adaptée Vite/React)

### Performance
- [ ] LCP < 2,5 s (Lighthouse)
- [ ] INP < 200 ms
- [ ] CLS < 0,1
- [ ] Bundle initial < 200 KB (gzip) — vérifier avec `npm run build` + analyseur
- [ ] Lazy loading des images below-the-fold (OptimizedImage)
- [ ] `priority` sur l’image LCP
- [ ] Preconnect / dns-prefetch pour origines critiques
- [ ] Cache-Control sur assets statiques (vercel.json)
- [ ] Réduire le nombre de polices Google Fonts si possible

### UX / chargement
- [ ] Pas d’écran blanc (fond + DelayedFallback / skeletons)
- [ ] Error boundaries sur les routes sensibles
- [ ] PWA installable (manifest + SW déjà en place)

### SEO (déjà traité ailleurs)
- [ ] Métadonnées, schema.org, sitemap, robots.txt — voir `docs/seo-report.md`

### Monitoring (optionnel)
- [ ] Web Vitals reporting (hook + envoi à analytics)
- [ ] Vercel Analytics / Speed Insights si déployé sur Vercel

---

## 11. Snippets de correction

### Cache headers (vercel.json) — appliqués
- **`/assets/*`** (JS/CSS hashed par Vite) : `Cache-Control: public, max-age=31536000, immutable`
- **`/pwa-*.png`**, **`/inkflow-logo-v2.png`** : `max-age=31536000, immutable`
- **`/manifest.webmanifest`** : `max-age=86400, stale-while-revalidate=3600`
- **`/images/*`** : `max-age=2592000, stale-while-revalidate=86400`
- **`/*`** (HTML et reste) : `s-maxage=10, stale-while-revalidate=59` + en-têtes de sécurité

### Preconnect esm.sh (index.html)
Si l’import map charge des modules depuis `esm.sh`, ajouter :
```html
<link rel="dns-prefetch" href="https://esm.sh" />
<link rel="preconnect" href="https://esm.sh" crossorigin />
```

### Preload image LCP (optionnel)
Si une image hero est toujours la même (ex. `/hero.webp`) :
```html
<link rel="preload" as="image" href="/hero.webp" />
```

### Skeleton de chargement (exemple)
Pour une page dashboard :
```tsx
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="h-8 bg-zinc-800 rounded w-1/4" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
```
Puis : `<Suspense fallback={<DashboardSkeleton />}><DashboardOverview /></Suspense>` (à adapter selon la structure des routes).

---

**Résumé** : Le projet (Vite + React) a déjà du code splitting par route, un composant d’images optimisées, une PWA et un fallback de chargement. Les prochaines étapes prioritaires sont : headers de cache, resource hints, mesure Lighthouse régulière, et réduction des polices / bundle si nécessaire.

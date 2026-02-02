# Rapport LCP & PWA — Optimisations Fluidité et Installation

**Projet** : InkFlow (Léna MVP)  
**Objectifs** : fluidité perçue, chargement instantané après 1ère visite, incitation à l’installation (focus iOS/Android).

---

## 1. Livrables réalisés

### 1.1 Manifest (Web App Manifest)

- **Fichier** : généré par `vite-plugin-pwa` → `dist/manifest.webmanifest` (et injecté dans l’app).
- **Configuration** (dans `vite.config.ts`) :
  - **name** : InkFlow - Tattoo Manager  
  - **short_name** : InkFlow  
  - **description** : Gestion simplifiée pour tatoueurs pro. Réservations, flashs, paiements.  
  - **theme_color** : `#0f172a`  
  - **background_color** : `#0f172a`  
  - **display** : `standalone`  
  - **orientation** : `portrait`  
  - **scope** : `/`  
  - **start_url** : `/`  
  - **lang** : `fr`  
  - **categories** : `['business', 'productivity']`  
  - **prefer_related_applications** : `false`  
  - **icons** : 192×192 (any), 512×512 (any + maskable)

### 1.2 Service Worker & cache

- **Stratégie** : Workbox (via Vite PWA).
  - **Précache** : tous les assets buildés (`**/*.{js,css,html,ico,png,svg,woff2,woff}`) → chargement instantané après 1ère visite.
  - **Runtime cache** :
    - **Google Fonts** (fonts.googleapis.com, fonts.gstatic.com) : `StaleWhileRevalidate`, 1 an, 20 entrées.
    - **Images** (png, jpg, svg, gif, webp, ico) : `CacheFirst`, 30 jours, 64 entrées.
- **Mise à jour** : `registerType: 'autoUpdate'` pour prendre les nouveaux builds sans action utilisateur.

### 1.3 Bouton « Installer l’application »

- **Composants** : `components/PWAInstallPrompt.tsx`
  - **PWAInstallPrompt** : bannière flottante (Android) quand `beforeinstallprompt` est disponible.
  - **PWAInstallButton** : bouton pour le dashboard (sidebar desktop + menu mobile).
- **Détection** :
  - **Device** : iOS (`/iPad|iPhone|iPod/`), Android (`/Android/`).
  - **Déjà installé** : `display-mode: standalone` ou `navigator.standalone === true` (iOS legacy).
- **Android** : capture de `beforeinstallprompt`, `e.prompt()` au clic sur « Installer ».
- **iOS** : pas de prompt natif → modale personnalisée avec instructions visuelles :
  1. Appuyer sur le bouton **Partager** (icône carré avec flèche).
  2. Sélectionner **« Sur l’écran d’accueil »**.
  3. Confirmer → icône InkFlow sur l’écran d’accueil.
- **UI** : bouton mis en avant (`variant="prominent"`) en dashboard (amber, icône Download), masqué si l’app est déjà installée.

### 1.4 Fluidité & transitions

- **Skeletons entre pages** : après 400 ms de chargement d’une route, affichage d’un **RouteSkeletonFallback** (structure type header + blocs) au lieu du spinner seul → réduction du sentiment d’attente.
- **Lazy loading** :
  - Routes : toutes les pages (hors landing) en `React.lazy()`.
  - Images : composant **OptimizedImage** (Intersection Observer, `priority` pour LCP, skeleton pendant le chargement).

---

## 2. Mesure du LCP (Largest Contentful Paint)

### 2.1 Outils

- **Lighthouse** (Chrome DevTools) : onglet Lighthouse → « Analyse des performances » (Mobile).
- **PageSpeed Insights** : https://pagespeed.web.dev/ → URL `https://ink-flow.me` (ou l’URL de preview Vercel).
- **Chrome UX (CrUX)** : https://chromeuxreport.com/ (données terrain).

### 2.2 Méthode recommandée

1. **Avant déploiement** : `npm run build && npx vite preview` → ouvrir en mode Mobile (throttling 4G) → Lighthouse.
2. **Après déploiement** : PageSpeed Insights sur l’URL de prod (mobile).
3. **Cible** : LCP < 2,5 s (bon), < 1,2 s (excellent).

### 2.3 Optimisations déjà en place (impact LCP)

| Optimisation | Impact attendu sur LCP |
|-------------|-------------------------|
| Polices critiques seules (Syne + Space Grotesk) en premier | Moins de blocage réseau, FCP/LCP plus tôt |
| Lazy Login/Register + chunks séparés | Bundle initial plus léger, exécution plus rapide |
| `fetchpriority="high"` sur le script d’entrée | Priorisation du JS principal sur mobile |
| Precache SW (2e visite) | LCP très bas sur les visites suivantes |
| Runtime cache Google Fonts + images | Moins de requêtes réseau, LCP stable |
| OptimizedImage + `priority` pour l’image LCP | LCP élément (image) chargé en priorité |
| Skeleton au lieu d’un long spinner | Meilleur ressenti (pas de réduction directe du LCP) |

### 2.4 Exemple de suivi

- **Avant** : noter le LCP (s) et le score Performance Lighthouse sur une URL type `/` ou `/dashboard`.
- **Après** : relancer les mêmes mesures après déploiement des changements (SW, cache, lazy, fonts).
- **Rapport** : documenter dans ce fichier ou dans un tableau « Avant / Après » (ex. LCP 3,2 s → 2,1 s, Score 72 → 88).

---

## 3. Fichiers modifiés / ajoutés

| Fichier | Rôle |
|---------|------|
| `vite.config.ts` | Manifest enrichi, Workbox runtime cache (fonts, images), globPatterns woff |
| `components/PWAInstallPrompt.tsx` | Hook `useInstallState`, modale iOS visuelle, bouton prominent, standalone + iOS legacy |
| `components/common/RouteSkeletonFallback.tsx` | Skeleton de transition entre pages |
| `components/common/DelayedFallback.tsx` | Spinner 400 ms puis skeleton |
| `components/dashboard/DashboardLayout.tsx` | PWAInstallButton (prominent) sidebar desktop + mobile |
| `docs/LCP_PWA_OPTIMIZATION_REPORT.md` | Ce rapport |

---

## 4. Checklist post-déploiement

- [ ] Vérifier sur iPhone : modale « Installer » → instructions Partager / Sur l’écran d’accueil.
- [ ] Vérifier sur Android : bannière ou bouton → prompt natif d’installation.
- [ ] Vérifier en mode standalone : bouton « Installer » masqué.
- [ ] Lighthouse (mobile) sur `/` et une page dashboard : LCP et score Performance.
- [ ] 2e visite (même appareil) : rechargement quasi instantané grâce au SW.

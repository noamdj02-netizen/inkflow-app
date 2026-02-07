# Audit Cybersécurité & Performance – InkFlow

**Date :** Février 2025  
**Périmètre :** Performance (Vitrine & images), Sécurité (API & données), Robustesse (erreurs, liens/boutons).

---

## 1. Performance (Vitrine & Images)

### Ce qui est bien en place

- **OptimizedImage** (`components/common/OptimizedImage.tsx`) : Intersection Observer + `loading="lazy"` / `eager` selon `priority`, skeleton, fallback, `decoding="async"`, `fetchPriority`. Utilisé dans **FlashCard** (vitrine) et **ImageSkeleton**.
- **Vitrine** (`components/vitrine/FlashGallery.tsx`) : Grille de flashs via **FlashCard** → **OptimizedImage** ; `priority={index < 2}` pour les 2 premières images (LCP). Filtres par style avec `useMemo` (pas de recalcul inutile).
- **PublicArtistPage** : Image du flash dans le drawer avec `loading="lazy"` ; avatar Hero avec `loading="eager"` (LCP).
- **Dashboard** : Lazy loading des widgets (`React.lazy`) + Suspense ; pas de boucles lourdes identifiées dans le scroll.

### Points à corriger

| Priorité | Fichier | Problème | Recommandation |
|----------|---------|----------|----------------|
| **MOYEN** | `LandingPage.tsx` (≈ L.471) | Section Vitrine (preview) : `<img>` sans `loading="lazy"` ni `OptimizedImage`. 4 images chargées d’un coup. | Ajouter `loading="lazy"` sur les `<img>` de la grille démo, ou utiliser `OptimizedImage` avec `priority={false}`. |
| **FAIBLE** | `FlashGallery.tsx` (page /flashs) | Grille utilise `<img loading="lazy">` sans Intersection Observer. | Optionnel : réutiliser `OptimizedImage` pour différer le chargement jusqu’à l’approche du viewport (meilleur comportement sur mobile). |
| **FAIBLE** | `vitrine/FlashGallery.tsx` | `filteredFlashs` recalculé à chaque render (simple `.filter`). | Déjà raisonnable ; si la liste devient très grande (>100), mémoïser avec `useMemo(() => flashs.filter(...), [flashs, activeFilter])`. |

**Résumé :** Pas de `next/image` (projet Vite/React), mais **lazy loading** et **OptimizedImage** sont bien utilisés côté vitrine. Risque de lag au scroll surtout sur la **Landing** (images Vitrine sans lazy). Aucune boucle lourde critique identifiée.

---

## 2. Sécurité (API & Données)

### Ce qui est bien en place

- **submit-project-request** : `validateProjectSubmission` (Zod) en entrée ; `parseRequestBody` robuste (string, Buffer, object) ; rate limiting ; try/catch avec logs ; pas de requêtes SQL brutes (Supabase client = paramétré).
- **send-care-instructions** : `careInstructionsSchema.safeParse` (Zod) ; échappement HTML (`escapeHtml`, `sanitizeText`) pour les emails.
- **utils/validation.ts** : Schémas Zod stricts (`.strict()`), regex UUID/email, limites de longueur ; pas d’injection SQL possible via les appels Supabase utilisés.
- **Webhook Stripe** : Vérification de signature ; body géré en string/Buffer pour la signature.

### Points à corriger

| Priorité | Fichier | Problème | Recommandation |
|----------|---------|----------|----------------|
| **CRITIQUE** | `api/create-payment-intent.ts` (L.49) | `body = JSON.parse(req.body || '{}')` : si Vercel fournit déjà un objet, `JSON.parse(object)` peut lever une exception ou produire un résultat incorrect. | Utiliser le même pattern que `create-checkout-session` : `body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})` ; entourer d’un try/catch et renvoyer 400 en cas d’erreur. |
| **CRITIQUE** | `api/create-flash-checkout.ts` (L.49) | Même risque que ci‑dessus avec `JSON.parse(req.body || '{}')`. | Idem : parser seulement si `typeof req.body === 'string'`, sinon utiliser `req.body` ; try/catch + 400. |
| **MOYEN** | `api/send-care-instructions.ts` (L.68) | `careInstructionsSchema.safeParse(req.body)` : si `req.body` est une string (body brut), Zod reçoit une string au lieu d’un objet et la validation échoue. | Normaliser le body : `const raw = typeof req.body === 'string' ? (try JSON.parse(req.body) : {}) : (req.body || {})` ; puis `careInstructionsSchema.safeParse(raw)`. |
| **MOYEN** | `api/availability.ts` (L.36) | `slug` seulement `.trim()` ; pas de validation de format ni de longueur. Risque DoS (très longue chaîne) ou comportement inattendu. | Valider avec Zod ou au minimum : `slug.length <= 100` et regex `^[a-z0-9-]+$` ; renvoyer 400 si invalide. |
| **MOYEN** | `api/create-checkout-session/route.ts` | Champs `priceId`, `userId` vérifiés en “présence” mais pas de schéma Zod (format UUID, format Stripe). | Ajouter un schéma Zod (ex. `userId` UUID, `priceId` string Stripe) pour renforcer la validation et éviter des valeurs malformées. |
| **MOYEN** | `api/tattoo-advice.ts` (L.27) | `message` sans limite de longueur ; envoi direct dans le prompt IA. Risque coût/temps de réponse si message énorme, et potentiel abus. | Limiter la longueur (ex. `message.slice(0, 2000)` ou schéma Zod `.max(2000)`). |
| **FAIBLE** | `api/calendar/feed.ts` | `artist_id` et `token` issus de la query sans schéma Zod. Utilisation dans `.eq()` uniquement (Supabase paramétré) : pas d’injection SQL. | Optionnel : valider `artist_id` (UUID) et `token` (longueur max) pour éviter des requêtes inutiles. |

**Résumé :** Pas d’injection SQL (Supabase client). Risques principaux : **parsing du body** incohérent (create-payment-intent, create-flash-checkout, send-care-instructions) pouvant provoquer des 500 ou des rejets valides ; **validation insuffisante** sur slug (availability) et message (tattoo-advice). À traiter en priorité les deux CRITIQUES.

---

## 3. Robustesse (Bugs potentiels, erreurs 500)

### Ce qui est bien en place

- **submit-project-request** : try/catch global ; try/catch sur `getClientIP` ; logs détaillés ; réponses JSON cohérentes.
- **availability.ts**, **calendar/feed.ts**, **tattoo-advice.ts**, **webhooks/stripe** : try/catch autour de la logique principale.
- **create-checkout-session**, **create-payment-intent**, **create-flash-checkout** : try/catch avec retour 400/500.
- Liens et boutons parcourus : les éléments interactifs ont soit un `onClick`, soit un `href` / `Link to=` ; pas de bouton “vide” détecté.

### Points à corriger

| Priorité | Fichier | Problème | Recommandation |
|----------|---------|----------|----------------|
| **CRITIQUE** | `api/create-payment-intent.ts` | En plus du parsing (voir §2), si `requireEnv(...)` lève avant le try/catch effectif, l’erreur peut remonter et provoquer une 500 non formatée. | S’assurer que tout le handler (y compris `requireEnv`) est dans un try/catch ; en cas d’erreur, `json(res, 500, { error: 'Configuration error' })` et `console.error`. |
| **CRITIQUE** | `api/create-flash-checkout.ts` | Même risque que ci‑dessus (requireEnv + parsing). | Idem : tout le handler dans try/catch ; réponses 500 explicites. |
| **MOYEN** | `api/availability.ts` (L.41) | `requireEnv` peut throw ; le catch actuel attrape tout, mais le message renvoyé au client peut exposer `err.message` (ex. nom de variable d’env). | Dans le catch : ne pas renvoyer `err.message` tel quel ; renvoyer un message générique ("Erreur serveur") et logger `err` côté serveur. |
| **MOYEN** | `api/calendar/feed.ts` | Idem : en cas d’erreur, éviter d’exposer des détails internes dans la réponse. | Réponse texte/JSON générique ; détail uniquement dans les logs. |
| **FAIBLE** | `LandingPage.tsx` (L.800–801) | Liens "Mentions légales" et "Contact" avec `href="#"` ; pas d’action réelle. | Remplacer par des routes ou des ancres réelles (ex. `/mentions-legales`, `/contact`) ou `role="button"` + modal si prévu. |

**Résumé :** Les APIs ont globalement des try/catch ; le principal risque de 500 “mystérieuse” vient du **parsing du body** (create-payment-intent, create-flash-checkout) quand `req.body` est déjà un objet. Corriger le parsing + s’assurer que tout le handler (y compris env) est sous try/catch réduit fortement le risque. Liens `#` sur la Landing à clarifier (intention produit).

---

## Synthèse par priorité

### CRITIQUE (à traiter en premier)

1. **create-payment-intent.ts** : Parser le body comme dans create-checkout-session (string vs object) ; tout le handler dans try/catch ; réponses 500 contrôlées.
2. **create-flash-checkout.ts** : Même correction (parsing body + try/catch global).

### MOYEN

3. **LandingPage.tsx** : Ajouter `loading="lazy"` (ou OptimizedImage) sur les images de la section Vitrine.
4. **send-care-instructions.ts** : Normaliser `req.body` (string → JSON.parse) avant `careInstructionsSchema.safeParse`.
5. **availability.ts** : Valider `slug` (longueur + format) ; en catch, ne pas renvoyer `err.message` au client.
6. **create-checkout-session** : Renforcer la validation (Zod) pour `priceId` / `userId`.
7. **tattoo-advice.ts** : Limiter la longueur de `message` (ex. 2000 caractères).
8. **calendar/feed.ts** : Réponse d’erreur générique (pas de fuite de détail).

### FAIBLE

9. **LandingPage** : Remplacer `href="#"` (Mentions légales, Contact) par des URLs ou comportements définis.
10. **FlashGallery.tsx** (/flashs) : Envisager OptimizedImage pour un meilleur lazy load.
11. **calendar/feed.ts** : Validation optionnelle de `artist_id` et `token`.

---

## Actions recommandées (ordre d’exécution)

1. Corriger le parsing du body dans **create-payment-intent.ts** et **create-flash-checkout.ts** (pattern string vs object + try/catch).
2. Normaliser le body dans **send-care-instructions.ts** avant validation Zod.
3. Ajouter `loading="lazy"` sur les images Vitrine de **LandingPage.tsx**.
4. Valider le `slug` dans **availability.ts** et limiter la longueur de `message` dans **tattoo-advice.ts**.
5. Vérifier que toutes les réponses d’erreur API n’exposent pas de détails internes (message générique + log serveur).
6. Clarifier les liens Mentions légales / Contact sur la Landing.

Une fois les points CRITIQUES et MOYEN traités, la stabilité (notamment vis‑à‑vis des 500) et la sécurité des API seront nettement renforcées, et la vitrine/landing plus légères au chargement et au scroll.

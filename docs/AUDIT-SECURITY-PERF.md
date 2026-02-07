# Audit Sécurité & Performance — InkFlow

## 1. SÉCURITÉ

### 1.1 Middleware (corrigé)
- **Routes protégées** : `/dashboard/*` et `/onboarding/*` → redirection vers `/login` si non connecté.
- **Guest only** : `/login` et `/register` → redirection vers `/dashboard` si déjà connecté.
- **Cookies** : Lors d’une redirection, les cookies de session Supabase sont recopiés sur la réponse de redirection pour ne pas perdre la session.
- **Rate limiting** : Limite par IP sur `/api/bookings/*`, `/api/availability`, `/api/creneaux`, `/login`, `/register` (15 req/min pour login/register, 30 pour les API).

### 1.2 Validation Zod (Server Actions)
- **`createBookingSession`** dans `lib/actions/booking.ts` : toutes les entrées sont validées avec un schéma Zod (`createBookingSessionSchema`) avant tout appel Prisma ou Stripe (types, plages, `endTime > startTime`, `depositAmount <= price`).
- **À faire** : Appliquer le même principe aux autres Server Actions et aux API routes qui prennent du JSON (ex. `POST /api/availability` avec un schéma Zod).

### 1.3 Injections & XSS
- **Audit** : Aucun `dangerouslySetInnerHTML` ni `$queryRaw` / `$executeRaw` non paramétré dans le code source. À conserver ainsi.

### 1.4 En-têtes de sécurité (`next.config.js`)
- **HSTS** : `Strict-Transport-Security` (production uniquement).
- **X-Frame-Options** : `SAMEORIGIN`.
- **X-Content-Type-Options** : `nosniff`.
- **X-XSS-Protection** : `1; mode=block`.
- **Referrer-Policy** : `strict-origin-when-cross-origin`.
- **Permissions-Policy** : caméra / micro / géoloc désactivés par défaut.

---

## 2. PERFORMANCE & BASE DE DONNÉES

### 2.1 Index Prisma (`schema.prisma`)
- **Booking** : index ajouté `@@index([artistId, startTime, endTime])` pour les requêtes de chevauchement (créneaux, calendrier).
- Index déjà présents utilisés : `[artistId, startTime]`, `[artistId, status, startTime]`, `[clientId]`, `[serviceId]`, `[status]`.

### 2.2 N+1
- **`app/api/creneaux/route.ts`** : pour chaque créneau retourné par `detecterCreneauxDisponibles`, un appel à `verifierDisponibilite` (plusieurs requêtes Prisma) est fait → N+1.
- **Recommandation** : calculer les créneaux disponibles en une seule passe dans `lib/booking-utils.ts` (comme `getAvailableSlots`) en réutilisant une seule requête de bookings sur la plage, puis filtrer en mémoire, et ne plus appeler `verifierDisponibilite` dans une boucle.

### 2.3 Caching (vitrine artiste)
- **Pages** : `app/[slug]/page.tsx` et `app/(public)/artist/[slug]/page.tsx` (Supabase `artists` + `flashs`).
- **Recommandation** : utiliser `unstable_cache` (ou `fetch` avec `next: { revalidate }`) autour de l’appel Supabase, par exemple :
  - `unstable_cache(async () => { ... supabase.from('artists') ... }, ['artist', slug], { revalidate: 60 })` (60 s).
- Ou, si les données sont servies par une Route Handler : `fetch(..., { next: { revalidate: 60 } })` côté serveur.

---

## 3. RATE LIMITING

- **Implémentation** : `lib/rate-limit.ts` (limite en mémoire par processus).
- **Middleware** : appliqué aux chemins sensibles (bookings, availability, creneaux, login, register).
- **Production** : pour plusieurs instances, utiliser **Upstash** :
  1. `npm install @upstash/ratelimit @upstash/redis`
  2. Créer un Redis sur [Upstash](https://upstash.com), récupérer `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.
  3. Dans `lib/rate-limit.ts`, ajouter une branche qui utilise `Ratelimit` d’Upstash quand les variables d’env sont définies, et garder le fallback mémoire en dev.

---

## 4. LIVRABLES

| Fichier | Modifications |
|--------|----------------|
| `middleware.ts` | Protection `/dashboard` + `/onboarding`, guest-only `/login` et `/register`, copie des cookies sur redirection, rate limiting par IP sur chemins sensibles. |
| `prisma/schema.prisma` | Index `@@index([artistId, startTime, endTime])` sur `Booking`. |
| `lib/actions/booking.ts` | Schéma Zod `createBookingSessionSchema` et validation systématique avant Prisma/Stripe. |
| `next.config.js` | En-têtes de sécurité (HSTS en prod uniquement, X-Frame-Options, X-Content-Type-Options, etc.). |
| `lib/rate-limit.ts` | Nouveau : rate limit en mémoire + helper `getIdentifierFromRequest`. |

Après modification du schéma Prisma, exécuter : `npx prisma generate` (et migration si besoin).

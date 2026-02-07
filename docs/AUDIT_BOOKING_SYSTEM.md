# Audit Sécurité & Logique – Système de Réservation InkFlow

**Date :** 2 février 2025  
**Périmètre :** Routing/Vitrines, Calendrier/Disponibilités, Intégrité Supabase (RLS), Edge Cases (annulation, timezones).

---

## Synthèse exécutive

| Pilier | État | Risque principal |
|--------|------|-------------------|
| 1. Routing & Slugs | ✅ Correct | Aucun majeur |
| 2. Calendrier & Disponibilités | ⚠️ À renforcer | Race condition partiellement couverte par trigger DB ; horaires figés ; timezone serveur |
| 3. Intégrité Supabase | 🔴 Critique | INSERT booking depuis le client (anon) vs RLS « pas d’INSERT public » |
| 4. Edge Cases | ⚠️ À renforcer | Annulation sans workflow Stripe ; timezones non explicites |

---

## 1. Routing & Slugs (Vitrines)

### 1.1 Récupération des données via le slug

- **Fichiers :** `hooks/usePublicArtist.ts`, `api/availability.ts`, `api/calendar/feed.ts`.
- **Logique :** Données artiste/vitrine récupérées via `slug_profil` (unique, indexé). `usePublicArtist` gère le cas « artiste introuvable » (code Supabase `PGRST116` → `notFound: true`).
- **Lien Artist ↔ Vitrine :** Un artiste = un `slug_profil` ; les flashs sont liés par `artist_id`. Lien cohérent.

### 1.2 Gestion 404 si le slug n’existe pas

- **API `GET /api/availability?slug=xxx` :** Retourne `404` avec `{ error: 'Artiste introuvable' }` si aucun artiste pour le slug. Validation du format slug (regex `[a-z0-9_-]+`).
- **Front :** `usePublicArtist` expose `notFound` ; les pages publiques peuvent afficher une page 404 ou message adapté.

**Verdict :** Pas de faille identifiée. Recommandation : s’assurer que la page publique (ex. `PublicArtistPage` / route `/:slug`) affiche bien une UI 404 lorsque `notFound === true`.

---

## 2. Logique Calendrier & Disponibilités

### 2.1 Calcul des créneaux disponibles

- **Fichier :** `api/availability.ts`.
- **Comportement :** Créneaux sur 30 jours, jours ouvrés Lun–Ven (ISO 1–5), 9h–18h, pas 60 min. Exclut les créneaux passés et ceux qui chevauchent des réservations `confirmed` ou `pending`.

**Problèmes :**

1. **Horaires figés :** `DEFAULT_WORK_DAYS`, `DEFAULT_START_HOUR`, `DEFAULT_END_HOUR` sont en dur. Un tatoueur ne peut pas définir ses propres horaires/plages.
2. **Timezone :** Les dates/heures sont construites avec `new Date()` et `setHours()` côté serveur → **fuseau du serveur (souvent UTC)**. Un « 9h–18h » affiché pour l’artiste doit correspondre à son fuseau (ex. Europe/Paris), pas à celui du serveur.

### 2.2 Race condition (deux clients réservent le même créneau)

- **Côté app :**  
  - `PublicArtistPage` : vérification overlap (lecture des bookings) puis INSERT booking puis appel Edge Function Stripe.  
  - Entre la lecture des créneaux et l’INSERT, un autre client peut réserver le même créneau.
- **Côté base :**  
  - `supabase/migration-prevent-booking-overlap.sql` : trigger `check_booking_no_overlap` sur `bookings` (BEFORE INSERT OR UPDATE). Il rejette tout INSERT/UPDATE qui crée un chevauchement avec un booking `pending` ou `confirmed` pour le même `artist_id` (erreur `23P01`).
- **Conclusion :** La race est **partiellement couverte** : le 2ᵉ INSERT échouera au niveau DB. En revanche :
  - Le 1ᵉ client peut abandonner après l’INSERT (sans payer) → booking `pending` orphelin qui bloque le créneau jusqu’à nettoyage ou timeout.
  - Aucune logique « expiration » des bookings `pending` (ex. 15 min) n’a été vue.

**Recommandations :**

- Conserver le trigger (déjà bien).
- Ajouter un job ou une contrainte métier pour expirer/annuler les `pending` non payés après X minutes.
- Optionnel : verrouillage pessimiste (SELECT FOR UPDATE) dans une route API dédiée « réserver ce créneau » pour réduire la fenêtre de concurrence.

### 2.3 Prise en compte des horaires d’ouverture

- Actuellement **non** : pas de table `artist_availability` ou champs type `working_hours`. Les créneaux sont uniquement dérivés des constantes dans `availability.ts`.

**Recommandation :** Introduire un modèle (ex. plages par jour de la semaine + timezone artiste) et adapter `availability.ts` pour en tenir compte.

---

## 3. Intégrité des données (Supabase)

### 3.1 Insertion des rendez-vous (bookings)

- **Flux actuel (réservation flash avec créneau) :**
  1. Client : formulaire sur `PublicArtistPage` (créneau + flash + email/nom).
  2. **Insert booking côté client** : `supabase.from('bookings').insert(insertPayload)` avec le client Supabase **anon** (`services/supabase.ts` → `VITE_SUPABASE_ANON_KEY`).
  3. Puis appel Edge Function `create-checkout-session` avec `booking_id`, qui crée une session Stripe avec `metadata.booking_id`.
  4. Webhook Stripe `checkout.session.completed` : met à jour le booking (`statut_booking: 'confirmed'`, `statut_paiement: 'deposit_paid'`) via **service role**.

- **Problème critique :**  
  - `migration-security-rls-audit.sql` **supprime** la policy `"Public can insert bookings"` et ne définit **aucune** policy INSERT sur `bookings` pour les anonymes.  
  - Donc, si cette migration est appliquée, **l’INSERT depuis le client (anon) doit être refusé par RLS** → le flux de réservation publique est cassé.  
  - Si la migration n’est pas appliquée et qu’une ancienne policy « Public can insert bookings » existe encore, alors tout client peut insérer des lignes dans `bookings` (avec un `artist_id` choisi par lui tant qu’il n’y a pas de WITH CHECK strict) → **risque d’intégrité et d’abus**.

**Recommandation (obligatoire) :** Ne pas rétablir une policy INSERT publique large. Créer une **route API côté serveur** (Vercel) qui :

1. Reçoit : slug (ou artist_id vérifié), `flash_id`, créneau (`date_debut` / `date_fin`), email, nom, etc.
2. Vérifie l’artiste et le flash (appartenance, dispo).
3. Vérifie l’absence de chevauchement (comme aujourd’hui en base).
4. Insère le booking avec le **service role**.
5. Retourne `booking_id` au client.
6. Le client appelle ensuite l’Edge Function Stripe avec ce `booking_id`.

Cela aligne le flux avec la règle RLS « pas d’INSERT public sur bookings » et garantit que `artist_id` et les champs sont contrôlés côté serveur.

### 3.2 Liaison user_id (client) et artist_id (tatoueur)

- **Schéma :** `bookings` a `artist_id` (FK vers `artists`), `client_email`, `client_name`, pas de `user_id` client (réservation possible sans compte).
- **Côté serveur (webhook, Edge Function) :** `artist_id` et `booking_id` viennent du flux (metadata Stripe ou paramètres contrôlés par l’API). Pas de risque de découplage si l’insertion est faite côté serveur avec vérification artiste/flash.

**Verdict :** Dès que l’INSERT booking sera fait par une API (service role), la liaison artist_id est fiable. Aujourd’hui, avec INSERT client, un utilisateur malveillant pourrait en théorie envoyer un `artist_id` arbitraire si une ancienne policy le permet.

### 3.3 RLS (Row Level Security)

- **Policies actuelles (après `migration-security-rls-audit.sql`) :**
  - `bookings` : SELECT et UPDATE uniquement pour l’artiste (`artist_id::text = auth.uid()::text`). Pas d’INSERT pour les anonymes.
- **Conséquence :** Un client ne peut pas lire ni modifier les bookings des autres ; seul l’artiste propriétaire peut. C’est cohérent avec un flux où l’INSERT est fait par une API (service role).

**Recommandation :** Une fois l’API d’insertion de booking en place, ne pas ajouter de policy INSERT sur `bookings` pour `anon` ; garder les policies actuelles SELECT/UPDATE par artiste.

---

## 4. Expérience utilisateur (Edge Cases)

### 4.1 Annulation au dernier moment

- **Côté produit :**
  - Annulation **paiement** : l’utilisateur quitte Stripe Checkout → `cancel_url` (ex. `/payment/cancel`). Aucun appel automatique au backend pour mettre le booking en `cancelled`. Le booking reste en `pending`.
  - Annulation **après confirmation** : dans le dashboard, l’artiste peut passer un booking en `cancelled` (`DashboardCalendar.tsx`, `handleStatusUpdate('cancelled')`). Aucune logique de remboursement Stripe ou d’annulation de session côté code vu.
- **Risques :**
  - Bookings `pending` orphelins (client parti sans payer) bloquent le créneau.
  - Pas de politique claire « annulation par le client » (lien magique, email, etc.) ni de synchronisation avec Stripe (refund, annulation de session).

**Recommandations :**

- Page `/payment/cancel` : appeler une API légère qui, si un `session_id` ou `booking_id` est connu (ex. en query param ou stocké avant redirection), marque le booking comme `cancelled` ou le supprime, pour libérer le créneau (à définir selon UX : supprimer vs garder en `cancelled`).
- Pour les annulations par l’artiste : documenter ou implémenter un flux de remboursement Stripe si besoin (hors périmètre strict du code vu).
- Mettre en place l’expiration des `pending` (voir § 2.2).

### 4.2 Fuseaux horaires (timezones)

- **Stockage :** `bookings.date_debut` / `date_fin` en `TIMESTAMP WITH TIME ZONE` → stockage en UTC, correct.
- **iCal :** `utils/ical.ts` utilise `getUTCFullYear()`, etc. → sortie en UTC (format `YYYYMMDDTHHmmssZ`), correct pour un flux calendrier.
- **Problème :** Dans `api/availability.ts`, les créneaux sont générés avec `new Date()` puis `setHours(hour, 0, 0, 0)` : l’heure est celle **du serveur** (souvent UTC). Donc « 9h–18h » = 9h–18h UTC, pas 9h–18h Paris. Pour un tatoueur en France, les créneaux affichés seront décalés.

**Recommandations :**

- Stocker pour chaque artiste un fuseau (ex. `timezone` dans `artists`, type `Europe/Paris`).
- Dans `availability.ts`, générer les créneaux dans ce fuseau (ex. avec `Intl` ou une lib type `date-fns-tz`) puis convertir en UTC pour les comparer aux `date_debut`/`date_fin` et pour retourner les `iso` au client. Ou au minimum documenter que les créneaux sont en UTC et afficher côté client avec le fuseau de l’artiste.
- Côté client, afficher les heures dans le fuseau de l’artiste (ou du visiteur) pour éviter toute ambiguïté.

---

## 5. Autres points

### 5.1 Double flux Stripe (Edge Function vs Vercel)

- **Flux utilisé pour la vitrine (créneau + flash) :** Edge Function `create-checkout-session` + webhook qui met à jour le booking. Le booking est créé **côté client** (problème RLS ci-dessus).
- **`api/create-flash-checkout.ts` (Vercel) :** Crée une session Stripe pour un flash mais **ne crée pas** de booking et **ne met pas** `booking_id` dans les metadata. Si ce chemin était utilisé pour la même réservation, le webhook ne pourrait pas mettre à jour de booking. À clarifier : ce fichier est-il utilisé ailleurs (ex. flux sans créneau) ? Si oui, il faudrait soit créer le booking côté API avant d’appeler Stripe, soit adapter le webhook pour gérer ce cas (ex. créer le booking à la réception du webhook avec les metadata disponibles).

### 5.2 Webhook Stripe

- Vérification de signature OK. Mise à jour du booking par `id` avec la service role OK. Aucune vérification que le booking est bien en `pending` avant de le passer en `confirmed` : sans impact majeur si le `booking_id` est toujours fourni par le serveur ; à garder en tête si d’autres flux envoient des metadata.

---

## 6. Liste des failles et bugs potentiels

| # | Sévérité | Description |
|---|----------|-------------|
| 1 | Critique | INSERT booking depuis le client (anon) alors que RLS supprime l’INSERT public → flux cassé ou policy trop permissive selon les migrations appliquées. |
| 2 | Élevé | Créneaux calculés dans le fuseau du serveur (souvent UTC) au lieu du fuseau de l’artiste. |
| 3 | Moyen | Horaires d’ouverture figés (Lun–Ven 9h–18h) ; pas de configuration par artiste. |
| 4 | Moyen | Bookings `pending` orphelins (client quitte sans payer) bloquent le créneau ; pas d’expiration automatique. |
| 5 | Moyen | Annulation côté client (cancel_url) ne met pas à jour le booking → créneau resté « pris » tant qu’aucun nettoyage. |
| 6 | Faible | Double flux Stripe (Edge Function vs `create-flash-checkout.ts`) à clarifier pour éviter incohérences. |

---

## 7. Corrections proposées (résumé)

1. **Créer une API serveur « créer une réservation »** (ex. `POST /api/bookings` ou `POST /api/create-booking`) qui reçoit slug/flash_id/créneau/client, vérifie dispo et artiste, insère en service role, retourne `booking_id`. Côté client, remplacer l’INSERT direct par un appel à cette API puis appel à l’Edge Function Stripe avec le `booking_id` retourné.
2. **Introduire un fuseau par artiste** et adapter `api/availability.ts` pour générer les créneaux dans ce fuseau (puis UTC pour comparaison et réponse).
3. **Documenter ou implémenter** un modèle d’horaires par artiste (jours/heures) et l’utiliser dans `availability.ts`.
4. **Expiration des `pending`** : job planifié ou trigger qui passe en `cancelled` (ou supprime) les bookings `pending` non payés après 15–30 min.
5. **Sur `cancel_url`** : soit rediriger avec un identifiant (booking_id ou session_id) et appeler une API pour marquer le booking comme annulé/supprimé, soit gérer l’expiration des `pending` (point 4) pour libérer les créneaux.
6. **Clarifier** le rôle de `api/create-flash-checkout.ts` par rapport à l’Edge Function et au webhook (un seul flux « réservation avec créneau » recommandé, avec création de booking côté serveur).

---

## 8. Implémentation fournie : API `POST /api/create-booking`

Une route **`api/create-booking.ts`** a été ajoutée. Elle :

- Accepte en body : `slug` (ou `artist_id`), `flash_id`, `date_debut_iso`, `duree_minutes`, `client_email`, `client_name`, `client_phone`.
- Vérifie l’artiste, le flash (appartenance, dispo, stock), l’absence de chevauchement, puis insère le booking avec la **service role**.
- Retourne `{ success: true, booking_id: string }`.

**Côté frontend (`PublicArtistPage.tsx`)** : remplacer l’INSERT direct par un appel à cette API, puis appeler l’Edge Function Stripe avec le `booking_id` retourné.

Exemple de remplacement (dans `onSubmit`) :

```ts
// Au lieu de :
// const { data: bookingData, error: insertError } = await supabase.from('bookings').insert(...)

const createRes = await fetch(`${window.location.origin}/api/create-booking`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    slug: artist.slug_profil,
    flash_id: flash.id,
    date_debut_iso: dateDebut.toISOString(),
    duree_minutes: flash.duree_minutes,
    client_email: data.client_email.trim(),
    client_name: data.client_name?.trim() || undefined,
    client_phone: data.client_phone?.trim() || undefined,
  }),
});
const createJson = await createRes.json();
if (!createRes.ok || !createJson.booking_id) {
  setError(createJson.error || 'Impossible d\'enregistrer la réservation.');
  return;
}
const bookingData = { id: createJson.booking_id };
// Puis continuer avec create-checkout-session (Edge Function) en passant bookingData.id
```

Le rollback en cas d’échec Stripe (suppression du booking) peut être fait en appelant une future API `DELETE /api/bookings/:id` avec un token dérivé du booking (ou en gardant la suppression côté client si une policy UPDATE/DELETE limitée est ajoutée pour le booking non confirmé). En attendant, on peut laisser le trigger d’overlap et l’expiration des `pending` gérer les conflits.

---

*Audit réalisé sur la base du code et des migrations présents dans le dépôt au moment de l’analyse.*

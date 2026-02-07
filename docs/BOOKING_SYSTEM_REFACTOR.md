# Refonte du Système de Réservation - Documentation Technique

## 📋 Vue d'ensemble

Cette refonte apporte **3 améliorations majeures** au système de réservation InkFlow :

1. **Logique de Planning & Synchronisation** : Calcul intelligent des créneaux disponibles
2. **Gestion des Acomptes** : Intégration Stripe PaymentIntents pour sécuriser les RDV
3. **Transactions Atomiques** : Élimination des race conditions et doubles réservations

---

## 🗄️ Modifications de la Base de Données

### Migration SQL

Exécuter la migration : `supabase/migration-booking-system-refactor.sql`

**Ajouts :**
- Index composite pour performance : `idx_bookings_artist_date_status`
- Index pour recherche rapide par statut paiement
- **Fonction SQL `get_available_slots()`** : Calcule les créneaux disponibles
- **Fonction SQL `check_slot_availability_atomic()`** : Vérification atomique avant INSERT

### Tables Utilisées

- `bookings` : Réservations (statut_booking: 'pending' | 'confirmed' | ...)
- `availability` : Horaires d'ouverture récurrents par jour de semaine
- `blocked_slots` : Créneaux bloqués (congés, pauses)
- `flashs` : Flashs disponibles
- `artists` : Informations artiste (deposit_percentage, stripe_account_id)

---

## 🔄 Nouveau Flow de Réservation

### Étape 1 : Client sélectionne un créneau

**Frontend** → `GET /api/artist-booking-info?slug=xxx&flash_id=yyy`

**Réponse :**
```json
{
  "artist": {
    "id": "...",
    "nom_studio": "...",
    "deposit_percentage": 30,
    "stripe_configured": true
  },
  "flash": {
    "id": "...",
    "title": "...",
    "prix": 15000,
    "duree_minutes": 120,
    "deposit_amount": 4500
  }
}
```

### Étape 2 : Client remplit le formulaire et valide

**Frontend** → `POST /api/create-booking`

**Body :**
```json
{
  "slug": "noam",
  "flash_id": "0f396aa1-...",
  "date_debut_iso": "2026-02-05T11:00:00.000Z",
  "duree_minutes": 120,
  "client_email": "client@example.com",
  "client_name": "Jean Dupont",
  "client_phone": "0612345678"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "booking_id": "abc-123-def",
  "deposit_amount": 4500,
  "prix_total": 15000
}
```

**Réponse (erreur - créneau pris) :**
```json
{
  "error": "Ce créneau n'est plus disponible",
  "code": "SLOT_UNAVAILABLE",
  "details": "Le créneau chevauche une réservation existante..."
}
```

**Ce qui se passe côté serveur :**
1. ✅ Validation des entrées
2. ✅ Vérification du flash (disponible, stock OK)
3. ✅ **Vérification atomique de disponibilité** via `check_slot_availability_atomic()`
   - Vérifie les horaires d'ouverture
   - Vérifie les créneaux bloqués
   - Vérifie les réservations existantes (pending + confirmed)
4. ✅ Calcul de l'acompte
5. ✅ **INSERT atomique** (le trigger `check_booking_no_overlap` vérifie une dernière fois)

### Étape 3 : Création du PaymentIntent Stripe

**Frontend** → `POST /api/create-booking-payment-intent`

**Body :**
```json
{
  "booking_id": "abc-123-def",
  "return_url": "https://ink-flow.me/payment/success?booking_id=abc-123-def"
}
```

**Réponse :**
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_yyy",
  "payment_intent_id": "pi_xxx",
  "amount": 4500,
  "currency": "eur",
  "booking_id": "abc-123-def"
}
```

**Ce qui se passe :**
1. ✅ Vérifie que la réservation est en `pending`
2. ✅ Vérifie que l'artiste a complété Stripe Connect
3. ✅ Crée un PaymentIntent Stripe avec :
   - Montant = `deposit_amount`
   - Application fee (commission plateforme)
   - Transfer vers le compte Stripe Connect de l'artiste
   - Metadata avec `booking_id`, `type: 'booking_deposit'`
4. ✅ Met à jour le booking avec `stripe_deposit_intent_id`

### Étape 4 : Client paie via Stripe

**Frontend** → Utilise `client_secret` avec Stripe Elements ou Checkout

### Étape 5 : Webhook Stripe confirme le paiement

**Stripe** → `POST /functions/v1/webhook-stripe`

**Événement :** `payment_intent.succeeded`

**Ce qui se passe :**
1. ✅ Vérifie la signature Stripe
2. ✅ Extrait `booking_id` depuis `metadata`
3. ✅ **Met à jour atomiquement** le booking :
   - `statut_paiement` → `'deposit_paid'`
   - `statut_booking` → `'confirmed'`
   - Condition : seulement si toujours `pending` (évite doubles confirmations)
4. ✅ Enregistre la transaction dans `stripe_transactions`
5. ✅ Déclenche l'envoi des emails (asynchrone)

---

## 🔒 Sécurité & Race Conditions

### Protection contre les doubles réservations

1. **Vérification atomique avant INSERT** : `check_slot_availability_atomic()`
2. **Trigger PostgreSQL** : `check_booking_no_overlap()` vérifie au moment de l'INSERT
3. **Condition atomique dans UPDATE** : `.eq('statut_booking', 'pending')` dans le webhook

### Gestion d'erreurs précise

L'API retourne maintenant des codes d'erreur spécifiques :

- `SLOT_UNAVAILABLE` : Créneau pris, bloqué, ou hors horaires
- `SLOT_OVERLAP` : Chevauchement détecté par le trigger
- `STRIPE_ONBOARDING_INCOMPLETE` : Artiste n'a pas configuré Stripe
- `BOOKING_NOT_PENDING` : Réservation déjà traitée
- `DATABASE_ERROR` : Erreur serveur

---

## 📊 Fonction SQL : `get_available_slots()`

Calcule les créneaux disponibles pour un artiste sur une période.

**Signature :**
```sql
get_available_slots(
    p_artist_id UUID,
    p_date_start DATE,
    p_date_end DATE,
    p_service_duration_minutes INTEGER DEFAULT 60,
    p_slot_interval_minutes INTEGER DEFAULT 30
)
```

**Retourne :**
- `slot_start` : Début du créneau
- `slot_end` : Fin du créneau
- `is_available` : true si disponible, false si occupé/bloqué

**Utilisation :**
```sql
SELECT * FROM get_available_slots(
    'artist-uuid',
    '2026-02-01'::DATE,
    '2026-02-28'::DATE,
    120,  -- Durée service : 2h
    30    -- Intervalle créneaux : 30 min
);
```

**Prend en compte :**
- ✅ Horaires d'ouverture (`availability` table)
- ✅ Créneaux bloqués (`blocked_slots` table)
- ✅ Réservations existantes (`bookings` avec statut `pending` ou `confirmed`)
- ✅ Durée du service (ne propose pas de créneaux trop courts)

---

## 🧪 Tests & Validation

### Scénarios de test

1. **Double réservation simultanée**
   - Deux clients tentent de réserver le même créneau en même temps
   - ✅ Seule la première doit réussir, la seconde doit recevoir `SLOT_UNAVAILABLE`

2. **Créneau hors horaires**
   - Client tente de réserver un créneau en dehors des horaires d'ouverture
   - ✅ Doit recevoir `SLOT_UNAVAILABLE` avec détails

3. **Paiement échoué**
   - Client crée une réservation mais le paiement échoue
   - ✅ Booking reste en `pending`, peut être annulé ou réessayé

4. **Webhook reçu deux fois**
   - Stripe envoie le webhook `payment_intent.succeeded` deux fois
   - ✅ La condition `.eq('statut_booking', 'pending')` empêche la double confirmation

---

## 🚀 Déploiement

### 1. Exécuter la migration SQL

```bash
# Via Supabase CLI
supabase db push

# Ou via SQL Editor dans Supabase Dashboard
# Copier-coller le contenu de migration-booking-system-refactor.sql
```

### 2. Remplacer l'API booking.ts

```bash
# Sauvegarder l'ancienne version
mv api/booking.ts api/booking.ts.old

# Utiliser la nouvelle version
mv api/booking-refactored.ts api/booking.ts
```

### 3. Déployer la nouvelle API PaymentIntent

Le fichier `api/create-booking-payment-intent.ts` est déjà prêt.

### 4. Mettre à jour le webhook Stripe

Le fichier `supabase/functions/webhook-stripe/index.ts` a été mis à jour.

**Déployer la fonction Edge :**
```bash
supabase functions deploy webhook-stripe
```

### 5. Configurer Stripe Webhook

Dans le Dashboard Stripe → Webhooks :
- **URL** : `https://[project-ref].supabase.co/functions/v1/webhook-stripe`
- **Événements à écouter** :
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
  - `checkout.session.completed` (pour compatibilité ancien flow)

---

## 📝 Notes pour le Frontend

### Modifications nécessaires dans `PublicBookingCheckoutPage.tsx`

1. **Après création du booking** :
   ```typescript
   const createRes = await fetch('/api/create-booking', { ... });
   const { booking_id, deposit_amount } = await createRes.json();
   ```

2. **Créer le PaymentIntent** :
   ```typescript
   const paymentRes = await fetch('/api/create-booking-payment-intent', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ 
       booking_id,
       return_url: `${window.location.origin}/payment/success?booking_id=${booking_id}`
     })
   });
   const { client_secret } = await paymentRes.json();
   ```

3. **Intégrer Stripe Elements** :
   ```typescript
   import { loadStripe } from '@stripe/stripe-js';
   const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
   const { error } = await stripe.confirmPayment({
     clientSecret: client_secret,
     confirmParams: { return_url: returnUrl }
   });
   ```

---

## 🔍 Monitoring & Debugging

### Logs à surveiller

- `[create-booking]` : Erreurs lors de la création de réservation
- `[create-booking-payment-intent]` : Erreurs lors de la création PaymentIntent
- `webhook-stripe` : Erreurs dans les logs Supabase Edge Functions

### Métriques importantes

- Taux de succès des créations de booking
- Taux d'échec `SLOT_UNAVAILABLE` (indique peut-être un problème UX)
- Temps entre création booking et paiement
- Taux de conversion paiement (bookings créés → paiements réussis)

---

## ✅ Checklist de Migration

- [ ] Migration SQL exécutée
- [ ] API `booking.ts` remplacée
- [ ] API `create-booking-payment-intent.ts` déployée
- [ ] Webhook Stripe mis à jour et déployé
- [ ] Webhook configuré dans Stripe Dashboard
- [ ] Frontend mis à jour pour utiliser le nouveau flow
- [ ] Tests end-to-end effectués
- [ ] Monitoring configuré

---

## 🐛 Troubleshooting

### Erreur "Ce créneau n'est plus disponible"

**Causes possibles :**
1. Créneau réellement pris (vérifier dans `bookings`)
2. Créneau dans un `blocked_slot`
3. Créneau hors horaires d'ouverture (vérifier `availability`)
4. Race condition (deux clients en même temps) → Normal, la deuxième doit échouer

### Erreur "STRIPE_ONBOARDING_INCOMPLETE"

L'artiste doit compléter l'onboarding Stripe Connect dans ses paramètres.

### Webhook ne confirme pas le booking

1. Vérifier que le webhook est bien configuré dans Stripe
2. Vérifier les logs Supabase Edge Functions
3. Vérifier que `metadata.booking_id` est bien présent dans le PaymentIntent
4. Vérifier que le booking est toujours en `pending` (pas déjà confirmé)

---

## 📚 Références

- [Stripe PaymentIntents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Connect](https://stripe.com/docs/connect)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Supabase RPC Functions](https://supabase.com/docs/guides/database/functions)

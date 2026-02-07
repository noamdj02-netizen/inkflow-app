# ✅ Intégration Stripe Checkout & Webhooks - Complète

## 📦 Packages

Les packages suivants sont **déjà installés** :
- ✅ `stripe` (v20.2.0) - SDK Stripe côté serveur
- ✅ `@stripe/stripe-js` (v8.6.1) - SDK Stripe côté client

## 📁 Fichiers Créés

### 1. Utilitaire Stripe (`utils/stripe/server.ts`)

Fonctions utilitaires pour :
- ✅ Initialiser Stripe côté serveur
- ✅ Vérifier les signatures de webhook
- ✅ Convertir les montants (euros ↔ centimes)

**Utilisation** :
```typescript
import { getStripeServer } from '../utils/stripe/server';

const stripe = getStripeServer();
const session = await stripe.checkout.sessions.create({...});
```

### 2. Route API Checkout (`api/create-checkout-session/route.ts`)

**Endpoint** : `POST /api/create-checkout-session`

**Body** :
```json
{
  "priceId": "price_xxx",
  "userId": "user-uuid",
  "successUrl": "/payment/success",
  "cancelUrl": "/payment/cancel"
}
```

**Réponse** :
```json
{
  "success": true,
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

### 3. Route API Webhook (`api/webhooks/stripe/route.ts`)

**Endpoint** : `POST /api/webhooks/stripe`

**Événements gérés** :
- ✅ `checkout.session.completed` - Met à jour l'utilisateur en Premium
- ✅ `customer.subscription.created` - Crée l'enregistrement de subscription
- ✅ `customer.subscription.updated` - Met à jour le statut
- ✅ `customer.subscription.deleted` - Annule l'abonnement

**Sécurité** :
- ✅ Vérification de la signature Stripe
- ✅ Validation du webhook secret
- ✅ Gestion d'erreur complète

### 4. Migration SQL (`supabase/migration-add-premium-subscription.sql`)

Ajoute les colonnes nécessaires pour gérer les abonnements :
- `is_premium` - Statut premium
- `premium_until` - Date d'expiration
- `stripe_customer_id` - ID client Stripe
- `stripe_subscription_id` - ID abonnement Stripe
- `stripe_subscription_status` - Statut de l'abonnement
- `user_plan` - Plan utilisateur (free, starter, pro, studio)

Crée aussi une table `subscriptions` pour un suivi détaillé.

## 🔧 Configuration Requise

### Variables d'Environnement (Vercel)

Dans **Vercel Dashboard → Settings → Environment Variables** :

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Optionnel
SITE_URL=https://votre-projet.vercel.app
```

### Variables d'Environnement (Frontend - `.env.local`)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

## 🚀 Utilisation

### Créer une Session Checkout

```typescript
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx', // Votre Price ID depuis Stripe Dashboard
    userId: user.id,      // ID utilisateur Supabase
  }),
});

const { url } = await response.json();
if (url) {
  window.location.href = url; // Rediriger vers Stripe Checkout
}
```

### Configurer le Webhook dans Stripe

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. **URL** : `https://votre-projet.vercel.app/api/webhooks/stripe`
4. **Événements** :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. **Copier le Signing secret** → Ajouter dans Vercel comme `STRIPE_WEBHOOK_SECRET`

## 🧪 Tester en Local

### Avec Stripe CLI

```bash
# 1. Installer Stripe CLI
stripe login

# 2. Forwarder les webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 3. Récupérer le secret local
stripe listen --print-secret
# Ajoutez-le dans .env.local comme STRIPE_WEBHOOK_SECRET

# 4. Tester un événement
stripe trigger checkout.session.completed
```

Voir [TEST_STRIPE_WEBHOOK_LOCAL.md](./TEST_STRIPE_WEBHOOK_LOCAL.md) pour plus de détails.

## 📊 Base de Données

### Exécuter la Migration

Dans **Supabase Dashboard → SQL Editor** :

1. Ouvrez `supabase/migration-add-premium-subscription.sql`
2. Copiez le contenu
3. Exécutez dans SQL Editor

Cela ajoutera :
- Colonnes premium dans `artists`
- Table `subscriptions` pour le suivi détaillé
- Indexes pour les performances
- Politiques RLS

## 🔄 Flux Complet

1. **Utilisateur clique sur "Upgrade"**
2. **Frontend** → Appelle `/api/create-checkout-session`
3. **Backend** → Crée session Stripe Checkout
4. **Redirection** → Vers Stripe Checkout
5. **Paiement** → Utilisateur paie avec carte de test
6. **Retour** → `/payment/success`
7. **Webhook** → Stripe envoie `checkout.session.completed`
8. **Backend** → Met à jour `artists.is_premium = true`
9. **Utilisateur Premium** ✅

## 📚 Documentation

- [Guide complet](./STRIPE_CHECKOUT_WEBHOOK_SETUP.md)
- [Test webhook local](./TEST_STRIPE_WEBHOOK_LOCAL.md)
- [Documentation Stripe](https://stripe.com/docs)

---

**Status** : ✅ Intégration complète - Prêt à utiliser après configuration des variables d'environnement et exécution de la migration SQL.

# ⚡ Configuration Rapide Stripe Checkout & Webhooks

## ⚠️ Architecture

**Ce projet utilise Vite + Vercel Serverless Functions, pas Next.js App Router.**

Les routes API sont dans `api/` et fonctionnent comme des Vercel Serverless Functions.

## 📦 Packages

✅ **Déjà installés** :
- `stripe` (v20.2.0)
- `@stripe/stripe-js` (v8.6.1)

## 🔧 Configuration en 3 Étapes

### Étape 1 : Variables d'Environnement (Vercel)

Dans **Vercel Dashboard → Settings → Environment Variables** :

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### Étape 2 : Migration Base de Données

Dans **Supabase Dashboard → SQL Editor** :

1. Ouvrez `supabase/migration-add-premium-subscription.sql`
2. Copiez le contenu
3. Exécutez dans SQL Editor

### Étape 3 : Configurer le Webhook Stripe

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Add endpoint**
3. **URL** : `https://votre-projet.vercel.app/api/webhooks/stripe`
4. **Événements** : `checkout.session.completed`, `customer.subscription.*`
5. **Copier le Signing secret** → Ajouter dans Vercel

## 🚀 Utilisation

### Créer une Session Checkout

```typescript
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx', // Votre Price ID
    userId: user.id,
  }),
});

const { url } = await response.json();
window.location.href = url;
```

## 🧪 Tester en Local

```bash
# 1. Installer Stripe CLI
stripe login

# 2. Forwarder les webhooks
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

# 3. Récupérer le secret local
stripe listen --print-secret
# Ajoutez dans .env.local comme STRIPE_WEBHOOK_SECRET

# 4. Tester
stripe trigger checkout.session.completed
```

## 📁 Fichiers Créés

- ✅ `utils/stripe/server.ts` - Utilitaire Stripe
- ✅ `api/create-checkout-session/route.ts` - Création de session
- ✅ `api/webhooks/stripe/route.ts` - Handler webhook
- ✅ `supabase/migration-add-premium-subscription.sql` - Migration SQL

## 📚 Guides Complets

- [Guide complet](./STRIPE_CHECKOUT_WEBHOOK_SETUP.md)
- [Test webhook local](./TEST_STRIPE_WEBHOOK_LOCAL.md)
- [Intégration complète](./STRIPE_INTEGRATION_COMPLETE.md)

---

**Note** : Les fichiers sont adaptés à Vercel Serverless Functions. Pour Next.js App Router, la structure serait différente (`app/api/...`).

# 💳 Configuration Stripe Checkout & Webhooks - Guide Complet

## ⚠️ Architecture Actuelle

**Ce projet utilise Vite + React avec Vercel Serverless Functions, pas Next.js App Router.**

- ✅ Routes API dans `api/` (Vercel Serverless Functions)
- ✅ Client Supabase dans `services/supabase.ts`
- ✅ Packages Stripe déjà installés (`stripe`, `@stripe/stripe-js`)

## 📦 Packages Installés

Les packages suivants sont **déjà installés** :

```json
{
  "stripe": "^20.2.0",
  "@stripe/stripe-js": "^8.6.1"
}
```

## 🔧 Configuration

### 1. Variables d'Environnement

Dans **Vercel Dashboard → Settings → Environment Variables**, configurez :

```env
# Stripe (Obligatoire)
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_... (depuis Stripe Dashboard)

# Supabase (Obligatoire)
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Optionnel
SITE_URL=https://votre-projet.vercel.app
```

**Note** : Pour le frontend (`.env.local`), utilisez :
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Fichiers Créés

- ✅ `utils/stripe/server.ts` - Utilitaire Stripe côté serveur
- ✅ `api/create-checkout-session/route.ts` - Création de session Checkout
- ✅ `api/webhooks/stripe/route.ts` - Handler de webhook Stripe

## 🚀 Utilisation

### Créer une Session Checkout

**Frontend** :

```typescript
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx', // Stripe Price ID
    userId: 'user-uuid',   // Supabase user ID
    successUrl: '/payment/success',
    cancelUrl: '/payment/cancel',
  }),
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

**Backend** (Route API) :

La route `/api/create-checkout-session` :
1. Vérifie que l'utilisateur existe
2. Crée une session Stripe Checkout
3. Retourne l'URL de redirection

### Webhook Stripe

Le webhook `/api/webhooks/stripe` :
1. ✅ Vérifie la signature Stripe (sécurité)
2. ✅ Écoute `checkout.session.completed`
3. ✅ Met à jour l'utilisateur dans Supabase
4. ✅ Crée un enregistrement de transaction

## 🔐 Configuration du Webhook dans Stripe

### Étape 1 : Créer l'Endpoint Webhook

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. Cliquez sur **"Add endpoint"**
4. URL : `https://votre-projet.vercel.app/api/webhooks/stripe`
5. Sélectionnez les événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
6. Cliquez sur **"Add endpoint"**

### Étape 2 : Récupérer le Signing Secret

1. Dans la liste des webhooks, cliquez sur votre endpoint
2. Dans **"Signing secret"**, cliquez sur **"Reveal"**
3. Copiez le secret (commence par `whsec_...`)
4. Ajoutez-le dans Vercel comme `STRIPE_WEBHOOK_SECRET`

## 🧪 Tester le Webhook en Local

### Option 1 : Stripe CLI (Recommandé)

1. **Installer Stripe CLI** :
   ```bash
   # Windows (via Scoop)
   scoop install stripe
   
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Linux
   # Voir https://stripe.com/docs/stripe-cli
   ```

2. **Se connecter** :
   ```bash
   stripe login
   ```

3. **Forwarder les webhooks vers votre serveur local** :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```

4. **Tester un événement** :
   ```bash
   stripe trigger checkout.session.completed
   ```

5. **Récupérer le webhook secret local** :
   ```bash
   stripe listen --print-secret
   ```
   
   Utilisez ce secret dans `.env.local` comme `STRIPE_WEBHOOK_SECRET` pour les tests locaux.

### Option 2 : ngrok (Alternative)

1. **Installer ngrok** : https://ngrok.com/download

2. **Démarrer votre serveur local** :
   ```bash
   npm run dev
   ```

3. **Créer un tunnel** :
   ```bash
   ngrok http 3000
   ```

4. **Configurer le webhook dans Stripe** :
   - URL : `https://votre-tunnel.ngrok.io/api/webhooks/stripe`
   - Copiez le signing secret dans Vercel

### Option 3 : Tester en Production

1. Déployez sur Vercel
2. Configurez le webhook dans Stripe avec l'URL de production
3. Testez avec Stripe Dashboard → **Send test webhook**

## 📊 Mise à Jour de la Base de Données

### Option A : Table `artists` (Actuel)

Si vous utilisez la table `artists`, ajoutez ces colonnes :

```sql
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;
```

### Option B : Table `subscriptions` (Recommandé)

Créez une table dédiée :

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL, -- active, canceled, past_due, etc.
  price_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
```

## 🔄 Flux Complet

1. **Client clique sur "Upgrade"** → Appelle `/api/create-checkout-session`
2. **Redirection vers Stripe** → Client paie
3. **Retour sur `/payment/success`** → Confirmation visuelle
4. **Webhook Stripe** → Met à jour automatiquement la base de données
5. **Utilisateur est Premium** ✅

## 🧪 Test avec des Cartes Stripe

Utilisez ces cartes de test :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Date : n'importe quelle date future  
CVC : n'importe quel 3 chiffres

## 📝 Exemple d'Utilisation Complète

### Frontend Component

```typescript
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const UpgradeButton = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: 'price_xxx', // Votre Price ID Stripe
          userId: user.id,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleUpgrade} disabled={loading}>
      {loading ? 'Chargement...' : 'Upgrade to Premium'}
    </button>
  );
};
```

## 🆘 Dépannage

### Erreur : "STRIPE_SECRET_KEY is not configured"

**Solution** : Ajoutez `STRIPE_SECRET_KEY` dans Vercel Dashboard → Environment Variables

### Erreur : "Webhook signature verification failed"

**Solution** :
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
2. Vérifiez que vous utilisez le bon secret (local vs production)
3. Vérifiez que le body est bien en raw string (pas parsé)

### Le webhook ne se déclenche pas

**Solution** :
1. Vérifiez que l'endpoint est configuré dans Stripe Dashboard
2. Vérifiez que l'URL est correcte (production)
3. Vérifiez les logs Vercel pour voir les requêtes reçues
4. Testez avec Stripe CLI en local

## 📚 Ressources

- [Documentation Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

---

**Note** : Les fichiers créés sont adaptés à Vercel Serverless Functions. Si vous migrez vers Next.js App Router, vous devrez adapter la structure des routes.

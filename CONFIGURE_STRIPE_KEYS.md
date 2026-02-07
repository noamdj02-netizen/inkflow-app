# 🔑 Configuration des Clés Stripe

## ⚠️ Types de Clés Stripe

### 1. **Secret Key** (`sk_live_...` ou `sk_test_...`)
- **Usage** : Opérations serveur (créer des sessions, gérer les webhooks)
- **Où l'utiliser** : Vercel Environment Variables → `STRIPE_SECRET_KEY`
- **⚠️ Ne JAMAIS exposer côté client**

### 2. **Publishable Key** (`pk_live_...` ou `pk_test_...`)
- **Usage** : Côté client (Stripe.js, Elements)
- **Où l'utiliser** : `.env.local` → `VITE_STRIPE_PUBLISHABLE_KEY`
- **✅ Peut être exposé publiquement**

### 3. **Restricted Key** (`rk_live_...` ou `rk_test_...`)
- **Usage** : Clé avec permissions limitées (sécurité renforcée)
- **Peut remplacer** : `STRIPE_SECRET_KEY` si elle a les bonnes permissions
- **⚠️ Vérifiez les permissions dans Stripe Dashboard**

### 4. **Webhook Secret** (`whsec_...`)
- **Usage** : Vérifier la signature des webhooks
- **Où l'utiliser** : Vercel Environment Variables → `STRIPE_WEBHOOK_SECRET`
- **⚠️ Différent pour chaque endpoint webhook**

## 🔧 Configuration dans Vercel

### Étape 1 : Récupérer vos Clés

1. **Stripe Dashboard** → **Developers** → **API keys**
2. **Secret key** : Copiez `sk_live_...` ou `sk_test_...`
   - Si vous avez une Restricted Key (`rk_live_...`), vous pouvez l'utiliser à la place
   - Vérifiez qu'elle a les permissions : `Checkout Sessions`, `Webhooks`, `Customers`, `Subscriptions`
3. **Publishable key** : Copiez `pk_live_...` ou `pk_test_...`

### Étape 2 : Configurer dans Vercel

**Vercel Dashboard** → **Votre Projet** → **Settings** → **Environment Variables**

Ajoutez :

```env
# Clé secrète (serveur)
STRIPE_SECRET_KEY=sk_live_... (ou rk_live_... si Restricted Key)

# Webhook secret (récupéré depuis Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Optionnel
SITE_URL=https://votre-projet.vercel.app
```

### Étape 3 : Configurer le Frontend (`.env.local`)

```env
# Clé publique (client)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
```

## 🔐 Utiliser une Restricted Key

Si vous avez une **Restricted Key** (`rk_live_...`), vous pouvez l'utiliser à la place de `STRIPE_SECRET_KEY` :

1. **Vérifiez les permissions** dans Stripe Dashboard :
   - ✅ `Checkout Sessions` (read & write)
   - ✅ `Webhooks` (read)
   - ✅ `Customers` (read & write)
   - ✅ `Subscriptions` (read & write)

2. **Ajoutez dans Vercel** :
   ```env
   STRIPE_SECRET_KEY=rk_live_... (votre Restricted Key)
   ```

3. **Testez** : Créez une session checkout pour vérifier que tout fonctionne

## 🧪 Tester la Configuration

### Test 1 : Vérifier les Variables d'Environnement

Dans votre code (temporairement, pour debug) :

```typescript
// api/create-checkout-session/route.ts
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Configuré' : '❌ Manquant');
```

### Test 2 : Créer une Session Checkout

```typescript
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx',
    userId: 'user-uuid',
  }),
});
```

### Test 3 : Vérifier les Logs Vercel

1. **Vercel Dashboard** → **Functions** → `api/create-checkout-session`
2. Vérifiez les logs pour les erreurs

## 🆘 Dépannage

### Erreur : "Invalid API Key"

**Causes** :
- Clé incorrecte ou expirée
- Clé de test utilisée en production (ou vice versa)
- Restricted Key sans les bonnes permissions

**Solution** :
1. Vérifiez que la clé est correcte dans Vercel
2. Vérifiez le mode (test vs live)
3. Si Restricted Key, vérifiez les permissions

### Erreur : "Missing required environment variable: STRIPE_SECRET_KEY"

**Solution** :
1. Vérifiez que la variable est bien dans Vercel
2. Redéployez après avoir ajouté la variable
3. Vérifiez l'orthographe (pas d'espaces)

### Restricted Key ne fonctionne pas

**Solution** :
1. Vérifiez les permissions dans Stripe Dashboard
2. Assurez-vous que toutes les permissions nécessaires sont activées
3. Utilisez une Secret Key standard si nécessaire

## 📚 Ressources

- [Stripe API Keys Documentation](https://stripe.com/docs/keys)
- [Restricted API Keys](https://stripe.com/docs/keys/restricted-api-keys)
- [Webhook Signing](https://stripe.com/docs/webhooks/signatures)

---

**Important** : Ne partagez JAMAIS vos clés secrètes publiquement. Utilisez toujours les variables d'environnement.

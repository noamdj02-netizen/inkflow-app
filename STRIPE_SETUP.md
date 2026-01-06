# 💳 Configuration Stripe pour InkFlow

## 📋 Variables d'Environnement Requises

### 1. Frontend (`.env.local`)

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Stripe (déjà présent)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique

# Supabase (déjà présent)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 2. Supabase Edge Functions

Dans Supabase Dashboard → Settings → Edge Functions → Secrets, ajoutez :

```
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
SITE_URL=http://localhost:5173  # Ou votre URL de production
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

## 🔧 Configuration Stripe

### Étape 1 : Créer un compte Stripe

1. Allez sur https://stripe.com
2. Créez un compte (mode test pour commencer)
3. Récupérez vos clés API dans Dashboard → Developers → API keys

### Étape 2 : Récupérer les clés

**Clés de Test (pour développement) :**
- **Publishable Key** : `pk_test_...` → Ajoutez dans `.env.local` comme `VITE_STRIPE_PUBLISHABLE_KEY`
- **Secret Key** : `sk_test_...` → Ajoutez dans Supabase Edge Functions Secrets comme `STRIPE_SECRET_KEY`

**Clés de Production (plus tard) :**
- Remplacez `test` par `live` dans les clés ci-dessus

### Étape 3 : Configurer le Webhook Stripe

1. Dans Stripe Dashboard → Developers → Webhooks
2. Cliquez sur "Add endpoint"
3. URL : `https://votre-projet.supabase.co/functions/v1/webhook-stripe`
4. Événements à écouter :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
5. Copiez le "Signing secret" → Ajoutez-le dans Supabase comme `STRIPE_WEBHOOK_SECRET`

## 🚀 Déploiement des Edge Functions

### Option A : Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier votre projet
supabase link --project-ref votre-project-ref

# Déployer les fonctions
supabase functions deploy create-checkout-session
supabase functions deploy webhook-stripe
```

### Option B : Via Supabase Dashboard

1. Allez dans Supabase Dashboard → Edge Functions
2. Créez une nouvelle fonction `create-checkout-session`
3. Copiez-collez le contenu de `supabase/functions/create-checkout-session/index.ts`
4. Répétez pour `webhook-stripe`

## 📝 Structure des Fichiers

```
supabase/
├── functions/
│   ├── create-checkout-session/
│   │   └── index.ts          # Crée une session Stripe Checkout
│   └── webhook-stripe/
│       └── index.ts          # Gère les webhooks Stripe
```

## 🔄 Flux de Paiement

1. **Client remplit le formulaire** → Crée une réservation avec `statut_paiement = 'pending'`
2. **Appel Edge Function** → Crée une session Stripe Checkout
3. **Redirection vers Stripe** → Le client paie
4. **Retour sur `/payment/success`** → Confirmation visuelle
5. **Webhook Stripe** → Met à jour automatiquement `statut_paiement = 'deposit_paid'`

## 🧪 Test avec des Cartes Stripe

Utilisez ces cartes de test dans Stripe :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Date d'expiration : n'importe quelle date future
CVC : n'importe quel 3 chiffres

## ⚠️ Notes Importantes

1. **Mode Test** : Utilisez les clés `test` pour le développement
2. **Webhook** : Le webhook doit être configuré pour mettre à jour automatiquement les statuts
3. **Sécurité** : Ne JAMAIS exposer `STRIPE_SECRET_KEY` dans le frontend
4. **URLs** : Mettez à jour `SITE_URL` avec votre URL de production avant le déploiement

## 🐛 Dépannage

### Erreur : "Function not found"
→ Vérifiez que les Edge Functions sont bien déployées dans Supabase

### Erreur : "Invalid API Key"
→ Vérifiez que `STRIPE_SECRET_KEY` est correctement configuré dans Supabase Secrets

### Le webhook ne fonctionne pas
→ Vérifiez que l'URL du webhook est correcte et que le secret correspond

---

**✅ Une fois configuré, le paiement des acomptes fonctionnera automatiquement !**


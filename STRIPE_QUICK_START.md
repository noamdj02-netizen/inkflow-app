# ⚡ Quick Start - Configuration Stripe

## 🎯 Étapes Rapides

### 1. Variables d'Environnement Frontend (`.env.local`)

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 2. Secrets Supabase Edge Functions

Dans Supabase Dashboard → Settings → Edge Functions → Secrets :

```
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
SITE_URL=http://localhost:5173
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

### 3. Déployer les Edge Functions

```bash
# Via Supabase CLI
supabase functions deploy create-checkout-session
supabase functions deploy webhook-stripe
```

### 4. Configurer le Webhook Stripe

1. Stripe Dashboard → Webhooks → Add endpoint
2. URL : `https://votre-projet.supabase.co/functions/v1/webhook-stripe`
3. Événements : `checkout.session.completed`
4. Copier le secret → Ajouter dans Supabase Secrets

## ✅ C'est tout !

Consultez `STRIPE_SETUP.md` pour plus de détails.


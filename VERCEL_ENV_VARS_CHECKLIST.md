# ✅ Checklist Variables d'Environnement Vercel

## 🔐 Variables à Configurer dans Vercel

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, ajoutez :

### 1. Stripe

```env
STRIPE_SECRET_KEY=sk_live_xxx  # Depuis Stripe Dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_xxx  # Depuis Stripe Dashboard → Webhooks → Signing secret
```

### 2. Supabase

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Important** : `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont utilisés par le build frontend (Vite) ; sans eux, l’app ne peut pas se connecter à Supabase en production.

### 3. Recommandé / Optionnel

```env
VITE_SITE_URL=https://ink-flow.me
```
(ou l’URL de votre projet Vercel pour canonical / SEO)

Projet Vercel : **inkflow-app-swart** — [inkflow-app-swart.vercel.app](https://inkflow-app-swart.vercel.app). Webhook Stripe : `https://inkflow-app-swart.vercel.app/api/webhooks/stripe`.

## 📝 Instructions

Pour chaque variable :
1. Cliquez sur **"Add New"**
2. Entrez le **Name** (ex: `STRIPE_WEBHOOK_SECRET`)
3. Entrez la **Value** (ex: `whsec_xxx` depuis Stripe Webhooks)
4. Cochez les environnements :
   - ✅ **Production** (obligatoire)
   - ✅ **Preview** (recommandé pour tester)
   - ✅ **Development** (optionnel)
5. Cliquez sur **Save**

## ✅ Vérification

Après avoir ajouté toutes les variables :

1. ✅ Redéployez le projet (si déjà déployé)
2. ✅ Vérifiez les logs Vercel pour les erreurs
3. ✅ Testez une fonction API (ex: `/api/create-checkout-session`)

---

**Status** : Prêt à configurer dans Vercel Dashboard

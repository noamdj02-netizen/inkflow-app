# ⚡ Déploiement Rapide - GitHub & Vercel

## 🚀 En 3 Étapes

### 1. Push sur GitHub

```powershell
git push origin login-blue
```

Ou utilisez le script automatique :
```powershell
.\deploy.ps1 "feat: Deploy to production"
```

### 2. Déployer sur Vercel

#### Option A : Via Dashboard (Recommandé)

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Add New Project** → Importez `inkflow-app`
3. Configurez les variables d'environnement (voir ci-dessous)
4. Cliquez sur **Deploy**

#### Option B : Via CLI

```powershell
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

### 3. Configurer les Variables d'Environnement

Dans **Vercel Dashboard** → **Settings** → **Environment Variables** :

```env
# Stripe
STRIPE_SECRET_KEY=rk_live_... (votre Restricted Key Stripe)
STRIPE_WEBHOOK_SECRET=whsec_... (après configuration du webhook)

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

## ✅ Vérification

1. ✅ Code pushé sur GitHub
2. ✅ Déployé sur Vercel
3. ✅ Variables d'environnement configurées
4. ✅ Webhook Stripe configuré (après déploiement)

## 📚 Guide Complet

Voir [DEPLOY_GITHUB_VERCEL.md](./DEPLOY_GITHUB_VERCEL.md) pour plus de détails.

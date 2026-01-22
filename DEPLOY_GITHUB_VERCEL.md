# 🚀 Déploiement sur GitHub et Vercel - Guide Complet

## 📋 Prérequis

1. ✅ **Compte GitHub** : Votre repo est déjà configuré (`https://github.com/noamdj02-netizen/inkflow-app.git`)
2. ✅ **Compte Vercel** : Créez un compte sur [vercel.com](https://vercel.com) si vous n'en avez pas
3. ✅ **Variables d'environnement** : Préparez toutes vos clés API

## 🔄 Étape 1 : Commit et Push sur GitHub

### 1.1 Vérifier les changements

```powershell
git status
```

### 1.2 Ajouter tous les fichiers

```powershell
git add .
```

### 1.3 Commit avec un message descriptif

```powershell
git commit -m "feat: Add Stripe Checkout & Webhooks integration

- Add Stripe Checkout session creation API
- Add Stripe webhook handler
- Add premium subscription migration SQL
- Add Stripe utilities and components
- Add comprehensive documentation"
```

### 1.4 Push vers GitHub

```powershell
# Si vous êtes sur la branche login-blue
git push origin login-blue

# Ou si vous voulez push sur main
git checkout main
git merge login-blue
git push origin main
```

## 🚀 Étape 2 : Déployer sur Vercel

### Méthode A : Via Vercel Dashboard (Recommandé)

#### 2.1 Connecter votre repository

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquez sur **"Add New Project"**
3. **Importez votre repository** :
   - Si c'est la première fois, connectez votre compte GitHub
   - Autorisez Vercel à accéder à vos repositories
   - Sélectionnez `inkflow-app` (ou le nom de votre repo)
4. Cliquez sur **"Import"**

#### 2.2 Configurer le projet

Vercel détecte automatiquement Vite grâce à `vercel.json`, mais vérifiez :

- **Framework Preset** : `Vite` ✅
- **Root Directory** : `./` ✅
- **Build Command** : `npm run build` ✅
- **Output Directory** : `dist` ✅
- **Install Command** : `npm install` ✅

#### 2.3 Configurer les variables d'environnement

**⚠️ CRITIQUE** : Configurez toutes les variables **AVANT** le premier déploiement.

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, ajoutez :

```env
# Stripe
STRIPE_SECRET_KEY=rk_live_... (votre Restricted Key Stripe)
STRIPE_WEBHOOK_SECRET=whsec_... (à récupérer après configuration du webhook)

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Optionnel
SITE_URL=https://votre-projet.vercel.app
```

**Pour chaque variable** :
- ✅ Cochez **Production**
- ✅ Cochez **Preview** (si vous voulez tester sur les previews)
- ✅ Cochez **Development** (si vous voulez tester en local avec Vercel)

#### 2.4 Déployer

1. Cliquez sur **"Deploy"**
2. Attendez que le build se termine (2-5 minutes)
3. Votre site sera disponible sur `https://votre-projet.vercel.app`

### Méthode B : Via Vercel CLI

#### 2.1 Installer Vercel CLI

```powershell
npm install -g vercel
```

#### 2.2 Se connecter

```powershell
vercel login
```

#### 2.3 Déployer

```powershell
# Déploiement de preview
vercel

# Déploiement en production
vercel --prod
```

## 🔐 Étape 3 : Configurer le Webhook Stripe

### 3.1 Récupérer l'URL de production

Une fois déployé, votre URL sera : `https://votre-projet.vercel.app`

### 3.2 Configurer dans Stripe Dashboard

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. **URL** : `https://votre-projet.vercel.app/api/webhooks/stripe`
4. **Événements** :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Cliquez sur **"Add endpoint"**

### 3.3 Récupérer le Webhook Secret

1. Dans la liste des webhooks, cliquez sur votre endpoint
2. Dans **"Signing secret"**, cliquez sur **"Reveal"**
3. Copiez le secret (commence par `whsec_...`)

### 3.4 Ajouter dans Vercel

1. **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Ajoutez `STRIPE_WEBHOOK_SECRET` avec la valeur copiée
3. **Redéployez** pour que la variable soit prise en compte

## ✅ Étape 4 : Vérifier le Déploiement

### 4.1 Tester l'API Checkout

```javascript
// Testez depuis votre frontend ou avec curl
fetch('https://votre-projet.vercel.app/api/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    priceId: 'price_xxx',
    userId: 'user-uuid',
  }),
});
```

### 4.2 Tester le Webhook

1. **Stripe Dashboard** → Votre webhook → **"Send test webhook"**
2. Sélectionnez `checkout.session.completed`
3. Vérifiez les logs Vercel pour voir si le webhook est reçu

### 4.3 Vérifier les Logs

**Vercel Dashboard** → **Functions** → `api/webhooks/stripe` → **Logs**

## 🔄 Déploiements Automatiques

Une fois connecté à GitHub, Vercel déploie automatiquement :

- ✅ **Chaque push sur `main`** → Déploiement en production
- ✅ **Chaque pull request** → Déploiement de preview
- ✅ **Chaque push sur une branche** → Déploiement de preview

## 🆘 Dépannage

### Erreur : Build failed

**Causes** :
- Variables d'environnement manquantes
- Erreurs de compilation TypeScript
- Dépendances manquantes

**Solution** :
1. Vérifiez les logs de build dans Vercel Dashboard
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les variables d'environnement sont configurées

### Erreur : Function not found (404)

**Causes** :
- Route API mal configurée
- Fichier dans le mauvais dossier

**Solution** :
1. Vérifiez que les routes API sont dans `api/`
2. Vérifiez `vercel.json` pour les rewrites

### Le webhook ne fonctionne pas

**Solution** :
1. Vérifiez que `STRIPE_WEBHOOK_SECRET` est configuré
2. Vérifiez que l'URL du webhook est correcte dans Stripe
3. Vérifiez les logs Vercel pour les erreurs

## 📚 Ressources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

---

**Status** : Prêt à déployer ! Suivez les étapes ci-dessus pour un déploiement réussi.

# 🚀 Guide de Déploiement Vercel - InkFlow

Guide complet pour déployer votre application InkFlow sur Vercel.

## 📋 Prérequis

1. **Compte Vercel** : Créez un compte sur [vercel.com](https://vercel.com)
2. **Compte GitHub/GitLab/Bitbucket** : Votre code doit être dans un repository Git
3. **Variables d'environnement** : Préparez vos clés API

## 🎯 Méthode 1 : Déploiement via Vercel Dashboard (Recommandé)

### Étape 1 : Préparer votre code

1. **Vérifier que tout est commité** :
   ```bash
   git status
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Vérifier que le build fonctionne localement** :
   ```bash
   npm run build
   ```
   Si le build échoue, corrigez les erreurs avant de continuer.

### Étape 2 : Connecter votre repository

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Cliquez sur **"Add New Project"**
3. **Importez votre repository** :
   - Si c'est la première fois, connectez votre compte GitHub/GitLab/Bitbucket
   - Sélectionnez votre repository `tatoo` (ou le nom de votre repo)
4. Cliquez sur **"Import"**

### Étape 3 : Configurer le projet

Vercel détecte automatiquement Vite grâce à `vercel.json`, mais vérifiez :

- **Framework Preset** : `Vite` (détecté automatiquement)
- **Root Directory** : `./` (racine du projet)
- **Build Command** : `npm run build` (déjà configuré dans `vercel.json`)
- **Output Directory** : `dist` (déjà configuré dans `vercel.json`)
- **Install Command** : `npm install` (déjà configuré)

### Étape 4 : Configurer les variables d'environnement

**IMPORTANT** : Configurez toutes les variables avant le premier déploiement.

Dans la section **"Environment Variables"**, ajoutez :

#### Variables Frontend (VITE_*)
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (ou pk_live_...)
VITE_GEMINI_API_KEY=votre_gemini_key (optionnel)
```

#### Variables Backend (pour les API routes)
```
STRIPE_SECRET_KEY=sk_test_... (ou sk_live_...)
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
SUPABASE_URL=https://votre-projet.supabase.co (ou utilisez VITE_SUPABASE_URL)
SITE_URL=https://votre-projet.vercel.app (sera mis à jour après le premier déploiement)
```

#### Variables optionnelles
```
STRIPE_WEBHOOK_SECRET=whsec_... (pour les webhooks Stripe)
RESEND_API_KEY=re_... (pour les emails)
```

**Note** : 
- Les variables `VITE_*` sont accessibles côté client
- Les autres variables sont uniquement côté serveur (API routes)

### Étape 5 : Déployer

1. Cliquez sur **"Deploy"**
2. Attendez que le build se termine (2-5 minutes)
3. Vercel vous donnera une URL : `https://votre-projet.vercel.app`

### Étape 6 : Mettre à jour SITE_URL

Après le premier déploiement, mettez à jour la variable `SITE_URL` :

1. Allez dans **Settings → Environment Variables**
2. Modifiez `SITE_URL` avec votre URL Vercel : `https://votre-projet.vercel.app`
3. **Redéployez** pour appliquer le changement

## 🎯 Méthode 2 : Déploiement via Vercel CLI

### Étape 1 : Installer Vercel CLI

```bash
npm install -g vercel
```

### Étape 2 : Se connecter

```bash
vercel login
```

### Étape 3 : Déployer

```bash
# Déploiement de prévisualisation (staging)
vercel

# Déploiement en production
vercel --prod
```

### Étape 4 : Configurer les variables d'environnement

```bash
# Ajouter une variable
vercel env add VITE_SUPABASE_URL production

# Ou via le dashboard (plus facile)
```

## ✅ Vérification après Déploiement

### 1. Vérifier que l'application fonctionne

- Ouvrez l'URL fournie par Vercel
- Vérifiez que la page d'accueil s'affiche
- Testez la connexion

### 2. Vérifier les API Routes

Allez sur **Vercel Dashboard → Functions** et vérifiez que ces fonctions apparaissent :
- `api/stripe-connect-onboard`
- `api/stripe-connect-callback`
- `api/create-payment-intent`
- `api/create-flash-checkout`
- `api/submit-project-request`
- `api/send-care-instructions`

### 3. Tester les fonctionnalités principales

- [ ] Connexion/Inscription
- [ ] Dashboard artiste
- [ ] Configuration Stripe Connect
- [ ] Création de flashs
- [ ] Réservation de flashs
- [ ] Paiements

## 🔧 Configuration des Domaines Personnalisés

### Ajouter un domaine personnalisé

1. Allez dans **Settings → Domains**
2. Ajoutez votre domaine (ex: `inkflow.com`)
3. Suivez les instructions pour configurer les DNS

### Configuration DNS

Ajoutez ces enregistrements dans votre registrar :

**Type A** :
```
@ → 76.76.21.21
```

**Type CNAME** :
```
www → cname.vercel-dns.com
```

## 🐛 Dépannage

### Le build échoue

1. **Vérifiez les logs** : Vercel Dashboard → Deployments → Latest → Build Logs
2. **Testez localement** : `npm run build`
3. **Vérifiez les erreurs TypeScript** : `npx tsc --noEmit`

### Les API routes ne fonctionnent pas

1. **Vérifiez que les fonctions sont déployées** : Dashboard → Functions
2. **Vérifiez les variables d'environnement** : Settings → Environment Variables
3. **Vérifiez les logs** : Dashboard → Functions → [nom de la fonction] → Logs

### Les variables d'environnement ne sont pas disponibles

- Les variables `VITE_*` doivent être préfixées avec `VITE_`
- Redéployez après avoir ajouté/modifié des variables
- Vérifiez que les variables sont configurées pour l'environnement correct (Production, Preview, Development)

### L'application fonctionne en local mais pas sur Vercel

1. **Videz le cache** : Dashboard → Deployments → Redeploy → Décochez "Use existing Build Cache"
2. **Vérifiez les variables d'environnement**
3. **Vérifiez les logs de build**

## 📝 Checklist de Déploiement

Avant de déployer :

- [ ] Code commité et poussé sur Git
- [ ] Build local réussi (`npm run build`)
- [ ] Variables d'environnement préparées
- [ ] `vercel.json` présent et correct
- [ ] `.env.local` dans `.gitignore` (ne pas commiter les secrets)

Après le déploiement :

- [ ] Application accessible sur l'URL Vercel
- [ ] Variables d'environnement configurées
- [ ] API routes fonctionnelles
- [ ] Connexion/Inscription fonctionne
- [ ] Stripe Connect configuré
- [ ] `SITE_URL` mis à jour avec l'URL Vercel

## 🔄 Déploiements Automatiques

Vercel déploie automatiquement à chaque push sur :
- **Production** : Branche `main` ou `master`
- **Preview** : Toutes les autres branches et pull requests

Pour désactiver les déploiements automatiques :
- Settings → Git → Configure Git → Désactivez "Automatic deployments"

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite + Vercel](https://vercel.com/docs/frameworks/vite)
- [Guide de dépannage Stripe Connect](./docs/TROUBLESHOOTING_STRIPE_CONNECT.md)
- [Checklist de déploiement](./docs/VERCEL_DEPLOYMENT_CHECKLIST.md)

## 🚀 Commandes Rapides

```bash
# Déployer en production
vercel --prod

# Voir les logs
vercel logs

# Lister les déploiements
vercel ls

# Ouvrir le dashboard
vercel dashboard
```

---

**Note** : Après le déploiement, n'oubliez pas de mettre à jour `SITE_URL` dans les variables d'environnement avec votre URL Vercel !

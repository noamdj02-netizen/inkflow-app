# Guide de Déploiement sur Vercel

## ✅ Code déjà poussé sur GitHub

Le code a été poussé avec succès sur : `https://github.com/noamdj02-netizen/inkflow-app.git`

## 🚀 Déploiement sur Vercel

### Option 1 : Déploiement via l'interface Vercel (Recommandé)

1. **Connecter votre compte GitHub à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous avec votre compte GitHub
   - Cliquez sur "Add New Project"

2. **Importer le projet**
   - Sélectionnez le dépôt `inkflow-app` depuis la liste
   - Vercel détectera automatiquement la configuration (Vite)

3. **Configuration du projet**
   - **Framework Preset** : Vite (détecté automatiquement)
   - **Root Directory** : `./` (racine)
   - **Build Command** : `npm run build` (déjà configuré dans `vercel.json`)
   - **Output Directory** : `dist` (déjà configuré dans `vercel.json`)
   - **Install Command** : `npm install` (déjà configuré dans `vercel.json`)

4. **Variables d'environnement**
   Ajoutez les variables suivantes dans la section "Environment Variables" :
   
   ```
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   VITE_STRIPE_PUBLISHABLE_KEY=votre_clé_publique_stripe
   GEMINI_API_KEY=votre_clé_gemini (si utilisée)
   ```

   **Comment trouver ces valeurs :**
   - **Supabase** : Dashboard Supabase → Settings → API
   - **Stripe** : Dashboard Stripe → Developers → API keys
   - **Gemini** : Google AI Studio (si utilisé)

5. **Déployer**
   - Cliquez sur "Deploy"
   - Attendez la fin du build (environ 2-3 minutes)
   - Votre application sera disponible sur `https://votre-projet.vercel.app`

### Option 2 : Déploiement via CLI Vercel

1. **Installer Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Déployer**
   ```bash
   vercel
   ```
   
   Suivez les instructions :
   - Lier au projet existant ou créer un nouveau projet
   - Confirmer les paramètres de build
   - Ajouter les variables d'environnement quand demandé

4. **Déployer en production**
   ```bash
   vercel --prod
   ```

## 📝 Configuration Vercel (vercel.json)

Le fichier `vercel.json` est déjà configuré avec :
- ✅ Build command : `npm run build`
- ✅ Output directory : `dist`
- ✅ Rewrites pour le routing SPA (React Router)

## 🔧 Variables d'environnement requises

Créez un fichier `.env.production` localement pour référence (ne pas commiter) :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
GEMINI_API_KEY=votre_clé_gemini
```

**Important** : Ces variables doivent être ajoutées dans le dashboard Vercel, pas dans le fichier `.env` du repo.

## 🌐 Domaines personnalisés

1. Allez dans **Settings** → **Domains** de votre projet Vercel
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions DNS

## 🔄 Déploiements automatiques

Vercel déploie automatiquement :
- ✅ Chaque push sur `main` → Production
- ✅ Chaque pull request → Preview

## 📱 PWA sur Vercel

La PWA est déjà configurée et fonctionnera automatiquement sur Vercel grâce à :
- ✅ `vite-plugin-pwa` configuré
- ✅ Manifest.json généré automatiquement
- ✅ Service Worker généré automatiquement

## 🐛 Dépannage

### Build échoue
- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez les logs de build dans Vercel Dashboard

### Erreur 404 sur les routes
- Vérifiez que les rewrites sont bien configurés dans `vercel.json` (✅ déjà fait)

### Images ne s'affichent pas
- Vérifiez que les images dans `public/` sont bien commitées
- Les chemins doivent être relatifs : `/images/...`

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Vite sur Vercel](https://vercel.com/docs/frameworks/vite)
- [Variables d'environnement Vercel](https://vercel.com/docs/environment-variables)


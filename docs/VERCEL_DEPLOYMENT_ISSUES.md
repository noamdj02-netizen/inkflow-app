# 🔧 Guide de Résolution des Problèmes de Déploiement Vercel

## Problème : Les nouvelles fonctionnalités n'apparaissent pas sur Vercel

### Symptômes
- ✅ Le bouton "Continuer avec Google" fonctionne en local mais pas sur Vercel
- ✅ Les paramètres admin (Stripe, couleurs) ne s'affichent pas sur Vercel
- ✅ Les routes API ne fonctionnent pas sur Vercel

---

## ✅ Solution 1 : Forcer un Redéploiement Complet

### Étape 1 : Vider le Cache Vercel

1. **Allez sur [Vercel Dashboard](https://vercel.com/dashboard)**
2. **Sélectionnez votre projet** (`inkflow-app`)
3. **Allez dans "Settings" → "General"**
4. **Scroll jusqu'à "Build & Development Settings"**
5. **Cliquez sur "Clear Build Cache"** (si disponible)
6. **OU** allez dans "Deployments" → Sélectionnez le dernier déploiement → "Redeploy" → **Cochez "Use existing Build Cache"** → **DÉCOCHEZ-LA** → "Redeploy"

### Étape 2 : Push un Commit Vide pour Forcer le Build

```bash
git commit --allow-empty -m "chore: Force Vercel redeploy - Clear cache"
git push origin main
```

### Étape 3 : Vérifier le Build sur Vercel

1. **Allez dans "Deployments"** sur Vercel
2. **Attendez que le build se termine** (2-3 minutes)
3. **Vérifiez les logs** pour voir si tout s'est bien compilé
4. **Cliquez sur "Visit"** pour voir le site

---

## ✅ Solution 2 : Vérifier les Variables d'Environnement

### Variables Requises sur Vercel

Allez dans **Vercel Dashboard → Settings → Environment Variables** et vérifiez que vous avez :

#### Obligatoires
- `VITE_SUPABASE_URL` = `https://votre-projet.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `votre_anon_key`
- `STRIPE_SECRET_KEY` = `sk_test_...` ou `sk_live_...`
- `SUPABASE_SERVICE_ROLE_KEY` = `votre_service_role_key`
- `RESEND_API_KEY` = `re_...`

#### Optionnelles
- `VITE_GEMINI_API_KEY` = `votre_gemini_key` (si vous utilisez l'IA)

### Comment Ajouter/Modifier

1. **Vercel Dashboard → Settings → Environment Variables**
2. **Ajoutez chaque variable** avec sa valeur
3. **Sélectionnez les environnements** (Production, Preview, Development)
4. **Cliquez sur "Save"**
5. **Redéployez** (voir Solution 1)

---

## ✅ Solution 3 : Vérifier la Configuration Vercel

### Fichier `vercel.json`

Le fichier `vercel.json` doit contenir :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Vérifier que les Routes API sont Déployées

1. **Allez sur Vercel Dashboard → Deployments**
2. **Cliquez sur le dernier déploiement**
3. **Allez dans l'onglet "Functions"**
4. **Vous devriez voir** :
   - `api/stripe-connect-onboard`
   - `api/create-flash-checkout`
   - `api/create-payment-intent`
   - etc.

Si elles n'apparaissent pas, c'est que Vercel ne les détecte pas. Vérifiez que :
- Les fichiers sont dans le dossier `api/` à la racine
- Les fichiers ont l'extension `.ts`
- Le `vercel.json` contient la section `functions`

---

## ✅ Solution 4 : Vérifier le Cache du Navigateur

### Sur Vercel (Production)

1. **Ouvrez le site en navigation privée** (Ctrl+Shift+N ou Cmd+Shift+N)
2. **OU** videz le cache :
   - Chrome/Edge : `Ctrl+Shift+Delete` → Cochez "Images et fichiers en cache" → "Effacer"
   - Firefox : `Ctrl+Shift+Delete` → Cochez "Cache" → "Effacer"
   - Safari : `Cmd+Option+E`

3. **Rechargez la page** (F5 ou Ctrl+R)

### Hard Refresh

- **Windows/Linux** : `Ctrl+Shift+R` ou `Ctrl+F5`
- **Mac** : `Cmd+Shift+R`

---

## ✅ Solution 5 : Vérifier les Logs Vercel

### Build Logs

1. **Vercel Dashboard → Deployments → [Dernier déploiement]**
2. **Cliquez sur "Build Logs"**
3. **Cherchez les erreurs** :
   - `Error: Cannot find module...`
   - `Error: Missing environment variable...`
   - `Error: Build failed...`

### Runtime Logs (pour les Routes API)

1. **Vercel Dashboard → Deployments → [Dernier déploiement]**
2. **Allez dans l'onglet "Functions"**
3. **Cliquez sur une fonction** (ex: `api/stripe-connect-onboard`)
4. **Allez dans "Logs"**
5. **Vérifiez les erreurs** lors des appels API

---

## ✅ Solution 6 : Vérifier que le Code est Bien Commit

### Vérifier Git

```bash
# Vérifier que les fichiers sont bien commités
git status

# Vérifier que les fichiers sont bien pushés
git log --oneline -5

# Vérifier que les fichiers sont sur GitHub
# Allez sur https://github.com/votre-repo/inkflow-app
# Vérifiez que les fichiers sont bien présents :
# - components/LoginPage.tsx (avec le bouton Google)
# - components/dashboard/DashboardSettings.tsx (avec Stripe)
# - api/stripe-connect-onboard.ts
```

### Si les Fichiers ne sont pas Commités

```bash
git add components/LoginPage.tsx
git add components/dashboard/DashboardSettings.tsx
git add api/
git commit -m "fix: Add missing components and API routes"
git push origin main
```

---

## ✅ Solution 7 : Test Local vs Production

### Tester en Local

```bash
# Installer les dépendances
npm install

# Lancer le build
npm run build

# Tester le build
npm run preview

# Ouvrir http://localhost:4173
# Vérifier que :
# - Le bouton Google apparaît sur /login
# - Les paramètres Stripe apparaissent sur /dashboard/settings
```

### Comparer avec Production

1. **Ouvrez le site Vercel** (ex: `https://inkflow-app.vercel.app`)
2. **Comparez avec le local** (`http://localhost:4173`)
3. **Si c'est différent**, c'est un problème de déploiement
4. **Si c'est identique**, c'est un problème de cache navigateur

---

## 🚨 Checklist de Vérification

Avant de signaler un problème, vérifiez :

- [ ] Le code est bien commité et pushé sur GitHub
- [ ] Le build Vercel s'est terminé sans erreur
- [ ] Les variables d'environnement sont configurées sur Vercel
- [ ] Le cache Vercel a été vidé
- [ ] Le cache du navigateur a été vidé
- [ ] Vous avez testé en navigation privée
- [ ] Les routes API apparaissent dans "Functions" sur Vercel
- [ ] Le fichier `vercel.json` est présent et correct

---

## 📞 Si Rien ne Fonctionne

1. **Vérifiez les logs Vercel** (Build + Runtime)
2. **Vérifiez les logs du navigateur** (F12 → Console)
3. **Vérifiez le Network tab** (F12 → Network) pour voir les erreurs API
4. **Créez un nouveau déploiement** en forçant le rebuild complet

---

## 🔗 Liens Utiles

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation - Vite](https://vercel.com/docs/frameworks/vite)
- [Vercel Documentation - Serverless Functions](https://vercel.com/docs/functions)

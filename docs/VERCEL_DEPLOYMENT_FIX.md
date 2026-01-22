# 🚀 Vercel Deployment Fix Guide

## ✅ Step 1: Build Check - PASSED ✅

Le build local fonctionne sans erreurs :
```bash
npm run build
✓ built in 17.46s
```

**Avertissements (non bloquants)** :
- Certains chunks sont > 500 KB (normal pour une app React complète)
- Avertissement Recharts sur dépendance circulaire (non critique)

---

## 📋 Step 2: Environment Variables Checklist

### Variables Frontend (Vite - `import.meta.env`)

Ces variables doivent être ajoutées dans **Vercel Dashboard → Settings → Environment Variables** avec le préfixe `VITE_` :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJhbGc...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | `pk_test_...` ou `pk_live_...` |
| `VITE_GEMINI_API_KEY` | Clé API Google Gemini (optionnel) | `AIza...` |

### Variables Backend (API Routes - `process.env`)

Ces variables sont utilisées dans les API routes Vercel (`/api/*`) :

| Variable | Description | Où utilisé |
|----------|-------------|------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `api/stripe-connect-onboard.ts`, `api/stripe-connect-callback.ts` |
| `RESEND_API_KEY` | Clé API Resend pour emails | `api/submit-project-request.ts`, `api/send-care-instructions.ts` |
| `RESEND_FROM_EMAIL` | Email expéditeur (optionnel) | `api/submit-project-request.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | `api/stripe-connect-onboard.ts`, `api/stripe-connect-callback.ts` |
| `SITE_URL` | URL de production (optionnel) | `api/stripe-connect-onboard.ts` |

**Note** : `NODE_ENV` est automatiquement défini par Vercel (`production` en prod, `development` en preview).

---

## 🔧 Step 3: How to Force Redeploy Without Cache

### Option A: Via Vercel Dashboard (Recommandé)

1. **Allez dans Vercel Dashboard** → Votre projet
2. **Onglet "Deployments"**
3. **Trouvez le dernier déploiement** (celui qui montre l'ancien code)
4. **Cliquez sur les 3 points** (⋯) à droite du déploiement
5. **Sélectionnez "Redeploy"**
6. **Cochez "Use existing Build Cache"** → **DÉCOCHEZ** cette option
7. **Cliquez sur "Redeploy"**

### Option B: Via Git (Force Push Empty Commit)

Si vous voulez forcer un nouveau déploiement depuis le terminal :

```bash
# Créer un commit vide pour déclencher un nouveau build
git commit --allow-empty -m "chore: Force Vercel redeploy without cache"

# Pousser sur la branche principale
git push origin main
```

**Note** : Cette méthode déclenchera un nouveau build, mais Vercel peut toujours utiliser le cache. Pour être sûr, utilisez l'Option A.

### Option C: Via Vercel CLI (Si installé)

```bash
# Installer Vercel CLI (si pas déjà fait)
npm i -g vercel

# Se connecter
vercel login

# Déployer sans cache
vercel --prod --force
```

---

## 🎯 Checklist Complète pour Résoudre le Problème

### 1. Vérifier les Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables, assurez-vous que **TOUTES** ces variables sont présentes :

**Frontend (VITE_*) :**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] `VITE_GEMINI_API_KEY` (optionnel)

**Backend (API Routes) :**
- [ ] `STRIPE_SECRET_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL` (optionnel, défaut: `InkFlow <onboarding@resend.dev>`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SITE_URL` (optionnel, sera déduit automatiquement)

### 2. Vérifier l'Environnement

Assurez-vous que les variables sont définies pour **Production** (et éventuellement Preview) :

- Dans Vercel, chaque variable peut être définie pour :
  - **Production** (déploiements sur `main`)
  - **Preview** (déploiements sur autres branches)
  - **Development** (déploiements locaux via `vercel dev`)

### 3. Forcer un Redéploiement Sans Cache

Utilisez l'**Option A** ci-dessus pour être sûr que le cache est ignoré.

### 4. Vérifier les Logs de Build

Après le redéploiement, vérifiez les logs :

1. Vercel Dashboard → Votre projet → **Deployments**
2. Cliquez sur le dernier déploiement
3. Onglet **"Build Logs"**
4. Vérifiez qu'il n'y a pas d'erreurs liées aux variables d'environnement

### 5. Vérifier le Code Déployé

Pour confirmer que le nouveau code est déployé :

1. Ouvrez votre site en production
2. Ouvrez les DevTools (F12)
3. Onglet **Network** → Rechargez la page (Ctrl+F5)
4. Vérifiez que les fichiers JS chargés ont des noms de hash récents
5. Vérifiez la console pour d'éventuelles erreurs

---

## 🐛 Diagnostic Supplémentaire

Si le problème persiste après avoir suivi ces étapes :

### Vérifier le Cache du Navigateur

Le problème peut aussi venir du cache du navigateur :

1. **Chrome/Edge** : `Ctrl + Shift + Delete` → Cochez "Images et fichiers en cache" → Effacer
2. **Firefox** : `Ctrl + Shift + Delete` → Cochez "Cache" → Effacer
3. **Ou** : Ouvrez en navigation privée (Ctrl+Shift+N)

### Vérifier le CDN Cache

Vercel utilise un CDN qui peut mettre en cache les fichiers statiques :

1. Vercel Dashboard → Settings → **Edge Network**
2. Vérifiez les paramètres de cache
3. Si nécessaire, purgez le cache via l'API Vercel ou contactez le support

### Vérifier les Headers de Cache

Vérifiez que `vercel.json` ne force pas un cache trop long :

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

## ✅ Résumé des Actions

1. ✅ **Build Check** : Le build local fonctionne
2. 📋 **Environment Variables** : Vérifiez que toutes les variables sont dans Vercel
3. 🔄 **Force Redeploy** : Utilisez l'Option A pour redéployer sans cache
4. 🧹 **Clear Browser Cache** : Testez en navigation privée
5. 📊 **Check Build Logs** : Vérifiez les logs Vercel pour des erreurs

Une fois ces étapes complétées, votre nouveau code (design, bouton Google) devrait apparaître en production.

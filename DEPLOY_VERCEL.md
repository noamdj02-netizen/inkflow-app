# Déploiement Vercel – ink-flow.me

## 1. Déployer en production

À la racine du projet :

```bash
npx vercel --prod --yes
```

Ou, si vous voulez suivre les questions du CLI :

```bash
npx vercel --prod
```

## 2. Variables d'environnement (obligatoires)

Dans **Vercel** → votre projet → **Settings** → **Environment Variables**, ajoutez pour **Production** (et Preview si besoin) :

| Nom | Valeur | Notes |
|-----|--------|--------|
| `VITE_SUPABASE_URL` | `https://votre-projet.supabase.co` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | Clé anon publique Supabase |

Optionnel (si vous utilisez Gemini) :

| Nom | Valeur |
|-----|--------|
| `VITE_GEMINI_API_KEY` | Votre clé API Gemini |

Après avoir ajouté ou modifié des variables, refaites un déploiement : **Deployments** → **…** sur le dernier → **Redeploy**.

## 3. Domaine personnalisé ink-flow.me

1. Allez sur [vercel.com](https://vercel.com) → votre projet **tatoo**.
2. **Settings** → **Domains**.
3. Cliquez sur **Add** et saisissez : `ink-flow.me`.
4. Pour que tout le site soit servi sur ce domaine, ajoutez aussi `www.ink-flow.me` si vous voulez (optionnel).
5. Vercel affiche les enregistrements DNS à créer chez votre registrar (ex. A, CNAME).
6. Chez le gestionnaire de domaine (où vous avez acheté ink-flow.me), créez les enregistrements indiqués par Vercel (souvent un CNAME `cname.vercel-dns.com` ou des A vers `76.76.21.21`).

La propagation DNS peut prendre jusqu’à 48 h (souvent quelques minutes).

## 4. Vérifications

- **Build** : le build local `npm run build` doit réussir (dossier `dist/`).
- **Config** : `vercel.json` est déjà en place (output: `dist`, rewrites SPA, headers de sécurité).
- **API** : les routes sous `/api/*` sont gérées par les serverless functions du dossier `api/`. Si vous en utilisez, ajoutez dans Vercel les variables demandées par ces fonctions (ex. `SUPABASE_URL`, `SUPABASE_ANON_KEY` pour les API serverless).

## Résumé

1. `npx vercel --prod --yes` pour déployer.
2. Configurer `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (et optionnellement `VITE_GEMINI_API_KEY`) dans **Settings** → **Environment Variables**.
3. Dans **Settings** → **Domains**, ajouter **ink-flow.me** et configurer le DNS chez votre registrar.

# Déploiement GitHub + Vercel — ink-flow.me

Guide pour pousser le projet sur GitHub et le déployer sur Vercel avec le domaine **ink-flow.me**.

---

## 1. Préparer le dépôt (si pas déjà fait)

### Retirer `.next` du suivi Git (si déjà commité)

```powershell
cd "c:\Users\lanie\OneDrive\.limpc\Bureau\tatoo"
git rm -r --cached .next
```

Puis commiter la mise à jour du `.gitignore` (`.next/` et `out/` y sont déjà).

### Créer le dépôt sur GitHub

1. Va sur [github.com/new](https://github.com/new).
2. Nom du repo : par ex. `tatoo` ou `inkflow`.
3. **Private** ou **Public** selon ton besoin.
4. Ne coche pas "Add a README" si le projet existe déjà en local.
5. Clique sur **Create repository**.

### Lier le projet local à GitHub

```powershell
cd "c:\Users\lanie\OneDrive\.limpc\Bureau\tatoo"

# Si aucun remote n'existe
git remote add origin https://github.com/TON-USERNAME/TON-REPO.git

# Ou avec SSH
# git remote add origin git@github.com:TON-USERNAME/TON-REPO.git

# Vérifier
git remote -v
```

Remplace `TON-USERNAME` et `TON-REPO` par ton compte GitHub et le nom du repo.

### Pousser le code

```powershell
git add .
git status
git commit -m "chore: prepare deploy GitHub + Vercel, ignore .next"
git branch -M main
git push -u origin main
```

---

## 2. Déployer sur Vercel

### Importer le projet depuis GitHub

1. Va sur [vercel.com](https://vercel.com) et connecte-toi (avec GitHub si possible).
2. **Add New…** → **Project**.
3. **Import** du repo GitHub (tu choisis l’org/compte puis le repo).
4. **Configure Project** :
   - **Framework Preset** : Next.js (détecté automatiquement).
   - **Root Directory** : laisser vide si le code est à la racine.
   - **Build Command** : `npm run build`.
   - **Output Directory** : laisser par défaut (Next.js gère).
   - **Install Command** : `npm install`.
5. Clique sur **Deploy** (le premier déploiement peut échouer tant que les variables d’env ne sont pas définies).

### Variables d’environnement (obligatoire)

Dans le projet Vercel : **Settings** → **Environment Variables**. Ajoute au minimum :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anon Supabase | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service_role (optionnel) | Production |
| `STRIPE_SECRET_KEY` | `sk_live_...` ou `sk_test_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` ou `pk_test_...` | Production, Preview |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (voir ci‑dessous) | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://ink-flow.me` | Production, Preview |
| `DATABASE_URL` | URL pooler Supabase (port 6543, `?pgbouncer=true`) | Production, Preview |
| `DIRECT_URL` | URL pooler Supabase (port 5432) pour migrations | Production, Preview |

Optionnel (emails, etc.) :

- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- Autres variables présentes dans ton `.env.local.example`.

Puis **Redeploy** le dernier déploiement pour que les variables soient prises en compte.

### Webhook Stripe (pour les paiements)

1. Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL** : `https://ink-flow.me/api/webhooks/stripe` (ou l’URL Vercel temporaire avant le domaine).
3. Événements à sélectionner : `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`.
4. Copie le **Signing secret** (`whsec_...`) et ajoute-le dans Vercel comme `STRIPE_WEBHOOK_SECRET`.

---

## 3. Domaine personnalisé ink-flow.me

### Sur Vercel

1. Projet Vercel → **Settings** → **Domains**.
2. **Add** → saisis `ink-flow.me`.
3. Pour avoir aussi `www.ink-flow.me` : ajoute `www.ink-flow.me` et laisse Vercel gérer la redirection.

### Chez ton registrar (où tu as acheté ink-flow.me)

Deux options selon ce que Vercel affiche (souvent **A** pour un domaine racine).

**Option A — enregistrements A**

- Type **A** :
  - Nom : `@` (ou `ink-flow.me`)
  - Valeur : `76.76.21.21` (IP Vercel, à confirmer dans l’interface Vercel).
- Type **CNAME** pour `www` si tu utilises www :
  - Nom : `www`
  - Valeur : `cname.vercel-dns.com` (ou la cible indiquée par Vercel).

**Option B — CNAME (souvent pour www uniquement)**

- Si Vercel propose un CNAME pour la racine (ex. alias Vercel) :
  - Suivre exactement les instructions affichées dans **Domains** (nom et cible).

Vercel vérifie le domaine ; la propagation DNS peut prendre jusqu’à 48 h (souvent quelques minutes).

### Après que le domaine est actif

1. Dans Vercel **Domains**, vérifier que `ink-flow.me` (et éventuellement `www.ink-flow.me`) est **Valid**.
2. Dans les variables d’environnement, confirmer que `NEXT_PUBLIC_SITE_URL` = `https://ink-flow.me`.
3. Redéployer une fois si tu viens de changer `NEXT_PUBLIC_SITE_URL`.

---

## 4. Vérifications rapides

- [ ] `https://ink-flow.me` affiche la landing.
- [ ] `https://ink-flow.me/login` et `/register` fonctionnent.
- [ ] Connexion Supabase OK (login/register).
- [ ] `https://ink-flow.me/dashboard` (après connexion).
- [ ] Une réservation test avec Stripe (mode test si tu utilises des clés test).
- [ ] Stripe Dashboard → Webhooks : événements reçus pour `https://ink-flow.me/api/webhooks/stripe`.

---

## 5. Commandes utiles

```powershell
# Pousser les mises à jour
git add .
git commit -m "ton message"
git push

# Déploiement Vercel via CLI (optionnel)
npx vercel --prod
```

Chaque `git push` sur la branche connectée (souvent `main`) déclenche un nouveau déploiement Vercel.

---

## Résumé

1. **GitHub** : repo créé → `git remote add origin` → `git push -u origin main`.
2. **Vercel** : import du repo GitHub → ajout des variables d’environnement → déploiement.
3. **Stripe** : webhook `https://ink-flow.me/api/webhooks/stripe` + `STRIPE_WEBHOOK_SECRET` dans Vercel.
4. **Domaine** : Vercel **Domains** → ajouter `ink-flow.me` → configurer les enregistrements DNS chez ton registrar comme indiqué par Vercel.

Si tu indiques où tu en es (GitHub créé ou pas, Vercel déjà lié ou pas), on peut détailler uniquement la prochaine étape.

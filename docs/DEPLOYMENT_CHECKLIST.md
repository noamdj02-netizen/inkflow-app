# 🚀 Checklist de Déploiement - Nouvelles Fonctionnalités

## ✅ Déploiement GitHub & Vercel

**Commit créé et poussé sur `main`** ✅

Le déploiement Vercel se déclenche automatiquement. Vérifiez dans Vercel Dashboard que le build est en cours.

---

## 📋 Actions Requises AVANT d'utiliser les nouvelles fonctionnalités

### 1. Migrations SQL (Supabase Dashboard)

Exécutez ces migrations dans **Supabase Dashboard → SQL Editor** :

#### Migration 1 : Stripe Onboarding Status
```sql
-- Fichier: supabase/migration-add-stripe-onboarding.sql
```
**Action** : Ajoute le champ `stripe_onboarding_complete` à la table `artists`

#### Migration 2 : Flash Deposit Amount
```sql
-- Fichier: supabase/migration-add-flash-deposit.sql
```
**Action** : Ajoute le champ `deposit_amount` à la table `flashs`

---

### 2. Variables d'Environnement Vercel

Ajoutez ces variables dans **Vercel Dashboard → Settings → Environment Variables** :

#### Variables Backend (API Routes)

| Variable | Description | Où l'obtenir |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | Stripe Dashboard → Developers → API keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase | Supabase Dashboard → Settings → API |
| `RESEND_API_KEY` | Clé API Resend (déjà configuré) | Resend Dashboard |
| `SITE_URL` | URL de production (optionnel) | Votre domaine Vercel (ex: `https://inkflow.vercel.app`) |

**Important** : Assurez-vous que ces variables sont définies pour **Production** (et Preview si nécessaire).

---

### 3. Configuration Stripe Connect

#### Étape 1 : Activer Stripe Connect

1. Allez dans **Stripe Dashboard** → **Connect**
2. Cliquez sur **"Démarrer"** ou **"Get started"**
3. Choisissez **"Platforme ou Place de marché"**

#### Étape 2 : Configurer l'Apparence

1. **Stripe Dashboard** → **Settings** → **Connect** → **Branding**
2. Ajoutez votre logo InkFlow
3. Configurez les couleurs (Noir/Or pour correspondre à votre thème)

#### Étape 3 : URL de Redirection

Dans **Stripe Dashboard** → **Settings** → **Connect** → **Settings**, ajoutez :

- **Redirect URI** : `https://votre-domaine.vercel.app/api/stripe-connect-callback`

---

## 🎯 Nouvelles Fonctionnalités Déployées

### 1. Stripe Connect (Onboarding & Paiements)

**Fichiers créés** :
- `api/stripe-connect-onboard.ts` - Création du compte et lien d'onboarding
- `api/stripe-connect-callback.ts` - Vérification après onboarding
- `api/create-payment-intent.ts` - Payment Intent avec commission dynamique

**UI** :
- Section "Paiements Stripe" dans Dashboard Settings (`/dashboard/settings`)
- Bouton "Configurer les virements" pour l'onboarding
- Badge "Compte Stripe actif" une fois configuré

**Flux** :
1. Artiste va dans Settings → Paiements Stripe
2. Clique sur "Configurer les virements"
3. Redirigé vers Stripe pour entrer ses informations bancaires
4. Après complétion, redirigé vers Settings avec confirmation

---

### 2. Flash Direct Booking

**Fichiers créés** :
- `api/create-flash-checkout.ts` - Session Stripe Checkout pour flash
- Migration SQL : `supabase/migration-add-flash-deposit.sql`

**UI** :
- Bouton "Réserver (Acompte XX€)" sur chaque carte de flash
- Calcul automatique de l'acompte (deposit_amount ou prix * deposit_percentage)
- Redirection directe vers Stripe Checkout

**Flux** :
1. Client visite le profil public de l'artiste
2. Voit les flashs disponibles dans une grille
3. Clique sur "Réserver (Acompte XX€)"
4. Redirigé vers Stripe Checkout pour payer
5. Après paiement, redirigé vers `/pay/success`

---

## 🔧 Commission Dynamique

La commission est calculée automatiquement selon le plan :

| Plan | Commission | Exemple (50€ acompte) |
|------|------------|----------------------|
| **FREE** | 5% | 2.50€ |
| **STARTER** | 2% | 1.00€ |
| **PRO** | 0% | 0.00€ |
| **STUDIO** | 0% | 0.00€ |

**Logique** :
- InkFlow reçoit la commission (`application_fee_amount`)
- L'artiste reçoit le reste (`amount - application_fee_amount`)

---

## 📊 Vérification du Déploiement

### 1. Vérifier le Build Vercel

1. Allez dans **Vercel Dashboard** → Votre projet
2. Onglet **"Deployments"**
3. Vérifiez que le dernier déploiement est **"Ready"** (vert)
4. Si erreur, consultez les **Build Logs**

### 2. Tester les Fonctionnalités

#### Test Stripe Connect :
1. Connectez-vous au dashboard
2. Allez dans **Settings** → **Paiements Stripe**
3. Cliquez sur **"Configurer les virements"**
4. Vérifiez que vous êtes redirigé vers Stripe

#### Test Flash Booking :
1. Visitez un profil public d'artiste (ex: `/p/votre-slug`)
2. Onglet **"Flashs"**
3. Cliquez sur **"Réserver (Acompte XX€)"** sur un flash
4. Vérifiez que vous êtes redirigé vers Stripe Checkout

---

## 🐛 Dépannage

### Erreur : "Artist has not completed Stripe Connect onboarding"

**Solution** : L'artiste doit d'abord configurer son compte bancaire dans Settings → Paiements Stripe.

### Erreur : "Missing required environment variable"

**Solution** : Vérifiez que toutes les variables d'environnement sont définies dans Vercel Dashboard.

### Erreur : "Flash not found" ou "Project not found"

**Solution** : Vérifiez que les migrations SQL ont été exécutées et que les données existent dans Supabase.

---

## 📚 Documentation

Tous les guides sont disponibles dans le dossier `docs/` :

- `STRIPE_CONNECT_STEP1.md` - Database & Dependencies
- `STRIPE_CONNECT_STEP2_3.md` - Onboarding Flow & Callback
- `STRIPE_CONNECT_STEP4.md` - Payment Intent with Commission
- `FLASH_DIRECT_BOOKING_STEP1.md` - Database Schema
- `FLASH_DIRECT_BOOKING_STEP2.md` - Checkout Session API
- `FLASH_DIRECT_BOOKING_STEP3.md` - Public Profile UI
- `VERCEL_DEPLOYMENT_FIX.md` - Guide de déploiement Vercel

---

## ✅ Checklist Complète

- [x] Code commité et poussé sur GitHub
- [x] Déploiement Vercel déclenché
- [ ] Migration SQL `migration-add-stripe-onboarding.sql` exécutée
- [ ] Migration SQL `migration-add-flash-deposit.sql` exécutée
- [ ] Variables d'environnement Vercel configurées :
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RESEND_API_KEY` (déjà configuré)
  - [ ] `SITE_URL` (optionnel)
- [ ] Stripe Connect activé dans Stripe Dashboard
- [ ] URL de redirection configurée dans Stripe Connect
- [ ] Build Vercel réussi
- [ ] Test Stripe Connect onboarding
- [ ] Test Flash Direct Booking

---

## 🎉 Une fois tout configuré

Votre SaaS InkFlow est prêt avec :
- ✅ Réservation directe de flashs avec paiement Stripe
- ✅ Commission dynamique selon le plan d'abonnement
- ✅ Onboarding Stripe Connect pour les artistes
- ✅ Paiements sécurisés avec Stripe Checkout

**Tout est déployé et prêt à être utilisé !** 🚀

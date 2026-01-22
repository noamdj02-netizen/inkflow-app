# 💳 Stripe Connect - Step 1: Database & Dependencies

## ✅ Vérifications

### 1. Package Stripe
- ✅ Le package `stripe` est déjà installé dans `package.json` (version 20.2.0)

### 2. Base de Données
- ✅ La table `artists` a déjà les champs :
  - `stripe_account_id` (TEXT, nullable) - ID du compte Stripe Connect (`acct_...`)
  - `stripe_connected` (BOOLEAN) - Indique si le compte est connecté
- ✅ Migration créée : `supabase/migration-add-stripe-onboarding.sql`
  - Ajoute `stripe_onboarding_complete` (BOOLEAN) pour suivre l'état de l'onboarding
- ✅ Types TypeScript mis à jour dans `types/supabase.ts`

### 3. Plan d'Abonnement
- ✅ La table `artists` a le champ `user_plan` (FREE, STARTER, PRO, STUDIO)
- ✅ Le fichier `config/subscriptions.ts` contient les taux de commission :
  - FREE: 5% (0.05)
  - STARTER: 2% (0.02)
  - PRO: 0% (0.00)
  - STUDIO: 0% (0.00)

## 📋 Actions Requises

### 1. Exécuter la Migration SQL

Dans Supabase Dashboard → SQL Editor, exécutez :

```sql
-- Fichier: supabase/migration-add-stripe-onboarding.sql
```

Cette migration ajoute le champ `stripe_onboarding_complete` à la table `artists`.

### 2. Variables d'Environnement

Assurez-vous d'avoir ces variables dans votre `.env.local` (frontend) :

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Et dans Vercel (pour les API routes) ou Supabase Edge Functions Secrets :

```env
STRIPE_SECRET_KEY=sk_test_...
```

**Important pour Stripe Connect** : Vous aurez besoin de la clé secrète côté serveur pour créer les comptes Connect et les Account Links.

## 🎯 Prochaine Étape

Une fois la migration SQL exécutée, passez à **Step 2** : Création du flux d'onboarding Stripe Connect.

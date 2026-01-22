# 💳 Stripe Connect - Step 2 & 3: Onboarding Flow & Callback

## ✅ Step 2: Onboarding Flow

### Fichiers Créés

1. **`api/stripe-connect-onboard.ts`**
   - API route Vercel pour créer un compte Stripe Connect Express
   - Génère un Account Link pour l'onboarding
   - Sauvegarde le `stripe_account_id` dans la base de données

### Fonctionnalités

- **Création automatique du compte Stripe** : Si l'artiste n'a pas encore de compte, un compte Express est créé
- **Génération du lien d'onboarding** : Crée un Account Link avec :
  - `refresh_url` : Redirige vers `/dashboard/settings?stripe_refresh=true` si l'utilisateur annule
  - `return_url` : Redirige vers `/api/stripe-connect-callback` après complétion
- **Sauvegarde du compte ID** : Stocke `stripe_account_id` dans la table `artists`

### Sécurité

- Vérification de l'authentification via token Bearer
- Utilisation de la clé secrète Stripe côté serveur uniquement
- Service Role Key Supabase pour bypass RLS lors de la mise à jour

---

## ✅ Step 3: Callback Handler

### Fichiers Créés

1. **`api/stripe-connect-callback.ts`**
   - Handler pour la redirection après onboarding Stripe
   - Vérifie le statut d'onboarding (`charges_enabled` et `details_submitted`)
   - Met à jour `stripe_connected` et `stripe_onboarding_complete` dans la DB

### Fonctionnalités

- **Vérification du statut** : Récupère le compte Stripe et vérifie si l'onboarding est complet
- **Mise à jour automatique** : Met à jour les champs dans `artists` :
  - `stripe_connected` : `true` si `charges_enabled && details_submitted`
  - `stripe_onboarding_complete` : même logique
- **Redirection intelligente** :
  - Succès → `/dashboard/settings?stripe_success=true`
  - Incomplet → `/dashboard/settings?stripe_incomplete=true`

---

## ✅ UI Component

### Modifications dans `DashboardSettings.tsx`

1. **Nouvelle section "Paiements Stripe"**
   - Affiche le statut de connexion Stripe
   - Bouton "Configurer les virements" si non connecté
   - Badge "Compte Stripe actif" si connecté

2. **Gestion des callbacks**
   - Détecte les paramètres URL (`stripe_success`, `stripe_incomplete`, `stripe_refresh`)
   - Affiche des toasts Sonner pour informer l'utilisateur
   - Rafraîchit le profil après succès

3. **Fonction `handleStripeConnect`**
   - Récupère le token de session Supabase
   - Appelle `/api/stripe-connect-onboard`
   - Redirige vers l'URL Stripe d'onboarding

---

## 📋 Configuration Requise

### Variables d'Environnement Vercel

Ajoutez dans Vercel Dashboard → Settings → Environment Variables :

```env
STRIPE_SECRET_KEY=sk_test_...
VITE_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
SITE_URL=https://votre-domaine.vercel.app
```

**Important** : La clé secrète Stripe (`STRIPE_SECRET_KEY`) doit être stockée dans Vercel, jamais dans le code source.

### Configuration Vercel

Le fichier `vercel.json` a été mis à jour pour router les API routes :

```json
{
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

---

## 🎯 Flux Utilisateur

1. **Artiste va dans Dashboard → Settings**
2. **Voit la section "Paiements Stripe"**
3. **Clique sur "Configurer les virements"**
4. **Redirigé vers Stripe** pour compléter l'onboarding (RIB, informations bancaires)
5. **Après complétion**, redirigé vers `/api/stripe-connect-callback`
6. **Callback vérifie le statut** et met à jour la DB
7. **Redirigé vers Settings** avec message de succès
8. **Section affiche "Compte Stripe actif"**

---

## 🎯 Prochaine Étape

Une fois Step 2 & 3 validés, passez à **Step 4** : Création du Payment Intent avec commission dynamique basée sur le plan d'abonnement.

# 🚀 Implémentation SaaS avec Abonnements Stripe

## ✅ Ce qui a été implémenté

### 1. **Schéma Prisma** (`prisma/schema.prisma`)
- ✅ Ajout des enums `SubscriptionPlan` (STARTER, PRO, STUDIO) et `SubscriptionStatus`
- ✅ Ajout des champs d'abonnement dans le modèle `User` :
  - `stripeCustomerId`
  - `stripeSubscriptionId`
  - `subscriptionPlan`
  - `subscriptionStatus`
  - `subscriptionCurrentPeriodEnd`

### 2. **Migration SQL Supabase** (`supabase/migration-add-subscription-fields.sql`)
- ✅ Création des enums PostgreSQL
- ✅ Ajout des colonnes à la table `users`
- ✅ Création des index pour les performances

### 3. **Système de Permissions** (`lib/permissions.ts`)
- ✅ Fonction `hasActiveSubscription()` pour vérifier l'abonnement actif
- ✅ Fonction `hasFeatureAccess()` pour vérifier l'accès aux fonctionnalités
- ✅ Fonction `canCreateArtist()` pour limiter le nombre d'artistes par plan
- ✅ Fonction `canUseAIForm()` pour restreindre l'accès au formulaire IA
- ✅ Fonction `getStripeFeePercentage()` pour calculer les frais Stripe

### 4. **Utilitaires d'Abonnement** (`lib/subscription-utils.ts`)
- ✅ Configuration des Price IDs Stripe
- ✅ Mapping des statuts Stripe vers Prisma
- ✅ Helpers pour l'affichage des plans

### 5. **Hook d'Abonnement** (`hooks/useSubscription.ts`)
- ✅ Récupération des données d'abonnement depuis Supabase
- ✅ Écoute en temps réel des changements d'abonnement

### 6. **Protection des Routes** (`components/SubscriptionProtectedRoute.tsx`)
- ✅ Composant qui vérifie l'abonnement avant d'autoriser l'accès au Dashboard
- ✅ Redirection automatique vers `/subscribe` si pas d'abonnement actif

### 7. **API Routes Stripe**

#### `api/create-subscription-checkout.ts`
- ✅ Création d'une session Stripe Checkout pour les abonnements
- ✅ Création automatique d'un Stripe Customer si nécessaire
- ✅ Gestion des métadonnées (userId, plan)

#### `api/create-customer-portal.ts`
- ✅ Création d'une session Stripe Customer Portal
- ✅ Permet aux utilisateurs de gérer leur abonnement (upgrade/downgrade, carte bancaire)

#### `api/webhooks/stripe/route.ts` (mis à jour)
- ✅ Gestion de l'événement `checkout.session.completed` pour les abonnements
- ✅ Gestion de `customer.subscription.created` et `customer.subscription.updated`
- ✅ Gestion de `customer.subscription.deleted`
- ✅ Mise à jour automatique de la table `users` avec le statut d'abonnement

### 8. **Page d'Abonnement** (`components/SubscribePage.tsx`)
- ✅ Affichage des 3 plans (Starter, Pro, Studio)
- ✅ Boutons pour créer une session Stripe Checkout
- ✅ Gestion des erreurs et états de chargement

### 9. **Dashboard Settings** (`components/dashboard/DashboardSettings.tsx`)
- ✅ Section "Abonnement" avec affichage du plan actuel
- ✅ Bouton "Gérer mon abonnement" qui ouvre le Stripe Customer Portal
- ✅ Affichage de la date de renouvellement

### 10. **Routes** (`App.tsx`)
- ✅ Route `/subscribe` pour la page d'abonnement
- ✅ Route `/subscribe/success` pour la page de succès après paiement
- ✅ Protection du Dashboard avec `SubscriptionProtectedRoute`

---

## 🔧 Configuration Requise

### 1. **Variables d'Environnement**

Ajoutez ces variables dans `.env.local` et dans Vercel Dashboard :

```bash
# Stripe (déjà configuré)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (À CRÉER DANS STRIPE DASHBOARD)
STRIPE_PRICE_ID_STARTER=price_xxxxx  # À créer pour le plan Starter (29€/mois)
STRIPE_PRICE_ID_PRO=price_xxxxx      # À créer pour le plan Pro (49€/mois)
STRIPE_PRICE_ID_STUDIO=price_xxxxx   # À créer pour le plan Studio (99€/mois)
```

### 2. **Créer les Price IDs dans Stripe Dashboard**

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Créez 3 produits avec abonnements mensuels :
   - **Starter** : 29€/mois
   - **Pro** : 49€/mois
   - **Studio** : 99€/mois
3. Copiez les Price IDs (commencent par `price_`) et ajoutez-les dans les variables d'environnement

### 3. **Appliquer la Migration SQL**

Exécutez la migration SQL dans Supabase Dashboard :

1. Allez dans Supabase Dashboard → SQL Editor
2. Copiez-collez le contenu de `supabase/migration-add-subscription-fields.sql`
3. Exécutez la migration

### 4. **Configurer le Webhook Stripe**

1. Allez sur [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Ajoutez un endpoint : `https://votre-domaine.vercel.app/api/webhooks/stripe`
3. Sélectionnez ces événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copiez le "Signing secret" (commence par `whsec_`) et ajoutez-le dans `STRIPE_WEBHOOK_SECRET`

---

## 📋 Utilisation du Feature Gating

### Exemple dans une API Route

```typescript
import { canCreateArtist, canUseAIForm } from '../lib/permissions';

// Dans votre API route
const { data: user } = await supabase
  .from('users')
  .select('subscription_plan, subscription_status')
  .eq('id', userId)
  .single();

const userSubscription = {
  plan: user.subscription_plan,
  status: user.subscription_status,
};

// Vérifier si l'utilisateur peut créer un artiste
const artistCheck = canCreateArtist(userSubscription, currentArtistCount);
if (!artistCheck.allowed) {
  return res.status(403).json({ error: artistCheck.reason });
}

// Vérifier si l'utilisateur peut utiliser le formulaire IA
const aiFormCheck = canUseAIForm(userSubscription);
if (!aiFormCheck.allowed) {
  return res.status(403).json({ error: aiFormCheck.reason });
}
```

### Exemple dans un Composant React

```typescript
import { useSubscription } from '../hooks/useSubscription';
import { hasFeatureAccess } from '../lib/permissions';

const MyComponent = () => {
  const { subscription } = useSubscription();

  if (!hasFeatureAccess(subscription, 'use_ai_form')) {
    return <div>Cette fonctionnalité nécessite le plan Pro ou Studio</div>;
  }

  return <AIForm />;
};
```

---

## 🔄 Flux Utilisateur

### 1. **Nouvel Utilisateur**
1. S'inscrit sur `/register`
2. Se connecte sur `/login`
3. Accède au Dashboard → Redirigé vers `/subscribe` (pas d'abonnement)
4. Choisit un plan → Redirigé vers Stripe Checkout
5. Paiement réussi → Webhook met à jour l'abonnement → Redirigé vers `/dashboard`

### 2. **Utilisateur Existant**
1. Se connecte → Accède au Dashboard (si abonnement actif)
2. Va dans Settings → Section "Abonnement"
3. Clique sur "Gérer mon abonnement" → Ouvre Stripe Customer Portal
4. Peut changer de plan, mettre à jour sa carte, annuler, etc.

### 3. **Annulation d'Abonnement**
1. Utilisateur annule via Stripe Customer Portal
2. Webhook `customer.subscription.deleted` est déclenché
3. Statut mis à jour à `canceled` dans la base de données
4. Au prochain accès au Dashboard → Redirigé vers `/subscribe`

---

## 🎯 Prochaines Étapes (Optionnel)

1. **Page de Succès Personnalisée** : Créer `/subscribe/success` avec un message de bienvenue
2. **Email de Bienvenue** : Envoyer un email après souscription réussie
3. **Essai Gratuit** : Configurer une période d'essai de 14 jours dans Stripe
4. **Limites par Plan** : Implémenter les limites réelles (nombre d'artistes, etc.)
5. **Analytics** : Tracker les conversions et les changements de plan
6. **Notifications** : Alerter les utilisateurs avant la fin de période d'essai

---

## 🐛 Dépannage

### L'utilisateur est redirigé vers `/subscribe` même avec un abonnement actif
- Vérifiez que la migration SQL a été appliquée
- Vérifiez que les colonnes `subscription_plan` et `subscription_status` existent dans la table `users`
- Vérifiez que le webhook Stripe fonctionne (logs dans Vercel)

### Le webhook ne met pas à jour l'abonnement
- Vérifiez que l'URL du webhook est correcte dans Stripe Dashboard
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Vérifiez les logs Vercel pour voir les erreurs

### Le Customer Portal ne s'ouvre pas
- Vérifiez que `STRIPE_SECRET_KEY` est configuré
- Vérifiez que l'utilisateur a un `stripe_customer_id` dans la base de données

---

## 📚 Ressources

- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

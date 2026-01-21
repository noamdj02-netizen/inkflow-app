# 🔑 Configuration des Stripe Price IDs

## 📋 Guide pour obtenir et configurer les Stripe Price IDs

Ce guide vous explique comment créer les produits et prix Stripe pour vos plans d'abonnement, puis comment les configurer dans `config/subscriptions.ts`.

---

## 🎯 Étape 1 : Créer les Produits dans Stripe Dashboard

### 1. Accéder à Stripe Dashboard

1. **Connectez-vous** à [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Allez dans** "Products" (menu latéral gauche)

### 2. Créer le Produit "Starter"

1. **Cliquez sur** "Add product"
2. **Remplissez** :
   - **Name** : `InkFlow Starter`
   - **Description** : `Plan Starter - Pour démarrer avec InkFlow`
   - **Pricing model** : `Standard pricing`
   - **Price** : `29.00 EUR`
   - **Billing period** : `Monthly` (recurring)
   - **Currency** : `EUR`
3. **Cliquez sur** "Save product"
4. **Copiez le Price ID** (commence par `price_...`) - Exemple : `price_1ABC123xyz`

### 3. Créer le Produit "Pro"

1. **Cliquez sur** "Add product"
2. **Remplissez** :
   - **Name** : `InkFlow Pro`
   - **Description** : `Plan Pro - Pour les tatoueurs établis`
   - **Pricing model** : `Standard pricing`
   - **Price** : `49.00 EUR`
   - **Billing period** : `Monthly` (recurring)
   - **Currency** : `EUR`
3. **Cliquez sur** "Save product"
4. **Copiez le Price ID** (commence par `price_...`)

### 4. Créer le Produit "Studio"

1. **Cliquez sur** "Add product"
2. **Remplissez** :
   - **Name** : `InkFlow Studio`
   - **Description** : `Plan Studio - Pour les équipes (jusqu'à 3 artistes)`
   - **Pricing model** : `Standard pricing`
   - **Price** : `99.00 EUR`
   - **Billing period** : `Monthly` (recurring)
   - **Currency** : `EUR`
3. **Cliquez sur** "Save product"
4. **Copiez le Price ID** (commence par `price_...`)

---

## 🔧 Étape 2 : Configurer dans `config/subscriptions.ts`

### Ouvrir le fichier

Ouvrez `config/subscriptions.ts` et remplacez les placeholders :

```typescript
STARTER: {
  title: 'Starter',
  price: 29,
  priceId: 'price_1ABC123xyz', // ← Remplacez par votre vrai Price ID
  // ...
},
PRO: {
  title: 'Pro',
  price: 49,
  priceId: 'price_1DEF456uvw', // ← Remplacez par votre vrai Price ID
  // ...
},
STUDIO: {
  title: 'Studio',
  price: 99,
  priceId: 'price_1GHI789rst', // ← Remplacez par votre vrai Price ID
  // ...
}
```

### Exemple complet

```typescript
export const PLANS: Record<PlanType, PlanConfig> = {
  FREE: {
    title: 'Essai / Gratuit',
    price: 0,
    priceId: '', // Pas de Price ID pour le plan gratuit
    // ...
  },
  STARTER: {
    title: 'Starter',
    price: 29,
    priceId: 'price_1OaBcDeFgHiJkLmN', // Votre Price ID Stripe
    description: 'Pour démarrer',
    // ...
  },
  PRO: {
    title: 'Pro',
    price: 49,
    priceId: 'price_1PqRsTuVwXyZaBcD', // Votre Price ID Stripe
    description: 'Pour les établis',
    // ...
  },
  STUDIO: {
    title: 'Studio',
    price: 99,
    priceId: 'price_1EfGhIjKlMnOpQrS', // Votre Price ID Stripe
    description: 'Pour les équipes',
    // ...
  }
};
```

---

## ✅ Vérification

### Tester la configuration

```typescript
import { getStripePriceId, getPlan } from '../config/subscriptions';

// Vérifier que les Price IDs sont configurés
console.log('Starter Price ID:', getStripePriceId('STARTER'));
console.log('Pro Price ID:', getStripePriceId('PRO'));
console.log('Studio Price ID:', getStripePriceId('STUDIO'));

// Vérifier la config complète
const starterPlan = getPlan('STARTER');
console.log('Starter Plan:', starterPlan);
```

### Erreurs courantes

#### ❌ "Invalid price ID"

**Cause** : Le Price ID n'existe pas dans Stripe ou est incorrect.

**Solution** :
1. Vérifiez que le Price ID commence par `price_`
2. Vérifiez dans Stripe Dashboard que le produit existe
3. Vérifiez que vous utilisez le bon Price ID (pas le Product ID)

#### ❌ "Price ID is empty"

**Cause** : Le placeholder n'a pas été remplacé.

**Solution** :
1. Remplacez tous les `price_*_placeholder` par vos vrais Price IDs
2. Vérifiez qu'il n'y a pas d'espaces avant/après

---

## 🔒 Sécurité

### ⚠️ Ne commitez JAMAIS les Price IDs en production

Si vous utilisez des Price IDs différents pour dev/prod :

1. **Créez un fichier `.env.local`** :
   ```env
   VITE_STRIPE_PRICE_STARTER=price_1ABC123xyz
   VITE_STRIPE_PRICE_PRO=price_1DEF456uvw
   VITE_STRIPE_PRICE_STUDIO=price_1GHI789rst
   ```

2. **Modifiez `config/subscriptions.ts`** :
   ```typescript
   STARTER: {
     priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER || 'price_starter_placeholder',
     // ...
   }
   ```

3. **Ajoutez `.env.local` à `.gitignore`**

---

## 📝 Checklist

- [ ] Produit "Starter" créé dans Stripe Dashboard
- [ ] Price ID Starter copié
- [ ] Produit "Pro" créé dans Stripe Dashboard
- [ ] Price ID Pro copié
- [ ] Produit "Studio" créé dans Stripe Dashboard
- [ ] Price ID Studio copié
- [ ] Placeholders remplacés dans `config/subscriptions.ts`
- [ ] Configuration testée
- [ ] Price IDs ajoutés à `.env.local` (si nécessaire)
- [ ] `.env.local` ajouté à `.gitignore`

---

## 🚀 Prochaines Étapes

Une fois les Price IDs configurés :

1. **Intégrer dans le code** : Utiliser `getStripePriceId()` pour créer les Checkout Sessions
2. **Tester les paiements** : Utiliser les Price IDs de test Stripe
3. **Gérer les webhooks** : Mettre à jour `user_plan` quand un abonnement est créé/annulé

---

**Note** : Les Price IDs sont différents entre le mode test et le mode live de Stripe. Assurez-vous d'utiliser les bons Price IDs selon votre environnement.

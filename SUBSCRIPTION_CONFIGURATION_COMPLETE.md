# ✅ Subscription Configuration Complete

## 🎉 Configuration Finalisée

Tous les Stripe Price IDs ont été configurés dans `config/subscriptions.ts` !

---

## ✅ Price IDs Configurés

| Plan | Prix | Price ID | Product ID |
|------|------|----------|------------|
| **STARTER** | 29€ | `price_1SnI6x5JVD1yZUQvprDYjdy1` | `prod_TkniNnxKXXUKeM` |
| **PRO** | 49€ | `price_1SnI7d5JVD1yZUQv1kAtDX0v` | `prod_TknjUbDRIoeGpP` |
| **STUDIO** | 99€ | `price_1SnI7y5JVD1yZUQvPvKjcNYn` | `prod_Tknj6fdYAgGFBB` |

---

## 📋 Checklist Finale

- [x] Migration SQL créée (`supabase/migration-add-subscription-plans.sql`)
- [x] Configuration des plans créée (`config/subscriptions.ts`)
- [x] Helper functions implémentées
- [x] Types TypeScript mis à jour (`types/supabase.ts`)
- [x] **Stripe Price IDs configurés** ✅
- [ ] Migration SQL appliquée dans Supabase
- [ ] Intégration dans les composants (à faire)
- [ ] Page de pricing/upgrade (à faire)
- [ ] Webhook Stripe pour gérer les changements de plan (à faire)

---

## 🚀 Prochaines Étapes

### 1. Appliquer la Migration SQL

Dans Supabase Dashboard → SQL Editor :

```sql
-- Exécutez le contenu de supabase/migration-add-subscription-plans.sql
```

### 2. Utiliser dans le Code

**Exemple : Créer une Checkout Session Stripe**

```typescript
import { getStripePriceId } from '../config/subscriptions';
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);

// Créer une Checkout Session pour un plan
const plan = 'STARTER'; // ou 'PRO', 'STUDIO'
const priceId = getStripePriceId(plan);

const { error } = await stripe.redirectToCheckout({
  lineItems: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  successUrl: `${window.location.origin}/dashboard?success=true`,
  cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
});
```

**Exemple : Vérifier les Features**

```typescript
import { hasFeature, getPlanLimits } from '../config/subscriptions';

const artistPlan = artist.user_plan || 'FREE';
const plan = artistPlan as PlanType;

// Afficher le formulaire IA seulement si PRO ou STUDIO
if (hasFeature(plan, 'aiBooking')) {
  // Show AI booking form
}

// Vérifier le nombre max d'artistes
const maxArtists = getPlanLimits(plan).maxArtists;
```

**Exemple : Calculer la Commission**

```typescript
import { calculateApplicationFee } from '../config/subscriptions';

const depositAmount = 3000; // 30€ en centimes
const plan = artist.user_plan || 'FREE';
const commission = calculateApplicationFee(depositAmount, plan);
// FREE: 150 centimes (1.50€)
// STARTER: 60 centimes (0.60€)
// PRO/STUDIO: 0
```

---

## 📚 Documentation

- **Configuration** : `config/subscriptions.ts`
- **Migration SQL** : `supabase/migration-add-subscription-plans.sql`
- **Guide Stripe** : `docs/STRIPE_PRICE_IDS_SETUP.md`

---

**Status** : ✅ Configuration Complete - Ready for Integration

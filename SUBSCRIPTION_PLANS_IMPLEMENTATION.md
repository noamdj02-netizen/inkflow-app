# ✅ Subscription Plans Implementation Complete

## 🎯 Résumé

Système de pricing/abonnements implémenté pour InkFlow avec 4 plans : FREE, STARTER, PRO, et STUDIO.

---

## ✅ Ce qui a été créé

### 1. Migration SQL (`supabase/migration-add-subscription-plans.sql`)

- ✅ Ajout du champ `user_plan` à la table `artists`
- ✅ Type CHECK : `'FREE' | 'STARTER' | 'PRO' | 'STUDIO'`
- ✅ Valeur par défaut : `'FREE'`
- ✅ Index pour les requêtes par plan
- ✅ Mise à jour des artistes existants vers `FREE`

### 2. Configuration (`config/subscriptions.ts`)

- ✅ Type `PlanType` : Union type pour les 4 plans
- ✅ Interface `PlanLimits` : Limites et fonctionnalités
- ✅ Interface `PlanConfig` : Configuration complète d'un plan
- ✅ Objet `PLANS` : Configuration de tous les plans

**Plans configurés** :

| Plan | Prix | Commission | Artistes | IA | White Label | Multi-Cal |
|------|------|------------|----------|----|----|----|
| **FREE** | 0€ | 5% | 1 | ❌ | ❌ | ❌ |
| **STARTER** | 29€ | 2% | 1 | ❌ | ❌ | ❌ |
| **PRO** | 49€ | 0% | 1 | ✅ | ❌ | ❌ |
| **STUDIO** | 99€ | 0% | 3 | ✅ | ✅ | ✅ |

### 3. Helper Functions

- ✅ `getPlanLimits(plan)` : Retourne les limites d'un plan
- ✅ `calculateApplicationFee(amount, plan)` : Calcule la commission
- ✅ `getPlan(plan)` : Retourne la config complète
- ✅ `hasFeature(plan, feature)` : Vérifie si un plan a une feature
- ✅ `getStripePriceId(plan)` : Retourne le Stripe Price ID
- ✅ `supportsMultipleArtists(plan)` : Vérifie le support multi-artistes

---

## 📋 Prochaines Étapes

### 1. Appliquer la Migration SQL

Dans Supabase Dashboard → SQL Editor :

```sql
-- Copiez-collez le contenu de supabase/migration-add-subscription-plans.sql
-- Exécutez la migration
```

### 2. Mettre à jour les Types TypeScript

Après la migration, mettez à jour `types/supabase.ts` :

```typescript
// Dans artists.Row et artists.Insert
user_plan: 'FREE' | 'STARTER' | 'PRO' | 'STUDIO' | null
```

Ou régénérez les types avec Supabase CLI :
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

### 3. Configurer les Stripe Price IDs

Dans `config/subscriptions.ts`, remplacez les placeholders :

```typescript
STARTER: {
  priceId: 'price_xxxxxxxxxxxxx', // Votre vrai Stripe Price ID
},
PRO: {
  priceId: 'price_yyyyyyyyyyyyy',
},
STUDIO: {
  priceId: 'price_zzzzzzzzzzzzz',
}
```

### 4. Utiliser dans le Code

**Exemple : Vérifier les limites**

```typescript
import { getPlanLimits, hasFeature } from '../config/subscriptions';

const artistPlan = artist.user_plan || 'FREE';
const limits = getPlanLimits(artistPlan);

if (limits.maxArtists > 1) {
  // Allow multiple artists
}

if (hasFeature(artistPlan, 'aiBooking')) {
  // Show AI booking form
}
```

**Exemple : Calculer la commission**

```typescript
import { calculateApplicationFee } from '../config/subscriptions';

const depositAmount = 3000; // 30€ en centimes
const artistPlan = artist.user_plan || 'FREE';
const commission = calculateApplicationFee(depositAmount, artistPlan);
// commission = 150 centimes (1.50€) pour FREE (5%)
// commission = 60 centimes (0.60€) pour STARTER (2%)
// commission = 0 pour PRO et STUDIO (0%)
```

---

## 🎯 Utilisation dans l'Application

### Vérifier les Features

```typescript
// Dans un composant
import { hasFeature, getPlanLimits } from '../config/subscriptions';

const { profile } = useArtistProfile();
const plan = (profile?.user_plan || 'FREE') as PlanType;

// Afficher le formulaire IA seulement si PRO ou STUDIO
{hasFeature(plan, 'aiBooking') && <AIBookingForm />}

// Vérifier le nombre max d'artistes
const maxArtists = getPlanLimits(plan).maxArtists;
```

### Calculer les Commissions Stripe

```typescript
// Dans l'API route pour créer un Payment Intent
import { calculateApplicationFee } from '../config/subscriptions';

const depositAmount = booking.prix_total * 0.3; // 30% d'acompte
const plan = artist.user_plan || 'FREE';
const applicationFee = calculateApplicationFee(depositAmount, plan);

// Utiliser applicationFee dans Stripe Connect
const paymentIntent = await stripe.paymentIntents.create({
  amount: depositAmount,
  application_fee_amount: applicationFee,
  // ...
});
```

### Gérer les Limites

```typescript
// Vérifier avant d'ajouter un artiste
import { getPlanLimits } from '../config/subscriptions';

const plan = artist.user_plan || 'FREE';
const limits = getPlanLimits(plan);

if (currentArtistsCount >= limits.maxArtists) {
  // Afficher un message d'upgrade
  showUpgradeModal();
}
```

---

## 📊 Structure des Plans

### FREE (Essai / Gratuit)
- **Prix** : 0€
- **Artistes** : 1
- **Commission** : 5%
- **Features** : Calendrier basique uniquement

### STARTER (Pour démarrer)
- **Prix** : 29€/mois
- **Artistes** : 1
- **Commission** : 2%
- **Features** : Flashs illimités, Acomptes Stripe, Support email

### PRO (Pour les établis)
- **Prix** : 49€/mois
- **Artistes** : 1
- **Commission** : 0%
- **Features** : Tout du Starter + IA, Agenda sync, Support prioritaire

### STUDIO (Pour les équipes)
- **Prix** : 99€/mois
- **Artistes** : 3
- **Commission** : 0%
- **Features** : Tout du Pro + Multi-calendriers, Dashboard studio, Marque blanche

---

## 🔧 Migration SQL

Le fichier `supabase/migration-add-subscription-plans.sql` contient :

```sql
-- Ajoute la colonne user_plan
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'FREE' 
CHECK (user_plan IN ('FREE', 'STARTER', 'PRO', 'STUDIO'));

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_artists_user_plan ON artists(user_plan);

-- Met à jour les artistes existants
UPDATE artists SET user_plan = 'FREE' WHERE user_plan IS NULL;
```

---

## ✅ Checklist

- [x] Migration SQL créée
- [x] Configuration des plans créée (`config/subscriptions.ts`)
- [x] Helper functions implémentées
- [ ] Migration SQL appliquée dans Supabase
- [ ] Types TypeScript mis à jour
- [ ] Stripe Price IDs configurés
- [ ] Intégration dans les composants (à faire)
- [ ] Page de pricing/upgrade (à faire)
- [ ] Webhook Stripe pour gérer les changements de plan (à faire)

---

**Status** : ✅ Configuration Complete - Ready for Integration

**Next Steps** : 
1. Appliquer la migration SQL
2. Configurer les Stripe Price IDs
3. Intégrer dans les composants pour vérifier les limites et features

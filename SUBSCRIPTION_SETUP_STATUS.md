# ✅ Subscription Plans Setup - Status

## 📋 État Actuel

### ✅ Complété

1. **Migration SQL** : `supabase/migration-add-subscription-plans.sql` créée
2. **Configuration** : `config/subscriptions.ts` créé avec les 4 plans
3. **Helper Functions** : Toutes les fonctions utilitaires implémentées
4. **Types TypeScript** : `user_plan` ajouté dans `types/supabase.ts`
5. **Documentation** : Guides créés pour la configuration

### ⚠️ À Faire

1. **Appliquer la migration SQL** dans Supabase Dashboard
2. **Obtenir les Price IDs Stripe** (pas les Product IDs)
3. **Configurer les Price IDs** dans `config/subscriptions.ts`

---

## 🔍 Product IDs Fournis

Vous avez fourni ces **Product IDs** :

- **29€ (Starter)** : `prod_TkniNnxKXXUKeM`
- **49€ (Pro)** : `prod_TknjUbDRIoeGpP`
- **99€ (Studio)** : `prod_Tknj6fdYAgGFBB`

⚠️ **Important** : Ce sont des **Product IDs**, pas des **Price IDs**. Pour créer des Checkout Sessions Stripe, vous avez besoin des **Price IDs** (qui commencent par `price_...`).

---

## 🎯 Prochaines Étapes

### 1. Obtenir les Price IDs

**Via Stripe Dashboard** :
1. Allez dans [Stripe Dashboard](https://dashboard.stripe.com/) → **Products**
2. Pour chaque produit, cliquez dessus
3. Dans la section **"Pricing"**, copiez le **Price ID** (commence par `price_...`)

**Via Stripe API** :
```bash
curl https://api.stripe.com/v1/prices?product=prod_TkniNnxKXXUKeM \
  -u sk_test_...:
```

### 2. Mettre à jour la Configuration

Une fois que vous avez les **Price IDs**, mettez à jour `config/subscriptions.ts` :

```typescript
STARTER: {
  priceId: 'price_1ABC123xyz', // ← Votre Price ID (pas Product ID)
  // Product ID: prod_TkniNnxKXXUKeM
},
PRO: {
  priceId: 'price_1DEF456uvw', // ← Votre Price ID
  // Product ID: prod_TknjUbDRIoeGpP
},
STUDIO: {
  priceId: 'price_1GHI789rst', // ← Votre Price ID
  // Product ID: prod_Tknj6fdYAgGFBB
}
```

---

## 📚 Documentation

- **Guide complet** : `docs/STRIPE_PRICE_IDS_SETUP.md`
- **Comment obtenir les Price IDs** : `docs/HOW_TO_GET_PRICE_IDS.md`
- **Configuration** : `config/subscriptions.ts`

---

## ✅ Checklist Finale

- [ ] Migration SQL appliquée dans Supabase
- [ ] Price ID pour Starter obtenu (depuis `prod_TkniNnxKXXUKeM`)
- [ ] Price ID pour Pro obtenu (depuis `prod_TknjUbDRIoeGpP`)
- [ ] Price ID pour Studio obtenu (depuis `prod_Tknj6fdYAgGFBB`)
- [ ] Price IDs configurés dans `config/subscriptions.ts`
- [ ] Configuration testée

---

**Status** : ⚠️ En attente des Price IDs Stripe

Une fois que vous avez les **Price IDs**, envoyez-les moi et je mettrai à jour la configuration !

# 🔍 Comment obtenir les Price IDs depuis vos Product IDs

## ⚠️ Important : Product ID vs Price ID

Vous avez fourni des **Product IDs** :
- 29€ : `prod_TkniNnxKXXUKeM`
- 49€ : `prod_TknjUbDRIoeGpP`
- 99€ : `prod_Tknj6fdYAgGFBB`

Mais pour créer des Checkout Sessions Stripe, vous avez besoin des **Price IDs** (qui commencent par `price_...`).

---

## 🎯 Comment obtenir les Price IDs

### Méthode 1 : Via Stripe Dashboard (Recommandé)

1. **Allez dans** [Stripe Dashboard](https://dashboard.stripe.com/) → **Products**
2. **Pour chaque produit** :

   **Pour le produit 29€ (`prod_TkniNnxKXXUKeM`)** :
   - Cliquez sur le produit
   - Dans la section **"Pricing"**, vous verrez les prix associés
   - **Copiez le Price ID** (commence par `price_...`)
   - Exemple : `price_1ABC123xyz`

   **Pour le produit 49€ (`prod_TknjUbDRIoeGpP`)** :
   - Même processus
   - Copiez le Price ID

   **Pour le produit 99€ (`prod_Tknj6fdYAgGFBB`)** :
   - Même processus
   - Copiez le Price ID

### Méthode 2 : Via Stripe API

```bash
# Récupérer les prix du produit 29€
curl https://api.stripe.com/v1/prices?product=prod_TkniNnxKXXUKeM \
  -u sk_test_...: # Votre clé secrète Stripe

# Récupérer les prix du produit 49€
curl https://api.stripe.com/v1/prices?product=prod_TknjUbDRIoeGpP \
  -u sk_test_...:

# Récupérer les prix du produit 99€
curl https://api.stripe.com/v1/prices?product=prod_Tknj6fdYAgGFBB \
  -u sk_test_...:
```

La réponse contiendra un tableau `data` avec les prix. Le champ `id` de chaque prix est le **Price ID** que vous cherchez.

---

## 🔧 Mise à jour de la Configuration

Une fois que vous avez les **Price IDs**, mettez à jour `config/subscriptions.ts` :

```typescript
STARTER: {
  title: 'Starter',
  price: 29,
  priceId: 'price_1ABC123xyz', // ← Remplacez par votre Price ID
  // Product ID: prod_TkniNnxKXXUKeM
  // ...
},
PRO: {
  title: 'Pro',
  price: 49,
  priceId: 'price_1DEF456uvw', // ← Remplacez par votre Price ID
  // Product ID: prod_TknjUbDRIoeGpP
  // ...
},
STUDIO: {
  title: 'Studio',
  price: 99,
  priceId: 'price_1GHI789rst', // ← Remplacez par votre Price ID
  // Product ID: prod_Tknj6fdYAgGFBB
  // ...
}
```

---

## ⚠️ Si vous n'avez pas encore créé les prix

Si les produits n'ont pas encore de prix associés :

1. **Dans Stripe Dashboard** → **Products**
2. **Cliquez sur le produit** (ex: `prod_TkniNnxKXXUKeM`)
3. **Cliquez sur "Add price"** ou **"Pricing"** → **"Add pricing"**
4. **Remplissez** :
   - **Amount** : `29.00` (ou 49.00, 99.00)
   - **Currency** : `EUR`
   - **Billing period** : `Monthly` (recurring)
5. **Sauvegardez**
6. **Copiez le Price ID** généré (commence par `price_...`)

---

## 📋 Checklist

- [ ] Ouvrir Stripe Dashboard → Products
- [ ] Pour `prod_TkniNnxKXXUKeM` (29€) : Trouver et copier le Price ID
- [ ] Pour `prod_TknjUbDRIoeGpP` (49€) : Trouver et copier le Price ID
- [ ] Pour `prod_Tknj6fdYAgGFBB` (99€) : Trouver et copier le Price ID
- [ ] Vérifier que les Price IDs commencent par `price_` (pas `prod_`)
- [ ] Mettre à jour `config/subscriptions.ts` avec les Price IDs

---

## 💡 Astuce

Si vous avez plusieurs prix pour un même produit (ex: mensuel et annuel), choisissez le **prix mensuel** (billing period: Monthly) car vos plans sont facturés mensuellement.

---

Une fois que vous avez les **Price IDs**, envoyez-les moi et je mettrai à jour `config/subscriptions.ts` pour vous !

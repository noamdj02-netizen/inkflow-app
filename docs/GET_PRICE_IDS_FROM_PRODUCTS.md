# 🔍 Comment obtenir les Price IDs depuis les Product IDs

## ⚠️ Important : Product ID vs Price ID

Vous avez fourni des **Product IDs** (commencent par `prod_`), mais Stripe nécessite des **Price IDs** (commencent par `price_`) pour créer des Checkout Sessions.

- **Product ID** : Identifie le produit (ex: "InkFlow Starter")
- **Price ID** : Identifie un prix spécifique pour ce produit (ex: "29€/mois")

Un produit peut avoir plusieurs prix (mensuel, annuel, etc.). Vous devez obtenir le **Price ID** associé à chaque produit.

---

## 🎯 Méthode 1 : Via Stripe Dashboard (Recommandé)

### Pour chaque produit :

1. **Allez dans Stripe Dashboard** → **Products**
2. **Cliquez sur le produit** (ex: celui avec ID `prod_TkniNnxKXXUKeM`)
3. **Dans la section "Pricing"**, vous verrez les prix associés
4. **Copiez le Price ID** (commence par `price_...`)

**Exemple** :
- Produit : `prod_TkniNnxKXXUKeM` (29€)
- Price ID : `price_1ABC123xyz` ← **C'est celui-ci qu'il faut**

---

## 🎯 Méthode 2 : Via Stripe API

Si vous préférez utiliser l'API :

```bash
# Récupérer les prix d'un produit
curl https://api.stripe.com/v1/prices?product=prod_TkniNnxKXXUKeM \
  -u sk_test_...: # Votre clé secrète Stripe
```

Cela retournera tous les prix associés au produit. Le Price ID sera dans le champ `id`.

---

## 🔧 Mise à jour de la Configuration

Une fois que vous avez les **Price IDs** (pas les Product IDs), mettez à jour `config/subscriptions.ts` :

```typescript
STARTER: {
  title: 'Starter',
  price: 29,
  priceId: 'price_1ABC123xyz', // ← Price ID (pas Product ID)
  // ...
},
PRO: {
  title: 'Pro',
  price: 49,
  priceId: 'price_1DEF456uvw', // ← Price ID (pas Product ID)
  // ...
},
STUDIO: {
  title: 'Studio',
  price: 99,
  priceId: 'price_1GHI789rst', // ← Price ID (pas Product ID)
  // ...
}
```

---

## 📋 Checklist

- [ ] Ouvrir Stripe Dashboard → Products
- [ ] Pour `prod_TkniNnxKXXUKeM` (29€) : Copier le Price ID
- [ ] Pour `prod_TknjUbDRIoeGpP` (49€) : Copier le Price ID
- [ ] Pour `prod_Tknj6fdYAgGFBB` (99€) : Copier le Price ID
- [ ] Mettre à jour `config/subscriptions.ts` avec les Price IDs
- [ ] Vérifier que les Price IDs commencent par `price_` (pas `prod_`)

---

## ⚠️ Note Importante

Si vous n'avez pas encore créé les prix pour ces produits :

1. **Dans Stripe Dashboard** → **Products**
2. **Cliquez sur le produit**
3. **Ajoutez un prix** :
   - **Amount** : 29.00 EUR (ou 49.00, 99.00)
   - **Billing period** : Monthly (recurring)
4. **Sauvegardez** et copiez le **Price ID** généré

---

Une fois que vous avez les **Price IDs**, je peux mettre à jour `config/subscriptions.ts` pour vous !

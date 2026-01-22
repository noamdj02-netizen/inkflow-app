# 💳 Flash Direct Booking - Step 2: Stripe Checkout Session API

## ✅ Fichier Créé

**`api/create-flash-checkout.ts`**

Cette API route crée une session Stripe Checkout pour la réservation directe d'un flash avec commission dynamique.

---

## 🎯 Fonctionnalités

### 1. Validation & Sécurité

- ✅ Vérifie que le flash existe et est disponible (`statut = 'available'`)
- ✅ Vérifie le stock disponible (`stock_current < stock_limit`)
- ✅ Vérifie que l'artiste a complété l'onboarding Stripe Connect
- ✅ Valide les données d'entrée (`flash_id`)

### 2. Calcul de l'Acompte

L'acompte est calculé selon cette logique :

1. **Si `flash.deposit_amount` est défini** → Utiliser cette valeur
2. **Sinon** → Calculer depuis `prix * artist.deposit_percentage / 100`

**Exemple** :
- Flash avec `prix = 15000` (150€) et `deposit_amount = NULL`
- Artiste avec `deposit_percentage = 30`
- Acompte calculé = `15000 * 0.30 = 4500` (45€)

### 3. Calcul de Commission Dynamique

La commission est calculée automatiquement selon le plan :

| Plan | Commission Rate | Exemple (45€ acompte) |
|------|----------------|----------------------|
| **FREE** | 5% (0.05) | 2.25€ |
| **STARTER** | 2% (0.02) | 0.90€ |
| **PRO** | 0% (0.00) | 0.00€ |
| **STUDIO** | 0% (0.00) | 0.00€ |

### 4. Création de la Session Stripe Checkout

La session est créée avec :

- **`mode`** : `'payment'` (paiement unique)
- **`line_items`** : Un item "Acompte - [Titre du Flash]"
- **`payment_intent_data`** :
  - `application_fee_amount` : Commission calculée
  - `transfer_data.destination` : Compte Stripe Connect de l'artiste
  - `metadata` : Informations sur le flash, l'artiste, le plan
- **`success_url`** : `/pay/success?session_id={CHECKOUT_SESSION_ID}&flash_id={flash_id}`
- **`cancel_url`** : `/pay/{flash_id}?canceled=true`

---

## 📋 API Endpoint

### POST `/api/create-flash-checkout`

#### Request Body

```json
{
  "flash_id": "uuid-du-flash",
  "client_email": "client@example.com", // Optionnel
  "client_name": "Jean Dupont" // Optionnel
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_xxx",
  "sessionId": "cs_xxx",
  "depositAmount": 4500,
  "applicationFee": 90,  // Commission en centimes (0.90€ pour STARTER)
  "commissionRate": 0.02,
  "plan": "STARTER"
}
```

#### Response (Error - 400/404/500)

```json
{
  "error": "Error message",
  "code": "ERROR_CODE" // Optionnel
}
```

**Codes d'erreur possibles** :
- `FLASH_NOT_AVAILABLE` : Le flash n'est plus disponible
- `FLASH_SOLD_OUT` : Le flash est épuisé
- `STRIPE_ONBOARDING_INCOMPLETE` : L'artiste n'a pas complété l'onboarding Stripe
- `STRIPE_ERROR` : Erreur de l'API Stripe

---

## 🔄 Flux Utilisateur

1. **Client visite le profil public** → Voit les flashs disponibles
2. **Client clique sur "Réserver (Acompte XX€)"** → Frontend appelle `/api/create-flash-checkout`
3. **API route** :
   - Récupère le flash et l'artiste
   - Vérifie la disponibilité et le stock
   - Vérifie l'onboarding Stripe
   - Calcule l'acompte (deposit_amount ou prix * deposit_percentage)
   - Calcule la commission selon le plan
   - Crée la session Stripe Checkout avec `application_fee_amount` et `transfer_data`
4. **Frontend reçoit `url`** → Redirige vers Stripe Checkout (`window.location.href = url`)
5. **Client paie sur Stripe** → Stripe :
   - Garde la commission (`application_fee_amount`) pour InkFlow
   - Transfère le reste (`depositAmount - application_fee_amount`) au compte Stripe Connect de l'artiste
6. **Redirection vers `/pay/success`** → Le webhook Stripe mettra à jour le flash (`statut = 'reserved'`)

---

## 💰 Exemple de Calcul

### Scénario : Flash 150€, Artiste STARTER, Acompte 30%

```typescript
// Input
flash.prix = 15000; // 150€ en centimes
flash.deposit_amount = NULL; // Pas défini, on calcule
artist.deposit_percentage = 30; // 30%
plan = 'STARTER'; // Commission rate = 0.02 (2%)

// Calcul de l'acompte
depositAmount = Math.round((15000 * 30) / 100) = 4500; // 45€

// Calcul de la commission
applicationFeeAmount = calculateApplicationFee(4500, 'STARTER');
// = Math.round(4500 * 0.02) = 90 centimes = 0.90€

// Checkout Session créée
{
  line_items: [{
    price_data: {
      unit_amount: 4500, // 45€ acompte
    }
  }],
  payment_intent_data: {
    application_fee_amount: 90, // 0.90€ pour InkFlow
    transfer_data: {
      destination: 'acct_xxx' // Compte Stripe de l'artiste
    }
  }
}

// Résultat
// - Client paie : 45€
// - InkFlow reçoit : 0.90€ (commission)
// - Artiste reçoit : 44.10€ (45€ - 0.90€)
```

---

## 🎯 Prochaine Étape

Une fois Step 2 validé, passez à **Step 3** : Mise à jour de la page publique pour afficher le bouton "Réserver" et intégrer le flux de paiement.

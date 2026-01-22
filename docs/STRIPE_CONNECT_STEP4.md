# 💳 Stripe Connect - Step 4: Payment Intent with Dynamic Commission

## ✅ Fichier Créé

**`api/create-payment-intent.ts`**

Cette API route crée un Payment Intent Stripe avec commission dynamique basée sur le plan d'abonnement de l'artiste.

---

## 🎯 Fonctionnalités

### 1. Validation & Sécurité

- ✅ Vérifie que l'artiste a complété l'onboarding Stripe Connect
- ✅ Vérifie que le dépôt n'a pas déjà été payé
- ✅ Valide les données d'entrée (project_id, amount)
- ✅ Authentification via Supabase (peut être ajoutée si nécessaire)

### 2. Calcul de Commission Dynamique

La commission est calculée automatiquement selon le plan :

| Plan | Commission Rate | Exemple (50€) |
|------|----------------|---------------|
| **FREE** | 5% (0.05) | 2.50€ |
| **STARTER** | 2% (0.02) | 1.00€ |
| **PRO** | 0% (0.00) | 0.00€ |
| **STUDIO** | 0% (0.00) | 0.00€ |

**Formule** : `application_fee_amount = Math.round(amount * commissionRate)`

### 3. Création du Payment Intent

Le Payment Intent est créé avec :

- **`amount`** : Montant total en centimes (ex: 5000 = 50€)
- **`currency`** : `'eur'`
- **`application_fee_amount`** : Commission calculée en centimes
- **`transfer_data.destination`** : `artist.stripe_account_id` (compte Stripe Connect)
- **`metadata`** : Informations sur le projet, l'artiste, le plan, et la commission

---

## 📋 API Endpoint

### POST `/api/create-payment-intent`

#### Request Body

```json
{
  "project_id": "uuid-du-projet",
  "amount": 5000,  // En centimes (50€)
  "description": "Acompte pour projet personnalisé" // Optionnel
}
```

#### Response (Success - 200)

```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 5000,
  "applicationFee": 100,  // Commission en centimes (1€ pour STARTER)
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
- `STRIPE_ONBOARDING_INCOMPLETE` : L'artiste n'a pas complété l'onboarding Stripe
- `STRIPE_ERROR` : Erreur de l'API Stripe
- Autres erreurs de validation

---

## 🔄 Flux Utilisateur

1. **Client soumet un projet personnalisé** → Projet créé avec `statut = 'inquiry'`
2. **Artiste approuve et fixe un prix** → `artist_quoted_price` mis à jour, `statut = 'approved'`
3. **Client clique sur "Payer l'acompte"** → Frontend appelle `/api/create-payment-intent`
4. **API route** :
   - Récupère le projet et l'artiste
   - Vérifie l'onboarding Stripe
   - Calcule la commission selon le plan
   - Crée le Payment Intent avec `application_fee_amount` et `transfer_data`
5. **Frontend reçoit `clientSecret`** → Affiche le formulaire de paiement Stripe
6. **Client paie** → Stripe :
   - Garde la commission (`application_fee_amount`) pour InkFlow
   - Transfère le reste (`amount - application_fee_amount`) au compte Stripe Connect de l'artiste
7. **Webhook Stripe** → Met à jour `deposit_paid = true` dans la base de données

---

## 💰 Exemple de Calcul

### Scénario : Artiste STARTER, Acompte de 50€

```typescript
// Input
amount = 5000; // 50€ en centimes
plan = 'STARTER'; // Commission rate = 0.02 (2%)

// Calcul
applicationFeeAmount = calculateApplicationFee(5000, 'STARTER');
// = Math.round(5000 * 0.02) = 100 centimes = 1€

// Payment Intent créé
{
  amount: 5000,              // 50€ total
  application_fee_amount: 100, // 1€ pour InkFlow
  transfer_data: {
    destination: 'acct_xxx'   // Compte Stripe de l'artiste
  }
}

// Résultat
// - InkFlow reçoit : 1€ (commission)
// - Artiste reçoit : 49€ (50€ - 1€)
```

### Scénario : Artiste PRO, Acompte de 100€

```typescript
// Input
amount = 10000; // 100€ en centimes
plan = 'PRO'; // Commission rate = 0.00 (0%)

// Calcul
applicationFeeAmount = calculateApplicationFee(10000, 'PRO');
// = Math.round(10000 * 0.00) = 0 centimes = 0€

// Payment Intent créé
{
  amount: 10000,             // 100€ total
  application_fee_amount: 0,  // 0€ pour InkFlow
  transfer_data: {
    destination: 'acct_xxx'   // Compte Stripe de l'artiste
  }
}

// Résultat
// - InkFlow reçoit : 0€ (pas de commission)
// - Artiste reçoit : 100€ (montant complet)
```

---

## 🔧 Intégration Frontend

### Exemple d'utilisation dans un composant React

```typescript
const handlePayDeposit = async (projectId: string, amount: number) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId,
        amount: amount, // En centimes
        description: 'Acompte pour projet personnalisé',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment intent');
    }

    // Utiliser data.clientSecret avec Stripe Elements
    const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLISHABLE_KEY!);
    const { error } = await stripe!.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
      },
    });

    if (error) {
      throw error;
    }

    // Succès - le webhook Stripe mettra à jour deposit_paid
    toast.success('Paiement réussi !');
  } catch (error) {
    console.error('Payment error:', error);
    toast.error(error.message || 'Erreur lors du paiement');
  }
};
```

---

## 🎯 Prochaines Étapes

### 1. Webhook Stripe (Déjà existant)

Le webhook `supabase/functions/webhook-stripe/index.ts` doit être mis à jour pour :
- Écouter l'événement `payment_intent.succeeded`
- Mettre à jour `deposit_paid = true` dans la table `projects`
- Envoyer un email de confirmation au client

### 2. UI pour Paiement

Créer ou mettre à jour un composant de paiement qui :
- Appelle `/api/create-payment-intent`
- Affiche le formulaire Stripe Elements
- Gère les erreurs et les succès

### 3. Tests

Tester avec différents plans :
- FREE (5% commission)
- STARTER (2% commission)
- PRO (0% commission)
- STUDIO (0% commission)

---

## ✅ Checklist

- [x] API route créée avec validation
- [x] Calcul de commission dynamique
- [x] Vérification de l'onboarding Stripe
- [x] Création du Payment Intent avec `application_fee_amount`
- [x] Transfer vers le compte Stripe Connect de l'artiste
- [ ] Intégration frontend (composant de paiement)
- [ ] Webhook pour mettre à jour `deposit_paid`
- [ ] Tests avec différents plans

---

## 🐛 Gestion d'Erreurs

L'API route gère plusieurs cas d'erreur :

1. **Artiste non onboardé** : Retourne `STRIPE_ONBOARDING_INCOMPLETE`
2. **Dépôt déjà payé** : Retourne une erreur explicite
3. **Projet introuvable** : Retourne 404
4. **Erreur Stripe** : Retourne l'erreur Stripe avec code

Toutes les erreurs sont loggées côté serveur pour le debugging.

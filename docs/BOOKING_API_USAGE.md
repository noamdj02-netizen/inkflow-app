# API de Réservation - Guide d'Utilisation

## 📋 Endpoints

### POST `/api/bookings/create`

Crée une réservation sécurisée avec vérification anti-collision et génération d'un PaymentIntent Stripe.

#### Request Body

```typescript
{
  clientId: string;      // ID du client (User.id)
  artistId: string;      // ID de l'artiste (ArtistProfile.id)
  serviceId: string;     // ID du service (Service.id)
  startTime: string;     // ISO 8601 (ex: "2026-02-05T11:00:00.000Z")
}
```

#### Response (201 Created)

```typescript
{
  success: true,
  booking: {
    id: string;
    startTime: string;
    endTime: string;
    status: "PENDING_PAYMENT";
    service: {
      id: string;
      name: string;
      price: number;
      depositAmount: number;
    };
  };
  paymentIntent: {
    id: string;
    clientSecret: string;  // À utiliser avec Stripe Elements
    amount: number;
    currency: string;
  };
}
```

#### Erreurs Possibles

**400 Bad Request**
```json
{
  "error": "Champs manquants: clientId, artistId, serviceId, startTime sont requis"
}
```

**404 Not Found**
```json
{
  "error": "Service introuvable"
}
```

**409 Conflict (Créneau non disponible)**
```json
{
  "error": "Créneau non disponible",
  "reason": "Créneau chevauchant une réservation existante (CONFIRMED)",
  "code": "SLOT_UNAVAILABLE"
}
```

**409 Conflict (Race condition)**
```json
{
  "error": "Ce créneau vient d'être réservé par quelqu'un d'autre",
  "code": "SLOT_TAKEN",
  "reason": "Créneau pris entre-temps: ..."
}
```

---

## 🔄 Flow Complet

### 1. Client sélectionne un créneau

```typescript
// Frontend: Récupérer les créneaux disponibles
const response = await fetch('/api/availability', {
  method: 'POST',
  body: JSON.stringify({
    artistId: 'artist-123',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    serviceDurationMin: 120,
  }),
});
const { slots } = await response.json();
```

### 2. Client remplit le formulaire et valide

```typescript
// Frontend: Créer la réservation
const response = await fetch('/api/bookings/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId: currentUser.id,
    artistId: 'artist-123',
    serviceId: 'service-456',
    startTime: '2026-02-05T11:00:00.000Z',
  }),
});

if (!response.ok) {
  const error = await response.json();
  // Gérer l'erreur (créneau pris, etc.)
  throw new Error(error.error);
}

const { booking, paymentIntent } = await response.json();
```

### 3. Client paie l'acompte via Stripe

```typescript
// Frontend: Utiliser Stripe Elements
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const { error } = await stripe.confirmPayment({
  clientSecret: paymentIntent.clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/booking/success?booking_id=${booking.id}`,
  },
});

if (error) {
  // Gérer l'erreur de paiement
  console.error(error);
}
```

### 4. Webhook Stripe confirme le booking

Le webhook `/api/webhooks/stripe` reçoit `payment_intent.succeeded` et met à jour automatiquement le booking :
- `PENDING_PAYMENT` → `CONFIRMED`
- Enregistre la transaction dans `stripe_transactions`
- Envoie les notifications (email client + artiste)

---

## 🔒 Sécurité

### Vérification Anti-Collision

La fonction `checkSlotAvailability()` vérifie :
1. ✅ Chevauchement avec bookings existants (`CONFIRMED` ou `PENDING_PAYMENT`)
2. ✅ Chevauchement avec absences (`Leave`)
3. ✅ Horaires d'ouverture (`WorkingHour`)

### Transaction Atomique

Utilisation de `prisma.$transaction()` pour garantir :
- ✅ Vérification atomique juste avant l'INSERT
- ✅ Création du booking + PaymentIntent dans la même transaction
- ✅ Rollback automatique en cas d'erreur

### Protection contre les Race Conditions

1. **Première vérification** : Avant la transaction (pour éviter les appels inutiles)
2. **Vérification atomique** : Dans la transaction, juste avant l'INSERT
3. **Condition atomique dans UPDATE** : Dans le webhook, `.where({ status: PENDING_PAYMENT })`

---

## 🧪 Tests

### Test de Collision

```typescript
// Créer deux réservations simultanées pour le même créneau
const promises = [
  createBooking({ startTime: '2026-02-05T11:00:00.000Z' }),
  createBooking({ startTime: '2026-02-05T11:00:00.000Z' }),
];

const results = await Promise.allSettled(promises);
// Une seule doit réussir, l'autre doit retourner SLOT_TAKEN
```

### Test de Disponibilité

```typescript
// Vérifier qu'un créneau dans une absence est rejeté
const leave = await prisma.leave.create({
  data: {
    artistId: 'artist-123',
    date: new Date('2026-02-05'),
    reason: 'Congé',
  },
});

const result = await createBooking({
  startTime: '2026-02-05T11:00:00.000Z',
});
// Doit retourner SLOT_UNAVAILABLE
```

---

## 📝 Variables d'Environnement Requises

```env
# Prisma
DATABASE_URL="postgresql://..."

# Stripe
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_..."
```

---

## 🐛 Troubleshooting

### Erreur "Créneau pris entre-temps"

**Cause** : Race condition détectée (deux clients ont réservé en même temps)

**Solution** : Normal, la deuxième réservation est rejetée. Le frontend doit afficher un message et proposer un autre créneau.

### Erreur "STRIPE_NOT_CONFIGURED"

**Cause** : L'artiste n'a pas complété l'onboarding Stripe Connect

**Solution** : L'artiste doit configurer son compte bancaire dans les paramètres.

### Webhook ne confirme pas le booking

**Vérifier** :
1. Le webhook est bien configuré dans Stripe Dashboard
2. L'URL du webhook est correcte : `https://votre-domaine.com/api/webhooks/stripe`
3. Le secret webhook (`STRIPE_WEBHOOK_SECRET`) est correct
4. Les logs du webhook dans Stripe Dashboard

---

## 📚 Références

- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- [Stripe PaymentIntents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

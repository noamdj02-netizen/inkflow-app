# Setup Backend Booking avec Prisma

## 📋 Prérequis

- Node.js 18+
- PostgreSQL (via Supabase ou local)
- Compte Stripe avec Stripe Connect configuré

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install @prisma/client stripe
npm install -D prisma
```

### 2. Configurer Prisma

```bash
# Initialiser Prisma (si pas déjà fait)
npx prisma init

# Générer le client Prisma
npx prisma generate

# Appliquer le schéma à la base de données
npx prisma db push
# OU pour une migration complète:
npx prisma migrate dev --name init
```

### 3. Variables d'environnement

Créer/éditer `.env` :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/inkflow?schema=public"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Configurer le Webhook Stripe

Dans **Stripe Dashboard → Webhooks** :

1. Ajouter un endpoint : `https://votre-domaine.com/api/webhooks/stripe`
2. Sélectionner les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
3. Copier le **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

## 📁 Structure des Fichiers

```
app/
├── api/
│   ├── bookings/
│   │   └── create/
│   │       └── route.ts          # POST /api/bookings/create
│   ├── availability/
│   │   └── route.ts               # POST /api/availability
│   └── webhooks/
│       └── stripe/
│           └── route.ts           # POST /api/webhooks/stripe
lib/
├── prisma.ts                      # Instance Prisma (singleton)
├── stripe.ts                      # Instance Stripe (singleton)
└── booking-utils.ts               # Utilitaires (checkSlotAvailability, getAvailableSlots)
prisma/
└── schema.prisma                  # Schéma Prisma
```

## 🔄 Flow Complet

### 1. Récupérer les créneaux disponibles

```typescript
// Frontend
const response = await fetch('/api/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    artistId: 'artist-123',
    startDate: '2026-02-01T00:00:00.000Z',
    endDate: '2026-02-28T23:59:59.999Z',
    serviceDurationMin: 120, // 2h
    slotIntervalMin: 30, // Créneaux de 30min
  }),
});

const { slots } = await response.json();
// slots = [{ startTime: "...", endTime: "...", available: true/false }, ...]
```

### 2. Créer une réservation

```typescript
// Frontend
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
  // Gérer l'erreur (SLOT_UNAVAILABLE, SLOT_TAKEN, etc.)
  throw new Error(error.error);
}

const { booking, paymentIntent } = await response.json();
// booking = { id, startTime, endTime, status: "PENDING_PAYMENT", ... }
// paymentIntent = { id, clientSecret, amount, currency }
```

### 3. Payer l'acompte avec Stripe

```typescript
// Frontend
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const { error } = await stripe.confirmPayment({
  clientSecret: paymentIntent.clientSecret,
  confirmParams: {
    return_url: `${window.location.origin}/booking/success?booking_id=${booking.id}`,
  },
});

if (error) {
  console.error('Payment error:', error);
}
```

### 4. Webhook confirme automatiquement

Le webhook `/api/webhooks/stripe` reçoit `payment_intent.succeeded` et :
- Met à jour le booking : `PENDING_PAYMENT` → `CONFIRMED`
- Enregistre la transaction dans `StripeTransaction`
- Envoie les notifications (à implémenter)

## 🧪 Tests

### Test de collision

```typescript
// Créer deux réservations simultanées pour le même créneau
const promises = [
  fetch('/api/bookings/create', {
    method: 'POST',
    body: JSON.stringify({
      clientId: 'client-1',
      artistId: 'artist-123',
      serviceId: 'service-456',
      startTime: '2026-02-05T11:00:00.000Z',
    }),
  }),
  fetch('/api/bookings/create', {
    method: 'POST',
    body: JSON.stringify({
      clientId: 'client-2',
      artistId: 'artist-123',
      serviceId: 'service-456',
      startTime: '2026-02-05T11:00:00.000Z',
    }),
  }),
];

const results = await Promise.allSettled(promises);
// Une seule doit réussir, l'autre doit retourner SLOT_TAKEN (409)
```

### Test avec Prisma Studio

```bash
# Ouvrir Prisma Studio pour visualiser les données
npx prisma studio
```

## 🔒 Sécurité

### Vérifications Implémentées

1. ✅ **Anti-collision** : Vérifie les bookings `CONFIRMED` et `PENDING_PAYMENT`
2. ✅ **Absences** : Vérifie les `Leave` sur la période
3. ✅ **Horaires** : Vérifie que le créneau est dans les `WorkingHour`
4. ✅ **Transaction atomique** : Double vérification dans `prisma.$transaction`
5. ✅ **Webhook sécurisé** : Vérification de la signature Stripe

### Protection contre les Race Conditions

- **Première vérification** : Avant la transaction (évite les appels inutiles)
- **Vérification atomique** : Dans la transaction, juste avant l'INSERT
- **Condition atomique** : Dans le webhook, `.where({ status: PENDING_PAYMENT })`

## 📝 Notes Importantes

### Conversion Decimal → Centimes

Prisma stocke les prix en `Decimal` (euros), mais Stripe utilise des centimes :

```typescript
const depositAmountCents = Math.round(Number(service.depositAmount) * 100);
```

### Gestion des Erreurs

L'API retourne des codes d'erreur spécifiques :
- `SLOT_UNAVAILABLE` : Créneau occupé, bloqué, ou hors horaires
- `SLOT_TAKEN` : Race condition détectée (créneau pris entre-temps)
- `STRIPE_NOT_CONFIGURED` : Artiste n'a pas configuré Stripe Connect
- `INTERNAL_ERROR` : Erreur serveur

### Webhook Idempotent

Le webhook vérifie que le booking est toujours `PENDING_PAYMENT` avant de le confirmer, ce qui le rend idempotent (peut être appelé plusieurs fois sans problème).

## 🐛 Troubleshooting

### Erreur "PrismaClient is not configured"

```bash
# Régénérer le client Prisma
npx prisma generate
```

### Erreur "Relation does not exist"

```bash
# Appliquer le schéma à la base de données
npx prisma db push
```

### Webhook ne fonctionne pas

1. Vérifier que l'URL du webhook est correcte dans Stripe Dashboard
2. Vérifier que `STRIPE_WEBHOOK_SECRET` est correct
3. Vérifier les logs dans Stripe Dashboard → Webhooks → Logs

### Erreur "Decimal is not a number"

Prisma `Decimal` doit être converti avec `Number()` :

```typescript
const amount = Number(service.depositAmount); // Convertit Decimal en number
```

## 📚 Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe PaymentIntents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Next.js App Router API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

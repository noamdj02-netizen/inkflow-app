# 📋 Proposition de Schema Prisma - Système de Réservation Natif

## ✅ Modifications Apportées

### Model Booking

**Champ ajouté** :
```prisma
stripeSessionId String? @unique // ID Stripe Checkout Session
```

**Champs existants utilisés** :
- `status` : `PENDING_PAYMENT` → `CONFIRMED` (via webhook)
- `depositPaid` : `false` → `true` (via webhook)
- `depositAmount` : Montant de l'acompte
- `stripeSessionId` : ID de la session Stripe Checkout

### Model WorkingHour (déjà existant)

Utilisé comme table `Availability` :
- `dayOfWeek` : 0-6 (Dimanche-Samedi)
- `startTime` : "09:00"
- `endTime` : "19:00"
- `isActive` : true/false

## 🔄 Migration Requise

```bash
npx prisma migrate dev --name add_stripe_session_id
```

Ou manuellement :
```sql
ALTER TABLE "Booking" ADD COLUMN "stripeSessionId" TEXT;
CREATE UNIQUE INDEX "Booking_stripeSessionId_key" ON "Booking"("stripeSessionId") WHERE "stripeSessionId" IS NOT NULL;
```

## 📝 Notes

- Le champ `stripeSessionId` est optionnel (peut être null)
- Il est unique pour éviter les doublons
- Il est utilisé pour tracker les sessions Stripe Checkout
- Le webhook `checkout.session.completed` utilise ce champ pour trouver le booking

# 🏗️ Architecture du Système de Réservation Natif

## 📋 Vue d'Ensemble

Système de réservation natif pour InkFlow, sans dépendance à Cal.com.

## 🗄️ Base de Données

### Schema Prisma Modifié

#### Booking Model
- ✅ Ajout de `stripeSessionId` (String? @unique) pour tracker les sessions Stripe Checkout
- ✅ `status` : PENDING_PAYMENT → CONFIRMED (via webhook Stripe)
- ✅ `depositPaid` : false → true (via webhook Stripe)

#### WorkingHour Model (déjà existant)
- ✅ Utilisé comme table `Availability`
- ✅ Champs : `dayOfWeek`, `startTime`, `endTime`, `isActive`

## 🔧 Logique de Créneaux

### Fonction `getAvailableSlots`

**Fichier** : `lib/actions/booking.ts`

**Logique** :
1. Récupère les horaires de travail (`WorkingHour`) pour le jour de la semaine
2. Récupère les bookings `CONFIRMED` existants ce jour-là
3. Calcule les créneaux libres en tenant compte :
   - Des horaires de travail
   - Des bookings existants (avec temps de préparation/nettoyage)
   - Du buffer entre les sessions
   - De l'intervalle de créneaux configuré

**Exemple** :
- Artiste travaille : 10h-19h
- Booking existant : 12h-14h
- Temps préparation : 15min avant
- Temps nettoyage : 15min après
- Buffer : 0min
- Créneaux disponibles pour un Flash de 3h :
  - 10h-13h ✅
  - 14h30-17h30 ✅ (14h + 15min nettoyage + 15min buffer = 14h30)
  - 15h-18h ✅
  - etc.

## 💳 Paiement & Confirmation

### Server Action `createBookingSession`

**Fichier** : `lib/actions/booking.ts`

**Processus** :
1. Crée le Booking en base avec `status: PENDING_PAYMENT`
2. Crée une Session Stripe Checkout avec `metadata: { bookingId }`
3. Met à jour le Booking avec `stripeSessionId`
4. Retourne l'URL de paiement

### Webhook Stripe

**Fichier** : `app/api/webhooks/stripe/route.ts`

**Événements gérés** :
- ✅ `checkout.session.completed` : Passe le Booking en `CONFIRMED`
- ✅ `payment_intent.succeeded` : (fallback) Passe le Booking en `CONFIRMED`

**Logique** :
1. Récupère le `bookingId` depuis `session.metadata.bookingId`
2. Vérifie que le booking est encore `PENDING_PAYMENT`
3. Met à jour : `status: CONFIRMED`, `depositPaid: true`
4. Enregistre la transaction Stripe

## 🎨 Interface Frontend (À Créer)

### Page de Réservation

**Route** : `app/book/[artistSlug]/[flashId]/page.tsx`

**Étapes** :
1. **Sélection de la date** : Calendrier (shadcn/ui Calendar)
2. **Sélection du créneau** : Liste des slots disponibles (calculés par `getAvailableSlots`)
3. **Formulaire client** : Nom, Téléphone, Email
4. **Paiement** : Bouton "Payer l'acompte" → Redirige vers Stripe Checkout

### Composants nécessaires

- `BookingCalendar` : Calendrier pour sélectionner la date
- `AvailableSlotsList` : Liste des créneaux disponibles
- `BookingForm` : Formulaire client
- `CheckoutButton` : Bouton de paiement

## 🔄 Flux Complet

```
1. Client sélectionne une date
   ↓
2. Frontend appelle getAvailableSlots(artistId, date, durationMin)
   ↓
3. Backend calcule les créneaux disponibles
   ↓
4. Client sélectionne un créneau
   ↓
5. Client remplit le formulaire
   ↓
6. Frontend appelle createBookingSession(...)
   ↓
7. Backend crée Booking (PENDING_PAYMENT) + Session Stripe
   ↓
8. Client redirigé vers Stripe Checkout
   ↓
9. Client paie l'acompte
   ↓
10. Stripe envoie webhook checkout.session.completed
    ↓
11. Backend met à jour Booking (CONFIRMED, depositPaid: true)
    ↓
12. Booking apparaît dans Dashboard → Calendrier
```

## ✅ Règles d'Or

1. **Aucun booking n'apparaît sur le Dashboard sans acompte payé**
   - Seuls les bookings `CONFIRMED` avec `depositPaid: true` sont affichés

2. **Les créneaux sont calculés dynamiquement**
   - Prend en compte les horaires de travail
   - Prend en compte les bookings existants
   - Prend en compte les temps de préparation/nettoyage

3. **Le paiement est obligatoire**
   - Le booking reste en `PENDING_PAYMENT` jusqu'au paiement
   - Le webhook Stripe confirme automatiquement le booking

## 📝 Prochaines Étapes

1. ✅ Schema Prisma modifié
2. ✅ Fonction `getAvailableSlots` créée
3. ✅ Server Action `createBookingSession` créée
4. ✅ Webhook Stripe mis à jour
5. ⏳ Interface frontend à créer
6. ⏳ Migration Prisma à exécuter

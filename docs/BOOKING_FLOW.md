# Workflow de Réservation Automatique

Ce document décrit le flux complet de réservation dans InkFlow.

## 1. Client visite la vitrine

- URL: `/artist/[slug]`
- Affiche: Hero, galerie flashs, CTA projet custom

## 2. Sélection flash ou projet

### Flash
- Client clique sur un flash
- Ouvre `BookingModal` avec les détails du flash

### Projet custom
- Client clique sur "Proposer un projet"
- Ouvre `BookingModal` en mode projet

## 3. Formulaire client (Étape 1)

- Nom complet *
- Email *
- Téléphone *
- (Projet uniquement) Description, zone, budget

## 4. Sélection créneau (Étape 2)

- `CalComSlotPicker` affiche les 7 prochains jours
- Appelle `/api/calendar/slots?artist=...&date=...`
- Filtre les créneaux déjà réservés
- Client sélectionne un créneau

## 5. Confirmation et paiement (Étape 3)

- Récapitulatif: date, heure, acompte
- Client clique sur "Payer l'acompte"
- Appelle `/api/bookings/create`:
  1. Crée booking Supabase (status: `pending`)
  2. Crée PaymentIntent Stripe
  3. Crée booking Cal.com (si configuré)
  4. Envoie email notification au tatoueur
- Redirige vers Stripe Checkout

## 6. Webhook Stripe

Quand le paiement réussit:
- `payment_intent.succeeded` → Webhook `/api/webhooks/stripe`
- Met à jour booking: `status = 'confirmed'`, `acompte_paid = true`
- Crée booking Cal.com si pas encore créé
- Envoie email confirmation au tatoueur

## 7. Page succès

- URL: `/booking/success?id=[booking_id]`
- Affiche confirmation avec détails
- Lien vers Cal.com si disponible

## Dashboard Tatoueur

- `/dashboard` affiche:
  - Stats: revenus mois, RDV à venir, en attente
  - Liste des bookings avec actions (confirmer/annuler)

## Schéma de données

### Table `bookings`

- `type`: `'flash'` ou `'project'`
- `status`: `'pending'`, `'confirmed'`, `'cancelled'`, `'completed'`
- `scheduled_at`: Date/heure du RDV
- `acompte_amount`: Montant acompte en euros
- `acompte_paid`: Boolean
- `cal_com_booking_id`: ID réservation Cal.com
- `stripe_payment_intent_id`: ID PaymentIntent Stripe

### Table `artists`

- `cal_com_username`: Username Cal.com
- `cal_com_event_type_id`: ID type événement Cal.com

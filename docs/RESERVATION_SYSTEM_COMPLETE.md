# Système de Réservation Avancé — Implémentation Complète

## ✅ Ce qui a été implémenté

### 1. Modèle de données étendu (Prisma)

Le modèle `Booking` a été enrichi pour correspondre à l'interface `Reservation` :

- ✅ **Type de réservation** : `BookingType` enum (CONSULTATION, SESSION, RETOUCHE)
- ✅ **Détails projet** : `projectDescription`, `zone`, `size`, `style`
- ✅ **Photos de référence** : `referencePhotos` (array d'URLs)
- ✅ **Prix et acompte** : `price`, `depositAmount`, `depositPaid`
- ✅ **Rappels envoyés** : `remindersSent` (array de dates)
- ✅ **Notes** : `notes` (texte libre)
- ✅ **Réservations récurrentes** : `recurringSeriesId`, `recurringPattern`
- ✅ **Temps préparation/nettoyage** : `prepTimeMin`, `cleanupTimeMin`
- ✅ **Nouveau modèle** : `RecurringBookingSeries` pour gérer les séries récurrentes

### 2. Automatisations avancées (`lib/booking-utils.ts`)

#### ✅ Vérification de disponibilité améliorée
- Prise en compte des temps de préparation et nettoyage
- Buffer time entre sessions
- Vérification des horaires d'ouverture
- Détection des absences (leaves)
- Prévention des doubles réservations

#### ✅ Fonction `verifierDisponibilite()`
```typescript
async function verifierDisponibilite(
  tatoueurId: string,
  dateDebut: Date,
  duree: number,
  type: BookingType,
  prepTimeMin?: number,
  cleanupTimeMin?: number
): Promise<{ available: boolean; reason?: string }>
```

#### ✅ Détection automatique des créneaux
- `detecterCreneauxDisponibles()` : trouve tous les créneaux disponibles pour une durée donnée
- Prend en compte les durées par défaut selon le type (consultation: 5min prep/cleanup, session: 15min, retouche: 10min)

#### ✅ Réservations récurrentes
- `createRecurringBookings()` : crée une série de réservations
- Support des patterns : daily, weekly, monthly
- Intervalle personnalisable
- Date de fin ou nombre d'occurrences max
- Vérification automatique de disponibilité pour chaque occurrence

#### ✅ Blocage intelligent des slots
- Temps de préparation avant chaque session
- Temps de nettoyage après chaque session
- Buffer time configurable par artiste
- Calcul automatique des créneaux réels (startTime - prepTime à endTime + cleanupTime + buffer)

### 3. Système de notifications automatiques (`lib/booking-notifications.ts`)

#### ✅ Templates d'emails HTML/text
- **Confirmation immédiate** : `envoyerConfirmationReservation()`
  - Détails complets du RDV
  - Boutons : Annuler, Modifier, Ajouter au calendrier
  - Informations sur l'acompte
  
- **Rappel 48h avant** : `envoyerRappel48h()`
  - Bouton de confirmation
  - Lien d'annulation
  
- **Rappel 24h avant** : `envoyerRappel24h()`
  - Alerte visuelle
  - Rappel de l'adresse
  
- **Relance acompte** : `relancerAcompteNonRegle()`
  - Alerte visuelle
  - Bouton de paiement
  
- **Notification d'annulation** : `notifierAnnulation()`
  - Message de confirmation
  - Invitation à reprendre RDV
  
- **Demande d'avis** : `demanderAvisApresSession()`
  - Invitation à laisser un avis
  - Lien vers formulaire

### 4. Paramètres artiste étendus (`ArtistProfile`)

- ✅ `defaultPrepTimeMin` : Temps de préparation par défaut (15min)
- ✅ `defaultCleanupTimeMin` : Temps de nettoyage par défaut (15min)
- ✅ `bufferTimeMin` : Temps de pause entre sessions (0min par défaut)

## ⏳ À implémenter (DashboardCalendar)

### Vues calendrier
- [ ] Vue jour (agenda horaire)
- [ ] Vue semaine (7 colonnes)
- [ ] Vue mois (grille calendrier)
- [ ] Vue agenda (liste chronologique)

### Fonctionnalités UI
- [ ] Drag & drop pour déplacer rendez-vous
- [ ] Code couleur par statut (PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED)
- [ ] Code couleur par type (CONSULTATION, SESSION, RETOUCHE)
- [ ] Affichage multi-tatoueurs (si plan STUDIO)
- [ ] Filtres par statut/type
- [ ] Recherche dans les événements

### Intégration notifications
- [ ] Cron job pour rappels 48h avant
- [ ] Cron job pour rappels 24h avant
- [ ] Cron job pour relances acompte
- [ ] Cron job pour demandes d'avis (après session terminée)

## 📋 Migration Prisma

Pour appliquer les changements du schéma :

```bash
npx prisma migrate dev --name add_advanced_booking_fields
npx prisma generate
```

## 🔧 Configuration

### Variables d'environnement requises

```env
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=InkFlow <noreply@inkflow.app>
DATABASE_URL=postgresql://...
```

### Configuration artiste (dans le dashboard)

Les artistes peuvent configurer :
- Temps de préparation par défaut
- Temps de nettoyage par défaut
- Buffer time entre sessions
- Horaires d'ouverture (déjà implémenté)

## 📚 Utilisation

### Créer une réservation simple

```typescript
import { prisma } from '@/lib/prisma';
import { verifierDisponibilite } from '@/lib/booking-utils';
import { envoyerConfirmationReservation } from '@/lib/booking-notifications';

// Vérifier disponibilité
const disponibilite = await verifierDisponibilite(
  artistId,
  new Date('2026-02-10T14:00:00'),
  180, // 3h
  BookingType.SESSION
);

if (disponibilite.available) {
  // Créer la réservation
  const booking = await prisma.booking.create({
    data: {
      artistId,
      clientId,
      startTime: new Date('2026-02-10T14:00:00'),
      endTime: new Date('2026-02-10T17:00:00'),
      type: BookingType.SESSION,
      durationMin: 180,
      price: 300,
      depositAmount: 90,
      depositPaid: false,
      status: BookingStatus.PENDING_PAYMENT,
      // ... autres champs
    },
  });

  // Envoyer confirmation
  await envoyerConfirmationReservation({
    bookingId: booking.id,
    clientName: 'Marie Dupont',
    clientEmail: 'marie@example.com',
    artistName: 'John Doe',
    date: booking.startTime,
    heure: '14:00',
    duree: 180,
    type: BookingType.SESSION,
    prix: 300,
    acompte: 90,
    acompteRegle: false,
    siteBaseUrl: 'https://inkflow.app',
    cancelLink: `https://inkflow.app/bookings/${booking.id}/cancel`,
    modifyLink: `https://inkflow.app/bookings/${booking.id}/modify`,
  });
}
```

### Créer une série récurrente

```typescript
import { createRecurringBookings } from '@/lib/booking-utils';

const { seriesId, bookingIds } = await createRecurringBookings(
  artistId,
  clientId,
  new Date('2026-02-10T14:00:00'),
  180, // 3h
  {
    frequency: 'weekly',
    interval: 2, // Toutes les 2 semaines
    occurrences: 4, // 4 sessions max
  },
  {
    type: BookingType.SESSION,
    price: 300,
    depositAmount: 90,
    zone: 'Bras',
    style: 'Réalisme',
  }
);
```

## 🚀 Prochaines étapes

1. **Implémenter DashboardCalendar amélioré** avec toutes les vues et fonctionnalités
2. **Créer les cron jobs** pour les notifications automatiques (Vercel Cron ou Supabase Edge Functions)
3. **Ajouter SMS** via Twilio ou autre service (optionnel)
4. **Tests** : tests unitaires pour les fonctions d'automatisation
5. **Documentation API** : documenter les endpoints de réservation

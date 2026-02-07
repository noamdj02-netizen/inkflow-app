# Système de Paiement et Flow Automatisé — Documentation Complète

## ✅ Implémenté

### 1. Modèle Payment (Prisma)

Le modèle `Payment` a été créé avec tous les champs de l'interface `Paiement` :

- ✅ **Types de paiement** : `PaymentType` enum (ACOMPTE, SOLDE, TOTAL)
- ✅ **Méthodes** : `PaymentMethod` enum (STRIPE, ESPECES, VIREMENT)
- ✅ **Statuts** : `PaymentStatus` enum (EN_ATTENTE, REGLE, REMBOURSE)
- ✅ **Champs** : `montant`, `dateReglement`, `stripePaymentIntentId`
- ✅ **Relations** : Lié à `Booking` et `ArtistProfile`

### 2. Flow Automatisé (`lib/payment-flow.ts`)

#### ✅ 1. Génération lien paiement acompte
```typescript
genererLienPaiementAcompte({
  bookingId,
  artistId,
  amount,
  clientEmail,
  clientName,
  siteBaseUrl
})
```
- Crée un `PaymentIntent` Stripe avec commission 5%
- Crée l'enregistrement `Payment` en base
- Retourne le lien de paiement sécurisé

#### ✅ 2. Traitement acompte réglé (webhook)
```typescript
traiterAcompteRegle(paymentIntentId)
```
- Met à jour le statut du paiement
- Met à jour la réservation (depositPaid = true, status = CONFIRMED)
- Envoie l'email de confirmation avec lien calendrier iCal

#### ✅ 3. Génération lien paiement solde
```typescript
genererLienPaiementSolde(bookingId, siteBaseUrl)
```
- Calcule le solde restant (prix total - acompte payé)
- Crée un nouveau `PaymentIntent` pour le solde
- Retourne le lien de paiement

#### ✅ 4. Génération facture automatique
```typescript
genererFactureAutomatique(bookingId)
```
- Crée un paiement TOTAL après session terminée
- Génère l'URL de la facture (PDF ou page web)

#### ✅ Fonctions utilitaires
- `enregistrerPaiementManuel()` : Pour paiements en espèces/virement
- `verifierEtRelancerAcomptesNonRegles()` : Cron job pour relances
- `envoyerRappelSoldeJ1()` : Rappel solde restant 24h avant

### 3. Composant Sélecteur de Créneaux (`components/CreneauSelector.tsx`)

Composant React optimisé pour choisir un créneau :

- ✅ **Calendrier visuel** : Sélection de date avec indicateurs de disponibilité
- ✅ **Grille d'heures** : Affichage des créneaux disponibles par jour
- ✅ **Feedback visuel** : Créneaux indisponibles barrés avec raison
- ✅ **Confirmation** : Affichage du créneau sélectionné avec détails
- ✅ **Responsive** : Adapté mobile/desktop
- ✅ **Animations** : Transitions fluides avec Framer Motion

**Utilisation** :
```tsx
<CreneauSelector
  tatoueurId={artistId}
  duree={180} // 3h en minutes
  onCreneauSelect={(creneau) => {
    // Traiter la sélection
    console.log('Créneau sélectionné:', creneau);
  }}
  dateMin={new Date()}
  dateMax={addDays(new Date(), 30)}
/>
```

### 4. Widget Alertes Dashboard (`components/dashboard/widgets/AlertsWidget.tsx`)

Widget affichant les alertes importantes :

- ✅ **Acomptes en attente** : Réservations avec acompte non réglé
- ✅ **Confirmations en attente** : Bookings nécessitant validation
- ✅ **RDV aujourd'hui** : Rappel des rendez-vous du jour
- ✅ **Code couleur** : Rouge (high), Amber (medium), Bleu (low)
- ✅ **Liens directs** : Clic pour accéder à la section concernée

### 5. API Endpoint Créneaux (`app/api/creneaux/route.ts`)

Endpoint REST pour récupérer les créneaux disponibles :

**GET** `/api/creneaux?tatoueur={id}&duree={minutes}&debut={ISO}&fin={ISO}&type={SESSION|CONSULTATION|RETOUCHE}`

**Réponse** :
```json
{
  "creneaux": [
    {
      "id": "artist-123-2026-02-10T14:00:00Z",
      "debut": "2026-02-10T14:00:00Z",
      "fin": "2026-02-10T17:00:00Z",
      "disponible": true
    }
  ]
}
```

## 🔄 Flow Complet Automatisé

### Étape 1 : Réservation créée
```
Client → Sélection créneau → Création Booking (status: PENDING_PAYMENT)
→ génerLienPaiementAcompte() → Lien envoyé au client
```

### Étape 2 : Acompte réglé
```
Webhook Stripe → traiterAcompteRegle()
→ Payment.status = REGLE
→ Booking.depositPaid = true, status = CONFIRMED
→ Email confirmation avec lien calendrier iCal
```

### Étape 3 : J-1 (24h avant)
```
Cron job quotidien → envoyerRappelSoldeJ1()
→ Vérifie bookings demain avec solde restant
→ Envoie rappel avec lien paiement solde
```

### Étape 4 : Après session
```
Artiste marque booking comme COMPLETED
→ genererFactureAutomatique()
→ Crée Payment TOTAL
→ Génère URL facture
```

## 📋 Cron Jobs à Configurer

### Vercel Cron (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/relance-acomptes",
      "schedule": "0 10 * * *"
    },
    {
      "path": "/api/cron/rappel-solde-j1",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Routes API Cron

**`app/api/cron/relance-acomptes/route.ts`** :
```typescript
import { verifierEtRelancerAcomptesNonRegles } from '@/lib/payment-flow';

export async function GET() {
  const sent = await verifierEtRelancerAcomptesNonRegles();
  return Response.json({ sent, timestamp: new Date().toISOString() });
}
```

**`app/api/cron/rappel-solde-j1/route.ts`** :
```typescript
import { envoyerRappelSoldeJ1 } from '@/lib/payment-flow';

export async function GET() {
  const sent = await envoyerRappelSoldeJ1();
  return Response.json({ sent, timestamp: new Date().toISOString() });
}
```

## 🎨 Interface Réservation Client

### Exemple d'utilisation complète

```tsx
import { CreneauSelector } from '@/components/CreneauSelector';
import { useState } from 'react';

function ReservationForm() {
  const [selectedCreneau, setSelectedCreneau] = useState(null);
  const [step, setStep] = useState<'creneau' | 'details' | 'paiement'>('creneau');

  return (
    <div className="max-w-4xl mx-auto p-6">
      {step === 'creneau' && (
        <CreneauSelector
          tatoueurId={artistId}
          duree={180}
          onCreneauSelect={(creneau) => {
            setSelectedCreneau(creneau);
            setStep('details');
          }}
        />
      )}
      
      {step === 'details' && (
        <ProjectDetailsForm
          creneau={selectedCreneau}
          onNext={() => setStep('paiement')}
        />
      )}
      
      {step === 'paiement' && (
        <PaymentStep
          creneau={selectedCreneau}
          onComplete={() => {
            // Redirection confirmation
          }}
        />
      )}
    </div>
  );
}
```

## 📊 Dashboard Widgets

### Widgets existants à enrichir

1. **KPIWidgets** : Ajouter CA du mois, taux remplissage
2. **RevenueChartWidget** : Graphique évolution revenus
3. **NextAppointmentWidget** : Prochains RDV aujourd'hui + semaine
4. **AlertsWidget** : ✅ Déjà créé (acomptes, confirmations, RDV aujourd'hui)

### Widgets à créer

- **StatsWidget** : CA mois, nb clients, taux remplissage
- **UpcomingBookingsWidget** : Liste des prochains RDV (aujourd'hui + semaine)
- **ReviewsWidget** : Derniers avis clients (si système d'avis implémenté)

## 🔐 Sécurité

- ✅ Validation des paramètres API
- ✅ Vérification artistId dans les requêtes
- ✅ Stripe PaymentIntent avec metadata sécurisé
- ✅ Webhooks Stripe vérifiés avec signature

## 📚 Prochaines Étapes

1. **Créer les routes API cron** pour automatiser les rappels
2. **Implémenter la génération de factures PDF** (avec @react-pdf/renderer)
3. **Ajouter les widgets dashboard manquants** (stats, graphiques)
4. **Créer l'interface complète de réservation** avec formulaire projet
5. **Tests** : Tests unitaires pour le flow de paiement
6. **Documentation API** : Swagger/OpenAPI pour les endpoints

## 🚀 Migration Prisma

```bash
npx prisma migrate dev --name add_payment_model
npx prisma generate
```

## 📝 Notes

- Les paiements en espèces/virement sont enregistrés manuellement via `enregistrerPaiementManuel()`
- Les factures sont générées automatiquement après marquage de la session comme terminée
- Le système de rappels nécessite la configuration des cron jobs Vercel
- Les liens iCal sont générés en data URI pour ajout direct au calendrier

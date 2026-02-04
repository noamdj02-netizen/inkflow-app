# Validation Zod et Tests Unitaires — Documentation

## ✅ Implémenté

### 1. Types Stricts (`types/booking.ts`)

Types TypeScript stricts pour le système de réservation :

```typescript
type StatutReservation = "en_attente" | "confirmee" | "annulee" | "terminee"
type TypeReservation = "consultation" | "session" | "retouche"
type MethodePaiement = "stripe" | "especes" | "virement"
type StatutPaiement = "en_attente" | "regle" | "rembourse"
```

### 2. Classes d'Erreurs Personnalisées (`lib/booking-errors.ts`)

Gestion d'erreurs explicite avec classes d'erreurs spécifiques :

- ✅ **CreneauIndisponibleError** : Créneau non disponible avec raison
- ✅ **ReservationNotFoundError** : Réservation introuvable
- ✅ **ClientNotFoundError** : Client introuvable
- ✅ **ArtisteNotFoundError** : Artiste introuvable
- ✅ **DureeInvalideError** : Durée hors limites
- ✅ **DatePasseeError** : Date dans le passé
- ✅ **PaiementEchoueError** : Échec paiement Stripe
- ✅ **ReservationDejaConfirmeeError** : Tentative de confirmer une réservation déjà confirmée
- ✅ **ReservationDejaAnnuleeError** : Tentative d'annuler une réservation déjà annulée

**Type guards** pour vérifier le type d'erreur :
```typescript
isCreneauIndisponibleError(error)
isReservationNotFoundError(error)
isPaiementEchoueError(error)
```

### 3. Validation Zod (`lib/booking-validation.ts`)

Schéma de validation complet avec Zod :

```typescript
const schemaReservation = z.object({
  clientId: z.string().uuid(),
  tatoueurId: z.string().uuid(),
  dateDebut: z.date().min(new Date()),
  duree: z.number().min(30).max(480),
  type: z.enum(['consultation', 'session', 'retouche']),
  prix: z.number().positive().max(10000),
  acompte: z.number().positive().optional(),
  // ... autres champs avec validation
})
```

**Fonctions utilitaires** :
- `validerReservation(data)` : Retourne `{ success: true, data }` ou `{ success: false, errors }`
- `validerReservationStrict(data)` : Lance une erreur Zod si invalide

### 4. Service de Réservation (`lib/booking-service.ts`)

Fonctions avec validation et gestion d'erreurs :

- ✅ `creerReservation(data)` : Crée une réservation avec validation complète
- ✅ `confirmerReservation(id)` : Confirme après paiement acompte
- ✅ `annulerReservation(id)` : Annule une réservation
- ✅ `terminerReservation(id)` : Marque comme terminée

**Flow de création** :
1. Validation Zod des données
2. Vérification existence client/artiste
3. Vérification disponibilité créneau
4. Création en base de données

### 5. Tests Unitaires (`lib/__tests__/booking-service.test.ts`)

Tests complets avec Vitest :

- ✅ **Test chevauchement créneaux** : Bloque les créneaux qui se chevauchent
- ✅ **Test date passée** : Rejette les dates dans le passé
- ✅ **Test durée invalide** : Rejette durées < 30min ou > 480min
- ✅ **Test client inexistant** : Lance `ClientNotFoundError`
- ✅ **Test artiste inexistant** : Lance `ArtisteNotFoundError`
- ✅ **Test création valide** : Crée une réservation correctement
- ✅ **Test confirmation** : Confirme une réservation en attente
- ✅ **Test double confirmation** : Rejette confirmation déjà confirmée
- ✅ **Test annulation** : Annule une réservation
- ✅ **Test double annulation** : Rejette annulation déjà annulée

### 6. Exemple d'Utilisation (`components/BookingFormExample.tsx`)

Composant React montrant l'utilisation avec gestion d'erreurs :

```typescript
try {
  await creerReservation(data)
} catch (error) {
  if (error instanceof CreneauIndisponibleError) {
    toast.error("Ce créneau n'est plus disponible")
  } else if (error instanceof ClientNotFoundError) {
    toast.error("Client introuvable")
  }
  // ...
}
```

## 🧪 Exécution des Tests

### Installation

```bash
npm install
```

### Lancer les tests

```bash
# Tous les tests
npm test

# Mode watch (re-exécute à chaque changement)
npm run test:watch

# Avec couverture de code
npm run test:coverage
```

### Interface UI Vitest

```bash
npm test -- --ui
```

## 📋 Exemple de Test

```typescript
describe("Système de réservation", () => {
  it("devrait bloquer les créneaux qui se chevauchent", async () => {
    const rdv1 = await creerReservation({
      dateDebut: new Date("2024-03-01 10:00"),
      duree: 120
    })
    
    await expect(
      creerReservation({
        dateDebut: new Date("2024-03-01 11:00"),
        duree: 60
      })
    ).rejects.toThrow("Créneau indisponible")
  })
})
```

## 🔧 Utilisation dans le Code

### Créer une réservation avec gestion d'erreurs

```typescript
import { creerReservation } from '@/lib/booking-service';
import {
  CreneauIndisponibleError,
  ClientNotFoundError,
  isCreneauIndisponibleError,
} from '@/lib/booking-errors';

try {
  const result = await creerReservation({
    clientId: 'client-uuid',
    tatoueurId: 'artist-uuid',
    dateDebut: new Date('2024-03-01T10:00:00Z'),
    duree: 120,
    type: 'session',
    prix: 200,
    acompte: 60,
  });
  
  console.log('Réservation créée:', result.id);
} catch (error) {
  if (error instanceof CreneauIndisponibleError) {
    toast.error(`Créneau indisponible: ${error.raison}`);
  } else if (error instanceof ClientNotFoundError) {
    toast.error('Client introuvable');
  } else if (isCreneauIndisponibleError(error)) {
    // Alternative avec type guard
    toast.error(error.message);
  } else {
    toast.error('Erreur inconnue');
  }
}
```

### Valider des données sans créer la réservation

```typescript
import { validerReservation } from '@/lib/booking-validation';

const result = validerReservation(formData);

if (result.success) {
  // Données valides, procéder
  console.log('Données valides:', result.data);
} else {
  // Afficher les erreurs de validation
  result.errors.errors.forEach((err) => {
    console.error(`${err.path.join('.')}: ${err.message}`);
  });
}
```

## 🎯 Avantages

1. **Type Safety** : Types stricts TypeScript pour éviter les erreurs
2. **Validation Robuste** : Zod valide toutes les données avant traitement
3. **Erreurs Explicites** : Classes d'erreurs spécifiques pour gestion fine
4. **Tests Fiables** : Tests unitaires couvrent les cas critiques
5. **DX Améliorée** : Autocomplétion et vérification à la compilation

## 📚 Structure des Fichiers

```
lib/
├── booking-service.ts          # Service principal avec logique métier
├── booking-validation.ts       # Schémas Zod et validation
├── booking-errors.ts           # Classes d'erreurs personnalisées
├── booking-utils.ts           # Utilitaires (disponibilité, créneaux)
└── __tests__/
    └── booking-service.test.ts # Tests unitaires

types/
└── booking.ts                  # Types TypeScript stricts

components/
└── BookingFormExample.tsx     # Exemple d'utilisation React
```

## 🚀 Prochaines Étapes

1. **Tests d'intégration** : Tests avec vraie base de données
2. **Tests E2E** : Tests Playwright pour le flow complet
3. **Mock Prisma** : Améliorer les mocks dans les tests unitaires
4. **Coverage** : Atteindre 80%+ de couverture de code
5. **Documentation API** : Swagger/OpenAPI pour les endpoints

---

**Status** : ✅ Validation Zod et tests unitaires complets
**Date** : Février 2026
**Version** : 1.0.0

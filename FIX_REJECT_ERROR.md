# 🔴 FIX URGENT : Erreur "violates check constraint" lors du refus

## Problème

Lorsque vous cliquez sur "Refuser" une réservation, vous obtenez l'erreur :
```
Erreur: new row for relation "bookings" violates check constraint "bookings_statut_booking_check"
```

## Cause

La contrainte CHECK dans votre base de données Supabase n'autorise pas encore le statut `'rejected'`. Elle n'autorise que les anciens statuts : `'confirmed'`, `'completed'`, `'cancelled'`, `'no_show'`.

## Solution (2 minutes)

### Étape 1 : Ouvrir Supabase SQL Editor

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet InkFlow
3. Cliquez sur **SQL Editor** dans le menu de gauche

### Étape 2 : Exécuter le script

1. Ouvrez le fichier `supabase/FIX_REJECT_BOOKING.sql`
2. **Copiez TOUT le contenu** du fichier
3. Collez-le dans l'éditeur SQL de Supabase
4. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)

### Étape 3 : Vérifier

Le script va :
- ✅ Supprimer l'ancienne contrainte
- ✅ Créer une nouvelle contrainte avec tous les statuts : `'pending'`, `'confirmed'`, `'rejected'`, `'completed'`, `'cancelled'`, `'no_show'`
- ✅ Mettre à jour la valeur par défaut à `'pending'`

### Étape 4 : Tester

1. Rechargez votre application
2. Allez dans "Demandes"
3. Cliquez sur "Refuser" sur une réservation
4. ✅ Ça devrait fonctionner maintenant !

## Statuts autorisés après le fix

| Statut | Description |
|--------|-------------|
| `pending` | En attente de validation |
| `confirmed` | Confirmée par l'artiste |
| `rejected` | **Refusée par l'artiste** ← C'est celui qui manquait ! |
| `completed` | RDV terminé |
| `cancelled` | Annulée |
| `no_show` | Client absent |

## Si l'erreur persiste

1. Vérifiez que le script a bien été exécuté (pas d'erreur dans Supabase)
2. Videz le cache du navigateur (`Ctrl+Shift+R` ou `Cmd+Shift+R`)
3. Rechargez la page
4. Réessayez de refuser une réservation

---

**Note** : Ce fix est permanent. Une fois appliqué, vous n'aurez plus jamais cette erreur.


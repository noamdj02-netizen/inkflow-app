# Fix: Contrainte statut_booking

## Problème
L'erreur `new row for relation "bookings" violates check constraint "bookings_statut_booking_check"` se produit car le schéma n'autorisait que les statuts suivants :
- `'confirmed'`
- `'completed'`
- `'cancelled'`
- `'no_show'`

Mais le code utilise aussi :
- `'pending'` (pour les nouvelles réservations en attente)
- `'rejected'` (pour les réservations refusées)

## Solution

### 1. Appliquer le script SQL dans Supabase

Exécutez le script `fix-booking-status-constraint.sql` dans l'éditeur SQL de Supabase :

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez-collez le contenu de `supabase/fix-booking-status-constraint.sql`
5. Cliquez sur **Run**

### 2. Vérification

Après avoir exécuté le script, vérifiez que la contrainte a été mise à jour :

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
AND conname = 'bookings_statut_booking_check';
```

Vous devriez voir que la contrainte autorise maintenant :
- `'pending'`
- `'confirmed'`
- `'rejected'`
- `'completed'`
- `'cancelled'`
- `'no_show'`

### 3. Changements dans le code

Les fichiers suivants ont été mis à jour :

- ✅ `supabase/schema.sql` : Contrainte mise à jour avec les nouveaux statuts
- ✅ `types/supabase.ts` : Types TypeScript mis à jour
- ✅ `components/PublicArtistPage.tsx` : Crée maintenant les bookings avec `statut_booking: 'pending'` au lieu de `'confirmed'`
- ✅ `components/dashboard/DashboardRequests.tsx` : Utilise déjà `'pending'` et `'rejected'` (pas de changement nécessaire)

## Statuts de booking

| Statut | Description | Quand l'utiliser |
|--------|-------------|------------------|
| `pending` | En attente de validation par l'artiste | Nouvelle réservation créée par le client |
| `confirmed` | Confirmée par l'artiste | L'artiste a accepté la réservation |
| `rejected` | Refusée par l'artiste | L'artiste a refusé la réservation |
| `completed` | RDV terminé | Le tatouage a été réalisé |
| `cancelled` | Annulée | Réservation annulée (par le client ou l'artiste) |
| `no_show` | Client absent | Le client n'est pas venu au RDV |


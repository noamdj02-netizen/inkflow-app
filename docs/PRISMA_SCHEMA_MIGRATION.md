# Migration du Schéma Prisma vers Supabase

## 📋 Vue d'ensemble

Cette migration adapte le schéma Prisma proposé à votre infrastructure Supabase existante, en créant une structure plus organisée avec :

- **`users`** : Table centralisée pour tous les utilisateurs (liée à `auth.users`)
- **`artist_profiles`** : Profils des tatoueurs (remplace `artists`)
- **`working_hours`** : Horaires structurés (remplace `availability`)
- **`leaves`** : Jours de congés simplifiés (remplace `blocked_slots`)
- **`services`** : Services génériques (remplace `flashs`)
- **`bookings`** : Réservations avec nouveau statut `PENDING_PAYMENT`

---

## 🚀 Étapes de Migration

### 1. Exécuter la Migration SQL

Dans **Supabase Dashboard → SQL Editor**, exécutez :
```sql
-- Copier-coller le contenu de migration-prisma-schema-adaptation.sql
```

Cette migration :
- ✅ Crée les nouvelles tables (`users`, `artist_profiles`, `working_hours`, `leaves`, `services`)
- ✅ Ajoute les colonnes manquantes à `bookings` (`status`, `client_id`, `service_id`, `payment_intent`)
- ✅ Crée les fonctions de migration des données
- ✅ Configure RLS (Row Level Security)
- ✅ Crée les triggers et index nécessaires

### 2. Migrer les Données Existantes

Après avoir exécuté la migration, migrez les données en exécutant ces fonctions dans l'ordre :

```sql
-- 1. Migrer artists → users + artist_profiles
SELECT migrate_artists_to_users();

-- 2. Migrer flashs → services
SELECT migrate_flashs_to_services();

-- 3. Migrer availability → working_hours
SELECT migrate_availability_to_working_hours();

-- 4. Migrer blocked_slots → leaves
SELECT migrate_blocked_slots_to_leaves();
```

**Note importante :** 
- Les fonctions de migration utilisent `ON CONFLICT DO UPDATE` ou `ON CONFLICT DO NOTHING`, donc elles sont **idempotentes** (peuvent être exécutées plusieurs fois sans problème).
- Les données existantes dans `artists`, `flashs`, `availability`, `blocked_slots` sont **conservées** (pas de suppression).

### 3. Mettre à jour les Bookings

Pour lier les bookings existants aux nouvelles tables :

```sql
-- Lier bookings.client_id aux users (via email)
UPDATE bookings b
SET client_id = u.id
FROM users u
WHERE b.client_email = u.email
  AND b.client_id IS NULL;

-- Lier bookings.service_id aux services (via flash_id)
UPDATE bookings b
SET service_id = s.id
FROM services s
WHERE b.flash_id = s.id
  AND b.service_id IS NULL;
```

### 4. Vérifier la Migration

```sql
-- Vérifier le nombre d'artistes migrés
SELECT COUNT(*) FROM artist_profiles;

-- Vérifier le nombre de services migrés
SELECT COUNT(*) FROM services;

-- Vérifier les bookings avec nouveau statut
SELECT status, COUNT(*) FROM bookings GROUP BY status;
```

---

## 🔄 Structure des Nouvelles Tables

### `users`
```sql
id UUID PRIMARY KEY → auth.users(id)
email TEXT UNIQUE
name TEXT
phone TEXT
role user_role ('CLIENT', 'ARTIST', 'ADMIN')
```

### `artist_profiles`
```sql
id UUID PRIMARY KEY
user_id UUID UNIQUE → users(id)
slug TEXT UNIQUE
slot_interval_min INTEGER DEFAULT 30
min_notice_hours INTEGER DEFAULT 24
-- + tous les champs existants de artists
```

### `working_hours`
```sql
id UUID PRIMARY KEY
artist_id UUID → artist_profiles(id)
day_of_week INTEGER (0-6)
start_time TEXT ('09:00')
end_time TEXT ('19:00')
is_active BOOLEAN
```

### `leaves`
```sql
id UUID PRIMARY KEY
artist_id UUID → artist_profiles(id)
date DATE
reason TEXT
```

### `services`
```sql
id UUID PRIMARY KEY
artist_id UUID → artist_profiles(id)
name TEXT
duration_min INTEGER
price INTEGER (centimes)
deposit_amount INTEGER (centimes)
-- + champs optionnels (image_url, style, etc.)
```

### `bookings` (modifiée)
```sql
-- Nouvelles colonnes ajoutées :
status booking_status ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED')
client_id UUID → users(id)
service_id UUID → services(id)
payment_intent TEXT (renommage de stripe_deposit_intent_id)
```

---

## 🔐 Row Level Security (RLS)

Les nouvelles politiques RLS garantissent :

- **`users`** : Un utilisateur ne peut voir/modifier que ses propres données
- **`artist_profiles`** : Lecture publique, modification par propriétaire uniquement
- **`working_hours`** : Lecture publique, modification par artiste propriétaire
- **`leaves`** : Lecture publique, modification par artiste propriétaire
- **`services`** : Lecture publique, modification par artiste propriétaire

---

## 📝 Migration du Code Frontend/Backend

### 1. Mettre à jour les Types TypeScript

Générer les nouveaux types depuis Supabase :
```bash
npx supabase gen types typescript --project-id votre-project-id > types/supabase.ts
```

### 2. Mettre à jour les Requêtes

**Avant (ancien schéma) :**
```typescript
const { data: artist } = await supabase
  .from('artists')
  .select('*')
  .eq('slug_profil', slug)
  .single();
```

**Après (nouveau schéma) :**
```typescript
const { data: artist } = await supabase
  .from('artist_profiles')
  .select('*, user:users(*)')
  .eq('slug', slug)
  .single();
```

### 3. Mettre à jour les Composants

**Exemples de changements :**

- `components/PublicArtistPage.tsx` : `artists` → `artist_profiles`
- `components/dashboard/DashboardFlashs.tsx` : `flashs` → `services`
- `hooks/usePublicArtist.ts` : Adapter les requêtes
- `api/booking.ts` : Utiliser `services` au lieu de `flashs`

### 4. Mettre à jour les Statuts de Booking

**Avant :**
```typescript
statut_booking: 'pending' | 'confirmed'
statut_paiement: 'pending' | 'deposit_paid'
```

**Après :**
```typescript
status: 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
```

---

## ⚠️ Points d'Attention

### Compatibilité avec l'Existant

- Les tables `artists`, `flashs`, `availability`, `blocked_slots` **ne sont pas supprimées** pour éviter de casser le code existant.
- Vous pouvez migrer progressivement en utilisant les deux schémas en parallèle.

### Migration des Clients

- Les clients existants dans `customers` doivent être migrés vers `users` avec `role = 'CLIENT'`.
- Créer une fonction de migration si nécessaire :

```sql
CREATE OR REPLACE FUNCTION migrate_customers_to_users()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO users (id, email, name, role, created_at, updated_at)
    SELECT 
        gen_random_uuid(), -- Nouvel ID (pas lié à auth.users)
        email,
        name,
        'CLIENT'::user_role,
        created_at,
        updated_at
    FROM customers
    ON CONFLICT (email) DO NOTHING;
END;
$$;
```

### Gestion des Utilisateurs Auth

- La table `users` est liée à `auth.users(id)`.
- Lors de la création d'un compte, créer automatiquement l'entrée dans `users` :

```sql
-- Trigger pour créer automatiquement l'entrée users lors de la création auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        'CLIENT'::user_role
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 🧪 Tests Post-Migration

### Vérifier l'Intégrité des Données

```sql
-- Vérifier que tous les artistes ont un profil
SELECT COUNT(*) FROM artists a
LEFT JOIN artist_profiles ap ON a.id = ap.id
WHERE ap.id IS NULL;

-- Vérifier que tous les flashs ont un service correspondant
SELECT COUNT(*) FROM flashs f
LEFT JOIN services s ON f.id = s.id
WHERE s.id IS NULL;

-- Vérifier les bookings avec statut migré
SELECT 
    status,
    statut_booking,
    statut_paiement,
    COUNT(*)
FROM bookings
GROUP BY status, statut_booking, statut_paiement;
```

### Tester les Requêtes

```sql
-- Récupérer un artiste avec ses horaires
SELECT 
    ap.*,
    json_agg(wh.*) as working_hours
FROM artist_profiles ap
LEFT JOIN working_hours wh ON ap.id = wh.artist_id
WHERE ap.slug = 'noam'
GROUP BY ap.id;

-- Récupérer les créneaux disponibles
SELECT * FROM get_available_slots(
    'artist-uuid',
    '2026-02-01'::DATE,
    '2026-02-28'::DATE,
    120, -- 2h
    30   -- créneaux de 30min
);
```

---

## 📚 Ressources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Enums](https://www.postgresql.org/docs/current/datatype-enum.html)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

---

## ✅ Checklist de Migration

- [ ] Migration SQL exécutée dans Supabase Dashboard
- [ ] Fonctions de migration des données exécutées
- [ ] Bookings liés aux nouvelles tables (`client_id`, `service_id`)
- [ ] Types TypeScript régénérés
- [ ] Code frontend mis à jour (composants, hooks, API)
- [ ] Tests d'intégrité des données effectués
- [ ] Tests fonctionnels effectués (création booking, paiement, etc.)
- [ ] Documentation mise à jour

---

## 🐛 Troubleshooting

### Erreur "relation does not exist"

Vérifiez que toutes les tables ont été créées :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Erreur "duplicate key value"

Les fonctions de migration utilisent `ON CONFLICT`, donc elles sont idempotentes. Si vous avez des erreurs, vérifiez les contraintes UNIQUE.

### Bookings non migrés

Vérifiez que les `client_id` et `service_id` sont bien remplis :
```sql
SELECT COUNT(*) FROM bookings WHERE client_id IS NULL;
SELECT COUNT(*) FROM bookings WHERE service_id IS NULL;
```

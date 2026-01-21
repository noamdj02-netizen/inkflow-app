# ⚠️ Instructions pour Appliquer la Migration SQL

## ❌ Erreur Commune

Si vous voyez cette erreur :
```
ERROR: 42601: syntax error at or near "export"
```

Cela signifie que vous avez copié le **mauvais fichier** dans Supabase SQL Editor.

---

## ✅ Solution : Utiliser le Bon Fichier

### ❌ NE PAS copier :
- `config/subscriptions.ts` (c'est du TypeScript, pas du SQL)

### ✅ Copier ce fichier :
- `supabase/migration-add-subscription-plans.sql` (c'est du SQL)

---

## 📋 Instructions Pas à Pas

### 1. Ouvrir le Bon Fichier

Ouvrez **`supabase/migration-add-subscription-plans.sql`** (pas `config/subscriptions.ts`)

### 2. Copier le Contenu SQL

Le fichier contient uniquement du **SQL**, pas de TypeScript :

```sql
-- ============================================
-- Migration: Add Subscription Plans Support
-- ============================================
-- This migration adds the user_plan field to the artists table
-- to support FREE, STARTER, PRO, and STUDIO subscription tiers

-- Add user_plan column to artists table
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'FREE' 
CHECK (user_plan IN ('FREE', 'STARTER', 'PRO', 'STUDIO'));

-- Add index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_artists_user_plan ON artists(user_plan);

-- Add comment for documentation
COMMENT ON COLUMN artists.user_plan IS 'Subscription plan: FREE (default), STARTER, PRO, or STUDIO';

-- Update existing artists to have FREE plan (if NULL)
UPDATE artists SET user_plan = 'FREE' WHERE user_plan IS NULL;
```

### 3. Exécuter dans Supabase

1. **Allez dans** [Supabase Dashboard](https://app.supabase.com/)
2. **Sélectionnez votre projet**
3. **Allez dans** "SQL Editor" (menu latéral)
4. **Cliquez sur** "New query"
5. **Collez le contenu SQL** (uniquement le SQL, pas le TypeScript)
6. **Cliquez sur** "Run" ou appuyez sur `Ctrl+Enter`

---

## ✅ Vérification

Après l'exécution, vérifiez que la colonne existe :

```sql
-- Vérifier que la colonne user_plan existe
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'artists' AND column_name = 'user_plan';
```

Vous devriez voir :
- `column_name`: `user_plan`
- `data_type`: `text`
- `column_default`: `'FREE'`

---

## 🔍 Différence entre les Fichiers

### `supabase/migration-add-subscription-plans.sql` (SQL)
```sql
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS user_plan TEXT DEFAULT 'FREE';
```
✅ **À exécuter dans Supabase SQL Editor**

### `config/subscriptions.ts` (TypeScript)
```typescript
export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'STUDIO';
export const PLANS: Record<PlanType, PlanConfig> = { ... };
```
❌ **NE PAS exécuter dans SQL Editor** - C'est du code TypeScript pour votre application

---

## 📝 Checklist

- [ ] Ouvrir `supabase/migration-add-subscription-plans.sql` (pas `config/subscriptions.ts`)
- [ ] Copier uniquement le contenu SQL
- [ ] Coller dans Supabase SQL Editor
- [ ] Exécuter la requête
- [ ] Vérifier qu'il n'y a pas d'erreur
- [ ] Vérifier que la colonne `user_plan` existe

---

**Note** : Le fichier `config/subscriptions.ts` est déjà configuré avec vos Price IDs Stripe. Il n'a pas besoin d'être exécuté dans Supabase - c'est du code TypeScript qui sera utilisé par votre application React.

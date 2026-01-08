# 🔧 Résolution de l'erreur "new row violates row-level security policy"

## ❌ Erreur
```
new row violates row-level security policy
```

Cette erreur apparaît lors de la création ou de la mise à jour d'un profil artiste dans les paramètres.

## 🔍 Cause

La table `artists` a RLS (Row Level Security) activé, mais il manquait une politique **INSERT** permettant aux utilisateurs authentifiés de créer leur propre profil.

## ✅ Solution

### Option 1 : Exécuter le script SQL de correction (Recommandé)

1. Allez dans Supabase Dashboard → **SQL Editor**
2. Créez une nouvelle requête
3. Copiez-collez le contenu du fichier `supabase/FIX_RLS_ARTISTS_INSERT.sql`
4. Cliquez sur **"Run"**

### Option 2 : Exécuter directement cette commande SQL

```sql
-- Ajouter la politique INSERT manquante pour artists
DROP POLICY IF EXISTS "Artists can insert own data" ON artists;

CREATE POLICY "Artists can insert own data" ON artists
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND id::text = auth.uid()::text
        AND email = (auth.jwt() ->> 'email')
    );
```

## 📋 Vérification

Après avoir exécuté le script, vérifiez que la politique existe :

```sql
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'artists';
```

Vous devriez voir 3 politiques :
- ✅ `Artists can view own data` (SELECT)
- ✅ `Artists can insert own data` (INSERT) ← **Nouvelle politique**
- ✅ `Artists can update own data` (UPDATE)

## 🧪 Test

1. Allez dans les paramètres de votre profil
2. Modifiez votre nom de studio ou votre bio
3. Cliquez sur **"Enregistrer"**
4. ✅ L'erreur ne devrait plus apparaître

## 📝 Note

Le schéma principal (`supabase/schema.sql`) a été mis à jour pour inclure cette politique. Si vous recréez la base de données, cette politique sera automatiquement incluse.


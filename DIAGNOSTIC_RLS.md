# 🔍 Diagnostic RLS - "new row violates row-level security policy"

## ✅ Script de Correction Complet

Exécutez ce script dans Supabase SQL Editor :

```sql
-- ============================================
-- FIX RLS COMPLET : Politiques INSERT et UPDATE pour artists
-- ============================================

-- 1. Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Artists can view own data" ON artists;
DROP POLICY IF EXISTS "Artists can insert own data" ON artists;
DROP POLICY IF EXISTS "Artists can update own data" ON artists;

-- 2. Recréer les politiques avec des conditions simplifiées

-- SELECT : Les artistes peuvent voir leurs propres données
CREATE POLICY "Artists can view own data" ON artists
    FOR SELECT 
    USING (auth.uid()::text = id::text);

-- INSERT : Les utilisateurs authentifiés peuvent créer leur propre profil
CREATE POLICY "Artists can insert own data" ON artists
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND id::text = auth.uid()::text
    );

-- UPDATE : Les artistes peuvent modifier leurs propres données
-- IMPORTANT : Utiliser WITH CHECK pour les UPDATE
CREATE POLICY "Artists can update own data" ON artists
    FOR UPDATE 
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);
```

## 🔍 Vérification

Après avoir exécuté le script, vérifiez que tout est correct :

```sql
-- Vérifier les politiques
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'artists'
ORDER BY policyname;

-- Vérifier que RLS est activé
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'artists';
```

## 🐛 Problèmes Courants

### 1. La politique UPDATE n'a pas de WITH CHECK
**Symptôme** : Erreur lors de la mise à jour du profil
**Solution** : Ajouter `WITH CHECK` à la politique UPDATE (déjà fait dans le script ci-dessus)

### 2. La condition INSERT est trop stricte
**Symptôme** : Erreur lors de la création du profil
**Solution** : Simplifier la condition (enlever la vérification de l'email via JWT)

### 3. L'utilisateur n'est pas authentifié
**Symptôme** : `auth.uid()` retourne NULL
**Solution** : Vérifier que l'utilisateur est bien connecté dans l'application

## 🧪 Test de Diagnostic

Pour tester si l'authentification fonctionne :

```sql
-- Vérifier l'utilisateur actuel (à exécuter dans Supabase SQL Editor)
SELECT auth.uid() as current_user_id;
```

Si cela retourne NULL, l'utilisateur n'est pas authentifié côté Supabase.

## 📝 Note Importante

Le script ci-dessus simplifie la politique INSERT en enlevant la vérification de l'email via JWT, car cette vérification peut échouer dans certains cas. La vérification de l'ID est suffisante pour la sécurité.


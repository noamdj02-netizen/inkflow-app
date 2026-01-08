-- ============================================
-- FIX RAPIDE RLS : Corriger l'erreur "new row violates row-level security policy"
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor

-- Supprimer toutes les politiques existantes pour artists
DROP POLICY IF EXISTS "Artists can view own data" ON artists;
DROP POLICY IF EXISTS "Artists can insert own data" ON artists;
DROP POLICY IF EXISTS "Artists can update own data" ON artists;

-- Recréer les politiques avec des conditions simplifiées et correctes

-- 1. SELECT : Les artistes peuvent voir leurs propres données
CREATE POLICY "Artists can view own data" ON artists
    FOR SELECT 
    USING (auth.uid()::text = id::text);

-- 2. INSERT : Les utilisateurs authentifiés peuvent créer leur propre profil
-- Condition simplifiée : juste vérifier que l'ID correspond
CREATE POLICY "Artists can insert own data" ON artists
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND id::text = auth.uid()::text
    );

-- 3. UPDATE : Les artistes peuvent modifier leurs propres données
-- IMPORTANT : Ajouter WITH CHECK pour les UPDATE
CREATE POLICY "Artists can update own data" ON artists
    FOR UPDATE 
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Vérification : Afficher les politiques créées
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'OUI' 
        ELSE 'NON' 
    END as has_using,
    CASE 
        WHEN with_check IS NOT NULL THEN 'OUI' 
        ELSE 'NON' 
    END as has_with_check
FROM pg_policies 
WHERE tablename = 'artists'
ORDER BY policyname;


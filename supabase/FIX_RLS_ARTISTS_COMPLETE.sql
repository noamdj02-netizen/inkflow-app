-- ============================================
-- FIX RLS COMPLET : Politiques INSERT et UPDATE pour artists
-- ============================================
-- Ce script corrige l'erreur "new row violates row-level security policy"
-- en simplifiant et corrigeant les politiques RLS

-- 1. Supprimer toutes les politiques existantes pour artists
DROP POLICY IF EXISTS "Artists can view own data" ON artists;
DROP POLICY IF EXISTS "Artists can insert own data" ON artists;
DROP POLICY IF EXISTS "Artists can update own data" ON artists;

-- 2. Recréer les politiques avec des conditions simplifiées

-- SELECT : Les artistes peuvent voir leurs propres données
CREATE POLICY "Artists can view own data" ON artists
    FOR SELECT 
    USING (auth.uid()::text = id::text);

-- INSERT : Les utilisateurs authentifiés peuvent créer leur propre profil
-- Condition simplifiée : juste vérifier que l'ID correspond à l'utilisateur authentifié
CREATE POLICY "Artists can insert own data" ON artists
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND id::text = auth.uid()::text
    );

-- UPDATE : Les artistes peuvent modifier leurs propres données
-- IMPORTANT : Utiliser WITH CHECK pour les UPDATE, pas seulement USING
CREATE POLICY "Artists can update own data" ON artists
    FOR UPDATE 
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- 3. Vérification : Afficher toutes les politiques pour artists
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'artists'
ORDER BY policyname;

-- 4. Vérifier que RLS est bien activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'artists';


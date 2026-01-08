-- ============================================
-- FIX RLS : Ajouter la politique INSERT pour artists
-- ============================================
-- Ce script corrige l'erreur "new row violates row-level security policy"
-- lors de la création d'un profil artiste dans l'onboarding

-- Supprimer la politique INSERT si elle existe déjà
DROP POLICY IF EXISTS "Artists can insert own data" ON artists;

-- Créer la politique INSERT : Les utilisateurs authentifiés peuvent créer leur propre profil
-- La condition vérifie que l'ID de l'artiste correspond à l'ID de l'utilisateur authentifié
CREATE POLICY "Artists can insert own data" ON artists
    FOR INSERT 
    WITH CHECK (
        -- L'utilisateur doit être authentifié
        auth.uid() IS NOT NULL
        -- L'ID de l'artiste doit correspondre à l'ID de l'utilisateur authentifié
        AND id::text = auth.uid()::text
        -- L'email doit correspondre à l'email de l'utilisateur authentifié
        AND email = (auth.jwt() ->> 'email')
    );

-- Vérification : Afficher les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'artists'
ORDER BY policyname;


-- ============================================
-- Script de Diagnostic RLS pour flashs
-- ============================================
-- Exécutez ce script pour vérifier votre configuration

-- 1. Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'flashs';

-- 2. Vérifier les politiques existantes
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
WHERE tablename = 'flashs';

-- 3. Vérifier que votre artist existe avec le bon ID
-- Remplacez 'noamdj02@gmail.com' par votre email
SELECT 
    id,
    email,
    nom_studio,
    slug_profil,
    CASE 
        WHEN id = auth.uid() THEN '✅ ID correspond à auth.uid()'
        ELSE '❌ ID ne correspond PAS à auth.uid()'
    END as verification
FROM public.artists
WHERE email = 'VOTRE_EMAIL';

-- 4. Vérifier votre auth.uid() actuel
SELECT auth.uid() as current_user_id;

-- 5. Vérifier si vous avez un artist avec cet ID
SELECT 
    id,
    email,
    nom_studio
FROM public.artists
WHERE id = auth.uid();


-- ============================================
-- RLS Policies pour la table flashs
-- ============================================
-- Politiques de sécurité au niveau des lignes pour la table flashs

-- Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Flashs are public for reading" ON public.flashs;
DROP POLICY IF EXISTS "Artists can manage own flashs" ON public.flashs;
DROP POLICY IF EXISTS "Artists can insert own flashs" ON public.flashs;
DROP POLICY IF EXISTS "Public flashs are viewable by everyone" ON public.flashs;
DROP POLICY IF EXISTS "Artists can update own flashs" ON public.flashs;
DROP POLICY IF EXISTS "Artists can delete own flashs" ON public.flashs;
DROP POLICY IF EXISTS "flashs_select_policy" ON public.flashs;
DROP POLICY IF EXISTS "flashs_insert_policy" ON public.flashs;
DROP POLICY IF EXISTS "flashs_update_policy" ON public.flashs;
DROP POLICY IF EXISTS "flashs_delete_policy" ON public.flashs;
DROP POLICY IF EXISTS "flashs_select_public" ON public.flashs;
DROP POLICY IF EXISTS "flashs_insert_own" ON public.flashs;
DROP POLICY IF EXISTS "flashs_update_own" ON public.flashs;
DROP POLICY IF EXISTS "flashs_delete_own" ON public.flashs;

-- Activer RLS
ALTER TABLE public.flashs ENABLE ROW LEVEL SECURITY;

-- 1. SELECT : Public (tout le monde peut lire)
CREATE POLICY "flashs_select_public"
ON public.flashs
FOR SELECT
USING (true);

-- 2. INSERT : Version avec vérification explicite
-- Si auth.uid() est NULL, la politique échouera
CREATE POLICY "flashs_insert_own"
ON public.flashs
FOR INSERT
WITH CHECK (
  -- Vérifier que l'utilisateur est authentifié
  auth.uid() IS NOT NULL 
  -- Vérifier que artist_id correspond à l'utilisateur authentifié
  AND artist_id = auth.uid()
  -- Vérifier que l'artiste existe dans la table artists
  AND EXISTS (
    SELECT 1 FROM public.artists 
    WHERE artists.id = auth.uid()
  )
);

-- 3. UPDATE : Seul le propriétaire
CREATE POLICY "flashs_update_own"
ON public.flashs
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND artist_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND artist_id = auth.uid()
);

-- 4. DELETE : Seul le propriétaire
CREATE POLICY "flashs_delete_own"
ON public.flashs
FOR DELETE
USING (
  auth.uid() IS NOT NULL 
  AND artist_id = auth.uid()
);


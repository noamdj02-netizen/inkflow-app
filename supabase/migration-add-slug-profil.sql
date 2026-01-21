-- ============================================
-- Migration: Ajouter/garantir le slug public
-- Objectif: URL vitrine personnalisée (ex: inkflow.app/nom-du-studio)
-- Table: public.artists
--
-- Notes:
-- - Cette migration est idempotente (peut être relancée).
-- - Si vous avez déjà une contrainte UNIQUE existante sur slug_profil,
--   elle peut avoir un autre nom; adaptez le bloc DO $$ si besoin.
-- ============================================

-- 1) Ajouter la colonne si elle n'existe pas
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS slug_profil TEXT;

-- 2) Ajouter une contrainte d'unicité si elle n'existe pas déjà (nom par défaut Supabase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'artists_slug_profil_key'
      AND conrelid = 'public.artists'::regclass
  ) THEN
    ALTER TABLE public.artists
      ADD CONSTRAINT artists_slug_profil_key UNIQUE (slug_profil);
  END IF;
END $$;

-- 3) Index de performance pour lookup par slug
CREATE INDEX IF NOT EXISTS idx_artists_slug
  ON public.artists (slug_profil);


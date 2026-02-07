-- Vitrine: image de fond derrière le hero (nom, sous-titre, etc.)
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS vitrine_hero_background_url TEXT;

COMMENT ON COLUMN public.artists.vitrine_hero_background_url IS 'URL de l''image de fond affichée derrière le hero de la vitrine publique (nom, sous-titre)';

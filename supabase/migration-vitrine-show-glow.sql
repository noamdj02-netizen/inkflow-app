-- Vitrine: option pour afficher les effets de lumière (ambiance) sur la page publique
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS vitrine_show_glow BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.artists.vitrine_show_glow IS 'Afficher les effets de lumière (glow) sur la vitrine publique';

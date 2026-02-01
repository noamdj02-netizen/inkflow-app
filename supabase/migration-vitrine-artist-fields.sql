-- Vitrine: champs optionnels pour affichage (localisation, note, nb avis, années d'expérience)
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS ville TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS nb_avis INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS years_experience INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.artists.ville IS 'Ville / localisation pour la vitrine publique';
COMMENT ON COLUMN public.artists.rating IS 'Note affichée (ex: 4.9)';
COMMENT ON COLUMN public.artists.nb_avis IS 'Nombre d''avis (pour affichage)';
COMMENT ON COLUMN public.artists.years_experience IS 'Années d''expérience';

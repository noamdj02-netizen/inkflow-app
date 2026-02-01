-- Liens réseaux sociaux pour la vitrine (affichés sous "Réserver maintenant")
ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT;

COMMENT ON COLUMN public.artists.instagram_url IS 'URL complète du profil Instagram (vitrine)';
COMMENT ON COLUMN public.artists.tiktok_url IS 'URL complète du profil TikTok (vitrine)';
COMMENT ON COLUMN public.artists.facebook_url IS 'URL complète de la page Facebook (vitrine)';

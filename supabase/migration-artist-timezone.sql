-- Migration: Fuseau horaire par artiste pour les créneaux de réservation
-- Les créneaux (9h-18h) sont affichés et calculés dans le fuseau de l'artiste.

ALTER TABLE public.artists
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Paris';

COMMENT ON COLUMN public.artists.timezone IS 'IANA timezone (ex: Europe/Paris) pour les horaires de réservation';

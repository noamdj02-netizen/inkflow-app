-- Migration: Token secret pour le flux iCal (abonnement calendrier)
-- Permet aux tatoueurs d'avoir une URL secrète pour s'abonner sans exposer l'artist_id.

ALTER TABLE artists
ADD COLUMN IF NOT EXISTS ical_feed_token TEXT UNIQUE;

-- Index pour lookup rapide par token
CREATE INDEX IF NOT EXISTS idx_artists_ical_feed_token ON artists(ical_feed_token)
WHERE ical_feed_token IS NOT NULL;

-- Optionnel : générer un token pour les artistes existants (exécuter manuellement si besoin)
-- UPDATE artists SET ical_feed_token = encode(gen_random_bytes(32), 'hex') WHERE ical_feed_token IS NULL;

COMMENT ON COLUMN artists.ical_feed_token IS 'Token secret pour l''URL du flux iCal (abonnement Apple Calendar / Android). Générer via dashboard ou extension.';

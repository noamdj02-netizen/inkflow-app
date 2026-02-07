-- Migration: Statut des notifications email pour les projets (demandes de rendez-vous)
-- Permet de tracer si l'email au tatoueur a été envoyé ou a échoué (retry + échec définitif)

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS artist_notification_status TEXT DEFAULT 'pending'
  CHECK (artist_notification_status IN ('pending', 'sent', 'failed'));

-- Optionnel : date d'envoi de la confirmation client
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS client_confirmation_sent_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_projects_artist_notification_status
ON projects(artist_notification_status)
WHERE artist_notification_status = 'failed';

COMMENT ON COLUMN projects.artist_notification_status IS 'État de l''email "Nouvelle demande" envoyé au tatoueur: pending, sent, failed';
COMMENT ON COLUMN projects.client_confirmation_sent_at IS 'Date d''envoi de l''email de confirmation au client';

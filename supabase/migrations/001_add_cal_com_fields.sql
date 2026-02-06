-- Migration: Ajouter les champs Cal.com à la table artists
-- Date: 2026-02-04

-- Ajouter les colonnes Cal.com si elles n'existent pas déjà
DO $$ 
BEGIN
  -- Ajouter cal_com_username si absent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artists' AND column_name = 'cal_com_username'
  ) THEN
    ALTER TABLE artists ADD COLUMN cal_com_username TEXT;
  END IF;

  -- Ajouter cal_com_event_type_id si absent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artists' AND column_name = 'cal_com_event_type_id'
  ) THEN
    ALTER TABLE artists ADD COLUMN cal_com_event_type_id TEXT;
  END IF;
END $$;

-- Ajouter un index pour recherche rapide par username Cal.com
CREATE INDEX IF NOT EXISTS idx_artists_cal_com_username ON artists(cal_com_username);

-- Commentaires pour documentation
COMMENT ON COLUMN artists.cal_com_username IS 'Username Cal.com de l''artiste (ex: john-doe)';
COMMENT ON COLUMN artists.cal_com_event_type_id IS 'ID du type d''événement Cal.com pour les réservations';

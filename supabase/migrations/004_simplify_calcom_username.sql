-- Migration: Simplifier Cal.com - juste calcom_username
-- Date: 2026-02-05
-- On garde juste le username, pas besoin d'event_type_id avec l'embed

-- Renommer cal_com_username en calcom_username pour cohérence
DO $$ 
BEGIN
  -- Renommer la colonne si elle existe
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artists' AND column_name = 'cal_com_username'
  ) THEN
    ALTER TABLE artists RENAME COLUMN cal_com_username TO calcom_username;
  END IF;

  -- Ajouter calcom_username si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artists' AND column_name = 'calcom_username'
  ) THEN
    ALTER TABLE artists ADD COLUMN calcom_username TEXT;
  END IF;

  -- Supprimer cal_com_event_type_id (plus besoin avec l'embed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'artists' AND column_name = 'cal_com_event_type_id'
  ) THEN
    ALTER TABLE artists DROP COLUMN cal_com_event_type_id;
  END IF;
END $$;

-- Mettre à jour l'index
DROP INDEX IF EXISTS idx_artists_cal_com_username;
CREATE INDEX IF NOT EXISTS idx_artists_calcom_username ON artists(calcom_username);

-- Commentaire
COMMENT ON COLUMN artists.calcom_username IS 'Username Cal.com de l''artiste (ex: john-doe pour cal.com/john-doe)';

-- Migration: Ajouter champ acompte à la table flashs
-- Date: 2026-02-04

-- Ajouter acompte si absent (en DECIMAL pour correspondre au schéma fourni)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'flashs' AND column_name = 'acompte'
  ) THEN
    ALTER TABLE flashs ADD COLUMN acompte DECIMAL(10,2);
    
    -- Calculer l'acompte à partir du prix (30% par défaut) si prix existe
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'flashs' AND column_name = 'prix'
    ) THEN
      -- Prix est en centimes, convertir en euros et calculer 30%
      UPDATE flashs 
      SET acompte = ROUND((prix / 100.0) * 0.30, 2)
      WHERE acompte IS NULL;
    END IF;
  END IF;
END $$;

-- Ajouter une contrainte pour s'assurer que acompte <= prix
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_acompte_less_than_prix'
  ) THEN
    ALTER TABLE flashs 
    ADD CONSTRAINT check_acompte_less_than_prix 
    CHECK (acompte IS NULL OR acompte <= (prix / 100.0));
  END IF;
END $$;

COMMENT ON COLUMN flashs.acompte IS 'Montant de l''acompte en euros (30% du prix par défaut)';

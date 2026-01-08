-- ============================================
-- Migration: Ajouter theme_color et avatar_url à la table artists
-- ============================================

-- Ajouter la colonne theme_color si elle n'existe pas
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'amber' CHECK (theme_color IN ('amber', 'red', 'blue', 'emerald', 'violet'));

-- Ajouter la colonne avatar_url si elle n'existe pas
ALTER TABLE artists 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Mettre à jour les valeurs existantes de accent_color vers theme_color
UPDATE artists 
SET theme_color = CASE 
  WHEN accent_color = 'gold' THEN 'amber'
  WHEN accent_color = 'red' THEN 'red'
  WHEN accent_color = 'blue' THEN 'blue'
  WHEN accent_color = 'green' THEN 'emerald'
  WHEN accent_color = 'purple' THEN 'violet'
  ELSE 'amber'
END
WHERE theme_color IS NULL OR theme_color = 'amber';


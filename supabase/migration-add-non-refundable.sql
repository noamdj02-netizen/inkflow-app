-- ═══════════════════════════════════════════════════════════════
-- Migration: Add is_deposit_non_refundable to artist_payment_settings
-- Pour les déploiements où la table existe déjà
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE artist_payment_settings
  ADD COLUMN IF NOT EXISTS is_deposit_non_refundable BOOLEAN DEFAULT false;

COMMENT ON COLUMN artist_payment_settings.is_deposit_non_refundable
  IS 'Si true, l''acompte est non remboursable en cas d''annulation tardive';

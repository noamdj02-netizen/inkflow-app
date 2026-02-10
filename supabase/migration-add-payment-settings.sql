-- ═══════════════════════════════════════════════════════════════
-- Migration: artist_payment_settings table
-- Paramètres de paiement avancés pour chaque artiste tatoueur
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS artist_payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_connected_at TIMESTAMP WITH TIME ZONE,
  
  -- Politique d'acompte
  deposit_type TEXT NOT NULL DEFAULT 'percentage' CHECK (deposit_type IN ('percentage', 'fixed')),
  deposit_percentage INTEGER DEFAULT 30 CHECK (deposit_percentage >= 0 AND deposit_percentage <= 100),
  deposit_fixed_amount INTEGER DEFAULT 50, -- En euros (pas centimes)
  is_deposit_non_refundable BOOLEAN DEFAULT false, -- Acompte non remboursable si annulation tardive
  
  -- Politique d'annulation
  cancellation_policy_enabled BOOLEAN DEFAULT true,
  cancellation_hours INTEGER DEFAULT 48 CHECK (cancellation_hours > 0),
  
  -- TVA / Taxes
  tax_enabled BOOLEAN DEFAULT false,
  tax_rate DECIMAL(5,2) DEFAULT 20.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un seul paramétrage par artiste
  UNIQUE(artist_id)
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_payment_settings_artist ON artist_payment_settings(artist_id);
CREATE INDEX IF NOT EXISTS idx_payment_settings_stripe ON artist_payment_settings(stripe_account_id);

-- Row Level Security (RLS)
ALTER TABLE artist_payment_settings ENABLE ROW LEVEL SECURITY;

-- Politique : Un artiste ne peut voir que ses propres paramètres
CREATE POLICY "Artists can view own payment settings"
  ON artist_payment_settings
  FOR SELECT
  USING (auth.uid() = artist_id);

-- Politique : Un artiste peut insérer ses propres paramètres
CREATE POLICY "Artists can insert own payment settings"
  ON artist_payment_settings
  FOR INSERT
  WITH CHECK (auth.uid() = artist_id);

-- Politique : Un artiste peut modifier ses propres paramètres
CREATE POLICY "Artists can update own payment settings"
  ON artist_payment_settings
  FOR UPDATE
  USING (auth.uid() = artist_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_payment_settings_updated_at ON artist_payment_settings;
CREATE TRIGGER update_payment_settings_updated_at
  BEFORE UPDATE ON artist_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE artist_payment_settings IS 'Paramètres de paiement et facturation pour chaque artiste tatoueur';
COMMENT ON COLUMN artist_payment_settings.deposit_type IS 'Type d''acompte : percentage (%) ou fixed (montant fixe)';
COMMENT ON COLUMN artist_payment_settings.deposit_percentage IS 'Pourcentage de l''acompte si deposit_type = percentage';
COMMENT ON COLUMN artist_payment_settings.deposit_fixed_amount IS 'Montant fixe en euros si deposit_type = fixed';
COMMENT ON COLUMN artist_payment_settings.cancellation_hours IS 'Nombre d''heures avant RDV pour annulation sans pénalité';
COMMENT ON COLUMN artist_payment_settings.is_deposit_non_refundable IS 'Si true, l''acompte est non remboursable en cas d''annulation tardive';

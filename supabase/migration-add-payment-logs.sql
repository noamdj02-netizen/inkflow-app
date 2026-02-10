-- ═══════════════════════════════════════════════════════════════
-- Migration: payment_logs table
-- Historique complet de tous les paiements avec détails Stripe
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe
  payment_intent_id TEXT UNIQUE NOT NULL,
  charge_id TEXT,
  
  -- Montants (en centimes)
  amount INTEGER NOT NULL CHECK (amount > 0),
  amount_received INTEGER, -- Montant effectivement reçu après frais
  fee_amount INTEGER, -- Frais Stripe
  net_amount INTEGER, -- Net = amount_received - fee_amount
  
  -- Type et statut
  payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'balance', 'full')),
  status TEXT NOT NULL CHECK (status IN ('created', 'processing', 'succeeded', 'failed', 'canceled', 'refunded')),
  
  -- Remboursements
  refund_id TEXT,
  refund_amount INTEGER,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  currency TEXT DEFAULT 'eur',
  payment_method_type TEXT, -- 'card', 'sepa_debit', etc.
  card_brand TEXT, -- 'visa', 'mastercard', etc.
  card_last4 TEXT,
  
  -- Client
  client_email TEXT,
  client_name TEXT,
  
  -- Erreurs
  error_code TEXT,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  succeeded_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_payment_logs_booking ON payment_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_artist ON payment_logs(artist_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_intent ON payment_logs(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);

-- Index composite pour les recherches par artiste + statut
CREATE INDEX IF NOT EXISTS idx_payment_logs_artist_status 
  ON payment_logs(artist_id, status, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Politique : Un artiste ne peut voir que ses propres logs
CREATE POLICY "Artists can view own payment logs"
  ON payment_logs
  FOR SELECT
  USING (auth.uid() = artist_id);

-- Politique : Seul le système peut insérer (via service role key)
CREATE POLICY "System can insert payment logs"
  ON payment_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Politique : Seul le système peut modifier (webhooks)
CREATE POLICY "System can update payment logs"
  ON payment_logs
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_payment_logs_updated_at ON payment_logs;
CREATE TRIGGER update_payment_logs_updated_at
  BEFORE UPDATE ON payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Vue pour les statistiques de paiement par artiste
CREATE OR REPLACE VIEW artist_payment_stats AS
SELECT
  artist_id,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE status = 'refunded') as refunded_payments,
  SUM(amount) FILTER (WHERE status = 'succeeded') as total_revenue_cents,
  SUM(fee_amount) FILTER (WHERE status = 'succeeded') as total_fees_cents,
  SUM(net_amount) FILTER (WHERE status = 'succeeded') as total_net_cents,
  AVG(amount) FILTER (WHERE status = 'succeeded') as avg_payment_cents,
  MIN(created_at) as first_payment_at,
  MAX(created_at) as last_payment_at
FROM payment_logs
GROUP BY artist_id;

-- Vue pour les paiements récents (derniers 30 jours)
CREATE OR REPLACE VIEW recent_payments AS
SELECT
  pl.*,
  b.client_name as booking_client_name,
  b.client_email as booking_client_email,
  b.date_debut as booking_date,
  COALESCE(f.title, p.body_part) as booking_description
FROM payment_logs pl
LEFT JOIN bookings b ON pl.booking_id = b.id
LEFT JOIN flashs f ON b.flash_id = f.id
LEFT JOIN projects p ON b.project_id = p.id
WHERE pl.created_at > NOW() - INTERVAL '30 days'
ORDER BY pl.created_at DESC;

-- Fonction pour calculer le revenue mensuel
CREATE OR REPLACE FUNCTION get_monthly_revenue(
  p_artist_id UUID,
  p_start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  month DATE,
  total_revenue BIGINT,
  total_fees BIGINT,
  net_revenue BIGINT,
  payment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE_TRUNC('month', pl.created_at)::DATE as month,
    SUM(pl.amount) FILTER (WHERE pl.status = 'succeeded') as total_revenue,
    SUM(pl.fee_amount) FILTER (WHERE pl.status = 'succeeded') as total_fees,
    SUM(pl.net_amount) FILTER (WHERE pl.status = 'succeeded') as net_revenue,
    COUNT(*) FILTER (WHERE pl.status = 'succeeded') as payment_count
  FROM payment_logs pl
  WHERE pl.artist_id = p_artist_id
    AND pl.created_at >= p_start_date
    AND pl.created_at <= p_end_date
  GROUP BY DATE_TRUNC('month', pl.created_at)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE payment_logs IS 'Historique complet de tous les paiements avec détails Stripe';
COMMENT ON COLUMN payment_logs.amount IS 'Montant total en centimes';
COMMENT ON COLUMN payment_logs.net_amount IS 'Montant net après déduction des frais Stripe';
COMMENT ON COLUMN payment_logs.payment_type IS 'Type de paiement: deposit (acompte), balance (solde), ou full (paiement complet)';
COMMENT ON VIEW artist_payment_stats IS 'Statistiques agrégées des paiements par artiste';
COMMENT ON VIEW recent_payments IS 'Vue enrichie des paiements des 30 derniers jours';

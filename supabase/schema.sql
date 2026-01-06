-- ============================================
-- InkFlow SaaS - Schéma de Base de Données
-- PostgreSQL via Supabase
-- ============================================

-- Extension pour les UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: artists
-- ============================================
CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nom_studio TEXT NOT NULL,
    slug_profil TEXT UNIQUE NOT NULL, -- Ex: "zonett_ink" pour inkflow.app/zonett_ink
    stripe_account_id TEXT, -- ID du compte Stripe Connect
    stripe_connected BOOLEAN DEFAULT FALSE,
    deposit_percentage INTEGER DEFAULT 30, -- Pourcentage d'acompte (30%)
    accent_color TEXT DEFAULT 'gold', -- Couleur d'accent (gold, red, blue, etc.)
    bio_instagram TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par slug
CREATE INDEX IF NOT EXISTS idx_artists_slug ON artists(slug_profil);
CREATE INDEX IF NOT EXISTS idx_artists_email ON artists(email);

-- ============================================
-- TABLE: flashs
-- ============================================
CREATE TABLE IF NOT EXISTS flashs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL, -- URL Cloudinary/S3
    prix INTEGER NOT NULL, -- En centimes (ex: 15000 = 150€)
    duree_minutes INTEGER NOT NULL, -- Durée estimée en minutes
    taille_cm TEXT, -- Ex: "10x5 cm"
    style TEXT, -- Fine Line, Traditionnel, etc.
    statut TEXT DEFAULT 'available' CHECK (statut IN ('available', 'reserved', 'sold_out')),
    stock_limit INTEGER DEFAULT 1, -- Nombre de fois qu'on peut réserver ce flash (1 = unique)
    stock_current INTEGER DEFAULT 0, -- Nombre de réservations actuelles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par artiste et statut
CREATE INDEX IF NOT EXISTS idx_flashs_artist ON flashs(artist_id);
CREATE INDEX IF NOT EXISTS idx_flashs_statut ON flashs(statut);

-- ============================================
-- TABLE: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    body_part TEXT NOT NULL, -- Zone du corps
    size_cm INTEGER NOT NULL,
    style TEXT NOT NULL, -- Fine Line, Réalisme, etc.
    description TEXT NOT NULL,
    budget_max INTEGER, -- En centimes (ex: 40000 = 400€)
    is_cover_up BOOLEAN DEFAULT FALSE,
    is_first_tattoo BOOLEAN DEFAULT FALSE,
    reference_images TEXT[], -- Array d'URLs d'images
    availability TEXT[], -- Array de jours: ['Lun', 'Mar', 'Mer']
    
    -- Analyse IA
    ai_estimated_hours DECIMAL(4,1),
    ai_complexity_score INTEGER CHECK (ai_complexity_score >= 1 AND ai_complexity_score <= 10),
    ai_price_range TEXT, -- Ex: "250€ - 400€"
    ai_technical_notes TEXT,
    
    -- Validation artiste
    statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected', 'quoted')),
    artist_quoted_price INTEGER, -- Prix final proposé par l'artiste (en centimes)
    artist_notes TEXT, -- Commentaires de l'artiste
    artist_response_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_projects_artist ON projects(artist_id);
CREATE INDEX IF NOT EXISTS idx_projects_statut ON projects(statut);
CREATE INDEX IF NOT EXISTS idx_projects_client_email ON projects(client_email);

-- ============================================
-- TABLE: bookings
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    
    -- Type de réservation (soit flash_id, soit project_id)
    flash_id UUID REFERENCES flashs(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Informations client
    client_email TEXT NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    
    -- Détails du rendez-vous
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    duree_minutes INTEGER NOT NULL,
    
    -- Paiement
    prix_total INTEGER NOT NULL, -- En centimes
    deposit_amount INTEGER NOT NULL, -- Montant de l'acompte (en centimes)
    deposit_percentage INTEGER NOT NULL, -- Pourcentage d'acompte appliqué
    
    -- Statut de paiement Stripe
    statut_paiement TEXT DEFAULT 'pending' CHECK (statut_paiement IN ('pending', 'deposit_paid', 'fully_paid', 'refunded', 'failed')),
    stripe_payment_intent_id TEXT, -- ID du Payment Intent Stripe
    stripe_deposit_intent_id TEXT, -- ID du Payment Intent pour l'acompte
    
    -- Statut du rendez-vous
    statut_booking TEXT DEFAULT 'confirmed' CHECK (statut_booking IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    
    -- Notifications
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    reminder_sms_sent BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte: soit flash_id, soit project_id doit être défini
    CONSTRAINT booking_type_check CHECK (
        (flash_id IS NOT NULL AND project_id IS NULL) OR 
        (flash_id IS NULL AND project_id IS NOT NULL)
    )
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_bookings_artist ON bookings(artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_debut ON bookings(date_debut);
CREATE INDEX IF NOT EXISTS idx_bookings_statut_paiement ON bookings(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_bookings_statut_booking ON bookings(statut_booking);
CREATE INDEX IF NOT EXISTS idx_bookings_client_email ON bookings(client_email);

-- ============================================
-- TABLE: stripe_transactions (Optionnel - pour tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS stripe_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL, -- En centimes
    currency TEXT DEFAULT 'eur',
    status TEXT NOT NULL, -- succeeded, pending, failed, refunded
    payment_type TEXT NOT NULL CHECK (payment_type IN ('deposit', 'full_payment')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_transactions_artist ON stripe_transactions(artist_id);
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_booking ON stripe_transactions(booking_id);

-- ============================================
-- TRIGGERS: Mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer les triggers s'ils existent déjà, puis les recréer
DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at BEFORE UPDATE ON artists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_flashs_updated_at ON flashs;
CREATE TRIGGER update_flashs_updated_at BEFORE UPDATE ON flashs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================
-- Activer RLS sur toutes les tables
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes avant de les recréer (pour éviter les erreurs de duplication)
DROP POLICY IF EXISTS "Artists can view own data" ON artists;
DROP POLICY IF EXISTS "Artists can update own data" ON artists;
DROP POLICY IF EXISTS "Flashs are public for reading" ON flashs;
DROP POLICY IF EXISTS "Artists can manage own flashs" ON flashs;
DROP POLICY IF EXISTS "Artists can view own projects" ON projects;
DROP POLICY IF EXISTS "Artists can update own projects" ON projects;
DROP POLICY IF EXISTS "Artists can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Artists can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Artists can view own transactions" ON stripe_transactions;

-- Policy: Les artistes peuvent voir/modifier leurs propres données
CREATE POLICY "Artists can view own data" ON artists
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Artists can update own data" ON artists
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Policy: Les flashs sont publics en lecture, mais seul l'artiste peut les modifier
CREATE POLICY "Flashs are public for reading" ON flashs
    FOR SELECT USING (true);

CREATE POLICY "Artists can manage own flashs" ON flashs
    FOR ALL USING (artist_id::text = auth.uid()::text);

-- Policy: Les projets sont visibles par l'artiste et le client (via email)
CREATE POLICY "Artists can view own projects" ON projects
    FOR SELECT USING (artist_id::text = auth.uid()::text);

CREATE POLICY "Artists can update own projects" ON projects
    FOR UPDATE USING (artist_id::text = auth.uid()::text);

-- Policy: Les réservations sont visibles par l'artiste
CREATE POLICY "Artists can view own bookings" ON bookings
    FOR SELECT USING (artist_id::text = auth.uid()::text);

CREATE POLICY "Artists can update own bookings" ON bookings
    FOR UPDATE USING (artist_id::text = auth.uid()::text);

-- Policy: Les transactions Stripe sont visibles par l'artiste
CREATE POLICY "Artists can view own transactions" ON stripe_transactions
    FOR SELECT USING (artist_id::text = auth.uid()::text);

-- ============================================
-- FONCTIONS UTILES
-- ============================================

-- Fonction pour obtenir les créneaux disponibles d'un artiste
CREATE OR REPLACE FUNCTION get_available_slots(
    p_artist_id UUID,
    p_date_debut DATE,
    p_date_fin DATE
)
RETURNS TABLE (
    date_debut TIMESTAMP WITH TIME ZONE,
    date_fin TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.date_debut,
        b.date_fin,
        FALSE as is_available
    FROM bookings b
    WHERE b.artist_id = p_artist_id
      AND b.statut_booking IN ('confirmed', 'completed')
      AND b.date_debut >= p_date_debut
      AND b.date_debut <= p_date_fin;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DONNÉES DE TEST (Optionnel - pour développement)
-- ============================================
-- INSERT INTO artists (email, nom_studio, slug_profil, deposit_percentage)
-- VALUES 
--     ('zonett@example.com', 'Zonett Ink', 'zonett_ink', 30),
--     ('test@example.com', 'Test Studio', 'test_studio', 30);


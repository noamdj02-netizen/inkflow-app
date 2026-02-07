-- ============================================
-- Migration: Adaptation du schéma Prisma vers Supabase
-- Structure améliorée avec User/ArtistProfile séparés, WorkingHour, Leave, Service
-- Compatible avec Supabase Auth (auth.uid() = User.id)
-- ============================================

-- ============================================
-- ENUMS
-- ============================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CLIENT', 'ARTIST', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: users (remplace customers, lié à auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, -- Lié à Supabase Auth
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role DEFAULT 'CLIENT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLE: artist_profiles (remplace artists, lié à users)
-- ============================================
CREATE TABLE IF NOT EXISTS artist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    slug TEXT UNIQUE NOT NULL, -- pour l'url: inkflow.com/artist/nom
    description TEXT,
    
    -- Paramètres du planning
    slot_interval_min INTEGER DEFAULT 30, -- Découpage du planning (ex: toutes les 30min)
    min_notice_hours INTEGER DEFAULT 24, -- Pas de rdv moins de 24h avant
    
    -- Champs existants de artists (pour compatibilité)
    nom_studio TEXT NOT NULL,
    stripe_account_id TEXT,
    stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
    deposit_percentage INTEGER DEFAULT 30,
    theme_color TEXT DEFAULT 'amber',
    theme_accent_hex TEXT,
    theme_secondary_hex TEXT,
    avatar_url TEXT,
    bio_instagram TEXT,
    pre_tattoo_instructions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artist_profiles_user_id ON artist_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_profiles_slug ON artist_profiles(slug);

-- ============================================
-- TABLE: working_hours (remplace availability avec structure améliorée)
-- ============================================
CREATE TABLE IF NOT EXISTS working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
    
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Dimanche, 1 = Lundi, etc.
    start_time TEXT NOT NULL, -- Format "09:00"
    end_time TEXT NOT NULL, -- Format "19:00"
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT working_hours_end_after_start CHECK (
        -- Conversion TIME pour comparaison
        (end_time::TIME) > (start_time::TIME)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_working_hours_artist_day ON working_hours(artist_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_working_hours_artist_active ON working_hours(artist_id, is_active);

-- ============================================
-- TABLE: leaves (remplace blocked_slots avec structure simplifiée)
-- ============================================
CREATE TABLE IF NOT EXISTS leaves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
    
    date DATE NOT NULL, -- Jour spécifique bloqué
    reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_artist_date ON leaves(artist_id, date);

-- ============================================
-- TABLE: services (remplace flashs avec structure plus générique)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artist_profiles(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL, -- ex: "Flash M", "Consultation", "Journée Complète"
    duration_min INTEGER NOT NULL, -- Durée en minutes (ex: 180 pour 3h)
    price INTEGER NOT NULL, -- En centimes
    deposit_amount INTEGER NOT NULL, -- Montant de l'acompte obligatoire en centimes
    
    -- Champs optionnels pour compatibilité avec flashs
    image_url TEXT,
    taille_cm TEXT,
    style TEXT,
    statut TEXT DEFAULT 'available' CHECK (statut IN ('available', 'reserved', 'sold_out')),
    stock_limit INTEGER DEFAULT 1,
    stock_current INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_artist ON services(artist_id);
CREATE INDEX IF NOT EXISTS idx_services_statut ON services(statut);

-- ============================================
-- TABLE: bookings (refactorisée avec nouveau statut)
-- ============================================
-- Note: On garde la table bookings existante mais on ajoute les nouvelles colonnes
-- et on crée une vue ou fonction pour migrer les données

-- Ajouter la colonne status si elle n'existe pas (pour compatibilité)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'status'
    ) THEN
        ALTER TABLE bookings ADD COLUMN status booking_status;
    END IF;
END $$;

-- Migrer les statuts existants vers le nouveau format
UPDATE bookings 
SET status = CASE
    WHEN statut_booking = 'pending' AND statut_paiement = 'pending' THEN 'PENDING_PAYMENT'::booking_status
    WHEN statut_booking = 'confirmed' THEN 'CONFIRMED'::booking_status
    WHEN statut_booking = 'cancelled' THEN 'CANCELLED'::booking_status
    WHEN statut_booking = 'completed' THEN 'COMPLETED'::booking_status
    ELSE 'PENDING_PAYMENT'::booking_status
END
WHERE status IS NULL;

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
    -- client_id (lié à users)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN client_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- service_id (lié à services)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'service_id'
    ) THEN
        ALTER TABLE bookings ADD COLUMN service_id UUID REFERENCES services(id) ON DELETE SET NULL;
    END IF;
    
    -- payment_intent (renommage de stripe_deposit_intent_id pour cohérence)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'payment_intent'
    ) THEN
        ALTER TABLE bookings ADD COLUMN payment_intent TEXT;
        -- Copier les valeurs existantes
        UPDATE bookings SET payment_intent = stripe_deposit_intent_id WHERE stripe_deposit_intent_id IS NOT NULL;
    END IF;
END $$;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_bookings_artist_start_time ON bookings(artist_id, start_time) 
WHERE status IN ('PENDING_PAYMENT', 'CONFIRMED');

CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id) WHERE service_id IS NOT NULL;

-- ============================================
-- FONCTIONS DE MIGRATION DES DONNÉES EXISTANTES
-- ============================================

-- Fonction pour migrer les artists existants vers users + artist_profiles
CREATE OR REPLACE FUNCTION migrate_artists_to_users()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    artist_record RECORD;
    user_id_val UUID;
BEGIN
    -- Pour chaque artist existant
    FOR artist_record IN SELECT * FROM artists LOOP
        -- Vérifier si l'utilisateur existe déjà dans auth.users
        SELECT id INTO user_id_val FROM auth.users WHERE id = artist_record.id LIMIT 1;
        
        IF user_id_val IS NULL THEN
            -- Si l'artiste n'a pas de compte auth, on crée un user "fantôme" (à migrer manuellement)
            RAISE NOTICE 'Artist % (email: %) n''a pas de compte auth.users - migration manuelle requise', artist_record.id, artist_record.email;
            CONTINUE;
        END IF;
        
        -- Créer l'entrée dans users si elle n'existe pas
        INSERT INTO users (id, email, name, role, created_at, updated_at)
        VALUES (
            user_id_val,
            artist_record.email,
            artist_record.nom_studio,
            'ARTIST'::user_role,
            artist_record.created_at,
            artist_record.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            name = EXCLUDED.nom_studio,
            role = 'ARTIST'::user_role;
        
        -- Créer l'entrée dans artist_profiles
        INSERT INTO artist_profiles (
            id, user_id, slug, nom_studio, stripe_account_id, stripe_onboarding_complete,
            deposit_percentage, theme_color, theme_accent_hex, theme_secondary_hex,
            avatar_url, bio_instagram, pre_tattoo_instructions,
            created_at, updated_at
        )
        VALUES (
            artist_record.id,
            user_id_val,
            artist_record.slug_profil,
            artist_record.nom_studio,
            artist_record.stripe_account_id,
            artist_record.stripe_connected,
            artist_record.deposit_percentage,
            artist_record.theme_color,
            artist_record.theme_accent_hex,
            artist_record.theme_secondary_hex,
            artist_record.avatar_url,
            artist_record.bio_instagram,
            artist_record.pre_tattoo_instructions,
            artist_record.created_at,
            artist_record.updated_at
        )
        ON CONFLICT (user_id) DO UPDATE SET
            slug = EXCLUDED.slug,
            nom_studio = EXCLUDED.nom_studio,
            stripe_account_id = EXCLUDED.stripe_account_id,
            stripe_onboarding_complete = EXCLUDED.stripe_onboarding_complete,
            deposit_percentage = EXCLUDED.deposit_percentage;
    END LOOP;
END;
$$;

-- Fonction pour migrer flashs vers services
CREATE OR REPLACE FUNCTION migrate_flashs_to_services()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    flash_record RECORD;
    deposit_amount_val INTEGER;
BEGIN
    FOR flash_record IN SELECT f.*, a.deposit_percentage 
                        FROM flashs f 
                        JOIN artists a ON f.artist_id = a.id LOOP
        -- Calculer deposit_amount depuis deposit_percentage
        deposit_amount_val := ROUND((flash_record.prix * COALESCE(flash_record.deposit_percentage, 30)) / 100);
        
        INSERT INTO services (
            id, artist_id, name, duration_min, price, deposit_amount,
            image_url, taille_cm, style, statut, stock_limit, stock_current,
            created_at, updated_at
        )
        VALUES (
            flash_record.id,
            flash_record.artist_id,
            flash_record.title,
            flash_record.duree_minutes,
            flash_record.prix,
            deposit_amount_val,
            flash_record.image_url,
            flash_record.taille_cm,
            flash_record.style,
            flash_record.statut,
            flash_record.stock_limit,
            flash_record.stock_current,
            flash_record.created_at,
            flash_record.updated_at
        )
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END;
$$;

-- Fonction pour migrer availability vers working_hours
CREATE OR REPLACE FUNCTION migrate_availability_to_working_hours()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    avail_record RECORD;
    start_time_str TEXT;
    end_time_str TEXT;
BEGIN
    FOR avail_record IN SELECT * FROM availability LOOP
        -- Convertir heures/minutes en format "HH:MM"
        start_time_str := LPAD(avail_record.start_hour::TEXT, 2, '0') || ':' || LPAD(avail_record.start_minute::TEXT, 2, '0');
        end_time_str := LPAD(avail_record.end_hour::TEXT, 2, '0') || ':' || LPAD(avail_record.end_minute::TEXT, 2, '0');
        
        INSERT INTO working_hours (
            artist_id, day_of_week, start_time, end_time, is_active, created_at, updated_at
        )
        VALUES (
            avail_record.artist_id,
            avail_record.day_of_week,
            start_time_str,
            end_time_str,
            avail_record.is_active,
            avail_record.created_at,
            avail_record.updated_at
        )
        ON CONFLICT (artist_id, day_of_week) DO UPDATE SET
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            is_active = EXCLUDED.is_active;
    END LOOP;
END;
$$;

-- Fonction pour migrer blocked_slots vers leaves
CREATE OR REPLACE FUNCTION migrate_blocked_slots_to_leaves()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    blocked_record RECORD;
    current_date DATE;
BEGIN
    FOR blocked_record IN SELECT * FROM blocked_slots LOOP
        -- Convertir la plage de dates en jours individuels
        current_date := blocked_record.start_date::DATE;
        
        WHILE current_date <= blocked_record.end_date::DATE LOOP
            INSERT INTO leaves (artist_id, date, reason, created_at)
            VALUES (
                blocked_record.artist_id,
                current_date,
                blocked_record.reason,
                blocked_record.created_at
            )
            ON CONFLICT DO NOTHING;
            
            current_date := current_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policies pour users
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policies pour artist_profiles
DROP POLICY IF EXISTS "Artist profiles are public for reading" ON artist_profiles;
CREATE POLICY "Artist profiles are public for reading" ON artist_profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artists can manage own profile" ON artist_profiles;
CREATE POLICY "Artists can manage own profile" ON artist_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Policies pour working_hours
DROP POLICY IF EXISTS "Working hours are public for reading" ON working_hours;
CREATE POLICY "Working hours are public for reading" ON working_hours
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artists can manage own working hours" ON working_hours;
CREATE POLICY "Artists can manage own working hours" ON working_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artist_profiles ap 
            WHERE ap.id = working_hours.artist_id AND ap.user_id = auth.uid()
        )
    );

-- Policies pour leaves
DROP POLICY IF EXISTS "Leaves are public for reading" ON leaves;
CREATE POLICY "Leaves are public for reading" ON leaves
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artists can manage own leaves" ON leaves;
CREATE POLICY "Artists can manage own leaves" ON leaves
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artist_profiles ap 
            WHERE ap.id = leaves.artist_id AND ap.user_id = auth.uid()
        )
    );

-- Policies pour services
DROP POLICY IF EXISTS "Services are public for reading" ON services;
CREATE POLICY "Services are public for reading" ON services
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Artists can manage own services" ON services;
CREATE POLICY "Artists can manage own services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM artist_profiles ap 
            WHERE ap.id = services.artist_id AND ap.user_id = auth.uid()
        )
    );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_artist_profiles_updated_at ON artist_profiles;
CREATE TRIGGER update_artist_profiles_updated_at BEFORE UPDATE ON artist_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_working_hours_updated_at ON working_hours;
CREATE TRIGGER update_working_hours_updated_at BEFORE UPDATE ON working_hours
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTAIRES
-- ============================================
COMMENT ON TABLE users IS 'Utilisateurs de la plateforme (liés à auth.users de Supabase)';
COMMENT ON TABLE artist_profiles IS 'Profils des tatoueurs (liés à users)';
COMMENT ON TABLE working_hours IS 'Horaires de travail récurrents par jour de la semaine';
COMMENT ON TABLE leaves IS 'Jours de congés/absences des artistes';
COMMENT ON TABLE services IS 'Services proposés par les artistes (remplace flashs)';
COMMENT ON COLUMN bookings.status IS 'Statut de la réservation (PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED)';

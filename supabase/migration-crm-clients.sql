-- ============================================
-- CRM Clients - Migration InkFlow
-- Tables: clients, client_photos
-- ============================================

-- TABLE: clients (fiches clients CRM par artiste)
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    email TEXT NOT NULL,
    telephone TEXT,
    date_naissance DATE,
    allergies TEXT[] DEFAULT '{}',
    notes TEXT,
    consentement_signe BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    dernier_rdv TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_artist_id ON clients(artist_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_nom_prenom ON clients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_clients_tags ON clients USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clients_dernier_rdv ON clients(dernier_rdv DESC NULLS LAST);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TABLE: client_photos (photos de référence et réalisations)
CREATE TABLE IF NOT EXISTS client_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('reference', 'realisation')),
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_photos_client_id ON client_photos(client_id);

-- RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artists can view own clients" ON clients;
DROP POLICY IF EXISTS "Artists can insert own clients" ON clients;
DROP POLICY IF EXISTS "Artists can update own clients" ON clients;
DROP POLICY IF EXISTS "Artists can delete own clients" ON clients;

CREATE POLICY "Artists can view own clients" ON clients FOR SELECT
    USING (artist_id = auth.uid());

CREATE POLICY "Artists can insert own clients" ON clients FOR INSERT
    WITH CHECK (artist_id = auth.uid());

CREATE POLICY "Artists can update own clients" ON clients FOR UPDATE
    USING (artist_id = auth.uid());

CREATE POLICY "Artists can delete own clients" ON clients FOR DELETE
    USING (artist_id = auth.uid());

DROP POLICY IF EXISTS "Artists can view own client photos" ON client_photos;
DROP POLICY IF EXISTS "Artists can insert own client photos" ON client_photos;
DROP POLICY IF EXISTS "Artists can update own client photos" ON client_photos;
DROP POLICY IF EXISTS "Artists can delete own client photos" ON client_photos;

CREATE POLICY "Artists can view own client photos" ON client_photos FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM clients c WHERE c.id = client_photos.client_id AND c.artist_id = auth.uid()
    ));

CREATE POLICY "Artists can insert own client photos" ON client_photos FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM clients c WHERE c.id = client_photos.client_id AND c.artist_id = auth.uid()
    ));

CREATE POLICY "Artists can update own client photos" ON client_photos FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM clients c WHERE c.id = client_photos.client_id AND c.artist_id = auth.uid()
    ));

CREATE POLICY "Artists can delete own client photos" ON client_photos FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM clients c WHERE c.id = client_photos.client_id AND c.artist_id = auth.uid()
    ));

-- Bucket client-photos (stockage images CRM)
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Storage client-photos
DROP POLICY IF EXISTS "Client photos are publicly accessible" ON storage.objects;
CREATE POLICY "Client photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Artists can upload client photos" ON storage.objects;
CREATE POLICY "Artists can upload client photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'client-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Artists can update own client photos storage" ON storage.objects;
CREATE POLICY "Artists can update own client photos storage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'client-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Artists can delete own client photos storage" ON storage.objects;
CREATE POLICY "Artists can delete own client photos storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'client-photos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

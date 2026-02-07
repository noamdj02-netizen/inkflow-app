-- ============================================
-- Tables: availability (horaires récurrents) et blocked_slots (créneaux bloqués)
-- Alignées sur le schéma Prisma / système de réservation Inkflow
-- ============================================

-- Type pour le blocage (congés, pause, événement, personnel)
DO $$ BEGIN
  CREATE TYPE block_type AS ENUM ('vacation', 'break', 'event', 'personal');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLE: availability
-- Horaires de travail récurrents par jour de la semaine (0 = Dimanche, 1 = Lundi ... 6 = Samedi)
-- ============================================
CREATE TABLE IF NOT EXISTS availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,

  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_hour INTEGER NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  start_minute INTEGER NOT NULL DEFAULT 0 CHECK (start_minute >= 0 AND start_minute <= 59),
  end_hour INTEGER NOT NULL CHECK (end_hour >= 0 AND end_hour <= 23),
  end_minute INTEGER NOT NULL DEFAULT 0 CHECK (end_minute >= 0 AND end_minute <= 59),

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT availability_end_after_start CHECK (end_hour > start_hour OR (end_hour = start_hour AND end_minute > start_minute))
);

CREATE INDEX IF NOT EXISTS idx_availability_artist_day ON availability(artist_id, day_of_week);
CREATE UNIQUE INDEX IF NOT EXISTS idx_availability_artist_day_start ON availability(artist_id, day_of_week, start_hour);

-- ============================================
-- TABLE: blocked_slots
-- Créneaux bloqués (congés, pause déjeuner, événements)
-- ============================================
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,

  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,

  reason TEXT,
  type block_type DEFAULT 'vacation',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT blocked_slots_end_after_start CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_artist_start ON blocked_slots(artist_id, start_date);

-- RLS (lecture publique pour créneaux, écriture réservée aux artistes propriétaires)
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

-- Lecture : tout le monde peut voir les dispos d'un artiste (pour la page booking)
CREATE POLICY "availability_select_all" ON availability FOR SELECT USING (true);

-- Écriture : seul l'artiste propriétaire
CREATE POLICY "availability_insert_own" ON availability FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "availability_update_own" ON availability FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "availability_delete_own" ON availability FOR DELETE USING (auth.uid() = artist_id);

CREATE POLICY "blocked_slots_select_all" ON blocked_slots FOR SELECT USING (true);
CREATE POLICY "blocked_slots_insert_own" ON blocked_slots FOR INSERT WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "blocked_slots_update_own" ON blocked_slots FOR UPDATE USING (auth.uid() = artist_id);
CREATE POLICY "blocked_slots_delete_own" ON blocked_slots FOR DELETE USING (auth.uid() = artist_id);

-- Note: Dans ce projet artists.id = auth.uid(), donc les policies "own" sont correctes.

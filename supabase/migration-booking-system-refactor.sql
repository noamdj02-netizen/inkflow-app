-- ============================================
-- Migration: Refonte système de réservation
-- Améliorations pour logique de planning robuste et transactions atomiques
-- ============================================

-- 1. Ajouter index composite pour performance sur vérification disponibilité
CREATE INDEX IF NOT EXISTS idx_bookings_artist_date_status 
ON bookings(artist_id, date_debut, date_fin, statut_booking) 
WHERE statut_booking IN ('pending', 'confirmed');

-- 2. Index pour recherche rapide par statut paiement
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status 
ON bookings(statut_paiement, statut_booking) 
WHERE statut_paiement = 'pending' AND statut_booking = 'pending';

-- 3. Index pour blocked_slots (déjà créé mais on s'assure qu'il existe)
CREATE INDEX IF NOT EXISTS idx_blocked_slots_artist_range 
ON blocked_slots(artist_id, start_date, end_date);

-- ============================================
-- Fonction SQL: getAvailableSlots()
-- Calcule les créneaux disponibles pour un artiste sur une période donnée
-- Prend en compte: horaires d'ouverture, créneaux bloqués, réservations existantes, durée du service
-- ============================================

-- Supprimer l'ancienne fonction si elle existe (signature différente)
DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_available_slots(
    p_artist_id UUID,
    p_date_start DATE,
    p_date_end DATE,
    p_service_duration_minutes INTEGER DEFAULT 60,
    p_slot_interval_minutes INTEGER DEFAULT 30
)
RETURNS TABLE (
    slot_start TIMESTAMP WITH TIME ZONE,
    slot_end TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_date DATE;
    v_slot_start TIMESTAMP WITH TIME ZONE;
    v_slot_end TIMESTAMP WITH TIME ZONE;
    v_day_of_week INTEGER;
    v_has_availability BOOLEAN;
    v_has_blocked BOOLEAN;
    v_has_booking BOOLEAN;
    v_opening_start TIME;
    v_opening_end TIME;
    v_current_slot TIMESTAMP WITH TIME ZONE;
    v_avail_record RECORD;
BEGIN
    -- Parcourir chaque jour de la période
    v_current_date := p_date_start;
    
    WHILE v_current_date <= p_date_end LOOP
        v_day_of_week := EXTRACT(DOW FROM v_current_date); -- 0 = Dimanche, 6 = Samedi
        
        -- Vérifier si l'artiste a des horaires d'ouverture ce jour
        SELECT EXISTS(
            SELECT 1 FROM availability
            WHERE artist_id = p_artist_id
              AND day_of_week = v_day_of_week
              AND is_active = true
        ) INTO v_has_availability;
        
        -- Si pas d'horaires définis, passer au jour suivant
        IF NOT v_has_availability THEN
            v_current_date := v_current_date + INTERVAL '1 day';
            CONTINUE;
        END IF;
        
        -- Pour chaque plage horaire d'ouverture ce jour
        FOR v_avail_record IN 
            SELECT 
                MAKE_TIME(a.start_hour, a.start_minute, 0) as start_time,
                MAKE_TIME(a.end_hour, a.end_minute, 0) as end_time
            FROM availability a
            WHERE a.artist_id = p_artist_id
              AND a.day_of_week = v_day_of_week
              AND a.is_active = true
            ORDER BY a.start_hour, a.start_minute
        LOOP
            v_opening_start := v_avail_record.start_time;
            v_opening_end := v_avail_record.end_time;
            
            -- Générer tous les créneaux possibles dans cette plage horaire
            v_current_slot := (v_current_date + v_opening_start)::TIMESTAMP WITH TIME ZONE;
            
            WHILE (v_current_slot + (p_service_duration_minutes || ' minutes')::INTERVAL)::TIME <= v_opening_end LOOP
                v_slot_start := v_current_slot;
                v_slot_end := v_slot_start + (p_service_duration_minutes || ' minutes')::INTERVAL;
                
                -- Vérifier si le créneau est bloqué (blocked_slots)
                SELECT EXISTS(
                    SELECT 1 FROM blocked_slots bs
                    WHERE bs.artist_id = p_artist_id
                      AND bs.start_date <= v_slot_end
                      AND bs.end_date >= v_slot_start
                ) INTO v_has_blocked;
                
                IF NOT v_has_blocked THEN
                    -- Vérifier si le créneau chevauche une réservation existante (pending ou confirmed)
                    SELECT EXISTS(
                        SELECT 1 FROM bookings b
                        WHERE b.artist_id = p_artist_id
                          AND b.statut_booking IN ('pending', 'confirmed')
                          AND b.date_debut < v_slot_end
                          AND b.date_fin > v_slot_start
                    ) INTO v_has_booking;
                    
                    IF NOT v_has_booking THEN
                        -- Créneau disponible
                        RETURN QUERY SELECT v_slot_start, v_slot_end, true;
                    ELSE
                        -- Créneau occupé
                        RETURN QUERY SELECT v_slot_start, v_slot_end, false;
                    END IF;
                ELSE
                    -- Créneau bloqué
                    RETURN QUERY SELECT v_slot_start, v_slot_end, false;
                END IF;
                
                -- Passer au créneau suivant (p_slot_interval_minutes)
                v_current_slot := v_current_slot + (p_slot_interval_minutes || ' minutes')::INTERVAL;
            END LOOP;
        END LOOP;
        
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    
    RETURN;
END;
$$;

COMMENT ON FUNCTION get_available_slots IS 'Calcule les créneaux disponibles pour un artiste en tenant compte des horaires, créneaux bloqués et réservations existantes';

-- ============================================
-- Fonction SQL: check_slot_availability_atomic()
-- Vérifie la disponibilité d'un créneau spécifique de manière atomique (pour éviter race conditions)
-- Utilisée dans une transaction juste avant l'insertion
-- ============================================
CREATE OR REPLACE FUNCTION check_slot_availability_atomic(
    p_artist_id UUID,
    p_date_debut TIMESTAMP WITH TIME ZONE,
    p_date_fin TIMESTAMP WITH TIME ZONE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_has_overlap BOOLEAN;
    v_has_blocked BOOLEAN;
    v_day_of_week INTEGER;
    v_time_start TIME;
    v_time_end TIME;
    v_has_availability BOOLEAN;
BEGIN
    -- Vérifier les chevauchements avec les réservations existantes
    SELECT EXISTS(
        SELECT 1 FROM bookings b
        WHERE b.artist_id = p_artist_id
          AND b.statut_booking IN ('pending', 'confirmed')
          AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
          AND b.date_debut < p_date_fin
          AND b.date_fin > p_date_debut
    ) INTO v_has_overlap;
    
    IF v_has_overlap THEN
        RETURN false;
    END IF;
    
    -- Vérifier si le créneau est dans un blocked_slot
    SELECT EXISTS(
        SELECT 1 FROM blocked_slots bs
        WHERE bs.artist_id = p_artist_id
          AND bs.start_date <= p_date_fin
          AND bs.end_date >= p_date_debut
    ) INTO v_has_blocked;
    
    IF v_has_blocked THEN
        RETURN false;
    END IF;
    
    -- Vérifier que le créneau est dans les horaires d'ouverture
    v_day_of_week := EXTRACT(DOW FROM p_date_debut);
    v_time_start := p_date_debut::TIME;
    v_time_end := p_date_fin::TIME;
    
    SELECT EXISTS(
        SELECT 1 FROM availability a
        WHERE a.artist_id = p_artist_id
          AND a.day_of_week = v_day_of_week
          AND a.is_active = true
          AND MAKE_TIME(a.start_hour, a.start_minute, 0) <= v_time_start
          AND MAKE_TIME(a.end_hour, a.end_minute, 0) >= v_time_end
    ) INTO v_has_availability;
    
    IF NOT v_has_availability THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

COMMENT ON FUNCTION check_slot_availability_atomic IS 'Vérifie atomiquement la disponibilité d un créneau spécifique (utilisé dans transaction avant INSERT)';

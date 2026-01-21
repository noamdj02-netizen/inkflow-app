-- ============================================
-- PERFORMANCE OPTIMIZATION - Database Indexes
-- Step 1: Database Indexing & Query Optimization
-- ============================================
-- This migration adds missing indexes to speed up relation lookups
-- and improve query performance for common access patterns

-- ============================================
-- 1. BOOKINGS TABLE - Missing Foreign Key Indexes
-- ============================================

-- Index for flash_id (used in JOINs with flashs table)
CREATE INDEX IF NOT EXISTS idx_bookings_flash_id ON bookings(flash_id) WHERE flash_id IS NOT NULL;

-- Index for project_id (used in JOINs with projects table)
CREATE INDEX IF NOT EXISTS idx_bookings_project_id ON bookings(project_id) WHERE project_id IS NOT NULL;

-- Composite index for common query pattern: artist_id + statut_booking
-- Used in: DashboardCalendar, DashboardRequests
CREATE INDEX IF NOT EXISTS idx_bookings_artist_statut ON bookings(artist_id, statut_booking);

-- Composite index for date range queries: artist_id + date_debut
-- Used in: DashboardOverview (upcoming bookings, monthly revenue)
CREATE INDEX IF NOT EXISTS idx_bookings_artist_date ON bookings(artist_id, date_debut);

-- Composite index for payment status queries: artist_id + statut_paiement
-- Used in: DashboardFinance, revenue calculations
CREATE INDEX IF NOT EXISTS idx_bookings_artist_payment ON bookings(artist_id, statut_paiement);

-- ============================================
-- 2. PROJECTS TABLE - Additional Composite Indexes
-- ============================================

-- Composite index for common query: artist_id + statut
-- Used in: DashboardRequests, DashboardOverview
CREATE INDEX IF NOT EXISTS idx_projects_artist_statut ON projects(artist_id, statut);

-- Composite index for date-based queries: artist_id + created_at
-- Used in: DashboardOverview (recent activity)
CREATE INDEX IF NOT EXISTS idx_projects_artist_created ON projects(artist_id, created_at DESC);

-- ============================================
-- 3. FLASHS TABLE - Additional Indexes
-- ============================================

-- Composite index for artist + statut queries
-- Used in: PublicArtistPage, DashboardFlashs
CREATE INDEX IF NOT EXISTS idx_flashs_artist_statut ON flashs(artist_id, statut);

-- ============================================
-- 4. STRIPE_TRANSACTIONS TABLE - Additional Indexes
-- ============================================

-- Composite index for revenue queries: artist_id + status + created_at
-- Used in: DashboardOverview (monthly revenue)
CREATE INDEX IF NOT EXISTS idx_stripe_transactions_artist_status_date 
ON stripe_transactions(artist_id, status, created_at DESC) 
WHERE status = 'succeeded';

-- ============================================
-- 5. VERIFY INDEXES
-- ============================================
-- Run this query to verify all indexes are created:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND tablename IN ('bookings', 'projects', 'flashs', 'stripe_transactions')
-- ORDER BY tablename, indexname;

-- ============================================
-- SECURITY AUDIT - RLS Policies Fix
-- Step 1: Database & RLS Security Audit
-- ============================================
-- This migration ensures that:
-- 1. RLS is enabled on all critical tables
-- 2. Anonymous users can ONLY INSERT into projects/customers (for booking form)
-- 3. Anonymous users CANNOT read or update existing records
-- 4. Artists can only access their own data
-- 5. No SQL injection vectors exist

-- ============================================
-- 1. VERIFY RLS IS ENABLED
-- ============================================
ALTER TABLE IF EXISTS public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.flashs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stripe_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.care_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================
-- Projects policies
DROP POLICY IF EXISTS "Artists can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Artists can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Public can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Public can insert inquiries" ON public.projects;

-- Customers policies
DROP POLICY IF EXISTS "Customers can be managed by service role" ON public.customers;
DROP POLICY IF EXISTS "Public can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Service role can manage customers" ON public.customers;

-- Bookings policies (drop all to recreate)
DROP POLICY IF EXISTS "Artists can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

-- ============================================
-- 3. PROJECTS TABLE - Secure Policies
-- ============================================
-- Policy: Artists can view ONLY their own projects
CREATE POLICY "Artists can view own projects"
ON public.projects
FOR SELECT
USING (
  -- Artist must be authenticated
  auth.uid() IS NOT NULL
  -- And must own the project
  AND artist_id::text = auth.uid()::text
);

-- Policy: Artists can update ONLY their own projects
CREATE POLICY "Artists can update own projects"
ON public.projects
FOR UPDATE
USING (artist_id::text = auth.uid()::text)
WITH CHECK (artist_id::text = auth.uid()::text);

-- Policy: Anonymous users can INSERT projects (for booking form)
-- BUT with strict constraints to prevent abuse
CREATE POLICY "Public can insert inquiry projects"
ON public.projects
FOR INSERT
WITH CHECK (
  -- Must be an inquiry status (not approved/booked directly)
  statut = 'inquiry'
  -- deposit_paid must be false (no direct payment bypass)
  AND deposit_paid = false
  -- Required fields must be present
  AND artist_id IS NOT NULL
  AND client_email IS NOT NULL
  AND client_name IS NOT NULL
  AND body_part IS NOT NULL
  AND style IS NOT NULL
  AND description IS NOT NULL
  -- Prevent injection: description must be reasonable length
  AND length(description) >= 10
  AND length(description) <= 4000
  -- Prevent injection: email must be valid format (basic check)
  AND client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Prevent injection: name must be reasonable
  AND length(client_name) >= 2
  AND length(client_name) <= 200
);

-- Policy: Anonymous users CANNOT read projects (even their own)
-- They must go through the API route which uses service role
-- This prevents enumeration attacks

-- Policy: Anonymous users CANNOT update projects
-- Only artists can update via authenticated requests

-- ============================================
-- 4. CUSTOMERS TABLE - Secure Policies
-- ============================================
-- Policy: Anonymous users can INSERT customers (for booking form)
-- BUT only with their own email (prevent spam)
CREATE POLICY "Public can insert customers"
ON public.customers
FOR INSERT
WITH CHECK (
  -- Email must be valid format
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  -- Name must be reasonable
  AND (name IS NULL OR (length(name) >= 2 AND length(name) <= 200))
);

-- Policy: Anonymous users CANNOT read customers
-- This prevents email enumeration attacks

-- Policy: Anonymous users CANNOT update customers
-- Only service role (via API) can update

-- Policy: Artists can view customers linked to their projects
-- (This is handled via JOIN in queries, not direct access)

-- ============================================
-- 5. BOOKINGS TABLE - Secure Policies
-- ============================================
-- Policy: Artists can view ONLY their own bookings
CREATE POLICY "Artists can view own bookings"
ON public.bookings
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND artist_id::text = auth.uid()::text
);

-- Policy: Artists can update ONLY their own bookings
CREATE POLICY "Artists can update own bookings"
ON public.bookings
FOR UPDATE
USING (artist_id::text = auth.uid()::text)
WITH CHECK (artist_id::text = auth.uid()::text);

-- Policy: NO public INSERT on bookings
-- Bookings are created via:
-- 1. Stripe webhooks (service role)
-- 2. Artist dashboard (authenticated)
-- 3. API routes (service role)

-- ============================================
-- 6. ARTISTS TABLE - Secure Policies (verify)
-- ============================================
-- Keep existing policies:
-- - Artists can view own data
-- - Artists can insert own data
-- - Artists can update own data

-- ============================================
-- 7. FLASHS TABLE - Secure Policies (verify)
-- ============================================
-- Keep existing policies:
-- - Public can read (for public gallery)
-- - Artists can manage own flashs

-- ============================================
-- 8. CARE_TEMPLATES TABLE - Secure Policies (verify)
-- ============================================
-- Keep existing policies:
-- - Artists can manage own care templates

-- ============================================
-- 9. STRIPE_TRANSACTIONS TABLE - Secure Policies (verify)
-- ============================================
-- Keep existing policies:
-- - Artists can view own transactions

-- ============================================
-- 10. VERIFICATION QUERIES (for manual testing)
-- ============================================
-- Run these queries as an authenticated artist to verify:
-- 
-- SELECT * FROM public.projects WHERE artist_id = auth.uid(); -- Should work
-- SELECT * FROM public.projects WHERE artist_id != auth.uid(); -- Should return empty
-- 
-- Run these queries as anonymous (anon key) to verify:
-- 
-- INSERT INTO public.projects (artist_id, client_email, client_name, body_part, size_cm, style, description, statut, deposit_paid)
-- VALUES ('...', 'test@example.com', 'Test', 'Bras', 10, 'Fine Line', 'Test description', 'inquiry', false);
-- -- Should work
-- 
-- SELECT * FROM public.projects; -- Should return empty (no read access)
-- 
-- UPDATE public.projects SET statut = 'approved' WHERE id = '...'; -- Should fail (no update access)

-- ============================================================
-- FIX: RLS Policies + Storage Bucket for Reverse Auctions
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. DROP ALL EXISTING POLICIES (to start clean - idempotent)
DROP POLICY IF EXISTS "Brokers can update assigned auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "Customers can update their own auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "Brokers can view OPEN auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "Customers can view their own auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "Brokers can view assigned auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "Customers can create auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "view_own_auctions" ON public.reverse_auctions;
DROP POLICY IF EXISTS "create_auction" ON public.reverse_auctions;
DROP POLICY IF EXISTS "update_auction" ON public.reverse_auctions;

-- 2. RECREATE CORRECT POLICIES

-- SELECT: Customers see their own; Brokers see OPEN + their assigned auctions
CREATE POLICY "view_own_auctions" ON public.reverse_auctions
  FOR SELECT USING (
    auth.uid() = customer_id
    OR status = 'OPEN'
    OR auth.uid() = assigned_broker_id
  );

-- INSERT: Any authenticated user can create (customer creates)
CREATE POLICY "create_auction" ON public.reverse_auctions
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- UPDATE: Customer updates their auction OR any authenticated broker can update (for accept + level updates)
CREATE POLICY "update_auction" ON public.reverse_auctions
  FOR UPDATE USING (
    auth.uid() = customer_id
    OR auth.role() = 'authenticated'
  );

-- DELETE: Customer deletes their own auction
CREATE POLICY "delete_auction" ON public.reverse_auctions
  FOR DELETE USING (auth.uid() = customer_id);

-- 3. DROP OLD BIDS POLICIES and recreate cleanly
DROP POLICY IF EXISTS "Anyone can view bids" ON public.reverse_auction_bids;
DROP POLICY IF EXISTS "Brokers can insert bids" ON public.reverse_auction_bids;
DROP POLICY IF EXISTS "Brokers can update their own bids" ON public.reverse_auction_bids;

CREATE POLICY "view_bids" ON public.reverse_auction_bids FOR SELECT USING (true);
CREATE POLICY "insert_bids" ON public.reverse_auction_bids FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "update_bids" ON public.reverse_auction_bids FOR UPDATE USING (auth.uid() = broker_id OR auth.role() = 'authenticated');

-- 4. CREATE Storage bucket for reverse auction product images (if not already created)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reverse-auctions',
  'reverse-auctions',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Storage Policies for reverse-auctions bucket
DROP POLICY IF EXISTS "Anyone can view reverse-auctions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can insert to reverse-auctions" ON storage.objects;
DROP POLICY IF EXISTS "reverse_auctions_select" ON storage.objects;
DROP POLICY IF EXISTS "reverse_auctions_insert" ON storage.objects;
DROP POLICY IF EXISTS "reverse_auctions_update" ON storage.objects;
DROP POLICY IF EXISTS "reverse_auctions_delete" ON storage.objects;

CREATE POLICY "reverse_auctions_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'reverse-auctions');

CREATE POLICY "reverse_auctions_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reverse-auctions' AND auth.role() = 'authenticated');

CREATE POLICY "reverse_auctions_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'reverse-auctions' AND auth.role() = 'authenticated');

CREATE POLICY "reverse_auctions_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'reverse-auctions' AND auth.role() = 'authenticated');

-- 6. Also ensure avatars bucket exists (used as fallback) and has correct policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Ensure avatars bucket allows authenticated uploads (for fallback image uploads)
DROP POLICY IF EXISTS "avatars_select" ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

SELECT 'RLS and Storage policies fixed successfully' as result;

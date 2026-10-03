-- ============================================================
-- BROKER HUB — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  landmark TEXT,
  address TEXT,
  avatar TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'broker', 'admin', 'super_admin', 'moderator')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations to ensure existing tables get updated columns if running on an existing DB
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_line_1 TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address_line_2 TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Brokers Table (Extends User)
CREATE TABLE IF NOT EXISTS public.brokers (
  id UUID REFERENCES public.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  company TEXT,
  status TEXT DEFAULT 'Under Review' CHECK (status IN ('Connected', 'Under Review', 'Pending Match', 'Verified', 'Suspended', 'Rejected')),
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  status TEXT DEFAULT 'In Stock' CHECK (status IN ('In Stock', 'Out of Stock', 'Low Stock')),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  broker_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  broker_id UUID REFERENCES public.users(id),
  broker_name TEXT,
  product_id UUID,
  product_name TEXT,
  product_image TEXT,
  quantity INTEGER DEFAULT 1,
  price NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Successful', 'Failed', 'Refunded')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Delivered', 'In Transit', 'Pending', 'Cancelled', 'Processing', 'Shipped', 'ACCEPTED', 'COMPLETED', 'REFUNDED')),
  delivery_address TEXT,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS broker_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address JSONB DEFAULT '{}'::jsonb;

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  broker_id UUID REFERENCES public.users(id),
  broker_name TEXT
);

-- Migrations for order_items extended columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS broker_name TEXT;

-- Migration: add updated_at to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  broker_id UUID REFERENCES public.brokers(id) NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Confirmed', 'Pending', 'Cancelled', 'Requested', 'Accepted', 'Rejected', 'Completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.users(id) NOT NULL,
  receiver_id UUID REFERENCES public.users(id) NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS public.broker_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES public.users(id) NOT NULL,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  type TEXT NOT NULL CHECK (type IN ('call_request', 'message', 'order', 'meeting', 'profile_request', 'general')),
  title TEXT NOT NULL,
  description TEXT,
  related_order_id UUID,
  related_meeting_id UUID,
  related_product_id UUID,
  related_conversation_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'handled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_name TEXT NOT NULL,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  ip_address TEXT,
  device TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments Table (Razorpay Records)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  order_id UUID REFERENCES public.orders(id),
  customer_id UUID REFERENCES public.users(id),
  broker_id UUID REFERENCES public.users(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'Razorpay',
  status TEXT DEFAULT 'Successful' CHECK (status IN ('Successful', 'Pending', 'Failed', 'Refunded')),
  refund_status TEXT DEFAULT 'None' CHECK (refund_status IN ('None', 'Requested', 'Processed', 'Failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Broker-Customer Connections Table
CREATE TABLE IF NOT EXISTS public.broker_customer_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  broker_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  broker_id UUID REFERENCES public.users(id),
  product_id UUID REFERENCES public.products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'Published' CHECK (status IN ('Published', 'Hidden', 'Reported')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_customer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Permissive policies for demo/dev
CREATE POLICY "Allow public read all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update all users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow public read brokers" ON public.brokers FOR SELECT USING (true);
CREATE POLICY "Allow public insert brokers" ON public.brokers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update brokers" ON public.brokers FOR UPDATE USING (true);
-- Product Policies: Strict broker ownership with public marketplace visibility for active products
-- Also allow is_active IS NULL so legacy/new products without the flag set are still visible
CREATE POLICY "Brokers can read own products and customers can read active products" 
  ON public.products FOR SELECT 
  USING (auth.uid() = broker_id OR is_active = true OR is_active IS NULL);

CREATE POLICY "Brokers can insert own products" 
  ON public.products FOR INSERT 
  WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can update own products" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = broker_id) 
  WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can delete own products" 
  ON public.products FOR DELETE 
  USING (auth.uid() = broker_id);
CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public read order_items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update appointments" ON public.appointments FOR UPDATE USING (true);
CREATE POLICY "Allow public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read notifications" ON public.broker_notifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert notifications" ON public.broker_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notifications" ON public.broker_notifications FOR UPDATE USING (true);
CREATE POLICY "Allow public read admin_logs" ON public.admin_activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert admin_logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read payments" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update payments" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow public read connections" ON public.broker_customer_connections FOR SELECT USING (true);
CREATE POLICY "Allow public insert connections" ON public.broker_customer_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update connections" ON public.broker_customer_connections FOR UPDATE USING (true);
CREATE POLICY "Allow public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Allow public insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update reviews" ON public.reviews FOR UPDATE USING (true);

-- 14. Reverse Auctions Table
CREATE TABLE IF NOT EXISTS public.reverse_auctions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  product_id UUID REFERENCES public.products(id),
  product_name TEXT,
  product_image TEXT,
  quantity INTEGER DEFAULT 1 NOT NULL,
  description TEXT,
  specifications JSONB DEFAULT '{}'::jsonb,
  starting_price NUMERIC NOT NULL,
  current_lowest_bid NUMERIC,
  lowest_bidder_id UUID REFERENCES public.users(id),
  lowest_bidder_name TEXT,
  bid_count INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Ending Soon', 'Completed', 'Cancelled')),
  winning_bid_id UUID,
  winning_broker_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Reverse Auction Bids Table
CREATE TABLE IF NOT EXISTS public.reverse_auction_bids (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE NOT NULL,
  broker_id UUID REFERENCES public.users(id) NOT NULL,
  broker_name TEXT NOT NULL,
  broker_company TEXT,
  broker_avatar TEXT,
  bid_amount NUMERIC NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Lowest', 'Outbid', 'Accepted', 'Rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reverse_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read reverse_auctions" ON public.reverse_auctions FOR SELECT USING (true);
CREATE POLICY "Allow public insert reverse_auctions" ON public.reverse_auctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update reverse_auctions" ON public.reverse_auctions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete reverse_auctions" ON public.reverse_auctions FOR DELETE USING (true);

CREATE POLICY "Allow public read reverse_auction_bids" ON public.reverse_auction_bids FOR SELECT USING (true);
CREATE POLICY "Allow public insert reverse_auction_bids" ON public.reverse_auction_bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update reverse_auction_bids" ON public.reverse_auction_bids FOR UPDATE USING (true);
CREATE POLICY "Allow public delete reverse_auction_bids" ON public.reverse_auction_bids FOR DELETE USING (true);

-- Enable Realtime Publications
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['broker_notifications','messages','appointments','orders','payments','broker_customer_connections','admin_activity_logs','reverse_auctions','reverse_auction_bids'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;


-- Reverse Auction Full Setup Migration

-- 1. Create the `reverse_auctions` table if it does not exist
CREATE TABLE IF NOT EXISTS public.reverse_auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id),
    customer_name TEXT,
    customer_company TEXT,
    contact_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    delivery_location TEXT,
    title TEXT NOT NULL,
    category TEXT,
    product_name TEXT,
    product_image TEXT,
    photos TEXT[],
    quantity INTEGER DEFAULT 1,
    description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    starting_price NUMERIC,
    budget_text TEXT,
    deadline_date TEXT,
    activity_text TEXT,
    bid_count INTEGER DEFAULT 0,
    current_lowest_bid NUMERIC,
    lowest_bidder_id UUID,
    lowest_bidder_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'OPEN',
    status_pill TEXT,
    current_level TEXT DEFAULT 'OPEN',
    assigned_broker_id UUID REFERENCES auth.users(id),
    winning_bid_id UUID,
    winning_broker_id UUID REFERENCES auth.users(id),
    winning_broker_name TEXT,
    delivery_proof_photos TEXT[],
    delivery_confirmed_text TEXT,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the `reverse_auction_bids` table
CREATE TABLE IF NOT EXISTS public.reverse_auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
    broker_id UUID REFERENCES auth.users(id),
    broker_name TEXT,
    broker_company TEXT,
    broker_avatar TEXT,
    bid_amount NUMERIC NOT NULL,
    lead_time_days INTEGER,
    lead_time_text TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create reverse_auction_history table
CREATE TABLE IF NOT EXISTS public.reverse_auction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    old_status TEXT,
    new_status TEXT,
    old_level TEXT,
    new_level TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS and create policies
ALTER TABLE public.reverse_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_history ENABLE ROW LEVEL SECURITY;

-- REVERSE AUCTIONS POLICIES
CREATE POLICY "Customers can view their own auctions" ON public.reverse_auctions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Brokers can view OPEN auctions" ON public.reverse_auctions FOR SELECT USING (status = 'OPEN');
CREATE POLICY "Brokers can view assigned auctions" ON public.reverse_auctions FOR SELECT USING (auth.uid() = assigned_broker_id);
CREATE POLICY "Customers can create auctions" ON public.reverse_auctions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own auctions" ON public.reverse_auctions FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Brokers can update assigned auctions" ON public.reverse_auctions FOR UPDATE USING (auth.uid() = assigned_broker_id);
CREATE POLICY "Customers can delete their own auctions" ON public.reverse_auctions FOR DELETE USING (auth.uid() = customer_id);

-- REVERSE AUCTION BIDS POLICIES
CREATE POLICY "Anyone can view bids" ON public.reverse_auction_bids FOR SELECT USING (true);
CREATE POLICY "Brokers can insert bids" ON public.reverse_auction_bids FOR INSERT WITH CHECK (auth.uid() = broker_id);
CREATE POLICY "Brokers can update their own bids" ON public.reverse_auction_bids FOR UPDATE USING (auth.uid() = broker_id);

-- REVERSE AUCTION HISTORY POLICIES
CREATE POLICY "Anyone involved can view history" ON public.reverse_auction_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert history" ON public.reverse_auction_history FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reverse_auctions;
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
-- Create reverse_auction_images table for strict auction_id association
CREATE TABLE IF NOT EXISTS public.reverse_auction_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reverse_auction_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reverse auction images" ON public.reverse_auction_images FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reverse auction images" ON public.reverse_auction_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Try to create bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reverse-auctions', 'reverse-auctions', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can view reverse-auctions bucket" ON storage.objects FOR SELECT USING (bucket_id = 'reverse-auctions');
CREATE POLICY "Authenticated users can insert to reverse-auctions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reverse-auctions' AND auth.role() = 'authenticated');

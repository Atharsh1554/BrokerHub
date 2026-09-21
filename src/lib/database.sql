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
  avatar TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'broker', 'admin', 'super_admin', 'moderator')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  total_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Successful', 'Failed', 'Refunded')),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Delivered', 'In Transit', 'Pending', 'Cancelled', 'Processing', 'Shipped', 'ACCEPTED', 'COMPLETED', 'REFUNDED')),
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL
);

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
CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
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

-- Enable Realtime Publications
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['broker_notifications','messages','appointments','orders','payments','broker_customer_connections','admin_activity_logs'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;


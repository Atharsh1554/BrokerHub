-- ============================================================
-- BROKERHUB: PRODUCTS TABLE SCHEMA & REALTIME MIGRATION
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Ensure columns exist on public.products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS broker_name TEXT;

-- 2. Ensure RLS policies are up-to-date and allow active products to be viewed by customers & public
DROP POLICY IF EXISTS "Brokers can read own products and customers can read active products" ON public.products;
DROP POLICY IF EXISTS "Brokers can insert own products" ON public.products;
DROP POLICY IF EXISTS "Brokers can update own products" ON public.products;
DROP POLICY IF EXISTS "Brokers can delete own products" ON public.products;

-- SELECT policy: Active products are readable by everyone (customers and public visitors),
-- and brokers can read their own products (even inactive ones).
CREATE POLICY "Brokers can read own products and customers can read active products" 
  ON public.products FOR SELECT 
  USING (auth.uid() = broker_id OR is_active = true OR is_active IS NULL);

-- INSERT policy: Authenticated brokers can insert their own products
CREATE POLICY "Brokers can insert own products" 
  ON public.products FOR INSERT 
  WITH CHECK (auth.uid() = broker_id);

-- UPDATE policy: Authenticated brokers can update their own products
CREATE POLICY "Brokers can update own products" 
  ON public.products FOR UPDATE 
  USING (auth.uid() = broker_id) 
  WITH CHECK (auth.uid() = broker_id);

-- DELETE policy: Authenticated brokers can delete their own products
CREATE POLICY "Brokers can delete own products" 
  ON public.products FOR DELETE 
  USING (auth.uid() = broker_id);

-- 3. Ensure the products table is added to the Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
END $$;

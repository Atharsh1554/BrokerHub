-- ============================================================
-- BROKER HUB — FIX REVIEWS & RATINGS SCHEMA (IDEMPOTENT MIGRATION)
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================
-- 
-- PROBLEM: The reviews table was missing order_id / product_id columns,
-- preventing order-linked reviews and live ratings from synchronizing.
--
-- This script safely ensures all required columns, indexes, RLS policies,
-- and live aggregate rating triggers are present.
-- ============================================================

-- 1. Ensure reviews table exists with basic columns
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  broker_id UUID REFERENCES public.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'Published' CHECK (status IN ('Published', 'Hidden', 'Reported')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Safely add missing columns if they do not exist
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS broker_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';

-- 3. Add performance indexes for lookups
CREATE INDEX IF NOT EXISTS idx_reviews_broker_id ON public.reviews(broker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- 4. Prevent duplicate reviews for the same completed order
DROP INDEX IF EXISTS idx_reviews_order_unique;
CREATE UNIQUE INDEX idx_reviews_order_unique ON public.reviews(order_id) WHERE order_id IS NOT NULL;

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated customers can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers and admins can delete reviews" ON public.reviews;

-- Anyone can read published reviews
CREATE POLICY "Anyone can read published reviews" ON public.reviews 
  FOR SELECT USING (
    status = 'Published' OR 
    auth.uid() = customer_id OR 
    auth.uid() = broker_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator'))
  );

-- Authenticated customers can insert their own reviews
CREATE POLICY "Authenticated customers can insert own reviews" ON public.reviews 
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND 
    rating >= 1 AND 
    rating <= 5
  );

-- Customers can update their own reviews
CREATE POLICY "Customers can update own reviews" ON public.reviews 
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator'))
  );

-- Customers and admins can delete reviews
CREATE POLICY "Customers and admins can delete reviews" ON public.reviews 
  FOR DELETE USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator'))
  );

-- 6. Trigger: Automatically update broker rating & review count in brokers table
CREATE OR REPLACE FUNCTION public.update_broker_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_broker_id UUID;
  avg_val NUMERIC;
  cnt_val INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_broker_id := OLD.broker_id;
  ELSE
    target_broker_id := NEW.broker_id;
  END IF;

  IF target_broker_id IS NOT NULL THEN
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0), COUNT(*)
    INTO avg_val, cnt_val
    FROM public.reviews
    WHERE broker_id = target_broker_id AND status = 'Published';

    UPDATE public.brokers
    SET rating = avg_val, review_count = cnt_val
    WHERE id = target_broker_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_broker_rating_stats ON public.reviews;
CREATE TRIGGER trg_update_broker_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_broker_rating_stats();

-- 7. Verification output
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- ============================================================
-- BROKER HUB — LIVE REVIEWS & RATINGS MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Ensure Reviews Table has all required columns
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) NOT NULL,
  broker_id UUID REFERENCES public.users(id),
  order_id UUID REFERENCES public.orders(id),
  product_id UUID REFERENCES public.products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'Published' CHECK (status IN ('Published', 'Hidden', 'Reported')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations for existing deployments
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS broker_id UUID REFERENCES public.users(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Published';

-- 2. Foreign Keys and Performance Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_broker_id ON public.reviews(broker_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- Prevent duplicate reviews for the same completed order
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_order_unique ON public.reviews(order_id) WHERE order_id IS NOT NULL;

-- 3. Row Level Security (RLS) Configuration
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Allow public read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can read published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated customers can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers and admins can delete reviews" ON public.reviews;

-- Anyone can read published reviews (plus authors and brokers can read their own)
CREATE POLICY "Anyone can read published reviews" ON public.reviews 
  FOR SELECT USING (
    status = 'Published' OR 
    auth.uid() = customer_id OR 
    auth.uid() = broker_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator'))
  );

-- Only authenticated customers can insert reviews under their own authenticated user ID
CREATE POLICY "Authenticated customers can insert own reviews" ON public.reviews 
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id AND 
    rating >= 1 AND 
    rating <= 5
  );

-- Review authors and authorized administrators can update reviews
CREATE POLICY "Customers can update own reviews" ON public.reviews 
  FOR UPDATE USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator'))
  );

-- Review authors and administrators can delete reviews
CREATE POLICY "Customers and admins can delete reviews" ON public.reviews 
  FOR DELETE USING (
    auth.uid() = customer_id OR
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'moderator'))
  );

-- 4. Database Trigger: Automatically compute and update broker live average rating and review count
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

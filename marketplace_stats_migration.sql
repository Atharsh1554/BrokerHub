-- ============================================================
-- BROKERHUB — LIVE MARKETPLACE STATS & USER COUNT MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================
--
-- PURPOSE:
-- 1. Adds performance index on public.users(role, status) to optimize
--    live aggregate counting of registered sellers and customers.
-- 2. Provides a secure database RPC function `get_marketplace_stats`
--    that returns ONLY aggregate numbers, guaranteeing that no personal
--    names, emails, phones, or credentials can ever be exposed.
-- ============================================================

-- 1. Create composite index on users for role and status
CREATE INDEX IF NOT EXISTS idx_users_role_status 
  ON public.users (role, status);

-- 2. Secure Database RPC Function for Aggregate Stats
-- Uses SECURITY DEFINER to compute counts safely on the server side
-- and returns strictly an aggregate JSON payload.
CREATE OR REPLACE FUNCTION public.get_marketplace_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sellers_count INT;
  v_customers_count INT;
BEGIN
  -- Count verified active sellers (role = 'broker')
  SELECT COUNT(*) INTO v_sellers_count
  FROM public.users
  WHERE role = 'broker' AND (status = 'active' OR status IS NULL);

  -- Count active customers (role = 'customer')
  SELECT COUNT(*) INTO v_customers_count
  FROM public.users
  WHERE role = 'customer' AND (status = 'active' OR status IS NULL);

  RETURN json_build_object(
    'sellers_count', v_sellers_count,
    'customers_count', v_customers_count,
    'updated_at', NOW()
  )::jsonb;
END;
$$;

-- Grant execution permission to public visitors and authenticated users
GRANT EXECUTE ON FUNCTION public.get_marketplace_stats() TO anon, authenticated;

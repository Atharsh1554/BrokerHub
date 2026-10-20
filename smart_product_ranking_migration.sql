-- ============================================================
-- BROKERHUB — SMART PRODUCT RANKING & PERFORMANCE MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================
--
-- PURPOSE:
-- 1. Adds composite performance indexes to public.products to accelerate
--    active product lookups, seller-grouped queries, and timestamp sorting.
-- 2. Preserves Supabase free-tier resources by eliminating table scans.
-- 3. Provides an optional server-side smart ranking function (RPC) that
--    can execute Bayesian damping, recency decay, and seller diversity
--    directly in PostgreSQL when the product catalog scales up.
-- ============================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Add composite performance indexes on public.products
-- Accelerates discovery queries: active products ordered by newest
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON public.products (is_active, created_at DESC);

-- Accelerates broker product listings and seller diversity lookups
CREATE INDEX IF NOT EXISTS idx_products_broker_active
  ON public.products (broker_id, is_active);

-- Accelerates category-filtered browsing
CREATE INDEX IF NOT EXISTS idx_products_category_active
  ON public.products (category, is_active);

-- 3. Database-Side Smart Product Ranking Function (Optional Server RPC)
-- This function can be called via `supabase.rpc('get_smart_ranked_products', { ... })`
-- when millions of products exist, running the exact scoring formula in SQL.
CREATE OR REPLACE FUNCTION public.get_smart_ranked_products(
  p_query TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 12
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  price NUMERIC,
  image TEXT,
  category TEXT,
  stock INT,
  status TEXT,
  is_active BOOLEAN,
  description TEXT,
  broker_id UUID,
  broker_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rating NUMERIC,
  review_count INT,
  rank_score NUMERIC,
  seller_item_rank BIGINT,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_offset INT := GREATEST(0, (COALESCE(p_page, 1) - 1) * COALESCE(p_page_size, 12));
  v_limit INT := GREATEST(1, COALESCE(p_page_size, 12));
  v_clean_q TEXT := LOWER(TRIM(COALESCE(p_query, '')));
BEGIN
  RETURN QUERY
  WITH eligible_products AS (
    SELECT 
      p.id,
      p.name,
      p.price,
      p.image,
      p.category,
      COALESCE(p.stock, 0) AS stock,
      COALESCE(p.status, 'In Stock') AS status,
      COALESCE(p.is_active, TRUE) AS is_active,
      p.description,
      p.broker_id,
      COALESCE(p.broker_name, b.name, 'Verified Broker') AS broker_name,
      p.created_at,
      p.updated_at,
      COALESCE(b.rating, 0.0) AS rating,
      COALESCE(b.review_count, 0) AS review_count,
      -- Freshness score (14-day half-life decay)
      (1.0 / (1.0 + POWER(GREATEST(0.0, EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400.0) / 14.0, 1.5)))::numeric AS freshness_score,
      -- Bayesian quality score (Prior mean = 4.0, confidence weight C = 3)
      (
        CASE 
          WHEN COALESCE(b.review_count, 0) > 0 THEN
            (((3.0 * 4.0 + b.review_count * b.rating) / (3.0 + b.review_count)) - 1.0) / 4.0
          ELSE 0.50
        END
      )::numeric AS quality_score,
      -- Availability score
      (
        CASE 
          WHEN p.status = 'Out of Stock' OR COALESCE(p.stock, 0) <= 0 THEN 0.10
          WHEN p.status = 'Low Stock' OR COALESCE(p.stock, 0) < 5 THEN 0.75
          ELSE 1.00
        END
      )::numeric AS stock_score,
      -- Search relevance score
      (
        CASE 
          WHEN v_clean_q = '' THEN 1.00
          WHEN LOWER(p.name) = v_clean_q THEN 1.00
          WHEN LOWER(p.name) LIKE '%' || v_clean_q || '%' THEN 0.85
          WHEN LOWER(COALESCE(p.category, '')) LIKE '%' || v_clean_q || '%' THEN 0.40
          WHEN LOWER(COALESCE(p.description, '')) LIKE '%' || v_clean_q || '%' THEN 0.20
          ELSE 0.00
        END
      )::numeric AS search_score
    FROM public.products p
    LEFT JOIN public.brokers b ON p.broker_id = b.id
    WHERE (p.is_active IS TRUE OR p.is_active IS NULL)
      AND (p_category IS NULL OR p_category = 'All' OR p.category = p_category)
      AND (v_clean_q = '' OR LOWER(p.name) LIKE '%' || v_clean_q || '%' OR LOWER(COALESCE(p.category, '')) LIKE '%' || v_clean_q || '%' OR LOWER(COALESCE(p.description, '')) LIKE '%' || v_clean_q || '%')
  ),
  scored_products AS (
    SELECT 
      ep.*,
      ROUND(
        (
          CASE 
            WHEN v_clean_q = '' THEN
              0.45 * ep.freshness_score + 0.35 * ep.quality_score + 0.20 * ep.stock_score
            ELSE
              0.60 * ep.search_score + 0.20 * ep.freshness_score + 0.15 * ep.quality_score + 0.05 * ep.stock_score
          END
        ), 3
      ) AS rank_score,
      -- Compute item rank per seller for fair diversity interleaving
      ROW_NUMBER() OVER (
        PARTITION BY ep.broker_id 
        ORDER BY 
          (
            CASE 
              WHEN v_clean_q = '' THEN
                0.45 * ep.freshness_score + 0.35 * ep.quality_score + 0.20 * ep.stock_score
              ELSE
                0.60 * ep.search_score + 0.20 * ep.freshness_score + 0.15 * ep.quality_score + 0.05 * ep.stock_score
            END
          ) DESC,
          ep.created_at DESC
      ) AS seller_item_rank,
      COUNT(*) OVER() AS total_count
    FROM eligible_products ep
  )
  SELECT 
    sp.id,
    sp.name,
    sp.price,
    sp.image,
    sp.category,
    sp.stock,
    sp.status,
    sp.is_active,
    sp.description,
    sp.broker_id,
    sp.broker_name,
    sp.created_at,
    sp.updated_at,
    sp.rating,
    sp.review_count,
    sp.rank_score,
    sp.seller_item_rank,
    sp.total_count
  FROM scored_products sp
  ORDER BY 
    -- Diversity first: items with seller_item_rank <= 2 appear first, preventing seller monopoly
    LEAST(sp.seller_item_rank, 3) ASC,
    sp.rank_score DESC,
    sp.created_at DESC,
    sp.id ASC
  OFFSET v_offset
  LIMIT v_limit;
END;
$$;

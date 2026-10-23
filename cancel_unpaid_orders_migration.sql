-- ============================================================
-- BROKER HUB: AUTOMATIC CANCELLATION OF UNPAID ORDERS MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Relax payment_status constraint to support 'Cancelled' and 'Payment Cancelled'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN (
    'Pending',
    'Successful',
    'paid',
    'Failed',
    'Refunded',
    'Processing',
    'Cancelled',
    'Payment Cancelled'
  ));

-- 2. Relax status constraint to ensure 'Cancelled' is always supported
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN (
    'Delivered',
    'In Transit',
    'Pending',
    'Cancelled',
    'Processing',
    'Shipped',
    'ACCEPTED',
    'COMPLETED',
    'REFUNDED'
  ));

-- 3. Index for efficient lookup and sweep of abandoned/pending orders
CREATE INDEX IF NOT EXISTS idx_orders_unpaid_abandoned 
  ON public.orders (status, payment_status, created_at)
  WHERE status = 'Pending';

CREATE INDEX IF NOT EXISTS idx_broker_notifications_related_order
  ON public.broker_notifications (related_order_id);

-- 4. Server-Side Function to Automatically Cancel Abandoned Unpaid Orders
--    Can be invoked via `SELECT public.cancel_abandoned_unpaid_orders(15);`
--    or via Supabase RPC `supabase.rpc('cancel_abandoned_unpaid_orders', { timeout_minutes: 15 })`
CREATE OR REPLACE FUNCTION public.cancel_abandoned_unpaid_orders(timeout_minutes integer DEFAULT 15)
RETURNS TABLE (
  cancelled_orders_count integer,
  cancelled_order_ids uuid[]
) AS $$
DECLARE
  v_cutoff timestamptz;
  v_ord RECORD;
  v_item RECORD;
  v_cancelled_ids uuid[] := '{}';
BEGIN
  v_cutoff := NOW() - (timeout_minutes || ' minutes')::interval;

  FOR v_ord IN
    SELECT id, razorpay_order_id, payment_status, status
    FROM public.orders
    WHERE status = 'Pending'
      AND payment_status IN ('Pending', 'Processing')
      AND (payment_method IS NULL OR payment_method NOT ILIKE '%cod%')
      AND created_at <= v_cutoff
    FOR UPDATE
  LOOP
    -- Mark order as Cancelled and payment_status as Failed
    UPDATE public.orders
    SET 
      status = 'Cancelled',
      payment_status = 'Failed',
      updated_at = NOW()
    WHERE id = v_ord.id;

    -- Restore product stock for line items
    FOR v_item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = v_ord.id AND product_id IS NOT NULL
    LOOP
      UPDATE public.products
      SET 
        stock = stock + v_item.quantity,
        status = CASE 
          WHEN (stock + v_item.quantity) <= 0 THEN 'Out of Stock'
          WHEN (stock + v_item.quantity) < 10 THEN 'Low Stock'
          ELSE 'In Stock'
        END
      WHERE id = v_item.product_id;
    END LOOP;

    -- Remove any broker notifications created for this order
    DELETE FROM public.broker_notifications
    WHERE related_order_id = v_ord.id;

    -- Also clean up legacy notification by title match
    DELETE FROM public.broker_notifications
    WHERE title ILIKE '%#' || SUBSTRING(v_ord.id::text, 1, 8) || '%';

    v_cancelled_ids := array_append(v_cancelled_ids, v_ord.id);
  END LOOP;

  RETURN QUERY SELECT array_length(v_cancelled_ids, 1), v_cancelled_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Optional Cron Job Scheduling (if pg_cron extension is enabled on your Supabase instance)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cancel-abandoned-orders-every-15m');
    PERFORM cron.schedule(
      'cancel-abandoned-orders-every-15m',
      '*/15 * * * *',
      'SELECT public.cancel_abandoned_unpaid_orders(15);'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not enabled or permission denied; function can still be called via RPC or Edge Functions.';
END;
$$;

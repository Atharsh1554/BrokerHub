-- ============================================================
-- BROKER HUB — BROKER PAYMENT DETAILS & MANUAL SETTLEMENT MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Broker Payment Details Table (UPI & Bank Account Details for Manual Settlements)
CREATE TABLE IF NOT EXISTS public.broker_payment_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES public.users(id) NOT NULL UNIQUE,
  payment_method TEXT CHECK (payment_method IN ('upi', 'bank')),
  upi_id TEXT,
  account_holder_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update orders table to support 'Pending Admin Settlement' status
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS broker_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'Pending Admin Settlement',
ADD COLUMN IF NOT EXISTS settlement_date TIMESTAMPTZ;

-- Drop constraint if exists to update allowed settlement status values
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_settlement_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_settlement_status_check 
  CHECK (settlement_status IN ('Pending Admin Settlement', 'Pending', 'Settled', 'Failed', 'Refunded'));

-- 3. Enable RLS on broker_payment_details
ALTER TABLE public.broker_payment_details ENABLE ROW LEVEL SECURITY;

-- 4. Open Policies for broker_payment_details (Allows Brokers and Admins to read and write payment details)
DROP POLICY IF EXISTS "Brokers can view own payment details" ON public.broker_payment_details;
DROP POLICY IF EXISTS "Brokers can insert own payment details" ON public.broker_payment_details;
DROP POLICY IF EXISTS "Brokers can update own payment details" ON public.broker_payment_details;
DROP POLICY IF EXISTS "Admins can view all payment details" ON public.broker_payment_details;
DROP POLICY IF EXISTS "Admins can manage payment details" ON public.broker_payment_details;

-- Public/Anon/Authenticated SELECT Policy
DROP POLICY IF EXISTS "Allow public select on broker_payment_details" ON public.broker_payment_details;
CREATE POLICY "Allow public select on broker_payment_details" 
  ON public.broker_payment_details FOR SELECT 
  TO public 
  USING (true);

-- Public/Anon/Authenticated INSERT Policy
DROP POLICY IF EXISTS "Allow public insert on broker_payment_details" ON public.broker_payment_details;
CREATE POLICY "Allow public insert on broker_payment_details" 
  ON public.broker_payment_details FOR INSERT 
  TO public 
  WITH CHECK (true);

-- Public/Anon/Authenticated UPDATE Policy
DROP POLICY IF EXISTS "Allow public update on broker_payment_details" ON public.broker_payment_details;
CREATE POLICY "Allow public update on broker_payment_details" 
  ON public.broker_payment_details FOR UPDATE 
  TO public 
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for broker_payment_details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'broker_payment_details'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.broker_payment_details';
  END IF;
END $$;

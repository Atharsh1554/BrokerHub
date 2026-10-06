-- ============================================================
-- BROKER HUB — PAYMENT ARCHITECTURE MIGRATION
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Broker Payment Accounts (Razorpay Linked Accounts)
CREATE TABLE IF NOT EXISTS public.broker_payment_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES public.users(id) NOT NULL UNIQUE,
  razorpay_linked_account_id TEXT,
  status TEXT DEFAULT 'Not Connected' CHECK (status IN ('Not Connected', 'Connected', 'Pending', 'Suspended')),
  onboarding_status JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Broker Commissions
CREATE TABLE IF NOT EXISTS public.broker_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID REFERENCES public.users(id) NOT NULL UNIQUE,
  commission_type TEXT DEFAULT 'NONE' CHECK (commission_type IN ('NONE', 'FIXED', 'PERCENTAGE')),
  commission_value NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Modify Orders Table to store Commission Snapshot and Settlement Status
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS platform_commission NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS broker_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_type TEXT DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS commission_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'Pending' CHECK (settlement_status IN ('Pending', 'Settled', 'Failed', 'Refunded'));

-- 4. Enable RLS for new tables
ALTER TABLE public.broker_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_commissions ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Brokers can view own payment accounts" ON public.broker_payment_accounts FOR SELECT USING (auth.uid() = broker_id);
CREATE POLICY "Admins can view all payment accounts" ON public.broker_payment_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins can manage payment accounts" ON public.broker_payment_accounts FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
-- Allow brokers to update their own payment account status
CREATE POLICY "Brokers can insert own payment account" ON public.broker_payment_accounts FOR INSERT WITH CHECK (auth.uid() = broker_id);
CREATE POLICY "Brokers can update own payment account" ON public.broker_payment_accounts FOR UPDATE USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can view own commissions" ON public.broker_commissions FOR SELECT USING (auth.uid() = broker_id);
CREATE POLICY "Admins can view all commissions" ON public.broker_commissions FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
CREATE POLICY "Admins can manage commissions" ON public.broker_commissions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Function to handle broker creation and auto-create commission/payment account
CREATE OR REPLACE FUNCTION public.handle_new_broker()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'broker' THEN
    INSERT INTO public.broker_commissions (broker_id, commission_type, commission_value)
    VALUES (NEW.id, 'NONE', 0)
    ON CONFLICT (broker_id) DO NOTHING;

    INSERT INTO public.broker_payment_accounts (broker_id)
    VALUES (NEW.id)
    ON CONFLICT (broker_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on user creation/update if role is broker
DROP TRIGGER IF EXISTS on_broker_created ON public.users;
CREATE TRIGGER on_broker_created
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_broker();

-- Seed existing brokers with commission and payment accounts
INSERT INTO public.broker_commissions (broker_id, commission_type, commission_value)
SELECT id, 'NONE', 0 FROM public.users WHERE role = 'broker'
ON CONFLICT (broker_id) DO NOTHING;

INSERT INTO public.broker_payment_accounts (broker_id)
SELECT id FROM public.users WHERE role = 'broker'
ON CONFLICT (broker_id) DO NOTHING;

-- Relax payment_status constraint on orders table to accept both 'paid' and 'Successful'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('Pending', 'Successful', 'paid', 'Failed', 'Refunded', 'Processing'));

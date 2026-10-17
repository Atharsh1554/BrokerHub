-- ============================================================
-- FIX: Enable Cascade Delete for Users in Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
--
-- This script fixes the error:
-- "Failed to delete selected users: Database error deleting user"
-- by adding ON DELETE CASCADE to all foreign keys referencing
-- auth.users and public.users.
-- ============================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Automatically find and drop all foreign key constraints in public schema
    -- that reference public.users or auth.users without ON DELETE CASCADE
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.constraint_column_usage AS ccu 
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
          AND (
              ccu.table_name = 'users' 
              OR (ccu.table_schema = 'auth' AND ccu.table_name = 'users')
              OR ccu.table_name = 'brokers'
          )
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE;', 
            r.table_schema, r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- 2. Re-create all constraints with ON DELETE CASCADE

-- public.users -> auth.users
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_id_fkey,
  ADD CONSTRAINT users_id_fkey 
    FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- public.brokers -> public.users
ALTER TABLE public.brokers
  DROP CONSTRAINT IF EXISTS brokers_id_fkey,
  ADD CONSTRAINT brokers_id_fkey 
    FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

-- public.broker_payment_details -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'broker_payment_details') THEN
    ALTER TABLE public.broker_payment_details
      DROP CONSTRAINT IF EXISTS broker_payment_details_broker_id_fkey,
      ADD CONSTRAINT broker_payment_details_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- public.products -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    ALTER TABLE public.products
      DROP CONSTRAINT IF EXISTS products_broker_id_fkey,
      ADD CONSTRAINT products_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- public.orders -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders
      DROP CONSTRAINT IF EXISTS orders_customer_id_fkey,
      DROP CONSTRAINT IF EXISTS orders_broker_id_fkey,
      ADD CONSTRAINT orders_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT orders_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- public.order_items -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    ALTER TABLE public.order_items
      DROP CONSTRAINT IF EXISTS order_items_broker_id_fkey,
      ADD CONSTRAINT order_items_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- public.appointments -> public.users & public.brokers
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN
    ALTER TABLE public.appointments
      DROP CONSTRAINT IF EXISTS appointments_customer_id_fkey,
      DROP CONSTRAINT IF EXISTS appointments_broker_id_fkey,
      ADD CONSTRAINT appointments_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT appointments_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.brokers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- public.messages -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE public.messages
      DROP CONSTRAINT IF EXISTS messages_sender_id_fkey,
      DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey,
      ADD CONSTRAINT messages_sender_id_fkey 
        FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT messages_receiver_id_fkey 
        FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- public.broker_notifications -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'broker_notifications') THEN
    ALTER TABLE public.broker_notifications
      DROP CONSTRAINT IF EXISTS broker_notifications_broker_id_fkey,
      DROP CONSTRAINT IF EXISTS broker_notifications_customer_id_fkey,
      ADD CONSTRAINT broker_notifications_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT broker_notifications_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- public.payments -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE public.payments
      DROP CONSTRAINT IF EXISTS payments_customer_id_fkey,
      DROP CONSTRAINT IF EXISTS payments_broker_id_fkey,
      ADD CONSTRAINT payments_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE SET NULL,
      ADD CONSTRAINT payments_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- public.broker_customer_connections -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'broker_customer_connections') THEN
    ALTER TABLE public.broker_customer_connections
      DROP CONSTRAINT IF EXISTS broker_customer_connections_customer_id_fkey,
      DROP CONSTRAINT IF EXISTS broker_customer_connections_broker_id_fkey,
      ADD CONSTRAINT broker_customer_connections_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT broker_customer_connections_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- public.reviews -> public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE public.reviews
      DROP CONSTRAINT IF EXISTS reviews_customer_id_fkey,
      DROP CONSTRAINT IF EXISTS reviews_broker_id_fkey,
      ADD CONSTRAINT reviews_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT reviews_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Reverse auction tables -> auth.users or public.users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reverse_auctions') THEN
    ALTER TABLE public.reverse_auctions
      DROP CONSTRAINT IF EXISTS reverse_auctions_customer_id_fkey,
      DROP CONSTRAINT IF EXISTS reverse_auctions_assigned_broker_id_fkey,
      DROP CONSTRAINT IF EXISTS reverse_auctions_winning_broker_id_fkey,
      ADD CONSTRAINT reverse_auctions_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES auth.users(id) ON DELETE CASCADE,
      ADD CONSTRAINT reverse_auctions_assigned_broker_id_fkey 
        FOREIGN KEY (assigned_broker_id) REFERENCES auth.users(id) ON DELETE SET NULL,
      ADD CONSTRAINT reverse_auctions_winning_broker_id_fkey 
        FOREIGN KEY (winning_broker_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reverse_auction_bids') THEN
    ALTER TABLE public.reverse_auction_bids
      DROP CONSTRAINT IF EXISTS reverse_auction_bids_broker_id_fkey,
      ADD CONSTRAINT reverse_auction_bids_broker_id_fkey 
        FOREIGN KEY (broker_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reverse_auction_history') THEN
    ALTER TABLE public.reverse_auction_history
      DROP CONSTRAINT IF EXISTS reverse_auction_history_changed_by_fkey,
      ADD CONSTRAINT reverse_auction_history_changed_by_fkey 
        FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Delete user trigger function (Optional safety net: automatically deletes public.users if auth.users is deleted)
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
    DELETE FROM public.users WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

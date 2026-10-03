-- Reverse Auction Full Setup Migration

-- 1. Create the `reverse_auctions` table if it does not exist
CREATE TABLE IF NOT EXISTS public.reverse_auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES auth.users(id),
    customer_name TEXT,
    customer_company TEXT,
    contact_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    delivery_location TEXT,
    title TEXT NOT NULL,
    category TEXT,
    product_name TEXT,
    product_image TEXT,
    photos TEXT[],
    quantity INTEGER DEFAULT 1,
    description TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    starting_price NUMERIC,
    budget_text TEXT,
    deadline_date TEXT,
    activity_text TEXT,
    bid_count INTEGER DEFAULT 0,
    current_lowest_bid NUMERIC,
    lowest_bidder_id UUID,
    lowest_bidder_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'OPEN',
    status_pill TEXT,
    current_level TEXT DEFAULT 'OPEN',
    assigned_broker_id UUID REFERENCES auth.users(id),
    winning_bid_id UUID,
    winning_broker_id UUID REFERENCES auth.users(id),
    winning_broker_name TEXT,
    delivery_proof_photos TEXT[],
    delivery_confirmed_text TEXT,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create the `reverse_auction_bids` table
CREATE TABLE IF NOT EXISTS public.reverse_auction_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
    broker_id UUID REFERENCES auth.users(id),
    broker_name TEXT,
    broker_company TEXT,
    broker_avatar TEXT,
    bid_amount NUMERIC NOT NULL,
    lead_time_days INTEGER,
    lead_time_text TEXT,
    notes TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create reverse_auction_history table
CREATE TABLE IF NOT EXISTS public.reverse_auction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES auth.users(id),
    old_status TEXT,
    new_status TEXT,
    old_level TEXT,
    new_level TEXT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS and create policies
ALTER TABLE public.reverse_auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reverse_auction_history ENABLE ROW LEVEL SECURITY;

-- REVERSE AUCTIONS POLICIES
CREATE POLICY "Customers can view their own auctions" ON public.reverse_auctions FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Brokers can view OPEN auctions" ON public.reverse_auctions FOR SELECT USING (status = 'OPEN');
CREATE POLICY "Brokers can view assigned auctions" ON public.reverse_auctions FOR SELECT USING (auth.uid() = assigned_broker_id);
CREATE POLICY "Customers can create auctions" ON public.reverse_auctions FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update their own auctions" ON public.reverse_auctions FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Brokers can update assigned auctions" ON public.reverse_auctions FOR UPDATE USING (auth.uid() = assigned_broker_id);
CREATE POLICY "Customers can delete their own auctions" ON public.reverse_auctions FOR DELETE USING (auth.uid() = customer_id);

-- REVERSE AUCTION BIDS POLICIES
CREATE POLICY "Anyone can view bids" ON public.reverse_auction_bids FOR SELECT USING (true);
CREATE POLICY "Brokers can insert bids" ON public.reverse_auction_bids FOR INSERT WITH CHECK (auth.uid() = broker_id);
CREATE POLICY "Brokers can update their own bids" ON public.reverse_auction_bids FOR UPDATE USING (auth.uid() = broker_id);

-- REVERSE AUCTION HISTORY POLICIES
CREATE POLICY "Anyone involved can view history" ON public.reverse_auction_history FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert history" ON public.reverse_auction_history FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reverse_auctions;

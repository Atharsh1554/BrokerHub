-- Create reverse_auction_images table for strict auction_id association
CREATE TABLE IF NOT EXISTS public.reverse_auction_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES public.reverse_auctions(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.reverse_auction_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reverse auction images" ON public.reverse_auction_images FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reverse auction images" ON public.reverse_auction_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Try to create bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('reverse-auctions', 'reverse-auctions', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Anyone can view reverse-auctions bucket" ON storage.objects FOR SELECT USING (bucket_id = 'reverse-auctions');
CREATE POLICY "Authenticated users can insert to reverse-auctions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reverse-auctions' AND auth.role() = 'authenticated');

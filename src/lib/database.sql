-- ============================================================
-- BROKER HUB — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create broker_notifications table
CREATE TABLE IF NOT EXISTS broker_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT,
  type TEXT NOT NULL CHECK (type IN ('call_request', 'message', 'order', 'meeting', 'profile_request', 'general')),
  title TEXT NOT NULL,
  description TEXT,
  related_order_id TEXT,
  related_meeting_id TEXT,
  related_product_id TEXT,
  related_conversation_id TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'handled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_broker_notifications_broker ON broker_notifications(broker_id);
CREATE INDEX IF NOT EXISTS idx_broker_notifications_type ON broker_notifications(type);
CREATE INDEX IF NOT EXISTS idx_broker_notifications_read ON broker_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_broker_notifications_created ON broker_notifications(created_at DESC);

-- 3. Enable Row Level Security (RLS) - Optional/Permissive for demo
ALTER TABLE broker_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read broker_notifications" 
  ON broker_notifications FOR SELECT USING (true);

CREATE POLICY "Allow public insert broker_notifications" 
  ON broker_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update broker_notifications" 
  ON broker_notifications FOR UPDATE USING (true);

CREATE POLICY "Allow public delete broker_notifications" 
  ON broker_notifications FOR DELETE USING (true);

-- 4. Enable Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE broker_notifications;

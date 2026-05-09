-- supabase/schema.sql
-- Run in Supabase SQL Editor to initialize database

-- Portfolio table (matches class diagram)
CREATE TABLE IF NOT EXISTS portfolio (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       text NOT NULL,
  company_name text,
  quantity     numeric NOT NULL CHECK (quantity > 0),
  buy_price    numeric NOT NULL CHECK (buy_price > 0),
  buy_date     date,
  created_at   timestamptz DEFAULT now()
);

-- Watchlist table (matches class diagram)
CREATE TABLE IF NOT EXISTS watchlist (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       text NOT NULL,
  company_name text,
  added_at     timestamptz DEFAULT now()
);

-- PriceCache table (matches class diagram + enables persistent caching)
CREATE TABLE IF NOT EXISTS price_cache (
  symbol     text PRIMARY KEY,
  data       jsonb NOT NULL,
  cached_at  timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE portfolio   ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist   ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "portfolio_user" ON portfolio FOR ALL 
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist_user" ON watchlist FOR ALL 
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cache_public" ON price_cache FOR SELECT 
  TO anon, authenticated USING (true);

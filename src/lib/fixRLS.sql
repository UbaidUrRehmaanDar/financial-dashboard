-- Portfolio RLS
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own portfolio" ON portfolio;
CREATE POLICY "Users can manage own portfolio" 
  ON portfolio FOR ALL TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Watchlist RLS  
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own watchlist" ON watchlist;
CREATE POLICY "Users can manage own watchlist" 
  ON watchlist FOR ALL TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trivia Stats Table
CREATE TABLE IF NOT EXISTS trivia_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trivia_stats ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Trivia stats viewable by everyone" ON trivia_stats;
DROP POLICY IF EXISTS "Users can insert own trivia stats" ON trivia_stats;
DROP POLICY IF EXISTS "Users can update own trivia stats" ON trivia_stats;

-- Create Policies
CREATE POLICY "Trivia stats viewable by everyone" ON trivia_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert own trivia stats" ON trivia_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trivia stats" ON trivia_stats FOR UPDATE USING (auth.uid() = user_id);

-- Index for ranking queries
CREATE INDEX IF NOT EXISTS idx_trivia_stats_points ON trivia_stats(total_points DESC);

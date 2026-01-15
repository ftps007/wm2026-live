-- =====================================================
-- WM 2026 TIPPSPIEL - SUPABASE DATABASE SCHEMA
-- =====================================================
-- Run this SQL in your Supabase SQL Editor
-- Project Dashboard → SQL Editor → New Query

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PREDICTIONS TABLE
CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  match_id INTEGER NOT NULL,
  score1 INTEGER CHECK (score1 >= 0 AND score1 <= 20),
  score2 INTEGER CHECK (score2 >= 0 AND score2 <= 20),
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- 3. LEAGUES TABLE
CREATE TABLE leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LEAGUE MEMBERS TABLE
CREATE TABLE league_members (
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (league_id, user_id)
);

-- 5. MATCH RESULTS TABLE (Admin only)
CREATE TABLE match_results (
  match_id INTEGER PRIMARY KEY,
  score1 INTEGER NOT NULL CHECK (score1 >= 0),
  score2 INTEGER NOT NULL CHECK (score2 >= 0),
  is_final BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRIVIA STATS TABLE (User trivia performance)
CREATE TABLE trivia_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE trivia_stats ENABLE ROW LEVEL SECURITY;

-- PROFILES: Everyone can read, users can update own
CREATE POLICY "Profiles viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- PREDICTIONS: Everyone can read, users can manage own
CREATE POLICY "Predictions viewable by everyone" ON predictions FOR SELECT USING (true);
CREATE POLICY "Users can insert own predictions" ON predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON predictions FOR UPDATE USING (auth.uid() = user_id);

-- LEAGUES: Everyone can read, authenticated can create
CREATE POLICY "Leagues viewable by everyone" ON leagues FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create leagues" ON leagues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- LEAGUE MEMBERS: Everyone can read, users can join/leave
CREATE POLICY "League members viewable by everyone" ON league_members FOR SELECT USING (true);
CREATE POLICY "Users can join leagues" ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave leagues" ON league_members FOR DELETE USING (auth.uid() = user_id);

-- MATCH RESULTS: Everyone can read (admin writes via dashboard)
CREATE POLICY "Match results viewable by everyone" ON match_results FOR SELECT USING (true);

-- TRIVIA STATS: Everyone can read, users can manage own
CREATE POLICY "Trivia stats viewable by everyone" ON trivia_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert own trivia stats" ON trivia_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trivia stats" ON trivia_stats FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Calculate points function
CREATE OR REPLACE FUNCTION calculate_points(
  pred_score1 INTEGER, pred_score2 INTEGER,
  actual_score1 INTEGER, actual_score2 INTEGER
) RETURNS INTEGER AS $$
DECLARE
  pred_diff INTEGER;
  actual_diff INTEGER;
BEGIN
  IF pred_score1 IS NULL OR pred_score2 IS NULL OR actual_score1 IS NULL OR actual_score2 IS NULL THEN
    RETURN 0;
  END IF;
  
  pred_diff := pred_score1 - pred_score2;
  actual_diff := actual_score1 - actual_score2;
  
  -- Exact match: 4 points
  IF pred_score1 = actual_score1 AND pred_score2 = actual_score2 THEN
    RETURN 4;
  END IF;
  
  -- Correct difference + tendency: 3 points
  IF pred_diff = actual_diff THEN
    RETURN 3;
  END IF;
  
  -- Correct tendency: 2 points
  IF (pred_diff > 0 AND actual_diff > 0) OR 
     (pred_diff < 0 AND actual_diff < 0) OR 
     (pred_diff = 0 AND actual_diff = 0) THEN
    RETURN 2;
  END IF;
  
  -- Wrong: 0 points
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Generate unique league code
CREATE OR REPLACE FUNCTION generate_league_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match_id ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_league_members_league_id ON league_members(league_id);
CREATE INDEX IF NOT EXISTS idx_league_members_user_id ON league_members(user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_code ON leagues(code);
CREATE INDEX IF NOT EXISTS idx_trivia_stats_points ON trivia_stats(total_points DESC);

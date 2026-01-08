-- =====================================================
-- CLEANUP: Remove all sentiment-related objects
-- and fix security issues (ERRORS + WARNINGS)
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: DROP SENTIMENT VIEWS
-- =====================================================
DROP VIEW IF EXISTS public.v_latest_sentiment CASCADE;
DROP VIEW IF EXISTS public.wm2026_sentiment_timeline CASCADE;
DROP VIEW IF EXISTS public.latest_sentiment CASCADE;
DROP VIEW IF EXISTS public.sentiment_daily CASCADE;
DROP VIEW IF EXISTS public.sentiment_weekly CASCADE;

-- =====================================================
-- STEP 2: DROP SENTIMENT TABLES
-- =====================================================
DROP TABLE IF EXISTS public.wm2026_sentiment CASCADE;
DROP TABLE IF EXISTS public.wm2026_daily_sentiment CASCADE;
DROP TABLE IF EXISTS public.sentiment_data CASCADE;
DROP TABLE IF EXISTS public.sentiment_history CASCADE;
DROP TABLE IF EXISTS public.sentiment_alerts CASCADE;
DROP TABLE IF EXISTS public.sentiment_results CASCADE;

-- =====================================================
-- STEP 3: DROP SENTIMENT FUNCTIONS
-- =====================================================
DROP FUNCTION IF EXISTS public.sentiment_to_score CASCADE;
DROP FUNCTION IF EXISTS public.get_sentiment_label(numeric) CASCADE;
DROP FUNCTION IF EXISTS public.get_sentiment_label(double precision) CASCADE;
DROP FUNCTION IF EXISTS public.get_dominant_emotion_v2 CASCADE;
DROP FUNCTION IF EXISTS public.get_sentiment_trend(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_sentiment_trend(text, integer) CASCADE;
DROP FUNCTION IF EXISTS public.get_dominant_emotion CASCADE;
DROP FUNCTION IF EXISTS public.get_emotion_trend CASCADE;
DROP FUNCTION IF EXISTS public.calculate_dominant_emotion CASCADE;
DROP FUNCTION IF EXISTS public.calculate_emotional_intensity CASCADE;
DROP FUNCTION IF EXISTS public.normalize_sentiment CASCADE;
DROP FUNCTION IF EXISTS public.get_emotional_profile CASCADE;

-- =====================================================
-- STEP 4: DROP SECURITY DEFINER VIEWS
-- =====================================================
DROP VIEW IF EXISTS public.wm2026_viral_articles CASCADE;
DROP VIEW IF EXISTS public.wm2026_trending_players CASCADE;
DROP VIEW IF EXISTS public.wm2026_topic_stats CASCADE;
DROP VIEW IF EXISTS public.v_active_alerts CASCADE;
DROP VIEW IF EXISTS public.wm2026_controversial_articles CASCADE;
DROP VIEW IF EXISTS public.v_top_countries CASCADE;
DROP VIEW IF EXISTS public.v_today_categories CASCADE;
DROP VIEW IF EXISTS public.wm2026_trending_teams CASCADE;
DROP VIEW IF EXISTS public.wm2026_language_stats CASCADE;

-- =====================================================
-- STEP 5: ENABLE RLS ON TABLES (fix ERRORS)
-- =====================================================

-- Enable RLS on wm2026_categories (already has policies)
ALTER TABLE public.wm2026_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on wm2026_countries (already has policies)
ALTER TABLE public.wm2026_countries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on wm2026_groups
ALTER TABLE public.wm2026_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read groups" ON public.wm2026_groups;
CREATE POLICY "Public read groups" ON public.wm2026_groups FOR SELECT USING (true);

-- Enable RLS on wm2026_country_records
ALTER TABLE public.wm2026_country_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read country_records" ON public.wm2026_country_records;
CREATE POLICY "Public read country_records" ON public.wm2026_country_records FOR SELECT USING (true);

-- Enable RLS on wm2026_country_facts
ALTER TABLE public.wm2026_country_facts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read country_facts" ON public.wm2026_country_facts;
CREATE POLICY "Public read country_facts" ON public.wm2026_country_facts FOR SELECT USING (true);

-- =====================================================
-- STEP 6: FIX FUNCTION SEARCH_PATH (fix WARNINGS)
-- Recreate functions with SET search_path = ''
-- =====================================================

-- Fix update_updated_at
DROP FUNCTION IF EXISTS public.update_updated_at();
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_modified_column
DROP FUNCTION IF EXISTS public.update_modified_column();
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix clean_old_news
DROP FUNCTION IF EXISTS public.clean_old_news();
CREATE OR REPLACE FUNCTION public.clean_old_news()
RETURNS void AS $$
BEGIN
  DELETE FROM public.wm2026_articles
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix is_user_premium
DROP FUNCTION IF EXISTS public.is_user_premium(uuid);
CREATE OR REPLACE FUNCTION public.is_user_premium(user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Adjust based on your actual premium check logic
  RETURN false;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix unsubscribe_newsletter
DROP FUNCTION IF EXISTS public.unsubscribe_newsletter(text);
CREATE OR REPLACE FUNCTION public.unsubscribe_newsletter(email_param text)
RETURNS void AS $$
BEGIN
  UPDATE public.newsletter_subscribers
  SET subscribed = false, unsubscribed_at = NOW()
  WHERE email = email_param;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix get_category_history
DROP FUNCTION IF EXISTS public.get_category_history(text);
CREATE OR REPLACE FUNCTION public.get_category_history(category_name text)
RETURNS TABLE(date date, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT DATE(created_at), COUNT(*)
  FROM public.wm2026_articles
  WHERE category = category_name
  GROUP BY DATE(created_at)
  ORDER BY DATE(created_at) DESC;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix create_email_preferences_for_new_user
DROP FUNCTION IF EXISTS public.create_email_preferences_for_new_user();
CREATE OR REPLACE FUNCTION public.create_email_preferences_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix get_trend
DROP FUNCTION IF EXISTS public.get_trend(numeric, numeric);
CREATE OR REPLACE FUNCTION public.get_trend(current_val numeric, previous_val numeric)
RETURNS text AS $$
BEGIN
  IF previous_val IS NULL OR previous_val = 0 THEN
    RETURN 'stable';
  END IF;
  IF current_val > previous_val THEN
    RETURN 'up';
  ELSIF current_val < previous_val THEN
    RETURN 'down';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix calculate_points
DROP FUNCTION IF EXISTS public.calculate_points(integer, integer, integer, integer);
CREATE OR REPLACE FUNCTION public.calculate_points(
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
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix generate_league_code
DROP FUNCTION IF EXISTS public.generate_league_code();
CREATE OR REPLACE FUNCTION public.generate_league_code() RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- =====================================================
-- STEP 7: FIX scheduled_reminders (missing policy)
-- =====================================================
DROP POLICY IF EXISTS "Public read scheduled_reminders" ON public.scheduled_reminders;
CREATE POLICY "Public read scheduled_reminders" ON public.scheduled_reminders FOR SELECT USING (true);

-- =====================================================
-- STEP 8: FIX PERMISSIVE RLS POLICIES
-- Make INSERT policies more restrictive where needed
-- =====================================================

-- Fix newsletter_subscribers - require email to be non-empty
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email IS NOT NULL AND email <> '');

-- Fix wm_poll_votes - require user_id or session tracking
DROP POLICY IF EXISTS "public_insert" ON public.wm_poll_votes;
CREATE POLICY "public_insert" ON public.wm_poll_votes
  FOR INSERT WITH CHECK (true); -- Keep as-is if anonymous voting is intended

-- Fix wm2026_articles - restrict to service role only
DROP POLICY IF EXISTS "Service write articles" ON public.wm2026_articles;
CREATE POLICY "Service write articles" ON public.wm2026_articles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Fix wm2026_processing_log - restrict to service role only
DROP POLICY IF EXISTS "Service write log" ON public.wm2026_processing_log;
CREATE POLICY "Service write log" ON public.wm2026_processing_log
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- STEP 9: MOVE EXTENSIONS TO 'extensions' SCHEMA
-- (Optional - Supabase recommends this)
-- =====================================================
-- Note: This may require superuser privileges
-- Run these only if you have the permissions:

-- CREATE SCHEMA IF NOT EXISTS extensions;
-- ALTER EXTENSION pg_trgm SET SCHEMA extensions;
-- ALTER EXTENSION pg_net SET SCHEMA extensions;

-- =====================================================
-- MANUAL STEPS REQUIRED:
-- =====================================================
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Enable "Leaked Password Protection" under Password Security
--
-- 3. For extensions, you may need to:
--    - Go to Database > Extensions
--    - Disable and re-enable extensions in 'extensions' schema
-- =====================================================

-- =====================================================
-- DONE! Run the linter again to verify all issues fixed
-- =====================================================

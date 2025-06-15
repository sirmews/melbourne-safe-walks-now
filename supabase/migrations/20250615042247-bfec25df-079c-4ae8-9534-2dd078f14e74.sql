
-- First, let's make the tables completely private by denying all direct access
-- This forces all access to go through our API endpoints

-- Drop existing policies (using CASCADE to handle dependencies)
DROP POLICY IF EXISTS "Anyone can view safety reports" ON public.safety_reports;
DROP POLICY IF EXISTS "Anyone can create reports" ON public.safety_reports;
DROP POLICY IF EXISTS "Users can update own reports" ON public.safety_reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON public.safety_reports;
DROP POLICY IF EXISTS "Service role only access" ON public.safety_reports;

DROP POLICY IF EXISTS "Anyone can view ratings" ON public.report_ratings;
DROP POLICY IF EXISTS "Anyone can rate reports" ON public.report_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.report_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.report_ratings;
DROP POLICY IF EXISTS "Service role only access" ON public.report_ratings;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role only access" ON public.profiles;

-- Create restrictive policies that only allow service role access
-- This effectively blocks all direct client access
CREATE POLICY "Service role only access" ON public.safety_reports 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only access" ON public.report_ratings 
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on profiles table and restrict access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only access" ON public.profiles 
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for fast lookups on existing rate limits table
CREATE INDEX IF NOT EXISTS api_rate_limits_ip_endpoint_idx ON public.api_rate_limits(ip_address, endpoint, window_start);

-- Ensure rate limiting table has proper RLS
DROP POLICY IF EXISTS "Service role only access" ON public.api_rate_limits;
CREATE POLICY "Service role only access" ON public.api_rate_limits 
  FOR ALL USING (auth.role() = 'service_role');

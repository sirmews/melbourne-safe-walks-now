
-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable RLS on PostGIS system table
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read spatial reference systems (required for PostGIS operations)
CREATE POLICY "Anyone can read spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT USING (true);

-- Create enum for safety report categories
CREATE TYPE safety_category AS ENUM (
  'unlit_street',
  'dangerous_area', 
  'facility_risk',
  'crime_hotspot',
  'poor_visibility',
  'unsafe_infrastructure',
  'suspicious_activity',
  'well_lit_safe',
  'police_presence',
  'busy_safe_area'
);

-- Create enum for safety severity levels
CREATE TYPE safety_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create safety reports table with PostGIS geometry
CREATE TABLE public.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  address TEXT,
  category safety_category NOT NULL,
  severity safety_severity NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  photo_urls TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create spatial index for fast location queries
CREATE INDEX safety_reports_location_idx ON public.safety_reports USING GIST(location);

-- Create index for category and severity filtering
CREATE INDEX safety_reports_category_idx ON public.safety_reports(category);
CREATE INDEX safety_reports_severity_idx ON public.safety_reports(severity);

-- Create report ratings table for community validation
CREATE TABLE public.report_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.safety_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  helpful BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Safety reports policies - Allow anonymous viewing and creation
CREATE POLICY "Anyone can view safety reports" ON public.safety_reports FOR SELECT USING (true);
CREATE POLICY "Anyone can create reports" ON public.safety_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own reports" ON public.safety_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.safety_reports FOR DELETE USING (auth.uid() = user_id);

-- Report ratings policies - Allow anonymous ratings
CREATE POLICY "Anyone can view ratings" ON public.report_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can rate reports" ON public.report_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own ratings" ON public.report_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.report_ratings FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get safety reports within a bounding box
CREATE OR REPLACE FUNCTION get_reports_in_bounds(
  sw_lat FLOAT,
  sw_lng FLOAT, 
  ne_lat FLOAT,
  ne_lng FLOAT
)
RETURNS TABLE (
  id UUID,
  location_lat FLOAT,
  location_lng FLOAT,
  category safety_category,
  severity safety_severity,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  rating_avg FLOAT,
  rating_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    ST_Y(sr.location::geometry) as location_lat,
    ST_X(sr.location::geometry) as location_lng,
    sr.category,
    sr.severity,
    sr.title,
    sr.description,
    sr.created_at,
    COALESCE(AVG(rr.rating), 0)::FLOAT as rating_avg,
    COUNT(rr.rating)::INTEGER as rating_count
  FROM public.safety_reports sr
  LEFT JOIN public.report_ratings rr ON sr.id = rr.report_id
  WHERE ST_Within(
    sr.location::geometry,
    ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)
  )
  GROUP BY sr.id, sr.location, sr.category, sr.severity, sr.title, sr.description, sr.created_at;
END;
$$ LANGUAGE plpgsql;

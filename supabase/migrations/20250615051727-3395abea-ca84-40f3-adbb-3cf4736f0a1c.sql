
-- Drop the existing function first
DROP FUNCTION IF EXISTS get_reports_in_bounds(double precision, double precision, double precision, double precision);

-- Add flag field to safety_reports table
ALTER TABLE public.safety_reports 
ADD COLUMN flagged BOOLEAN DEFAULT FALSE;

-- Add index for flagged reports
CREATE INDEX safety_reports_flagged_idx ON public.safety_reports(flagged);

-- Recreate the get_reports_in_bounds function to include verification and flag status
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
  rating_count INTEGER,
  verified BOOLEAN,
  flagged BOOLEAN
) 
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
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
    COUNT(rr.rating)::INTEGER as rating_count,
    sr.verified,
    sr.flagged
  FROM public.safety_reports sr
  LEFT JOIN public.report_ratings rr ON sr.id = rr.report_id
  WHERE ST_Within(
    sr.location::geometry,
    ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)
  )
  GROUP BY sr.id, sr.location, sr.category, sr.severity, sr.title, sr.description, sr.created_at, sr.verified, sr.flagged;
END;
$$;

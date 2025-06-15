
-- Update the get_reports_in_bounds function to return all fields needed by the UI
DROP FUNCTION IF EXISTS get_reports_in_bounds(double precision, double precision, double precision, double precision);

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
  category TEXT,
  severity TEXT,
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
    sr.category::TEXT,
    sr.severity::TEXT,
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
  AND sr.created_at > NOW() - INTERVAL '7 days'
  GROUP BY sr.id, sr.location, sr.category, sr.severity, sr.title, sr.description, sr.created_at, sr.verified, sr.flagged
  ORDER BY sr.created_at DESC;
END;
$$;

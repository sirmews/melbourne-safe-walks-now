
-- Drop the existing function first to avoid conflicts
DROP FUNCTION IF EXISTS get_reports_in_bounds(double precision, double precision, double precision, double precision);

-- Create the corrected get_reports_in_bounds function that matches your schema
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
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
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
    sr.created_at
  FROM safety_reports sr
  WHERE ST_Intersects(
    sr.location,
    ST_MakeEnvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)::geography
  )
  AND sr.created_at > NOW() - INTERVAL '7 days' -- Only recent reports
  ORDER BY sr.created_at DESC;
END;
$$;

-- Create a simpler test function to debug what's happening
CREATE OR REPLACE FUNCTION test_safety_reports_exists()
RETURNS TABLE (
  total_reports BIGINT,
  sample_report JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_reports,
    CASE 
      WHEN COUNT(*) > 0 THEN
        jsonb_build_object(
          'id', (SELECT id FROM safety_reports LIMIT 1),
          'lat', (SELECT ST_Y(location::geometry) FROM safety_reports LIMIT 1),
          'lng', (SELECT ST_X(location::geometry) FROM safety_reports LIMIT 1),
          'category', (SELECT category FROM safety_reports LIMIT 1)
        )
      ELSE NULL
    END as sample_report
  FROM safety_reports;
END;
$$;

-- Enhanced debug version of the route safety analysis
CREATE OR REPLACE FUNCTION debug_analyze_route_safety(
  route_coordinates JSONB,
  analysis_buffer_km FLOAT DEFAULT 0.5
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  route_line GEOMETRY;
  route_buffer GEOMETRY;
  coord JSONB;
  points GEOMETRY[];
  total_reports INTEGER := 0;
  debug_info JSONB;
  i INTEGER;
BEGIN
  -- Debug: Check if we have any safety reports at all
  SELECT COUNT(*) INTO total_reports FROM safety_reports;
  
  IF total_reports = 0 THEN
    RETURN jsonb_build_object(
      'riskScore', 30,
      'riskLevel', 'low',
      'safetyNotes', jsonb_build_array('No safety reports found in database'),
      'dangerousAreas', jsonb_build_array(),
      'debug', jsonb_build_object(
        'totalReportsInDB', total_reports,
        'routeCoordinatesCount', jsonb_array_length(route_coordinates)
      )
    );
  END IF;

  -- Convert JSONB coordinates to geometry array
  FOR i IN 0..jsonb_array_length(route_coordinates) - 1
  LOOP
    coord := route_coordinates->i;
    points := array_append(points, ST_Point((coord->>0)::FLOAT, (coord->>1)::FLOAT));
  END LOOP;
  
  -- Create route line from points
  route_line := ST_SetSRID(ST_MakeLine(points), 4326);
  
  -- Create buffer around route (convert to meters for buffering)
  route_buffer := ST_Buffer(
    ST_Transform(route_line, 3857),
    analysis_buffer_km * 1000
  );
  
  -- Count nearby reports
  WITH nearby_reports AS (
    SELECT 
      sr.*,
      ST_Y(sr.location::geometry) as lat,
      ST_X(sr.location::geometry) as lng,
      ST_Distance(
        ST_Transform(sr.location::geometry, 3857),
        ST_Transform(route_line, 3857)
      ) / 1000.0 as distance_km
    FROM safety_reports sr
    WHERE ST_Intersects(
      ST_Transform(sr.location::geometry, 3857),
      route_buffer
    )
    AND sr.created_at > NOW() - INTERVAL '7 days'
  ),
  analysis_results AS (
    SELECT 
      COUNT(*) as nearby_count,
      COUNT(*) FILTER (WHERE category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity')) as danger_count,
      COUNT(*) FILTER (WHERE category IN ('well_lit_safe', 'police_presence', 'busy_safe_area')) as safe_count,
      
      COALESCE(
        SUM(
          CASE 
            WHEN category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity') THEN
              CASE severity::TEXT
                WHEN 'critical' THEN 60
                WHEN 'high' THEN 40  
                WHEN 'medium' THEN 25
                WHEN 'low' THEN 10
                ELSE 20
              END
            ELSE 0
          END
        ), 0
      ) as risk_score,
      
      jsonb_agg(
        jsonb_build_object(
          'lat', lat,
          'lng', lng,
          'reason', category || ': ' || title,
          'distance_km', ROUND(distance_km::numeric, 3)
        )
      ) FILTER (
        WHERE category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity')
        AND distance_km < 0.5
      ) as danger_areas,
      
      array_agg(
        'Safe area: ' || title
      ) FILTER (
        WHERE category IN ('well_lit_safe', 'police_presence', 'busy_safe_area')
        AND distance_km < 0.5
      ) as safety_notes
      
    FROM nearby_reports
  )
  SELECT 
    jsonb_build_object(
      'riskScore', LEAST(100, GREATEST(0, ar.risk_score)),
      'riskLevel', 
        CASE 
          WHEN ar.risk_score >= 75 THEN 'critical'
          WHEN ar.risk_score >= 50 THEN 'high'  
          WHEN ar.risk_score >= 25 THEN 'medium'
          ELSE 'low'
        END,
      'safetyNotes', 
        CASE 
          WHEN ar.nearby_count = 0 THEN jsonb_build_array('No recent safety reports found along this route')
          WHEN ar.safety_notes IS NOT NULL THEN array_to_json(ar.safety_notes)
          ELSE jsonb_build_array(ar.danger_count || ' safety concern(s) reported near this route')
        END,
      'dangerousAreas', COALESCE(ar.danger_areas, jsonb_build_array()),
      'debug', jsonb_build_object(
        'totalReportsInDB', total_reports,
        'nearbyReports', ar.nearby_count,
        'dangerousReports', ar.danger_count,
        'safeReports', ar.safe_count,
        'bufferKm', analysis_buffer_km,
        'routePointsCount', jsonb_array_length(route_coordinates)
      )
    ) INTO debug_info
  FROM analysis_results ar;
  
  RETURN debug_info;
END;
$$;

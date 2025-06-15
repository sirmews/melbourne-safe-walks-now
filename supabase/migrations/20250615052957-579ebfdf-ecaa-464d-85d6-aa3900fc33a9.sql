
-- Function to find dangerous areas along a route corridor
CREATE OR REPLACE FUNCTION find_dangerous_areas_along_route(
  origin_lat FLOAT,
  origin_lng FLOAT,
  dest_lat FLOAT,
  dest_lng FLOAT,
  corridor_width_km FLOAT DEFAULT 1.0,
  current_hour INTEGER DEFAULT EXTRACT(HOUR FROM NOW())::INTEGER,
  max_report_age_hours INTEGER DEFAULT 168
)
RETURNS TABLE (
  id UUID,
  location_lat FLOAT,
  location_lng FLOAT,
  category safety_category,
  severity safety_severity,
  weighted_risk_score FLOAT,
  distance_to_route_km FLOAT,
  buffer_radius_km FLOAT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  route_line GEOMETRY;
  route_buffer GEOMETRY;
BEGIN
  -- Create direct route line between origin and destination
  route_line := ST_MakeLine(
    ST_Point(origin_lng, origin_lat)::GEOMETRY,
    ST_Point(dest_lng, dest_lat)::GEOMETRY
  );
  
  -- Create buffer around route (corridor)
  route_buffer := ST_Buffer(
    ST_Transform(ST_SetSRID(route_line, 4326), 3857), -- Transform to meters
    corridor_width_km * 1000 -- Convert km to meters
  );
  
  RETURN QUERY
  SELECT 
    sr.id,
    ST_Y(sr.location::geometry) as location_lat,
    ST_X(sr.location::geometry) as location_lng,
    sr.category,
    sr.severity,
    -- Calculate time-weighted risk score
    CASE 
      WHEN sr.category IN ('dangerous_area', 'crime_hotspot') THEN
        CASE sr.severity
          WHEN 'critical' THEN 100.0
          WHEN 'high' THEN 75.0
          WHEN 'medium' THEN 50.0
          WHEN 'low' THEN 25.0
          ELSE 40.0
        END *
        -- Time of day multiplier
        CASE 
          WHEN sr.category = 'unlit_street' AND (current_hour < 6 OR current_hour > 20) THEN 1.5
          WHEN sr.category = 'crime_hotspot' AND (current_hour < 7 OR current_hour > 22) THEN 1.3
          ELSE 1.0
        END *
        -- Report age factor (newer reports weighted higher)
        GREATEST(0.1, 1.0 - EXTRACT(EPOCH FROM (NOW() - sr.created_at)) / 3600.0 / max_report_age_hours)
      ELSE 0.0
    END as weighted_risk_score,
    
    -- Distance from report to route line (in km)
    ST_Distance(
      ST_Transform(sr.location, 3857),
      ST_Transform(ST_SetSRID(route_line, 4326), 3857)
    ) / 1000.0 as distance_to_route_km,
    
    -- Dynamic buffer radius based on severity and category
    CASE 
      WHEN sr.severity = 'critical' THEN 0.5
      WHEN sr.severity = 'high' THEN 0.3
      WHEN sr.severity = 'medium' THEN 0.2
      WHEN sr.severity = 'low' THEN 0.1
      ELSE 0.15
    END as buffer_radius_km
    
  FROM safety_reports sr
  WHERE 
    -- Only include dangerous categories
    sr.category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity')
    -- Within the route corridor
    AND ST_Intersects(
      ST_Transform(sr.location, 3857),
      route_buffer
    )
    -- Within time limit
    AND sr.created_at > NOW() - INTERVAL '1 hour' * max_report_age_hours
    -- Not flagged
    AND (sr.flagged IS FALSE OR sr.flagged IS NULL)
  ORDER BY weighted_risk_score DESC, distance_to_route_km ASC;
END;
$$;

-- Function to generate avoidance waypoints
CREATE OR REPLACE FUNCTION generate_avoidance_waypoints(
  origin_lat FLOAT,
  origin_lng FLOAT,
  dest_lat FLOAT,
  dest_lng FLOAT,
  dangerous_areas JSONB,
  max_detour_ratio FLOAT DEFAULT 1.5,
  min_clearance_km FLOAT DEFAULT 0.2
)
RETURNS TABLE (waypoint_lng FLOAT, waypoint_lat FLOAT, waypoint_order INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  direct_route GEOMETRY;
  direct_distance_km FLOAT;
  max_allowed_distance_km FLOAT;
  waypoint_geom GEOMETRY;
  area JSONB;
  danger_point GEOMETRY;
  buffer_geom GEOMETRY;
  combined_obstacles GEOMETRY;
  route_midpoint GEOMETRY;
  perpendicular_offset GEOMETRY;
  waypoint_count INTEGER := 0;
BEGIN
  -- Create direct route
  direct_route := ST_MakeLine(
    ST_Point(origin_lng, origin_lat),
    ST_Point(dest_lng, dest_lat)
  );
  
  -- Calculate direct distance
  direct_distance_km := ST_Distance(
    ST_Transform(ST_SetSRID(ST_Point(origin_lng, origin_lat), 4326), 3857),
    ST_Transform(ST_SetSRID(ST_Point(dest_lng, dest_lat), 4326), 3857)
  ) / 1000.0;
  
  max_allowed_distance_km := direct_distance_km * max_detour_ratio;
  
  -- Create combined obstacle geometry from all dangerous areas
  combined_obstacles := NULL;
  
  FOR area IN SELECT * FROM jsonb_array_elements(dangerous_areas)
  LOOP
    danger_point := ST_Point(
      (area->>'location_lng')::FLOAT,
      (area->>'location_lat')::FLOAT
    );
    
    buffer_geom := ST_Buffer(
      ST_Transform(ST_SetSRID(danger_point, 4326), 3857),
      ((area->>'buffer_radius_km')::FLOAT + min_clearance_km) * 1000
    );
    
    IF combined_obstacles IS NULL THEN
      combined_obstacles := buffer_geom;
    ELSE
      combined_obstacles := ST_Union(combined_obstacles, buffer_geom);
    END IF;
  END LOOP;
  
  -- If no obstacles or direct route doesn't intersect, return no waypoints
  IF combined_obstacles IS NULL OR NOT ST_Intersects(
    ST_Transform(ST_SetSRID(direct_route, 4326), 3857),
    combined_obstacles
  ) THEN
    RETURN;
  END IF;
  
  -- Generate waypoints by finding route around obstacles
  -- Method 1: Create waypoint at route midpoint, offset perpendicular to avoid obstacles
  route_midpoint := ST_LineInterpolatePoint(direct_route, 0.5);
  
  -- Calculate perpendicular offsets (both sides)
  WITH route_azimuth AS (
    SELECT ST_Azimuth(
      ST_Point(origin_lng, origin_lat),
      ST_Point(dest_lng, dest_lat)
    ) as azimuth
  ),
  offset_points AS (
    SELECT 
      -- Left offset
      ST_Project(
        ST_Transform(ST_SetSRID(route_midpoint, 4326), 3857),
        min_clearance_km * 2000, -- 2x clearance for safety
        azimuth + PI()/2
      ) as left_point,
      -- Right offset  
      ST_Project(
        ST_Transform(ST_SetSRID(route_midpoint, 4326), 3857),
        min_clearance_km * 2000,
        azimuth - PI()/2
      ) as right_point
    FROM route_azimuth
  )
  SELECT 
    CASE 
      -- Choose the offset point that's further from all obstacles
      WHEN ST_Distance(left_point, combined_obstacles) > ST_Distance(right_point, combined_obstacles)
      THEN ST_Transform(left_point, 4326)
      ELSE ST_Transform(right_point, 4326)
    END INTO waypoint_geom
  FROM offset_points;
  
  -- Verify the waypoint creates a viable route within detour limits
  IF ST_Distance(
    ST_Transform(ST_SetSRID(ST_MakeLine(ARRAY[
      ST_Point(origin_lng, origin_lat),
      waypoint_geom,
      ST_Point(dest_lng, dest_lat)
    ]), 4326), 3857)
  ) / 1000.0 <= max_allowed_distance_km THEN
    
    waypoint_count := waypoint_count + 1;
    
    RETURN QUERY SELECT 
      ST_X(waypoint_geom)::FLOAT as waypoint_lng,
      ST_Y(waypoint_geom)::FLOAT as waypoint_lat,
      waypoint_count as waypoint_order;
  END IF;
  
  RETURN;
END;
$$;

-- Enhanced route safety analysis function (simplified version to avoid COALESCE issues)
CREATE OR REPLACE FUNCTION analyze_route_safety_detailed(
  route_coordinates JSONB,
  analysis_buffer_km FLOAT DEFAULT 0.5,
  current_hour INTEGER DEFAULT EXTRACT(HOUR FROM NOW())::INTEGER,
  current_day INTEGER DEFAULT EXTRACT(DOW FROM NOW())::INTEGER,
  max_report_age_hours INTEGER DEFAULT 168
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  route_line GEOMETRY;
  route_buffer GEOMETRY;
  coord JSONB;
  points GEOMETRY[];
  total_risk_score FLOAT := 0;
  risk_level TEXT;
  safety_notes TEXT[] := ARRAY[]::TEXT[];
  dangerous_areas JSONB := '[]'::JSONB;
  safe_features_count INTEGER := 0;
  danger_reports_count INTEGER := 0;
  total_danger_score FLOAT := 0;
  total_safety_score FLOAT := 0;
  i INTEGER;
BEGIN
  -- Convert JSONB coordinates to geometry array
  FOR i IN 0..jsonb_array_length(route_coordinates) - 1
  LOOP
    coord := route_coordinates->i;
    points := array_append(points, ST_Point((coord->>0)::FLOAT, (coord->>1)::FLOAT));
  END LOOP;
  
  -- Create route line from points
  route_line := ST_MakeLine(points);
  
  -- Create buffer around route
  route_buffer := ST_Buffer(
    ST_Transform(ST_SetSRID(route_line, 4326), 3857),
    analysis_buffer_km * 1000
  );
  
  -- Calculate risk scores and counts
  SELECT 
    CASE WHEN SUM(
      CASE 
        WHEN sr.category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity') THEN
          (CASE sr.severity 
            WHEN 'critical' THEN 60
            WHEN 'high' THEN 40  
            WHEN 'medium' THEN 25
            WHEN 'low' THEN 10
            ELSE 20
          END) * 
          (CASE 
            WHEN sr.category = 'unlit_street' AND (current_hour < 6 OR current_hour > 20) THEN 1.5
            WHEN sr.category = 'crime_hotspot' AND (current_hour < 7 OR current_hour > 22) THEN 1.3
            WHEN sr.category IN ('dangerous_area', 'suspicious_activity') AND current_day IN (5, 6) THEN 1.2
            ELSE 1.0
          END) * 
          GREATEST(0.1, 1.0 - EXTRACT(EPOCH FROM (NOW() - sr.created_at)) / 3600.0 / max_report_age_hours) *
          GREATEST(0.1, 1.0 - (ST_Distance(ST_Transform(sr.location, 3857), ST_Transform(ST_SetSRID(route_line, 4326), 3857)) / 1000.0 / analysis_buffer_km))
        ELSE 0
      END
    ) IS NULL THEN 0 ELSE SUM(
      CASE 
        WHEN sr.category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity') THEN
          (CASE sr.severity 
            WHEN 'critical' THEN 60
            WHEN 'high' THEN 40  
            WHEN 'medium' THEN 25
            WHEN 'low' THEN 10
            ELSE 20
          END) * 
          (CASE 
            WHEN sr.category = 'unlit_street' AND (current_hour < 6 OR current_hour > 20) THEN 1.5
            WHEN sr.category = 'crime_hotspot' AND (current_hour < 7 OR current_hour > 22) THEN 1.3
            WHEN sr.category IN ('dangerous_area', 'suspicious_activity') AND current_day IN (5, 6) THEN 1.2
            ELSE 1.0
          END) * 
          GREATEST(0.1, 1.0 - EXTRACT(EPOCH FROM (NOW() - sr.created_at)) / 3600.0 / max_report_age_hours) *
          GREATEST(0.1, 1.0 - (ST_Distance(ST_Transform(sr.location, 3857), ST_Transform(ST_SetSRID(route_line, 4326), 3857)) / 1000.0 / analysis_buffer_km))
        ELSE 0
      END
    ) END,
    COUNT(*) FILTER (WHERE sr.category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity')),
    COUNT(*) FILTER (WHERE sr.category IN ('well_lit_safe', 'police_presence', 'busy_safe_area', 'cctv_monitored'))
  INTO total_danger_score, danger_reports_count, safe_features_count
  FROM safety_reports sr
  WHERE 
    ST_Intersects(
      ST_Transform(sr.location, 3857),
      route_buffer
    )
    AND sr.created_at > NOW() - INTERVAL '1 hour' * max_report_age_hours
    AND (sr.flagged IS FALSE OR sr.flagged IS NULL);
  
  -- Calculate total risk score
  total_risk_score := LEAST(100, GREATEST(0, total_danger_score + total_safety_score));
  
  -- Determine risk level
  risk_level := CASE 
    WHEN total_risk_score >= 75 THEN 'critical'
    WHEN total_risk_score >= 50 THEN 'high'  
    WHEN total_risk_score >= 25 THEN 'medium'
    ELSE 'low'
  END;
  
  -- Generate safety notes
  IF danger_reports_count = 0 THEN
    safety_notes := array_append(safety_notes, 'No recent safety concerns reported along this route');
  ELSE
    safety_notes := array_append(safety_notes, danger_reports_count || ' safety concern(s) reported near this route');
  END IF;
  
  IF safe_features_count > 0 THEN
    safety_notes := array_append(safety_notes, safe_features_count || ' safety feature(s) present along route');
  END IF;
  
  IF current_hour < 6 OR current_hour > 22 THEN
    safety_notes := array_append(safety_notes, 'Route assessed for nighttime conditions');
  END IF;
  
  -- Get dangerous areas near route
  SELECT jsonb_agg(
    jsonb_build_object(
      'lat', ST_Y(sr.location::geometry),
      'lng', ST_X(sr.location::geometry),
      'reason', sr.category || ': ' || sr.title
    )
  ) INTO dangerous_areas
  FROM safety_reports sr
  WHERE 
    ST_Intersects(ST_Transform(sr.location, 3857), route_buffer)
    AND sr.category IN ('dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity')
    AND ST_Distance(ST_Transform(sr.location, 3857), ST_Transform(ST_SetSRID(route_line, 4326), 3857)) / 1000.0 < 0.3
    AND sr.created_at > NOW() - INTERVAL '1 hour' * max_report_age_hours
    AND (sr.flagged IS FALSE OR sr.flagged IS NULL);
  
  -- Return comprehensive safety analysis
  RETURN jsonb_build_object(
    'riskScore', total_risk_score,
    'riskLevel', risk_level,
    'safetyNotes', array_to_json(safety_notes),
    'dangerousAreas', CASE WHEN dangerous_areas IS NULL THEN '[]'::JSONB ELSE dangerous_areas END,
    'metadata', jsonb_build_object(
      'analysisBufferKm', analysis_buffer_km,
      'reportsAnalyzed', danger_reports_count + safe_features_count,
      'dangerousAreasCount', danger_reports_count,
      'safetyFeaturesCount', safe_features_count,
      'timeOfDay', current_hour,
      'dayOfWeek', current_day
    )
  );
END;
$$;

-- Performance indexes for the new functions
CREATE INDEX IF NOT EXISTS idx_safety_reports_location_gist 
  ON safety_reports USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_safety_reports_category_created 
  ON safety_reports (category, created_at);

CREATE INDEX IF NOT EXISTS idx_safety_reports_severity_flagged 
  ON safety_reports (severity, flagged) WHERE flagged IS FALSE OR flagged IS NULL;

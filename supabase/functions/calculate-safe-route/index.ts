import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const rateLimitResult = await checkRateLimit(req, 'calculate-safe-route');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { origin, destination, useSafeRouting = false, profile = 'walking' } = await req.json();
    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return new Response(JSON.stringify({
        error: 'Invalid origin or destination coordinates'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const MAPBOX_API_KEY = Deno.env.get('MAPBOX_API_KEY');
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY environment variable is required');
    }
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    let waypoints = [];
    let safetyAnalysis = null;
    // Generate minimal waypoints if safety routing is enabled
    if (useSafeRouting) {
      console.log('Checking for critical dangers and generating minimal waypoints...');
      waypoints = await generateMinimalSafeWaypoints(supabase, origin, destination);
      console.log(`Generated ${waypoints.length} minimal safety waypoints`);
    }
    // Build Mapbox Directions API request
    const coordinates = [
      [
        origin.lng,
        origin.lat
      ],
      ...waypoints,
      [
        destination.lng,
        destination.lat
      ]
    ];
    const coordinatesString = coordinates.map((coord)=>`${coord[0]},${coord[1]}`).join(';');
    const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}` + `?access_token=${MAPBOX_API_KEY}&geometries=geojson&steps=true&overview=full&alternatives=false`;
    console.log('Calling Mapbox API...');
    const mapboxResponse = await fetch(mapboxUrl);
    if (!mapboxResponse.ok) {
      const errorText = await mapboxResponse.text();
      console.error('Mapbox API error:', errorText);
      throw new Error(`Mapbox API error: ${mapboxResponse.status} ${mapboxResponse.statusText}`);
    }
    const mapboxData = await mapboxResponse.json();
    if (!mapboxData.routes || mapboxData.routes.length === 0) {
      throw new Error('No route found between the specified locations');
    }
    const route = mapboxData.routes[0];
    // Analyze route safety with improved debugging
    if (useSafeRouting) {
      console.log('Analyzing route safety...');
      safetyAnalysis = await analyzeRouteSafetyWithDebug(supabase, route.geometry.coordinates);
    }
    const result = {
      route: {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        instructions: route.legs?.[0]?.steps?.map((step)=>step.maneuver?.instruction).filter(Boolean) || [],
        safetyAnalysis
      },
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      metadata: {
        profile,
        usedSafeRouting: useSafeRouting,
        waypointsGenerated: waypoints.length,
        mapboxCode: mapboxData.code
      }
    };
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0'
      }
    });
  } catch (error) {
    console.error('Error calculating safe route:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
// Helper Functions
function isDangerousCategory(category) {
  const dangerousCategories = [
    'dangerous_area',
    'crime_hotspot',
    'unlit_street',
    'suspicious_activity'
  ];
  return dangerousCategories.includes(category);
}
async function generateMinimalSafeWaypoints(supabase, origin, destination) {
  try {
    // Calculate search bounds with buffer
    const latDiff = Math.abs(destination.lat - origin.lat);
    const lngDiff = Math.abs(destination.lng - origin.lng);
    const buffer = Math.max(latDiff, lngDiff) * 0.5 + 0.01;
    const bounds = {
      north: Math.max(origin.lat, destination.lat) + buffer,
      south: Math.min(origin.lat, destination.lat) - buffer,
      east: Math.max(origin.lng, destination.lng) + buffer,
      west: Math.min(origin.lng, destination.lng) - buffer
    };
    console.log('Searching for safety reports in bounds:', bounds);
    // Get safety reports from database
    const { data: reports, error } = await supabase.rpc('get_reports_in_bounds', {
      sw_lat: bounds.south,
      sw_lng: bounds.west,
      ne_lat: bounds.north,
      ne_lng: bounds.east
    });
    if (error) {
      console.error('Error fetching safety reports:', error);
      return [];
    }
    console.log(`Found ${reports?.length || 0} safety reports`);
    if (!reports || reports.length === 0) {
      return [];
    }
    // Only avoid CRITICAL dangers that are very close to the direct path
    const directPath = [
      [
        origin.lng,
        origin.lat
      ],
      [
        destination.lng,
        destination.lat
      ]
    ];
    const criticalDangersOnPath = reports.filter((report)=>isDangerousCategory(report.category)).filter((report)=>report.severity === 'critical') // ONLY critical - ignore high/medium/low
    .filter((report)=>{
      const distanceToPath = distanceToLineSegment([
        report.location_lng,
        report.location_lat
      ], directPath[0], directPath[1]);
      return distanceToPath < 0.0005; // Only if VERY close (~50m)
    });
    console.log(`Found ${criticalDangersOnPath.length} critical dangers directly on path`);
    if (criticalDangersOnPath.length === 0) {
      return []; // No critical dangers on path - use direct route
    }
    // Create ONE simple waypoint to avoid the critical area
    // Just offset the midpoint slightly to the side
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    // Very small offset - just enough to avoid the immediate danger
    const offsetDistance = 0.0008; // ~80m offset
    const latOffset = destination.lat - origin.lat;
    const lngOffset = destination.lng - origin.lng;
    // Perpendicular offset (much smaller than before)
    const perpLat = -lngOffset * offsetDistance;
    const perpLng = latOffset * offsetDistance;
    // Try left side first, then right if needed
    const leftWaypoint = [
      midLng + perpLng,
      midLat + perpLat
    ];
    const rightWaypoint = [
      midLng - perpLng,
      midLat - perpLat
    ];
    // Choose the side that's further from critical dangers
    const leftDistance = Math.min(...criticalDangersOnPath.map((danger)=>calculateDistance(danger.location_lat, danger.location_lng, leftWaypoint[1], leftWaypoint[0])));
    const rightDistance = Math.min(...criticalDangersOnPath.map((danger)=>calculateDistance(danger.location_lat, danger.location_lng, rightWaypoint[1], rightWaypoint[0])));
    const chosenWaypoint = leftDistance > rightDistance ? leftWaypoint : rightWaypoint;
    console.log('Created single waypoint to avoid critical dangers:', chosenWaypoint);
    return [
      chosenWaypoint
    ];
  } catch (error) {
    console.error('Error generating minimal waypoints:', error);
    return [];
  }
}
async function analyzeRouteSafetyWithDebug(supabase, routeCoordinates) {
  try {
    console.log('Analyzing route safety for coordinates:', routeCoordinates.length, 'points');
    // Use the debug function first
    const { data: debugResult, error } = await supabase.rpc('debug_analyze_route_safety', {
      route_coordinates: routeCoordinates,
      analysis_buffer_km: 0.5
    });
    if (error) {
      console.error('Error in debug analyze route safety:', error);
      throw error;
    }
    console.log('Debug analysis result:', debugResult);
    // Extract the main result and log debug info separately
    const { debug, ...safetyResult } = debugResult;
    console.log('Safety analysis debug info:', debug);
    return safetyResult;
  } catch (error) {
    console.error('Error analyzing route safety:', error);
    return {
      riskScore: 50,
      riskLevel: 'medium',
      safetyNotes: [
        'Unable to analyze route safety - using default risk level. Error: ' + error.message
      ],
      dangerousAreas: []
    };
  }
}
function distanceToLineSegment(point, lineStart, lineEnd) {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    const dpx = point[0] - lineStart[0];
    const dpy = point[1] - lineStart[1];
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }
  const t = Math.max(0, Math.min(1, ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (length * length)));
  const closestX = lineStart[0] + t * dx;
  const closestY = lineStart[1] + t * dy;
  const dpx = point[0] - closestX;
  const dpy = point[1] - closestY;
  return Math.sqrt(dpx * dpx + dpy * dpy);
}
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

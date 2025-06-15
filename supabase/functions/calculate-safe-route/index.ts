import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

// Redeploying function - updated 2025-06-15
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rateLimitResult = await checkRateLimit(req, 'calculate-safe-route');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { origin, destination, useSafeRouting = false, profile = 'walking' } = await req.json();

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return new Response(JSON.stringify({ error: 'Invalid origin or destination coordinates' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const MAPBOX_API_KEY = Deno.env.get('MAPBOX_API_KEY');
    if (!MAPBOX_API_KEY) {
      throw new Error('MAPBOX_API_KEY environment variable is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let waypoints = [];
    let safetyAnalysis = null;

    // First, let's test if we can connect to the database and have reports
    if (useSafeRouting) {
      console.log('Testing database connection and safety reports...');
      const { data: testData, error: testError } = await supabase.rpc('test_safety_reports_exists');
      
      if (testError) {
        console.error('Database test error:', testError);
      } else {
        console.log('Database test results:', testData);
      }
    }

    // Generate safe waypoints if safety routing is enabled
    if (useSafeRouting) {
      console.log('Generating safe waypoints...');
      waypoints = await generateSafeWaypoints(supabase, origin, destination);
      console.log(`Generated ${waypoints.length} safety waypoints`);
    }

    // Build Mapbox Directions API request
    const coordinates = [
      [origin.lng, origin.lat],
      ...waypoints,
      [destination.lng, destination.lat]
    ];

    const coordinatesString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
    const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}` +
      `?access_token=${MAPBOX_API_KEY}&geometries=geojson&steps=true&overview=full&alternatives=false`;

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
        instructions: route.legs?.[0]?.steps?.map(step => step.maneuver?.instruction).filter(Boolean) || [],
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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

async function generateSafeWaypoints(supabase, origin, destination) {
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

    // Use the corrected function that matches your schema
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

    // Create buffer zones for dangerous areas
    const bufferZones = reports
      .filter(report => isDangerousCategory(report.category))
      .map(report => ({
        lat: report.location_lat,
        lng: report.location_lng,
        radius: getBufferRadius(report.category, report.severity),
        severity: report.severity,
        category: report.category
      }));

    console.log(`Created ${bufferZones.length} buffer zones from dangerous areas`);

    if (bufferZones.length === 0) {
      return [];
    }

    // Calculate detour waypoints to avoid buffer zones
    const waypoints = calculateDetourWaypointsWithBuffers(origin, destination, bufferZones);
    console.log('Generated waypoints:', waypoints.length);
    
    return waypoints;
  } catch (error) {
    console.error('Error generating safe waypoints:', error);
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
      safetyNotes: ['Unable to analyze route safety - using default risk level. Error: ' + error.message],
      dangerousAreas: []
    };
  }
}

function getBufferRadius(category, severity) {
  // Safe categories don't create buffer zones
  const safeCategories = ['well_lit_safe', 'police_presence', 'busy_safe_area'];
  if (safeCategories.includes(category)) {
    return 0;
  }

  // Buffer radius in kilometers based on severity
  switch(severity) {
    case 'low': return 0.1; // 100m
    case 'medium': return 0.2; // 200m
    case 'high': return 0.3; // 300m
    case 'critical': return 0.5; // 500m
    default: return 0.15; // 150m
  }
}

function calculateDetourWaypointsWithBuffers(origin, destination, bufferZones) {
  const waypoints = [];
  
  // Check if direct path intersects with any buffer zones
  const directPath = [
    [origin.lng, origin.lat],
    [destination.lng, destination.lat]
  ];
  
  const conflictingZones = bufferZones.filter(zone => {
    const distanceToPath = distanceToLineSegment(
      [zone.lng, zone.lat],
      directPath[0],
      directPath[1]
    );
    return distanceToPath < zone.radius;
  });
  
  if (conflictingZones.length === 0) {
    return waypoints; // No buffer zones intersect with direct route
  }
  
  console.log('Found conflicting buffer zones:', conflictingZones.length);
  
  // Create waypoints to go around buffer zones
  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  
  // Calculate perpendicular offset to avoid buffer zones
  const latOffset = destination.lat - origin.lat;
  const lngOffset = destination.lng - origin.lng;
  
  // Find the maximum buffer radius in conflicting zones
  const maxBufferRadius = Math.max(...conflictingZones.map(zone => zone.radius));
  
  // Create detour distance based on largest buffer zone plus safety margin
  const detourDistance = maxBufferRadius + 0.002; // Add 200m safety margin
  const perpLat = -lngOffset * detourDistance;
  const perpLng = latOffset * detourDistance;
  
  const leftDetour = [midLng + perpLng, midLat + perpLat];
  const rightDetour = [midLng - perpLng, midLat - perpLat];
  
  // Choose the detour point that's further from all buffer zones
  const leftMinDistance = Math.min(...conflictingZones.map(zone => 
    calculateDistance(zone.lat, zone.lng, leftDetour[1], leftDetour[0])
  ));
  
  const rightMinDistance = Math.min(...conflictingZones.map(zone => 
    calculateDistance(zone.lat, zone.lng, rightDetour[1], rightDetour[0])
  ));
  
  // Add the safer detour point as a waypoint
  if (leftMinDistance > rightMinDistance) {
    waypoints.push(leftDetour);
  } else {
    waypoints.push(rightDetour);
  }
  
  return waypoints;
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
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

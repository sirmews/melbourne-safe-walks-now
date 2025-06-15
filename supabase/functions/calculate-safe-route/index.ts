
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  useSafeRouting?: boolean;
  profile?: 'walking' | 'driving' | 'cycling';
  maxDetourRatio?: number;
}

interface SafetyAnalysis {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  safetyNotes: string[];
  dangerousAreas: { lat: number; lng: number; reason: string }[];
  metadata?: {
    analysisBufferKm: number;
    reportsAnalyzed: number;
    dangerousAreasCount: number;
    safetyFeaturesCount: number;
    timeOfDay: number;
    dayOfWeek: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitResult = await checkRateLimit(req, 'calculate-safe-route');
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { origin, destination, useSafeRouting = false, profile = 'walking', maxDetourRatio = 1.5 }: RouteRequest = await req.json();

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

    let waypoints: [number, number][] = [];
    let safetyAnalysis: SafetyAnalysis | null = null;

    // Generate safe waypoints using PostGIS spatial analysis
    if (useSafeRouting) {
      console.log('Generating safe waypoints with PostGIS...');
      waypoints = await generateSafeWaypointsPostGIS(supabase, origin, destination, maxDetourRatio);
      console.log(`Generated ${waypoints.length} safety waypoints`);
    }

    // Build Mapbox Directions API request
    const coordinates = [
      [origin.lng, origin.lat],
      ...waypoints,
      [destination.lng, destination.lat]
    ];

    const coordinatesString = coordinates
      .map(coord => `${coord[0]},${coord[1]}`)
      .join(';');

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

    // Analyze route safety using PostGIS
    if (useSafeRouting) {
      console.log('Analyzing route safety with PostGIS...');
      safetyAnalysis = await analyzeRouteSafetyPostGIS(supabase, route.geometry.coordinates);
    }

    const result = {
      route: {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        instructions: route.legs?.[0]?.steps?.map((step: any) => step.maneuver?.instruction).filter(Boolean) || [],
        safetyAnalysis
      },
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      metadata: {
        profile,
        usedSafeRouting: useSafeRouting,
        waypointsGenerated: waypoints.length,
        mapboxCode: mapboxData.code,
        enhancedAnalysis: useSafeRouting
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

// Enhanced PostGIS-based waypoint generation
async function generateSafeWaypointsPostGIS(
  supabase: any,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  maxDetourRatio: number = 1.5
): Promise<[number, number][]> {
  try {
    const currentHour = new Date().getHours();
    
    // Use PostGIS to find dangerous areas along the direct route corridor
    const { data: dangerousAreas, error } = await supabase.rpc('find_dangerous_areas_along_route', {
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_lat: destination.lat,
      dest_lng: destination.lng,
      corridor_width_km: 1.0, // 1km corridor on each side
      current_hour: currentHour,
      max_report_age_hours: 168 // 1 week
    });

    if (error) {
      console.error('Error finding dangerous areas:', error);
      return [];
    }

    if (!dangerousAreas || dangerousAreas.length === 0) {
      console.log('No dangerous areas found along route');
      return [];
    }

    console.log(`Found ${dangerousAreas.length} dangerous areas along route`);

    // Convert dangerous areas to JSONB format for waypoint generation
    const dangerousAreasJsonb = dangerousAreas.map((area: any) => ({
      location_lat: area.location_lat,
      location_lng: area.location_lng,
      buffer_radius_km: area.buffer_radius_km,
      weighted_risk_score: area.weighted_risk_score
    }));

    // Generate waypoints to avoid dangerous areas using PostGIS
    const { data: waypoints, error: waypointError } = await supabase.rpc('generate_avoidance_waypoints', {
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      dest_lat: destination.lat,
      dest_lng: destination.lng,
      dangerous_areas: dangerousAreasJsonb,
      max_detour_ratio: maxDetourRatio,
      min_clearance_km: 0.2 // 200m minimum clearance from danger zones
    });

    if (waypointError) {
      console.error('Error generating waypoints:', waypointError);
      return [];
    }

    if (!waypoints || waypoints.length === 0) {
      return [];
    }

    return waypoints
      .sort((a: any, b: any) => a.waypoint_order - b.waypoint_order)
      .map((wp: any) => [wp.waypoint_lng, wp.waypoint_lat]);

  } catch (error) {
    console.error('Error in generateSafeWaypointsPostGIS:', error);
    return [];
  }
}

// Enhanced PostGIS-based safety analysis
async function analyzeRouteSafetyPostGIS(supabase: any, routeCoordinates: [number, number][]): Promise<SafetyAnalysis> {
  try {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    
    // Convert route coordinates to PostGIS LineString and analyze
    const { data: safetyData, error } = await supabase.rpc('analyze_route_safety_detailed', {
      route_coordinates: routeCoordinates,
      analysis_buffer_km: 0.5, // 500m buffer around route
      current_hour: currentHour,
      current_day: currentDay,
      max_report_age_hours: 168 // 1 week
    });

    if (error) {
      console.error('Error analyzing route safety:', error);
      return {
        riskScore: 50,
        riskLevel: 'medium',
        safetyNotes: ['Unable to analyze route safety - using default risk level'],
        dangerousAreas: []
      };
    }

    if (!safetyData) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        safetyNotes: ['No safety data available for this route'],
        dangerousAreas: []
      };
    }

    return {
      riskScore: safetyData.riskScore || 0,
      riskLevel: safetyData.riskLevel || 'low',
      safetyNotes: safetyData.safetyNotes || [],
      dangerousAreas: safetyData.dangerousAreas || [],
      metadata: safetyData.metadata
    };

  } catch (error) {
    console.error('Error in analyzeRouteSafetyPostGIS:', error);
    return {
      riskScore: 50,
      riskLevel: 'medium',
      safetyNotes: ['Unable to analyze route safety - using default risk level'],
      dangerousAreas: []
    };
  }
}

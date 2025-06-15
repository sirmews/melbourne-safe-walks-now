
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  useSafeRouting?: boolean;
  profile?: 'walking' | 'driving' | 'cycling';
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

    const { origin, destination, useSafeRouting = false, profile = 'walking' }: RouteRequest = await req.json();

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

    // Generate safe waypoints if safety routing is enabled using new DB functions
    if (useSafeRouting) {
      console.log('Finding dangerous areas along route using database function...');
      
      // Find dangerous areas along the route corridor
      const { data: dangerousAreas, error: dangerError } = await supabase.rpc('find_dangerous_areas_along_route', {
        origin_lat: origin.lat,
        origin_lng: origin.lng,
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        corridor_width_km: 1.0,
        current_hour: new Date().getHours(),
        max_report_age_hours: 168
      });

      if (dangerError) {
        console.error('Error finding dangerous areas:', dangerError);
      } else if (dangerousAreas && dangerousAreas.length > 0) {
        console.log(`Found ${dangerousAreas.length} dangerous areas along route`);
        
        // Convert dangerous areas to JSONB format for waypoint generation
        const dangerousAreasJsonb = dangerousAreas.map(area => ({
          location_lat: area.location_lat,
          location_lng: area.location_lng,
          buffer_radius_km: area.buffer_radius_km,
          weighted_risk_score: area.weighted_risk_score
        }));

        // Generate avoidance waypoints using database function
        const { data: generatedWaypoints, error: waypointError } = await supabase.rpc('generate_avoidance_waypoints', {
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          dangerous_areas: dangerousAreasJsonb,
          max_detour_ratio: 1.5,
          min_clearance_km: 0.2
        });

        if (waypointError) {
          console.error('Error generating waypoints:', waypointError);
        } else if (generatedWaypoints && generatedWaypoints.length > 0) {
          waypoints = generatedWaypoints
            .sort((a, b) => a.waypoint_order - b.waypoint_order)
            .map(wp => [wp.waypoint_lng, wp.waypoint_lat]);
          console.log(`Generated ${waypoints.length} avoidance waypoints`);
        }
      }
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

    // Analyze route safety using enhanced database function
    if (useSafeRouting) {
      console.log('Analyzing route safety using database function...');
      
      const { data: analysisResult, error: analysisError } = await supabase.rpc('analyze_route_safety_detailed', {
        route_coordinates: route.geometry.coordinates,
        analysis_buffer_km: 0.5,
        current_hour: new Date().getHours(),
        current_day: new Date().getDay(),
        max_report_age_hours: 168
      });

      if (analysisError) {
        console.error('Error analyzing route safety:', analysisError);
        safetyAnalysis = {
          riskScore: 50,
          riskLevel: 'medium',
          safetyNotes: ['Unable to analyze route safety - using default risk level'],
          dangerousAreas: []
        };
      } else if (analysisResult) {
        console.log('Route safety analysis completed:', analysisResult);
        safetyAnalysis = {
          riskScore: analysisResult.riskScore || 0,
          riskLevel: analysisResult.riskLevel || 'low',
          safetyNotes: analysisResult.safetyNotes || [],
          dangerousAreas: analysisResult.dangerousAreas || [],
          metadata: analysisResult.metadata
        };
      }
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

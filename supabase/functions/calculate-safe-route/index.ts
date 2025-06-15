
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimit } from '../_shared/rateLimit.ts'

interface RouteRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  useSafeRouting?: boolean;
  profile?: 'walking' | 'driving' | 'cycling';
}

interface SafetyReport {
  id: string;
  location_lat: number;
  location_lng: number;
  category: string;
  severity: string;
  title: string;
  description?: string;
}

interface SafetyAnalysis {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  safetyNotes: string[];
  dangerousAreas: { lat: number; lng: number; reason: string }[];
}

interface BufferZone {
  lat: number;
  lng: number;
  radius: number;
  severity: string;
  category: string;
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

    // Analyze route safety
    if (useSafeRouting) {
      console.log('Analyzing route safety...');
      safetyAnalysis = await analyzeRouteSafety(supabase, route.geometry.coordinates);
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

function isDangerousCategory(category: string): boolean {
  const dangerousCategories = ['dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity'];
  return dangerousCategories.includes(category);
}

function getBufferRadius(category: string, severity: string): number {
  // Safe categories don't create buffer zones
  const safeCategories = ['well_lit_safe', 'police_presence', 'busy_safe_area', 'cctv_monitored', 'emergency_phone'];
  if (safeCategories.includes(category)) {
    return 0;
  }

  // Buffer radius in kilometers based on severity
  switch (severity) {
    case 'low': return 0.1; // 100m
    case 'medium': return 0.2; // 200m
    case 'high': return 0.3; // 300m
    case 'critical': return 0.5; // 500m
    default: return 0.15; // 150m
  }
}

async function generateSafeWaypoints(
  supabase: any,
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<[number, number][]> {
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

    // Get safety reports in the area
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
    const bufferZones: BufferZone[] = reports
      .filter((report: SafetyReport) => isDangerousCategory(report.category))
      .map((report: SafetyReport) => ({
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

async function analyzeRouteSafety(supabase: any, routeCoordinates: [number, number][]): Promise<SafetyAnalysis> {
  try {
    console.log('Analyzing route safety for coordinates:', routeCoordinates.length, 'points');
    
    // Create a buffer around the route to check for nearby safety reports
    const routeBounds = getRouteBounds(routeCoordinates);
    const buffer = 0.01; // ~1km buffer around route
    
    console.log('Route bounds:', routeBounds);
    
    const { data: reports, error } = await supabase.rpc('get_reports_in_bounds', {
      sw_lat: routeBounds.south - buffer,
      sw_lng: routeBounds.west - buffer,
      ne_lat: routeBounds.north + buffer,
      ne_lng: routeBounds.east + buffer
    });

    if (error) {
      console.error('Error fetching safety reports:', error);
      throw error;
    }

    console.log('Found safety reports for analysis:', reports?.length || 0);
    
    return calculateSafetyMetrics(reports || [], routeCoordinates);
  } catch (error) {
    console.error('Error analyzing route safety:', error);
    return {
      riskScore: 50,
      riskLevel: 'medium',
      safetyNotes: ['Unable to analyze route safety - using default risk level'],
      dangerousAreas: []
    };
  }
}

function getRouteBounds(coordinates: [number, number][]) {
  const lats = coordinates.map(coord => coord[1]);
  const lngs = coordinates.map(coord => coord[0]);
  
  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
}

function calculateSafetyMetrics(reports: SafetyReport[], routeCoordinates: [number, number][]): SafetyAnalysis {
  const dangerousAreas: { lat: number; lng: number; reason: string }[] = [];
  const safetyNotes: string[] = [];
  let riskScore = 0;

  console.log('Calculating safety metrics for', reports.length, 'reports');

  // If no reports found, assign a neutral risk score
  if (reports.length === 0) {
    console.log('No safety reports found in area - assigning neutral risk');
    return {
      riskScore: 30,
      riskLevel: 'low',
      safetyNotes: ['No safety reports found in this area'],
      dangerousAreas: []
    };
  }

  // Analyze each report's impact on the route
  reports.forEach(report => {
    const distance = getMinDistanceToRoute(
      [report.location_lng, report.location_lat],
      routeCoordinates
    );

    console.log(`Report ${report.id}: category=${report.category}, severity=${report.severity}, distance=${distance}`);

    // Consider reports within 500m of the route
    if (distance < 0.005) {
      const impact = getSeverityImpact(report.severity, distance);
      
      if (isDangerousCategory(report.category)) {
        riskScore += impact;
        dangerousAreas.push({
          lat: report.location_lat,
          lng: report.location_lng,
          reason: `${report.category.replace('_', ' ')}: ${report.title}`
        });
        console.log(`Added dangerous area: ${report.title}, impact: ${impact}`);
      } else if (['well_lit_safe', 'police_presence', 'busy_safe_area', 'cctv_monitored'].includes(report.category)) {
        riskScore -= impact * 0.5; // Positive areas reduce risk
        safetyNotes.push(`Safe area: ${report.title}`);
        console.log(`Added safe area: ${report.title}, risk reduction: ${impact * 0.5}`);
      }
    }
  });

  // Normalize risk score to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));

  const riskLevel = 
    riskScore >= 75 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'medium' : 'low';

  console.log(`Final risk calculation: score=${riskScore}, level=${riskLevel}`);

  return {
    riskScore,
    riskLevel,
    safetyNotes: safetyNotes.slice(0, 3),
    dangerousAreas: dangerousAreas.slice(0, 5)
  };
}

function getSeverityImpact(severity: string, distance: number): number {
  const severityMultiplier = {
    low: 10,
    medium: 25,
    high: 40,
    critical: 60
  }[severity] || 25;

  // Closer reports have more impact
  const distanceMultiplier = Math.max(0.1, 1 - (distance / 0.005));
  
  return severityMultiplier * distanceMultiplier;
}

function getMinDistanceToRoute(point: [number, number], routeCoordinates: [number, number][]): number {
  let minDistance = Infinity;
  
  for (let i = 0; i < routeCoordinates.length - 1; i++) {
    const distance = distanceToLineSegment(
      point,
      routeCoordinates[i],
      routeCoordinates[i + 1]
    );
    minDistance = Math.min(minDistance, distance);
  }
  
  return minDistance;
}

function distanceToLineSegment(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
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

function calculateDetourWaypointsWithBuffers(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  bufferZones: BufferZone[]
): [number, number][] {
  const waypoints: [number, number][] = [];
  
  // Check if direct path intersects with any buffer zones
  const directPath: [number, number][] = [
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
  const latOffset = (destination.lat - origin.lat);
  const lngOffset = (destination.lng - origin.lng);
  
  // Find the maximum buffer radius in conflicting zones
  const maxBufferRadius = Math.max(...conflictingZones.map(zone => zone.radius));
  
  // Create detour distance based on largest buffer zone plus safety margin
  const detourDistance = maxBufferRadius + 0.002; // Add 200m safety margin
  const perpLat = -lngOffset * detourDistance;
  const perpLng = latOffset * detourDistance;
  
  const leftDetour = [midLng + perpLng, midLat + perpLat] as [number, number];
  const rightDetour = [midLng - perpLng, midLat - perpLat] as [number, number];
  
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

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

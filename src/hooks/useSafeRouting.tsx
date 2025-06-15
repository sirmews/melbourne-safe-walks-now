
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface SafetyAnalysis {
  riskScore: number; // 0-100, where 100 is highest risk
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  safetyNotes: string[];
  dangerousAreas: { lat: number; lng: number; reason: string }[];
}

export const useSafeRouting = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeRouteSafety = async (routeCoordinates: [number, number][]): Promise<SafetyAnalysis> => {
    setIsAnalyzing(true);
    
    try {
      // Create a buffer around the route to check for nearby safety reports
      const routeBounds = getRouteBounds(routeCoordinates);
      const buffer = 0.005; // ~500m buffer around route
      
      const { data: reports, error } = await supabase.rpc('get_reports_in_bounds', {
        sw_lat: routeBounds.south - buffer,
        sw_lng: routeBounds.west - buffer,
        ne_lat: routeBounds.north + buffer,
        ne_lng: routeBounds.east + buffer
      });

      if (error) throw error;

      return calculateSafetyMetrics(reports || [], routeCoordinates);
    } catch (error) {
      console.error('Error analyzing route safety:', error);
      return {
        riskScore: 50,
        riskLevel: 'medium',
        safetyNotes: ['Unable to analyze route safety'],
        dangerousAreas: []
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateSafeWaypoints = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<[number, number][]> => {
    // Get area bounds between origin and destination
    const bounds = {
      north: Math.max(origin.lat, destination.lat) + 0.01,
      south: Math.min(origin.lat, destination.lat) - 0.01,
      east: Math.max(origin.lng, destination.lng) + 0.01,
      west: Math.min(origin.lng, destination.lng) + 0.01
    };

    try {
      const { data: reports, error } = await supabase.rpc('get_reports_in_bounds', {
        sw_lat: bounds.south,
        sw_lng: bounds.west,
        ne_lat: bounds.north,
        ne_lng: bounds.east
      });

      if (error) throw error;

      // Find safe areas (positive safety reports)
      const safeAreas = (reports || []).filter(report => 
        ['well_lit_safe', 'police_presence', 'busy_safe_area'].includes(report.category)
      );

      // Find dangerous areas to avoid
      const dangerousAreas = (reports || []).filter(report => 
        ['dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity'].includes(report.category) &&
        ['high', 'critical'].includes(report.severity)
      );

      // Generate waypoints that go through safe areas and avoid dangerous ones
      return calculateOptimalWaypoints(origin, destination, safeAreas, dangerousAreas);
    } catch (error) {
      console.error('Error generating safe waypoints:', error);
      return [];
    }
  };

  return {
    analyzeRouteSafety,
    generateSafeWaypoints,
    isAnalyzing
  };
};

// Helper functions
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

function calculateSafetyMetrics(
  reports: SafetyReport[], 
  routeCoordinates: [number, number][]
): SafetyAnalysis {
  const dangerousAreas: { lat: number; lng: number; reason: string }[] = [];
  const safetyNotes: string[] = [];
  let riskScore = 0;

  // Analyze each report's impact on the route
  reports.forEach(report => {
    const distance = getMinDistanceToRoute(
      [report.location_lng, report.location_lat],
      routeCoordinates
    );

    // Only consider reports within 200m of the route
    if (distance < 0.002) {
      const impact = getSeverityImpact(report.severity, distance);
      
      if (['dangerous_area', 'crime_hotspot', 'unlit_street', 'suspicious_activity'].includes(report.category)) {
        riskScore += impact;
        dangerousAreas.push({
          lat: report.location_lat,
          lng: report.location_lng,
          reason: `${report.category.replace('_', ' ')}: ${report.title}`
        });
      } else if (['well_lit_safe', 'police_presence', 'busy_safe_area'].includes(report.category)) {
        riskScore -= impact * 0.5; // Positive areas reduce risk
        safetyNotes.push(`Safe area: ${report.title}`);
      }
    }
  });

  // Normalize risk score to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));

  const riskLevel = 
    riskScore >= 75 ? 'critical' :
    riskScore >= 50 ? 'high' :
    riskScore >= 25 ? 'medium' : 'low';

  return {
    riskScore,
    riskLevel,
    safetyNotes: safetyNotes.slice(0, 3), // Limit to 3 notes
    dangerousAreas: dangerousAreas.slice(0, 5) // Limit to 5 areas
  };
}

function getSeverityImpact(severity: string, distance: number): number {
  const severityMultiplier = {
    low: 5,
    medium: 15,
    high: 30,
    critical: 50
  }[severity] || 15;

  // Closer reports have more impact
  const distanceMultiplier = Math.max(0.1, 1 - (distance / 0.002));
  
  return severityMultiplier * distanceMultiplier;
}

function getMinDistanceToRoute(
  point: [number, number], 
  routeCoordinates: [number, number][]
): number {
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
  // Simple distance calculation (not geographically accurate but sufficient for this use)
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

function calculateOptimalWaypoints(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  safeAreas: SafetyReport[],
  dangerousAreas: SafetyReport[]
): [number, number][] {
  const waypoints: [number, number][] = [];
  
  // Simple approach: if there are dangerous areas between origin and destination,
  // try to route through safe areas
  if (dangerousAreas.length > 0 && safeAreas.length > 0) {
    // Find safe areas that are roughly between origin and destination
    const midLat = (origin.lat + destination.lat) / 2;
    const midLng = (origin.lng + destination.lng) / 2;
    
    const nearbyThreshold = 0.01; // ~1km
    const nearbySafeAreas = safeAreas.filter(area => {
      const distanceToMid = Math.sqrt(
        Math.pow(area.location_lat - midLat, 2) + 
        Math.pow(area.location_lng - midLng, 2)
      );
      return distanceToMid < nearbyThreshold;
    });
    
    // Add the best safe area as a waypoint
    if (nearbySafeAreas.length > 0) {
      const bestSafeArea = nearbySafeAreas[0]; // Could be improved with better selection logic
      waypoints.push([bestSafeArea.location_lng, bestSafeArea.location_lat]);
    }
  }
  
  return waypoints;
}

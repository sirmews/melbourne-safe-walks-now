
import { useState } from 'react';
import { toast } from 'sonner';
import { useSafeRouting } from './useSafeRouting';

export interface JourneyPoint {
  lat: number;
  lng: number;
  address?: string;
}

export interface Route {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  instructions?: string[];
  safetyAnalysis?: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    safetyNotes: string[];
    dangerousAreas: { lat: number; lng: number; reason: string }[];
  };
}

// Get the Mapbox API key from environment variables
const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY || 'pk.eyJ1Ijoic2lybWV3cyIsImEiOiJjbWJ4MGFzYXYxNGNxMm1wdWFkcDh3NGFqIn0.pm0S2cGStEHWbhcOCOtJgA';

export const useJourneyPlanner = () => {
  const [origin, setOrigin] = useState<JourneyPoint | null>(null);
  const [destination, setDestination] = useState<JourneyPoint | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [useSafeRouting, setUseSafeRouting] = useState(true);

  const { analyzeRouteSafety, generateSafeWaypoints, isAnalyzing } = useSafeRouting();

  const calculateRoute = async () => {
    if (!origin || !destination) {
      toast.error('Please set both origin and destination');
      return;
    }

    if (!MAPBOX_API_KEY || MAPBOX_API_KEY === 'pk.your_mapbox_token_here') {
      toast.error('Mapbox API key is not configured. Please set VITE_MAPBOX_API_KEY in your environment variables.');
      console.error('Mapbox API key is missing. Make sure to set VITE_MAPBOX_API_KEY in your environment variables.');
      return;
    }

    setIsLoading(true);
    try {
      let waypoints: [number, number][] = [];
      
      // Generate safe waypoints if safety routing is enabled
      if (useSafeRouting) {
        waypoints = await generateSafeWaypoints(origin, destination);
      }

      // Build the routing URL with waypoints
      const coordinates = [
        [origin.lng, origin.lat],
        ...waypoints,
        [destination.lng, destination.lat]
      ];
      
      const coordinatesString = coordinates
        .map(coord => `${coord[0]},${coord[1]}`)
        .join(';');

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinatesString}?access_token=${MAPBOX_API_KEY}&geometries=geojson&steps=true&overview=full`
      );
      
      console.log('Route request URL:', `https://api.mapbox.com/directions/v5/mapbox/walking/${coordinatesString}?access_token=${MAPBOX_API_KEY}&geometries=geojson&steps=true&overview=full`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Mapbox Directions API error:', errorText);
        throw new Error(`Route calculation failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Route response data:', data);

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        
        // Extract turn-by-turn instructions if available
        const instructions = routeData.legs?.[0]?.steps?.map((step: any) => step.maneuver?.instruction).filter(Boolean) || [];
        
        // Analyze route safety
        const safetyAnalysis = await analyzeRouteSafety(routeData.geometry.coordinates);
        
        const newRoute: Route = {
          coordinates: routeData.geometry.coordinates,
          distance: routeData.distance,
          duration: routeData.duration,
          instructions,
          safetyAnalysis
        };

        setRoute(newRoute);
        
        // Show safety-aware success message
        if (useSafeRouting && waypoints.length > 0) {
          toast.success(`Safe route calculated with ${waypoints.length} safety waypoint(s)`);
        } else {
          toast.success('Route calculated successfully');
        }

        // Warn about high-risk routes
        if (safetyAnalysis.riskLevel === 'high' || safetyAnalysis.riskLevel === 'critical') {
          toast.warning(`Route has ${safetyAnalysis.riskLevel} safety risk. Consider alternative routes.`);
        }
      } else {
        throw new Error('No route found between the selected locations.');
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error(`Failed to calculate route: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setOrigin(null);
    setDestination(null);
  };

  // Helper function to get a short address from coordinates using Mapbox Geocoding API
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    if (!MAPBOX_API_KEY || MAPBOX_API_KEY === 'pk.your_mapbox_token_here') {
      console.error('Mapbox API key is missing');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_API_KEY}&limit=1&country=au`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return feature.place_name || feature.text || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  return {
    origin,
    destination,
    route,
    isLoading: isLoading || isAnalyzing,
    useSafeRouting,
    setOrigin,
    setDestination,
    setUseSafeRouting,
    calculateRoute,
    clearRoute,
    getAddressFromCoordinates
  };
};


import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  const [isSafeRoutingEnabled, setIsSafeRoutingEnabled] = useState(true);

  // Clear route when origin or destination changes
  const handleSetOrigin = (point: JourneyPoint | null) => {
    console.log('Setting new origin:', point);
    setOrigin(point);
    // Clear existing route when origin changes
    if (route) {
      console.log('Clearing route due to origin change');
      setRoute(null);
    }
  };

  const handleSetDestination = (point: JourneyPoint | null) => {
    console.log('Setting new destination:', point);
    setDestination(point);
    // Clear existing route when destination changes
    if (route) {
      console.log('Clearing route due to destination change');
      setRoute(null);
    }
  };

  const calculateRoute = async () => {
    if (!origin || !destination) {
      toast.error('Please set both origin and destination');
      return;
    }

    setIsLoading(true);
    console.log('Starting route calculation...', { origin, destination });
    
    try {
      // Clear existing route first
      setRoute(null);
      
      console.log('Calculating route using Edge Function...');
      
      // Call the server-side Edge Function for route calculation
      const { data, error } = await supabase.functions.invoke('calculate-safe-route', {
        body: {
          origin,
          destination,
          useSafeRouting: isSafeRoutingEnabled,
          profile: 'walking'
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to calculate route');
      }

      if (!data || !data.route) {
        throw new Error('No route data returned from server');
      }

      console.log('Route calculated successfully:', data);

      const newRoute: Route = {
        coordinates: data.route.coordinates,
        distance: data.route.distance,
        duration: data.route.duration,
        instructions: data.route.instructions,
        safetyAnalysis: data.route.safetyAnalysis
      };

      console.log('Setting new route:', newRoute);
      setRoute(newRoute);
      
      // Show success message based on safety routing
      if (isSafeRoutingEnabled && data.waypoints && data.waypoints.length > 0) {
        toast.success(`Safe route calculated with ${data.waypoints.length} safety waypoint(s)`);
      } else {
        toast.success('Route calculated successfully');
      }

      // Warn about high-risk routes
      if (data.route.safetyAnalysis) {
        const { riskLevel } = data.route.safetyAnalysis;
        if (riskLevel === 'high' || riskLevel === 'critical') {
          toast.warning(`Route has ${riskLevel} safety risk. Consider alternative routes.`);
        }
      }
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error(`Failed to calculate route: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setRoute(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoute = () => {
    console.log('Clearing all journey data');
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
    isLoading,
    useSafeRouting: isSafeRoutingEnabled,
    setOrigin: handleSetOrigin,
    setDestination: handleSetDestination,
    setUseSafeRouting: setIsSafeRoutingEnabled,
    calculateRoute,
    clearRoute,
    getAddressFromCoordinates
  };
};

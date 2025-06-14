
import { useState } from 'react';
import { toast } from 'sonner';

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
}

// Get the MapTiler API key from environment variables
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || 'trIkgoZsSgH2Ht8MXmzd';

export const useJourneyPlanner = () => {
  const [origin, setOrigin] = useState<JourneyPoint | null>(null);
  const [destination, setDestination] = useState<JourneyPoint | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const calculateRoute = async () => {
    if (!origin || !destination) {
      toast.error('Please set both origin and destination');
      return;
    }

    if (!MAPTILER_API_KEY) {
      toast.error('MapTiler API key is not configured.');
      console.error('MapTiler API key is missing. Make sure to set VITE_MAPTILER_API_KEY in your environment variables.');
      return;
    }

    setIsLoading(true);
    try {
      // Use the MapTiler Directions API for walking
      const response = await fetch(
        `https://api.maptiler.com/routes/walking/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&steps=true&key=${MAPTILER_API_KEY}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to calculate route');
      }

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const routeData = data.routes[0];
        
        // Extract turn-by-turn instructions if available
        const instructions = routeData.legs?.[0]?.steps?.map((step: any) => step.instruction).filter(Boolean) || [];
        
        setRoute({
          coordinates: routeData.geometry.coordinates,
          distance: routeData.distance,
          duration: routeData.duration,
          instructions
        });
        
        toast.success('Route calculated successfully');
      } else {
        throw new Error('No route found.');
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

  // Helper function to get a short address from coordinates
  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${MAPTILER_API_KEY}&language=en`
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
    setOrigin,
    setDestination,
    calculateRoute,
    clearRoute,
    getAddressFromCoordinates
  };
};

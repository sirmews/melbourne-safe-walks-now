
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

// Get the Mapbox API key from environment variables
const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY || 'pk.your_mapbox_token_here';

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

    if (!MAPBOX_API_KEY || MAPBOX_API_KEY === 'pk.your_mapbox_token_here') {
      toast.error('Mapbox API key is not configured. Please set VITE_MAPBOX_API_KEY in your environment variables.');
      console.error('Mapbox API key is missing. Make sure to set VITE_MAPBOX_API_KEY in your environment variables.');
      return;
    }

    setIsLoading(true);
    try {
      // Use Mapbox Directions API for walking directions
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${MAPBOX_API_KEY}&geometries=geojson&steps=true&overview=full`
      );
      
      console.log('Route request URL:', `https://api.mapbox.com/directions/v5/mapbox/walking/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${MAPBOX_API_KEY}&geometries=geojson&steps=true&overview=full`);
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
        
        setRoute({
          coordinates: routeData.geometry.coordinates,
          distance: routeData.distance,
          duration: routeData.duration,
          instructions
        });
        
        toast.success('Route calculated successfully');
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
    isLoading,
    setOrigin,
    setDestination,
    calculateRoute,
    clearRoute,
    getAddressFromCoordinates
  };
};

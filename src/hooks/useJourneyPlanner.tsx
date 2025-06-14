
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
}

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

    setIsLoading(true);
    try {
      // Using MapTiler Routing API (free tier available)
      // You'll need to get your API key from https://cloud.maptiler.com/
      const MAPTILER_API_KEY = 'get_your_key_at_maptiler_dot_com';
      
      const response = await fetch(
        `https://api.maptiler.com/routing/walking/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?key=${MAPTILER_API_KEY}&overview=full&geometries=geojson`
      );
      
      if (!response.ok) {
        throw new Error('Failed to calculate route');
      }

      const data = await response.json();
      const routeData = data.routes[0];
      
      setRoute({
        coordinates: routeData.geometry.coordinates,
        distance: routeData.distance,
        duration: routeData.duration
      });
      
      toast.success('Route calculated successfully');
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate route. Please add your MapTiler API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setOrigin(null);
    setDestination(null);
  };

  return {
    origin,
    destination,
    route,
    isLoading,
    setOrigin,
    setDestination,
    calculateRoute,
    clearRoute
  };
};

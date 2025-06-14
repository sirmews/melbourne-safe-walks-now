
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
      // Using OpenRouteService API (free tier available)
      const response = await fetch(
        `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=5b3ce3597851110001cf6248c5a6b1e3da454b2882764d5bb7d54b0b&start=${origin.lng},${origin.lat}&end=${destination.lng},${destination.lat}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to calculate route');
      }

      const data = await response.json();
      const routeData = data.features[0];
      
      setRoute({
        coordinates: routeData.geometry.coordinates,
        distance: routeData.properties.segments[0].distance,
        duration: routeData.properties.segments[0].duration
      });
      
      toast.success('Route calculated successfully');
    } catch (error) {
      console.error('Error calculating route:', error);
      toast.error('Failed to calculate route. Please try again.');
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

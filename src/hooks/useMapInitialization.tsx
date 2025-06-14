
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { toast } from 'sonner';

export const useMapInitialization = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          initializeMap(longitude, latitude);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Using Melbourne as default.');
          // Fall back to Melbourne coordinates
          initializeMap(144.9631, -37.8136);
        }
      );
    } else {
      toast.error('Geolocation is not supported by this browser. Using Melbourne as default.');
      initializeMap(144.9631, -37.8136);
    }

    return () => {
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        map.current = null;
      }
    };
  }, []);

  const initializeMap = (lng: number, lat: number) => {
    if (!mapContainer.current || map.current) return;

    const MAPTILER_API_KEY = 'trIkgoZsSgH2Ht8MXmzd';
    
    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`,
        center: [lng, lat],
        zoom: 14
      });

      // Add user location marker if available
      if (userLocation || (lng !== 144.9631 && lat !== -37.8136)) {
        const userMarker = new maplibregl.Marker({ color: '#3b82f6' })
          .setLngLat([lng, lat])
          .addTo(map.current);
      }

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map. Please check your internet connection.');
    }
  };

  return {
    mapContainer,
    map: map.current,
    userLocation
  };
};

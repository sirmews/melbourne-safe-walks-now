
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface UseMapRouteVisualizationProps {
  map: maplibregl.Map | null;
  route?: any;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

export const useMapRouteVisualization = ({ 
  map, 
  route, 
  origin, 
  destination 
}: UseMapRouteVisualizationProps) => {
  // Update route visualization when route changes
  useEffect(() => {
    if (!map) return;

    const mapSource = map.getSource('route');
    if (mapSource && route) {
      (mapSource as any).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route.coordinates
        }
      });

      // Fit map to route bounds
      const bounds = new maplibregl.LngLatBounds();
      route.coordinates.forEach((coord: [number, number]) => {
        bounds.extend(coord);
      });
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, route]);

  // Update journey points when origin/destination changes
  useEffect(() => {
    if (!map) return;

    const journeyPointsSource = map.getSource('journey-points');
    if (journeyPointsSource) {
      const features = [];
      
      if (origin) {
        features.push({
          type: 'Feature',
          properties: { color: '#10b981' }, // green for origin
          geometry: {
            type: 'Point',
            coordinates: [origin.lng, origin.lat]
          }
        });
      }
      
      if (destination) {
        features.push({
          type: 'Feature',
          properties: { color: '#ef4444' }, // red for destination
          geometry: {
            type: 'Point',
            coordinates: [destination.lng, destination.lat]
          }
        });
      }

      (journeyPointsSource as any).setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [map, origin, destination]);
};

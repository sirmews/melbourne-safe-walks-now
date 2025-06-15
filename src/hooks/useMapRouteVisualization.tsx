
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { JourneyPoint, Route } from '@/hooks/useJourneyPlanner';

interface UseMapRouteVisualizationProps {
  map: maplibregl.Map | null;
  route?: Route | null;
  origin?: JourneyPoint | null;
  destination?: JourneyPoint | null;
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

    console.log('Route visualization update triggered:', { 
      hasRoute: !!route, 
      coordinatesLength: route?.coordinates?.length 
    });

    const updateRoute = () => {
      try {
        const mapSource = map.getSource('route');
        if (mapSource) {
          if (route?.coordinates) {
            console.log('Updating route with coordinates:', route.coordinates.length, 'points');
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
            console.log('Fitting map to route bounds');
            map.fitBounds(bounds, { padding: 50 });
          } else {
            console.log('Clearing route visualization');
            // Clear the route by setting empty coordinates
            (mapSource as any).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            });
          }
        } else {
          console.warn('Route source not found on map');
        }
      } catch (error) {
        console.error('Error updating route:', error);
      }
    };

    // Wait for map to be loaded and sources to be available
    if (map.isStyleLoaded() && map.getSource('route')) {
      updateRoute();
    } else {
      const onStyleLoad = () => {
        if (map.getSource('route')) {
          updateRoute();
          map.off('styledata', onStyleLoad);
        }
      };
      map.on('styledata', onStyleLoad);
      
      return () => {
        map.off('styledata', onStyleLoad);
      };
    }
  }, [map, route]);

  // Update journey points when origin/destination changes
  useEffect(() => {
    if (!map) return;

    console.log('Journey points update triggered:', { 
      hasOrigin: !!origin, 
      hasDestination: !!destination 
    });

    const updateJourneyPoints = () => {
      try {
        const journeyPointsSource = map.getSource('journey-points');
        if (journeyPointsSource) {
          const features = [];
          
          if (origin) {
            console.log('Adding origin point:', origin);
            features.push({
              type: 'Feature',
              properties: { color: '#10b981', type: 'origin' }, // green for origin
              geometry: {
                type: 'Point',
                coordinates: [origin.lng, origin.lat]
              }
            });
          }
          
          if (destination) {
            console.log('Adding destination point:', destination);
            features.push({
              type: 'Feature',
              properties: { color: '#ef4444', type: 'destination' }, // red for destination
              geometry: {
                type: 'Point',
                coordinates: [destination.lng, destination.lat]
              }
            });
          }

          console.log('Updating journey points with', features.length, 'features');
          (journeyPointsSource as any).setData({
            type: 'FeatureCollection',
            features
          });
        } else {
          console.warn('Journey points source not found on map');
        }
      } catch (error) {
        console.error('Error updating journey points:', error);
      }
    };

    // Wait for map to be loaded and sources to be available
    if (map.isStyleLoaded() && map.getSource('journey-points')) {
      updateJourneyPoints();
    } else {
      const onStyleLoad = () => {
        if (map.getSource('journey-points')) {
          updateJourneyPoints();
          map.off('styledata', onStyleLoad);
        }
      };
      map.on('styledata', onStyleLoad);
      
      return () => {
        map.off('styledata', onStyleLoad);
      };
    }
  }, [map, origin, destination]);
};

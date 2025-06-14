
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface UseMapLayersProps {
  map: maplibregl.Map | null;
  onLoadReports: () => void;
}

export const useMapLayers = ({ map, onLoadReports }: UseMapLayersProps) => {
  useEffect(() => {
    if (!map) return;

    const handleMapLoad = () => {
      onLoadReports();
      
      // Add route source and layer
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add origin/destination markers source
      map.addSource('journey-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      map.addLayer({
        id: 'journey-points',
        type: 'circle',
        source: 'journey-points',
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    };

    map.on('load', handleMapLoad);
    map.on('moveend', onLoadReports);

    return () => {
      map.off('load', handleMapLoad);
      map.off('moveend', onLoadReports);
    };
  }, [map, onLoadReports]);
};

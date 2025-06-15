
import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { Database } from '@/integrations/supabase/types';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface UseMapBufferZonesProps {
  map: maplibregl.Map | null;
  reports: SafetyReport[];
}

export const useMapBufferZones = ({ map, reports }: UseMapBufferZonesProps) => {
  const getBufferRadius = (category: string, severity: string): number => {
    // Safe categories don't need buffer zones
    const safeCategories = ['well_lit_safe', 'police_presence', 'busy_safe_area', 'cctv_monitored', 'emergency_phone'];
    if (safeCategories.includes(category)) {
      return 0;
    }

    // Buffer radius in kilometers based on severity
    switch (severity) {
      case 'low': return 0.1; // 100m
      case 'medium': return 0.2; // 200m
      case 'high': return 0.3; // 300m
      case 'critical': return 0.5; // 500m
      default: return 0.15; // 150m
    }
  };

  const getBufferColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'rgba(251, 191, 36, 0.15)'; // amber with transparency
      case 'medium': return 'rgba(245, 158, 11, 0.2)'; // orange with transparency
      case 'high': return 'rgba(239, 68, 68, 0.25)'; // red with transparency
      case 'critical': return 'rgba(220, 38, 38, 0.3)'; // dark red with transparency
      default: return 'rgba(107, 114, 128, 0.15)'; // gray with transparency
    }
  };

  const getBorderColor = (severity: string): string => {
    switch (severity) {
      case 'low': return 'rgba(217, 119, 6, 0.6)';
      case 'medium': return 'rgba(234, 88, 12, 0.7)';
      case 'high': return 'rgba(220, 38, 38, 0.8)';
      case 'critical': return 'rgba(153, 27, 27, 0.9)';
      default: return 'rgba(107, 114, 128, 0.6)';
    }
  };

  // Create GeoJSON for buffer zones
  const createBufferZonesGeoJSON = (reports: SafetyReport[]): GeoJSON.FeatureCollection => {
    const features = reports
      .filter(report => {
        const radius = getBufferRadius(report.category, report.severity);
        return radius > 0; // Only create buffers for dangerous areas
      })
      .map(report => {
        const radius = getBufferRadius(report.category, report.severity);
        const centerLng = report.location_lng;
        const centerLat = report.location_lat;
        
        // Create a circle polygon (approximation with 32 points)
        const points = 32;
        const coordinates = [];
        for (let i = 0; i <= points; i++) {
          const angle = (i * 360) / points;
          const dx = radius * Math.cos(angle * Math.PI / 180);
          const dy = radius * Math.sin(angle * Math.PI / 180);
          // Convert to approximate lat/lng (rough conversion for small distances)
          const lng = centerLng + (dx / (111.32 * Math.cos(centerLat * Math.PI / 180)));
          const lat = centerLat + (dy / 110.54);
          coordinates.push([lng, lat]);
        }

        return {
          type: 'Feature' as const,
          properties: {
            reportId: report.id,
            severity: report.severity,
            category: report.category,
            fillColor: getBufferColor(report.severity),
            borderColor: getBorderColor(report.severity)
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [coordinates]
          }
        };
      });

    return {
      type: 'FeatureCollection' as const,
      features
    };
  };

  useEffect(() => {
    if (!map) return;

    // Wait for map to be loaded
    const updateBufferZones = () => {
      const geoJSON = createBufferZonesGeoJSON(reports);
      
      // Update or add the buffer zones source
      const source = map.getSource('buffer-zones');
      if (source) {
        (source as any).setData(geoJSON);
      } else {
        map.addSource('buffer-zones', {
          type: 'geojson',
          data: geoJSON
        });

        // Add fill layer for buffer zones
        map.addLayer({
          id: 'buffer-zones-fill',
          type: 'fill',
          source: 'buffer-zones',
          paint: {
            'fill-color': ['get', 'fillColor'],
            'fill-opacity': 1
          }
        });

        // Add border layer for buffer zones
        map.addLayer({
          id: 'buffer-zones-border',
          type: 'line',
          source: 'buffer-zones',
          paint: {
            'line-color': ['get', 'borderColor'],
            'line-width': 2,
            'line-dasharray': [3, 3]
          }
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateBufferZones();
    } else {
      map.on('styledata', updateBufferZones);
    }

    return () => {
      map.off('styledata', updateBufferZones);
    };
  }, [map, reports]);

  const cleanup = () => {
    if (!map) return;
    
    try {
      if (map.getLayer('buffer-zones-fill')) {
        map.removeLayer('buffer-zones-fill');
      }
      if (map.getLayer('buffer-zones-border')) {
        map.removeLayer('buffer-zones-border');
      }
      if (map.getSource('buffer-zones')) {
        map.removeSource('buffer-zones');
      }
    } catch (error) {
      console.warn('Error cleaning up buffer zones:', error);
    }
  };

  return {
    cleanup
  };
};

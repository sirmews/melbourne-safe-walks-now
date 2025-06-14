
import { useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { Database } from '@/integrations/supabase/types';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface UseMapMarkersProps {
  map: maplibregl.Map | null;
  onReportClick?: (report: SafetyReport) => void;
}

export const useMapMarkers = ({ map, onReportClick }: UseMapMarkersProps) => {
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#22c55e'; // green
      case 'medium': return '#f59e0b'; // amber
      case 'high': return '#ef4444'; // red
      case 'critical': return '#7c3aed'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const updateMapMarkers = (reportsData: SafetyReport[]) => {
    if (!map) return;

    // Get current report IDs
    const currentReportIds = new Set(reportsData.map(report => report.id));
    
    // Remove markers that are no longer needed
    Object.keys(markersRef.current).forEach(reportId => {
      if (!currentReportIds.has(reportId)) {
        markersRef.current[reportId].remove();
        delete markersRef.current[reportId];
      }
    });

    // Add or update markers
    reportsData.forEach(report => {
      const reportId = report.id;
      
      // Skip if marker already exists
      if (markersRef.current[reportId]) {
        return;
      }

      const markerElement = document.createElement('div');
      markerElement.className = 'safety-marker';
      markerElement.setAttribute('data-report-id', reportId);
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        background-color: ${getSeverityColor(report.severity)};
        z-index: 1000;
        position: relative;
      `;

      // Add click handler to marker element
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onReportClick?.(report);
      });

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([report.location_lng, report.location_lat])
        .addTo(map);

      // Store marker reference
      markersRef.current[reportId] = marker;
    });
  };

  const cleanup = () => {
    Object.values(markersRef.current).forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Error removing marker:', error);
      }
    });
    markersRef.current = {};
  };

  return {
    updateMapMarkers,
    cleanup
  };
};

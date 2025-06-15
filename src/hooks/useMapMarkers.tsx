
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

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'well_lit_safe': return '💡';
      case 'police_presence': return '👮';
      case 'busy_safe_area': return '🏢';
      case 'cctv_monitored': return '📹';
      case 'emergency_phone': return '📞';
      case 'unlit_street': return '🌑';
      case 'crime_hotspot': return '⚠️';
      case 'dangerous_area': return '🚨';
      case 'suspicious_activity': return '👀';
      case 'poor_visibility': return '🌫️';
      case 'isolated_area': return '🏚️';
      case 'vandalism': return '🎨';
      case 'harassment': return '😰';
      case 'theft': return '💰';
      case 'assault': return '🚑';
      case 'drug_activity': return '💊';
      case 'general_concern': return '❓';
      default: return '📍';
    }
  };

  const getSeverityColor = (category: string, severity: string): string => {
    // Safe/positive categories always use green tones regardless of severity
    const safeCategories = ['well_lit_safe', 'police_presence', 'busy_safe_area', 'cctv_monitored', 'emergency_phone'];
    
    if (safeCategories.includes(category)) {
      switch (severity) {
        case 'low': return '#86efac'; // light green
        case 'medium': return '#22c55e'; // green
        case 'high': return '#16a34a'; // dark green
        case 'critical': return '#15803d'; // darker green
        default: return '#22c55e';
      }
    }
    
    // Unsafe/negative categories use warning colors based on severity
    switch (severity) {
      case 'low': return '#fbbf24'; // amber
      case 'medium': return '#f59e0b'; // orange
      case 'high': return '#ef4444'; // red
      case 'critical': return '#dc2626'; // dark red
      default: return '#6b7280'; // gray
    }
  };

  const getBorderColor = (category: string, severity: string, verified: boolean, flagged: boolean): string => {
    // Flagged reports get red border
    if (flagged) {
      return '#dc2626';
    }
    
    // Verified reports get green border
    if (verified) {
      return '#059669';
    }
    
    const safeCategories = ['well_lit_safe', 'police_presence', 'busy_safe_area', 'cctv_monitored', 'emergency_phone'];
    
    if (safeCategories.includes(category)) {
      return '#059669'; // green border for safe areas
    }
    
    switch (severity) {
      case 'low': return '#d97706';
      case 'medium': return '#ea580c';
      case 'high': return '#dc2626';
      case 'critical': return '#991b1b';
      default: return '#6b7280';
    }
  };

  const getMarkerSize = (severity: string): { width: number; height: number } => {
    switch (severity) {
      case 'low': return { width: 16, height: 16 };
      case 'medium': return { width: 20, height: 20 };
      case 'high': return { width: 24, height: 24 };
      case 'critical': return { width: 28, height: 28 };
      default: return { width: 20, height: 20 };
    }
  };

  const getStatusIndicator = (verified: boolean, flagged: boolean): string => {
    if (flagged) {
      return '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #dc2626; border-radius: 50%; border: 1px solid white;"></div>';
    }
    if (verified) {
      return '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background-color: #059669; border-radius: 50%; border: 1px solid white;"></div>';
    }
    return '';
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

      const markerSize = getMarkerSize(report.severity);
      const backgroundColor = getSeverityColor(report.category, report.severity);
      const borderColor = getBorderColor(report.category, report.severity, report.verified, report.flagged);
      const icon = getCategoryIcon(report.category);
      const statusIndicator = getStatusIndicator(report.verified, report.flagged);

      const markerElement = document.createElement('div');
      markerElement.className = 'safety-marker';
      markerElement.setAttribute('data-report-id', reportId);
      
      // Create a container for the icon and background
      markerElement.innerHTML = `
        <div style="
          width: ${markerSize.width}px;
          height: ${markerSize.height}px;
          border-radius: 50%;
          background-color: ${backgroundColor};
          border: 2px solid ${borderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${markerSize.width * 0.6}px;
          cursor: pointer;
          position: relative;
          z-index: 10;
        ">
          ${icon}
          ${statusIndicator}
        </div>
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

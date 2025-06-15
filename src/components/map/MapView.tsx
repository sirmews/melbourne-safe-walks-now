
import { useState, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPopup } from './MapPopup';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useMapLayers } from '@/hooks/useMapLayers';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMapBufferZones } from '@/hooks/useMapBufferZones';
import { useMapRouteVisualization } from '@/hooks/useMapRouteVisualization';
import { useMapReports } from '@/hooks/useMapReports';

// Updated type to match the new database function return signature
type SafetyReport = {
  id: string;
  location_lat: number;
  location_lng: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  rating_avg: number;
  rating_count: number;
  verified: boolean;
  flagged: boolean;
};

interface MapViewProps {
  onReportClick?: (report: SafetyReport) => void;
  onMapClick?: (lng: number, lat: number) => void;
  onPlanTripToLocation?: (lng: number, lat: number) => void;
  route?: any;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

export const MapView = ({ 
  onReportClick, 
  onMapClick, 
  onPlanTripToLocation, 
  route, 
  origin, 
  destination 
}: MapViewProps) => {
  const { mapContainer, map, userLocation } = useMapInitialization();
  const [popupPosition, setPopupPosition] = useState<{ lng: number; lat: number; x: number; y: number } | null>(null);
  const [mapClickHandlerAttached, setMapClickHandlerAttached] = useState(false);
  const [currentReports, setCurrentReports] = useState<SafetyReport[]>([]);
  
  const { loadReports } = useMapReports(map);
  const { updateMapMarkers, cleanup } = useMapMarkers({ map, onReportClick });
  const { cleanup: cleanupBufferZones } = useMapBufferZones({ map, reports: currentReports });

  const handleLoadReports = useCallback(async () => {
    const reportsData = await loadReports();
    setCurrentReports(reportsData);
    updateMapMarkers(reportsData);
  }, [loadReports, updateMapMarkers]);

  useMapLayers({ map, onLoadReports: handleLoadReports });
  useMapRouteVisualization({ map, route, origin, destination });

  // Handle map clicks
  const handleMapClick = useCallback((e: any) => {
    // Check if click was on a marker
    const target = e.originalEvent.target as HTMLElement;
    if (target.closest('.safety-marker')) {
      return; // Don't show popup if clicking on a marker
    }

    const { lng, lat } = e.lngLat;
    const { x, y } = e.point;
    
    setPopupPosition({ lng, lat, x, y });
  }, []);

  // Attach click handler when map is ready
  if (map && !mapClickHandlerAttached) {
    map.on('click', handleMapClick);
    setMapClickHandlerAttached(true);
  }

  const handlePopupSafetyReport = () => {
    if (popupPosition) {
      onMapClick?.(popupPosition.lng, popupPosition.lat);
      setPopupPosition(null);
    }
  };

  const handlePopupPlanTrip = () => {
    if (popupPosition) {
      onPlanTripToLocation?.(popupPosition.lng, popupPosition.lat);
      setPopupPosition(null);
    }
  };

  const handlePopupClose = () => {
    setPopupPosition(null);
  };

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {popupPosition && (
        <div
          style={{
            position: 'absolute',
            left: popupPosition.x,
            top: popupPosition.y,
            zIndex: 1000,
          }}
        >
          <MapPopup
            position={{ lng: popupPosition.lng, lat: popupPosition.lat }}
            onClose={handlePopupClose}
            onSafetyReport={handlePopupSafetyReport}
            onPlanTrip={handlePopupPlanTrip}
          />
        </div>
      )}
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { MapPopup } from './MapPopup';
import { MapContextMenu } from './MapContextMenu';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface MapViewProps {
  onReportClick?: (report: SafetyReport) => void;
  onMapClick?: (lng: number, lat: number) => void;
  onPlanTripToLocation?: (lng: number, lat: number) => void;
  route?: any;
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
}

export const MapView = ({ onReportClick, onMapClick, onPlanTripToLocation, route, origin, destination }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ lng: number; lat: number; x: number; y: number } | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ lng: number; lat: number } | null>(null);

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
      // Clean up markers first
      Object.values(markersRef.current).forEach(marker => {
        try {
          marker.remove();
        } catch (error) {
          console.warn('Error removing marker:', error);
        }
      });
      markersRef.current = {};
      
      // Clean up map instance safely
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

    // Initialize map with MapTiler tiles (free tier available)
    // You'll need to get your API key from https://cloud.maptiler.com/
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

      map.current.on('load', () => {
        loadReports();
        
        // Add route source and layer
        if (map.current) {
          map.current.addSource('route', {
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

          map.current.addLayer({
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
          map.current.addSource('journey-points', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          map.current.addLayer({
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
        }
        
        // Add click handler for map clicks (not on markers)
        map.current?.on('click', handleMapClick);
      });

      // Load reports when map bounds change
      map.current.on('moveend', loadReports);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast.error('Failed to initialize map. Please check your internet connection.');
    }
  };

  const loadReports = async () => {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    try {
      const { data, error } = await supabase.rpc('get_reports_in_bounds', {
        sw_lat: sw.lat,
        sw_lng: sw.lng,
        ne_lat: ne.lat,
        ne_lng: ne.lng
      });

      if (error) throw error;
      
      setReports(data || []);
      updateMapMarkers(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const updateMapMarkers = (reportsData: SafetyReport[]) => {
    if (!map.current) return;

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
        e.stopPropagation(); // Prevent map click event
        e.preventDefault();
        onReportClick?.(report);
      });

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([report.location_lng, report.location_lat])
        .addTo(map.current!);

      // Store marker reference
      markersRef.current[reportId] = marker;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#22c55e'; // green
      case 'medium': return '#f59e0b'; // amber
      case 'high': return '#ef4444'; // red
      case 'critical': return '#7c3aed'; // purple
      default: return '#6b7280'; // gray
    }
  };

  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    // Check if click was on a marker
    const target = e.originalEvent.target as HTMLElement;
    if (target.closest('.safety-marker')) {
      return; // Don't show popup if clicking on a marker
    }

    const { lng, lat } = e.lngLat;
    const { x, y } = e.point;
    
    setPopupPosition({ lng, lat, x, y });
  };

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

  // Update route visualization when route changes
  useEffect(() => {
    if (!map.current) return;

    const mapSource = map.current.getSource('route');
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
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [route]);

  // Update journey points when origin/destination changes
  useEffect(() => {
    if (!map.current) return;

    const journeyPointsSource = map.current.getSource('journey-points');
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
  }, [origin, destination]);

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

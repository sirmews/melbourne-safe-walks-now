
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface MapViewProps {
  onReportClick?: (report: SafetyReport) => void;
  onMapClick?: (lng: number, lat: number) => void;
}

export const MapView = ({ onReportClick, onMapClick }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const [reports, setReports] = useState<SafetyReport[]>([]);
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
      // Clean up markers
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      map.current?.remove();
    };
  }, []);

  const initializeMap = (lng: number, lat: number) => {
    if (!mapContainer.current) return;

    // Initialize map with OpenStreetMap tiles (free)
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
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
      console.log('Map loaded, loading reports...');
      loadReports();
      
      // Add click handler for map
      map.current?.on('click', (e) => {
        console.log('Map clicked at:', e.lngLat);
        // Check if click was on a marker by looking for the safety-marker class
        const target = e.originalEvent.target as HTMLElement;
        console.log('Click target:', target, 'Has safety-marker class:', target.closest('.safety-marker'));
        if (!target.closest('.safety-marker')) {
          const { lng, lat } = e.lngLat;
          console.log('Calling onMapClick with:', lng, lat);
          onMapClick?.(lng, lat);
        }
      });
    });

    // Load reports when map bounds change
    map.current.on('moveend', loadReports);
  };

  const loadReports = async () => {
    if (!map.current) return;

    const bounds = map.current.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    console.log('Loading reports for bounds:', { sw: { lat: sw.lat, lng: sw.lng }, ne: { lat: ne.lat, lng: ne.lng } });

    try {
      const { data, error } = await supabase.rpc('get_reports_in_bounds', {
        sw_lat: sw.lat,
        sw_lng: sw.lng,
        ne_lat: ne.lat,
        ne_lng: ne.lng
      });

      if (error) throw error;
      
      console.log('Loaded reports:', data?.length || 0, 'reports');
      setReports(data || []);
      updateMapMarkers(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const updateMapMarkers = (reportsData: SafetyReport[]) => {
    if (!map.current) return;

    console.log('Updating markers for', reportsData.length, 'reports');

    // Get current report IDs
    const currentReportIds = new Set(reportsData.map(report => report.id));
    
    // Remove markers that are no longer needed
    Object.keys(markersRef.current).forEach(reportId => {
      if (!currentReportIds.has(reportId)) {
        console.log('Removing marker for report:', reportId);
        markersRef.current[reportId].remove();
        delete markersRef.current[reportId];
      }
    });

    // Add or update markers
    reportsData.forEach(report => {
      const reportId = report.id;
      
      // Skip if marker already exists
      if (markersRef.current[reportId]) {
        console.log('Marker already exists for report:', reportId);
        return;
      }

      console.log('Creating marker for report:', report.title, 'at', report.location_lat, report.location_lng);

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
        transition: transform 0.2s ease;
        z-index: 1000;
        position: relative;
      `;

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        console.log('Mouse entered marker for report:', report.title);
        markerElement.style.transform = 'scale(1.2)';
      });
      
      markerElement.addEventListener('mouseleave', () => {
        console.log('Mouse left marker for report:', report.title);
        markerElement.style.transform = 'scale(1)';
      });

      // Add click handler to marker element
      markerElement.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent map click event
        e.preventDefault();
        console.log('MARKER CLICKED! Report:', report.title, 'ID:', report.id);
        console.log('onReportClick callback exists:', !!onReportClick);
        if (onReportClick) {
          console.log('Calling onReportClick with report data');
          onReportClick(report);
        }
      });

      const marker = new maplibregl.Marker({ element: markerElement })
        .setLngLat([report.location_lng, report.location_lat])
        .addTo(map.current!);

      // Store marker reference
      markersRef.current[reportId] = marker;
      console.log('Marker created and stored for report:', reportId);
    });

    console.log('Total markers now:', Object.keys(markersRef.current).length);
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

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

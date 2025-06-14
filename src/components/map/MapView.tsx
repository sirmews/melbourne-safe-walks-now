
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
      loadReports();
      
      // Add click handler for map
      map.current?.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        onMapClick?.(lng, lat);
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

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.safety-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add new markers
    reportsData.forEach(report => {
      const markerElement = document.createElement('div');
      markerElement.className = 'safety-marker';
      markerElement.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        background-color: ${getSeverityColor(report.severity)};
      `;

      const marker = new maplibregl.Marker(markerElement)
        .setLngLat([report.location_lng, report.location_lat])
        .addTo(map.current!);

      markerElement.addEventListener('click', () => {
        onReportClick?.(report);
      });
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

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
};

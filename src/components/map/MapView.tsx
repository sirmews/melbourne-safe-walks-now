
import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface MapViewProps {
  onReportClick?: (report: SafetyReport) => void;
  onMapClick?: (lng: number, lat: number) => void;
}

export const MapView = ({ onReportClick, onMapClick }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [reports, setReports] = useState<SafetyReport[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map centered on Melbourne
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://api.maptiler.com/maps/streets/style.json?key=demo', // Free demo tiles
      center: [144.9631, -37.8136], // Melbourne coordinates
      zoom: 12
    });

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

    return () => {
      map.current?.remove();
    };
  }, []);

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

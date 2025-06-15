
import { useState } from 'react';
import { safetyReportsApi } from '@/services/safetyReportsApi';

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

export const useMapReports = (map: maplibregl.Map | null) => {
  const [reports, setReports] = useState<SafetyReport[]>([]);

  const loadReports = async () => {
    if (!map) return;

    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    try {
      const data = await safetyReportsApi.getReportsInBounds({
        sw_lat: sw.lat,
        sw_lng: sw.lng,
        ne_lat: ne.lat,
        ne_lng: ne.lng
      });

      setReports(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  };

  return {
    reports,
    loadReports
  };
};

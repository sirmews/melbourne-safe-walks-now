
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

export const useMapReports = (map: maplibregl.Map | null) => {
  const [reports, setReports] = useState<SafetyReport[]>([]);

  const loadReports = async () => {
    if (!map) return;

    const bounds = map.getBounds();
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

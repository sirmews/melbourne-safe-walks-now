
import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { MapView } from '@/components/map/MapView';
import { JourneyPlanner } from '@/components/journey/JourneyPlanner';
import { AboutSafePathCard } from './AboutSafePathCard';
import { Database } from '@/integrations/supabase/types';
import { JourneyPoint, Route } from '@/hooks/useJourneyPlanner';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface MainLayoutProps {
  userLocation: { lat: number; lng: number } | null;
  origin: JourneyPoint | null;
  destination: JourneyPoint | null;
  route: Route | null;
  isLoading: boolean;
  useSafeRouting: boolean;
  setOrigin: (point: JourneyPoint | null) => void;
  setDestination: (point: JourneyPoint | null) => void;
  setUseSafeRouting: (enabled: boolean) => void;
  calculateRoute: () => void;
  clearRoute: () => void;
  getAddressFromCoordinates: (lat: number, lng: number) => Promise<string>;
  onMapClick: (lng: number, lat: number) => void;
  onReportClick: (report: SafetyReport) => void;
  onPlanTripToLocation: (lng: number, lat: number) => void;
  children?: ReactNode;
}

export const MainLayout = ({
  userLocation,
  origin,
  destination,
  route,
  isLoading,
  useSafeRouting,
  setOrigin,
  setDestination,
  setUseSafeRouting,
  calculateRoute,
  clearRoute,
  getAddressFromCoordinates,
  onMapClick,
  onReportClick,
  onPlanTripToLocation,
  children
}: MainLayoutProps) => {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with About SafePath Card */}
        <div className="lg:col-span-1">
          <AboutSafePathCard />
          <JourneyPlanner 
            userLocation={userLocation}
            origin={origin}
            destination={destination}
            route={route}
            isLoading={isLoading}
            useSafeRouting={useSafeRouting}
            setOrigin={setOrigin}
            setDestination={setDestination}
            setUseSafeRouting={setUseSafeRouting}
            calculateRoute={calculateRoute}
            clearRoute={clearRoute}
            getAddressFromCoordinates={getAddressFromCoordinates}
          />
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-[800px] overflow-hidden">
            <MapView 
              onMapClick={onMapClick} 
              onReportClick={onReportClick}
              onPlanTripToLocation={onPlanTripToLocation}
              route={route}
              origin={origin}
              destination={destination}
            />
          </Card>
        </div>
      </div>

      {children}
    </main>
  );
};

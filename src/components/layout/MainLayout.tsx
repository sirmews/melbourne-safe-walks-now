
import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { MapView } from '@/components/map/MapView';
import { JourneyPlanner } from '@/components/journey/JourneyPlanner';
import { AboutSafePathCard } from './AboutSafePathCard';
import { InfoCardsSection } from './InfoCardsSection';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Route, Map } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { JourneyPoint, Route as JourneyRoute } from '@/hooks/useJourneyPlanner';

// Feature flags
const FEATURE_FLAGS = {
  JOURNEY_PLANNER: false, // Set to true to enable journey planning
};

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

interface MainLayoutProps {
  userLocation: { lat: number; lng: number } | null;
  origin: JourneyPoint | null;
  destination: JourneyPoint | null;
  route: JourneyRoute | null;
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
        {/* Sidebar with Accordion */}
        <div className="lg:col-span-1">
          <Card>
            <Accordion type="multiple" defaultValue={["about", ...(FEATURE_FLAGS.JOURNEY_PLANNER ? ["journey"] : []), "legend"]} className="p-4">
              <AccordionItem value="about" className="border-b-0">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    About Safer Path
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <AboutSafePathCard />
                </AccordionContent>
              </AccordionItem>
              
              {FEATURE_FLAGS.JOURNEY_PLANNER && (
                <AccordionItem value="journey" className="border-b-0">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Route className="h-5 w-5 text-primary" />
                      Plan Journey
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
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
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value="legend" className="border-b-0">
                <AccordionTrigger className="text-base font-semibold hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Map className="h-5 w-5 text-primary" />
                    Legend
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <InfoCardsSection />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <Card className="h-[800px] overflow-hidden relative">
            <div className="absolute inset-0" style={{ touchAction: 'pan-x pan-y' }}>
              <MapView 
                onMapClick={onMapClick} 
                onReportClick={onReportClick}
                onPlanTripToLocation={onPlanTripToLocation}
                route={route}
                origin={origin}
                destination={destination}
              />
            </div>
            {/* Scroll indicator */}
            <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-xs pointer-events-none z-10">
              Hold Ctrl + scroll to zoom map
            </div>
          </Card>
        </div>
      </div>

      {children}
    </main>
  );
};

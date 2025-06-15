
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MapView } from '@/components/map/MapView';
import { ReportModal } from '@/components/reports/ReportModal';
import { ReportDetailsModal } from '@/components/reports/ReportDetailsModal';
import { Card } from '@/components/ui/card';
import { MapPin, Shield, Users } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { JourneyPlanner } from '@/components/journey/JourneyPlanner';
import { useJourneyPlanner } from '@/hooks/useJourneyPlanner';
import { toast } from 'sonner';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

const Index = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [journeyOrigin, setJourneyOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [journeyDestination, setJourneyDestination] = useState<{ lat: number; lng: number } | null>(null);

  // Use the journey planner hook here in the main component
  const {
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
    getAddressFromCoordinates
  } = useJourneyPlanner();

  const handleMapClick = (lng: number, lat: number) => {
    setSelectedLocation({ lat, lng });
    setShowReportModal(true);
  };

  const handleReportClick = (report: SafetyReport) => {
    setSelectedReport(report);
    setShowReportDetails(true);
  };

  const handleReportCreated = () => {
    // Trigger map refresh by updating a state or calling a refresh function
    window.location.reload(); // Simple refresh for now
  };

  const handleRouteChange = (route: any) => {
    setRouteData(route);
    if (route) {
      // Extract origin and destination from route if available
      if (route.coordinates && route.coordinates.length > 0) {
        const coords = route.coordinates;
        setJourneyOrigin({ 
          lng: coords[0][0], 
          lat: coords[0][1] 
        });
        setJourneyDestination({ 
          lng: coords[coords.length - 1][0], 
          lat: coords[coords.length - 1][1] 
        });
      }
    } else {
      setJourneyOrigin(null);
      setJourneyDestination(null);
    }
  };

  const handlePlanTripToLocation = async (lng: number, lat: number) => {
    try {
      const address = await getAddressFromCoordinates(lat, lng);
      console.log('Setting destination:', { lat, lng, address });
      setDestination({
        lat,
        lng,
        address
      });
      
      toast.success('Destination set! Plan your journey in the sidebar.');
    } catch (error) {
      console.error('Error setting destination:', error);
      toast.error('Failed to set destination. Please try again.');
    }
  };

  // Get user location for journey planning (no auth required)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user's current location on component mount
  useState(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Journey Planner Sidebar */}
          <div className="lg:col-span-1">
            <JourneyPlanner 
              onRouteChange={handleRouteChange}
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
            <Card className="h-[600px] overflow-hidden">
              <MapView 
                onMapClick={handleMapClick} 
                onReportClick={handleReportClick}
                onPlanTripToLocation={handlePlanTripToLocation}
                route={routeData}
                origin={journeyOrigin}
                destination={journeyDestination}
              />
            </Card>
          </div>
        </div>

        {/* Information Cards Below Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* About SafePath Card */}
          <Card className="p-4">
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              About SafePath
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                <span>Click anywhere on the map to report safety concerns or positive observations</span>
              </div>
              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
                <span>Community-driven data helps everyone make informed decisions about their routes</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                <span>Click on any existing pin to view detailed safety information</span>
              </div>
              <div className="mt-3 p-2 bg-green-50 rounded-md">
                <p className="text-xs text-green-700">
                  ✨ Completely anonymous - no signup required to contribute to community safety
                </p>
              </div>
            </div>
          </Card>

          {/* Legend Card */}
          <Card className="p-4">
            <h3 className="text-md font-semibold mb-3">Legend</h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-green-700 mb-2">Safe Areas</h4>
                <div className="space-y-1 ml-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <span>Well lit areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">👮</span>
                    <span>Police presence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏢</span>
                    <span>Busy safe areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">📹</span>
                    <span>CCTV monitored</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-red-700 mb-2">Risk Areas</h4>
                <div className="space-y-1 ml-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌑</span>
                    <span>Poorly lit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    <span>Crime hotspots</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚨</span>
                    <span>Dangerous areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">👀</span>
                    <span>Suspicious activity</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <h4 className="font-medium text-gray-700 mb-2">Severity & Buffer Zones</h4>
                <div className="space-y-1 ml-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <span>Low risk (100m buffer)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Medium risk (200m buffer)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>High risk (300m buffer)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-600"></div>
                    <span>Critical risk (500m buffer)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>

      {selectedLocation && (
        <ReportModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          lat={selectedLocation.lat}
          lng={selectedLocation.lng}
          onReportCreated={handleReportCreated}
        />
      )}

      <ReportDetailsModal
        open={showReportDetails}
        onOpenChange={setShowReportDetails}
        report={selectedReport}
      />
    </div>
  );
};

export default Index;

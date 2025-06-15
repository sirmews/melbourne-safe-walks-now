
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Header } from '@/components/layout/Header';
import { MapView } from '@/components/map/MapView';
import { ReportModal } from '@/components/reports/ReportModal';
import { ReportDetailsModal } from '@/components/reports/ReportDetailsModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Shield, Users } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { JourneyPlanner } from '@/components/journey/JourneyPlanner';
import { useJourneyPlanner } from '@/hooks/useJourneyPlanner';
import { toast } from 'sonner';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

// Get the Mapbox API key
const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY || 'pk.eyJ1Ijoic2lybWV3cyIsImEiOiJjbWJ4MGFzYXYxNGNxMm1wdWFkcDh3NGFqIn0.pm0S2cGStEHWbhcOCOtJgA';

const Index = () => {
  const { user, loading, userLocation } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [journeyOrigin, setJourneyOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [journeyDestination, setJourneyDestination] = useState<{ lat: number; lng: number } | null>(null);

  const { setDestination } = useJourneyPlanner();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

  const handleAuthClick = () => {
    setShowAuthModal(true);
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

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    if (!MAPBOX_API_KEY || MAPBOX_API_KEY === 'pk.your_mapbox_token_here') {
      console.error('Mapbox API key is missing');
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_API_KEY}&limit=1&country=au`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return feature.place_name || feature.text || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  const handlePlanTripToLocation = async (lng: number, lat: number) => {
    try {
      toast.loading('Finding address...');
      const address = await getAddressFromCoordinates(lat, lng);
      
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

  if (showAuthModal) {
    return (
      <div className="min-h-screen relative">
        <AuthPage />
        <Button 
          variant="outline" 
          className="absolute top-4 right-4"
          onClick={() => setShowAuthModal(false)}
        >
          Skip Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAuthClick={handleAuthClick} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Journey Planner */}
            <JourneyPlanner 
              onRouteChange={handleRouteChange}
              userLocation={userLocation}
            />

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
                {!user && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      Sign up to track your reports and help build a safer community
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Legend Card */}
            <Card className="p-4">
              <h3 className="text-md font-semibold mb-3">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Low Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span>Critical Risk</span>
                </div>
              </div>
            </Card>
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

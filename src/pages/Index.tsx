
import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MainLayout } from '@/components/layout/MainLayout';
import { InfoCardsSection } from '@/components/layout/InfoCardsSection';
import { ReportModal } from '@/components/reports/ReportModal';
import { ReportDetailsModal } from '@/components/reports/ReportDetailsModal';
import { useJourneyPlanner } from '@/hooks/useJourneyPlanner';
import { toast } from 'sonner';

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

const Index = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);

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
      
      <MainLayout
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
        onMapClick={handleMapClick}
        onReportClick={handleReportClick}
        onPlanTripToLocation={handlePlanTripToLocation}
      >
        <InfoCardsSection />
      </MainLayout>

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

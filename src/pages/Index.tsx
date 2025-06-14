
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { Header } from '@/components/layout/Header';
import { MapView } from '@/components/map/MapView';
import { ReportModal } from '@/components/reports/ReportModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MapPin, Shield, Users, LogIn } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

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

  const handleReportCreated = () => {
    // Trigger map refresh by updating a state or calling a refresh function
    window.location.reload(); // Simple refresh for now
  };

  const handleAuthClick = () => {
    setShowAuthModal(true);
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
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <Button 
                onClick={() => setShowReportModal(true)}
                className="w-full mb-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Report Safety Issue
              </Button>
              {!user && (
                <Button 
                  variant="outline"
                  onClick={handleAuthClick}
                  className="w-full"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In / Sign Up
                </Button>
              )}
            </Card>

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
                {!user && (
                  <div className="mt-3 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      Sign up to track your reports and help build a safer community
                    </p>
                  </div>
                )}
              </div>
            </Card>

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
              <MapView onMapClick={handleMapClick} />
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
    </div>
  );
};

export default Index;


import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Route, X } from 'lucide-react';
import { useJourneyPlanner } from '@/hooks/useJourneyPlanner';
import { AddressInput } from './AddressInput';
import { RouteInfo } from './RouteInfo';

interface JourneyPlannerProps {
  onRouteChange?: (route: any) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export const JourneyPlanner = ({ onRouteChange, userLocation }: JourneyPlannerProps) => {
  const {
    origin,
    destination,
    route,
    isLoading,
    setOrigin,
    setDestination,
    calculateRoute,
    clearRoute,
    getAddressFromCoordinates
  } = useJourneyPlanner();

  // Update route in parent component when route changes
  useEffect(() => {
    onRouteChange?.(route);
  }, [route, onRouteChange]);

  const handleClearRoute = () => {
    clearRoute();
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Route className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Plan Journey</h3>
      </div>

      <div className="space-y-3">
        <AddressInput
          label="From"
          placeholder="Enter origin address..."
          value={origin}
          onValueChange={setOrigin}
          userLocation={userLocation}
          showCurrentLocationButton={true}
          variant="origin"
          getAddressFromCoordinates={getAddressFromCoordinates}
        />

        <AddressInput
          label="To"
          placeholder="Enter destination address..."
          value={destination}
          onValueChange={setDestination}
          userLocation={userLocation}
          variant="destination"
        />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={calculateRoute}
            disabled={!origin || !destination || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Calculating...' : 'Calculate Route'}
          </Button>
          {(route || origin || destination) && (
            <Button variant="outline" onClick={handleClearRoute}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Route Info */}
        {route && (
          <RouteInfo 
            route={route} 
            origin={origin} 
            destination={destination} 
          />
        )}
      </div>
    </Card>
  );
};

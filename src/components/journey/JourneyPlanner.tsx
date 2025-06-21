
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Route, X, Shield, Construction } from 'lucide-react';
import { JourneyPoint, Route as JourneyRoute } from '@/hooks/useJourneyPlanner';
import { AddressInput } from './AddressInput';
import { RouteInfo } from './RouteInfo';

interface JourneyPlannerProps {
  userLocation?: {
    lat: number;
    lng: number;
  } | null;
  // Journey state props
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
}

export const JourneyPlanner = ({
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
  getAddressFromCoordinates
}: JourneyPlannerProps) => {
  const handleClearRoute = () => {
    clearRoute();
  };

  useEffect(() => {
    console.log('JourneyPlanner mounted');
    console.log('User destination:', destination);
    console.log('User origin:', origin);
  }, [destination, origin]);

  return (
    <div className="p-4 space-y-4 px-0 py-0">
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

        {/* Safety Routing Toggle - Disabled */}
        <div className="flex items-center space-x-2 p-2 bg-muted rounded-md opacity-70">
          <Switch 
            id="safe-routing" 
            checked={false} 
            disabled={true} 
            onCheckedChange={setUseSafeRouting} 
          />
          <Label htmlFor="safe-routing" className="text-xs flex items-center gap-1 text-muted-foreground">
            Prioritize safe routes
          </Label>
        </div>
        
        {/* Construction Notice */}
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-2 rounded-md border border-amber-300 dark:border-amber-800">
          <Construction className="h-3 w-3" />
          <span>This feature is currently under construction.</span>
        </div>

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
    </div>
  );
};

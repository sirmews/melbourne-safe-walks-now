
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Route, X, Navigation } from 'lucide-react';
import { useJourneyPlanner, JourneyPoint } from '@/hooks/useJourneyPlanner';

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
    clearRoute
  } = useJourneyPlanner();

  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  // Simple geocoding function (you could replace with a proper geocoding service)
  const geocodeAddress = async (address: string): Promise<JourneyPoint | null> => {
    try {
      // Using Nominatim (OpenStreetMap) for free geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Melbourne, Australia&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSetOrigin = async () => {
    if (originAddress.trim()) {
      const point = await geocodeAddress(originAddress);
      if (point) {
        setOrigin(point);
      }
    }
  };

  const handleSetDestination = async () => {
    if (destinationAddress.trim()) {
      const point = await geocodeAddress(destinationAddress);
      if (point) {
        setDestination(point);
      }
    }
  };

  const handleUseCurrentLocation = () => {
    if (userLocation) {
      setOrigin({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: 'Current Location'
      });
      setOriginAddress('Current Location');
    }
  };

  const handleCalculateRoute = async () => {
    await calculateRoute();
    if (route) {
      onRouteChange?.(route);
    }
  };

  const handleClearRoute = () => {
    clearRoute();
    setOriginAddress('');
    setDestinationAddress('');
    onRouteChange?.(null);
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Route className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Plan Journey</h3>
      </div>

      <div className="space-y-3">
        {/* Origin */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">From</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter origin address..."
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetOrigin()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetOrigin}
              disabled={!originAddress.trim()}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
          {userLocation && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 text-xs"
              onClick={handleUseCurrentLocation}
            >
              <Navigation className="h-3 w-3 mr-1" />
              Use current location
            </Button>
          )}
          {origin && (
            <p className="text-xs text-green-600 mt-1">✓ {origin.address}</p>
          )}
        </div>

        {/* Destination */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">To</label>
          <div className="flex gap-2">
            <Input
              placeholder="Enter destination address..."
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetDestination()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetDestination}
              disabled={!destinationAddress.trim()}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
          {destination && (
            <p className="text-xs text-green-600 mt-1">✓ {destination.address}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleCalculateRoute}
            disabled={!origin || !destination || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Calculating...' : 'Calculate Route'}
          </Button>
          {route && (
            <Button variant="outline" onClick={handleClearRoute}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Route Info */}
        {route && (
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-medium">{formatDistance(route.distance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Walking time:</span>
                <span className="font-medium">{formatDuration(route.duration)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

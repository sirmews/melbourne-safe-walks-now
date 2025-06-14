
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MapPin, Route, X, Navigation, Clock, ArrowRight } from 'lucide-react';
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
    clearRoute,
    getAddressFromCoordinates
  } = useJourneyPlanner();

  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');

  // Update route in parent component when route changes
  useEffect(() => {
    onRouteChange?.(route);
  }, [route, onRouteChange]);

  // Simple geocoding function using MapTiler
  const geocodeAddress = async (address: string): Promise<JourneyPoint | null> => {
    try {
      const MAPTILER_API_KEY = 'trIkgoZsSgH2Ht8MXmzd';
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${MAPTILER_API_KEY}&proximity=${userLocation?.lng || 144.9631},${userLocation?.lat || -37.8136}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        return {
          lat: feature.center[1],
          lng: feature.center[0],
          address: feature.place_name || feature.text
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

  const handleUseCurrentLocation = async () => {
    if (userLocation) {
      const address = await getAddressFromCoordinates(userLocation.lat, userLocation.lng);
      setOrigin({
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: address
      });
      setOriginAddress(address);
    }
  };

  const handleClearRoute = () => {
    clearRoute();
    setOriginAddress('');
    setDestinationAddress('');
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
            <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
              <p className="text-xs text-green-700 font-medium">From:</p>
              <p className="text-xs text-green-600">{origin.address}</p>
            </div>
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
            <div className="mt-2 p-2 bg-red-50 rounded-md border border-red-200">
              <p className="text-xs text-red-700 font-medium">To:</p>
              <p className="text-xs text-red-600">{destination.address}</p>
            </div>
          )}
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
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Distance:
                </span>
                <span className="font-medium">{formatDistance(route.distance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Walking time:
                </span>
                <span className="font-medium">{formatDuration(route.duration)}</span>
              </div>
              {origin && destination && (
                <div className="pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <span className="font-medium truncate">{origin.address?.split(',')[0] || 'Origin'}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="font-medium truncate">{destination.address?.split(',')[0] || 'Destination'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

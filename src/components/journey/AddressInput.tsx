
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation } from 'lucide-react';
import { JourneyPoint } from '@/hooks/useJourneyPlanner';

interface AddressInputProps {
  label: string;
  placeholder: string;
  value: JourneyPoint | null;
  onValueChange: (point: JourneyPoint) => void;
  userLocation?: { lat: number; lng: number } | null;
  showCurrentLocationButton?: boolean;
  variant?: 'origin' | 'destination';
  getAddressFromCoordinates?: (lat: number, lng: number) => Promise<string>;
}

export const AddressInput = ({ 
  label, 
  placeholder, 
  value, 
  onValueChange, 
  userLocation, 
  showCurrentLocationButton = false,
  variant = 'origin',
  getAddressFromCoordinates
}: AddressInputProps) => {
  const [address, setAddress] = useState('');

  // Sync address with value prop
  useEffect(() => {
    if (value?.address) {
      setAddress(value.address);
    } else if (!value) {
      setAddress('');
    }
  }, [value]);

  // Simple geocoding function using MapTiler
  const geocodeAddress = async (addressText: string): Promise<JourneyPoint | null> => {
    try {
      const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(addressText)}.json?key=${MAPTILER_API_KEY}&proximity=${userLocation?.lng || 144.9631},${userLocation?.lat || -37.8136}&limit=1`
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

  const handleSetAddress = async () => {
    if (address.trim()) {
      const point = await geocodeAddress(address);
      if (point) {
        onValueChange(point);
      }
    }
  };

  const handleUseCurrentLocation = async () => {
    if (userLocation && getAddressFromCoordinates) {
      const addressText = await getAddressFromCoordinates(userLocation.lat, userLocation.lng);
      const originPoint = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        address: addressText
      };
      onValueChange(originPoint);
    }
  };

  const colorClasses = variant === 'origin' 
    ? 'bg-green-50 border-green-200 text-green-700 text-green-600'
    : 'bg-red-50 border-red-200 text-red-700 text-red-600';

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSetAddress()}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSetAddress}
          disabled={!address.trim()}
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>
      {showCurrentLocationButton && userLocation && (
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
      {value && (
        <div className={`mt-2 p-2 rounded-md border ${colorClasses.split(' ').slice(0, 2).join(' ')}`}>
          <p className={`text-xs font-medium ${colorClasses.split(' ')[2]}`}>
            {variant === 'origin' ? 'From:' : 'To:'}
          </p>
          <p className={`text-xs ${colorClasses.split(' ')[3]}`}>{value.address}</p>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useRef } from 'react';
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

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

// Get the MapTiler API key with fallback
const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || 'trIkgoZsSgH2Ht8MXmzd';

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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  console.log(`[${variant}] AddressInput render:`, { value, address, showSuggestions, isSelecting });

  // Sync address with value prop
  useEffect(() => {
    console.log(`[${variant}] Effect - value changed:`, value);
    if (value?.address && !isSelecting) {
      setAddress(value.address);
    } else if (!value && !isSelecting) {
      setAddress('');
    }
  }, [value, isSelecting, variant]);

  // Debounced autocomplete search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (address.length > 2 && !isSelecting) {
        console.log(`[${variant}] Searching for:`, address);
        searchAddresses(address);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [address, isSelecting, variant]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddresses = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const proximityParam = userLocation 
        ? `&proximity=${userLocation.lng},${userLocation.lat}`
        : '&proximity=144.9631,-37.8136'; // Default to Melbourne

      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}${proximityParam}&limit=5`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to search addresses');
      }

      const data = await response.json();
      const addressSuggestions = data.features?.map((feature: any) => ({
        id: feature.id,
        place_name: feature.place_name || feature.text,
        center: feature.center
      })) || [];
      
      console.log(`[${variant}] Found suggestions:`, addressSuggestions.length);
      setSuggestions(addressSuggestions);
      setShowSuggestions(addressSuggestions.length > 0);
    } catch (error) {
      console.error('Autocomplete search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    console.log(`[${variant}] Suggestion clicked:`, suggestion);
    setIsSelecting(true);
    
    const point: JourneyPoint = {
      lat: suggestion.center[1],
      lng: suggestion.center[0],
      address: suggestion.place_name
    };
    
    setAddress(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onValueChange(point);
    
    // Reset selecting flag after a short delay
    setTimeout(() => {
      setIsSelecting(false);
    }, 100);
  };

  const handleSetAddress = async () => {
    if (address.trim() && !value) {
      // Only geocode if we don't already have a selected point
      const point = await geocodeAddress(address);
      if (point) {
        onValueChange(point);
      }
    }
  };

  const geocodeAddress = async (addressText: string): Promise<JourneyPoint | null> => {
    try {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log(`[${variant}] Input changed:`, newValue);
    setAddress(newValue);
    
    // Only clear the selected point if user manually types something different
    // and we're not in the middle of selecting a suggestion
    if (value && newValue !== value.address && !isSelecting) {
      console.log(`[${variant}] Clearing selected point because input changed`);
      // Instead of clearing completely, we'll keep the point but mark it as being edited
      // This prevents the constant clearing that causes the dropdown to reopen
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && !value) {
      setShowSuggestions(true);
    }
  };

  const colorClasses = variant === 'origin' 
    ? 'bg-green-50 border-green-200 text-green-700 text-green-600'
    : 'bg-red-50 border-red-200 text-red-700 text-red-600';

  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={address}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyPress={(e) => e.key === 'Enter' && handleSetAddress()}
            className={isLoading ? 'pr-8' : ''}
          />
          {isLoading && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
            </div>
          )}
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && !value && (
            <div 
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0 text-sm"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="truncate">{suggestion.place_name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleSetAddress}
          disabled={!address.trim() || !!value}
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

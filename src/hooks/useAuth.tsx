
import { useEffect, useState } from 'react';

export const useAuth = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Get user's current location
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
  }, []);

  return {
    user: null,
    session: null,
    loading: false,
    userLocation,
    signUp: () => Promise.resolve({ error: null }),
    signIn: () => Promise.resolve({ error: null }),
    signOut: () => Promise.resolve({ error: null })
  };
};

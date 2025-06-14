
import { MapPin, Clock, ArrowRight } from 'lucide-react';
import { Route } from '@/hooks/useJourneyPlanner';
import { JourneyPoint } from '@/hooks/useJourneyPlanner';

interface RouteInfoProps {
  route: Route;
  origin?: JourneyPoint | null;
  destination?: JourneyPoint | null;
}

export const RouteInfo = ({ route, origin, destination }: RouteInfoProps) => {
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
  );
};


import { Circle, MapPin, Navigation } from 'lucide-react';

export const InfoCardsSection = () => {
  return (
    <div className="p-4 px-0 py-0">
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <Circle className="h-3 w-3 fill-green-500 text-green-500" />
          <span className="text-gray-600">Safe areas (high community ratings)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Circle className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span className="text-gray-600">Moderate safety areas</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Circle className="h-3 w-3 fill-red-500 text-red-500" />
          <span className="text-gray-600">Areas with safety concerns</span>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span className="text-gray-600">Individual safety reports</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-purple-600" />
          <span className="text-gray-600">Calculated route</span>
        </div>
      </div>
    </div>
  );
};

import { MapPin, Shield, Users } from 'lucide-react';
export const AboutSafePathCard = () => {
  return <div className="p-4 px-0 py-0">
      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
          <span>Click anywhere on the map to report safety concerns or positive observations</span>
        </div>
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 mt-0.5 text-purple-600 flex-shrink-0" />
          <span>Community-driven data helps everyone make informed decisions about their routes</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
          <span>Click on any existing pin to view detailed safety information</span>
        </div>
        <div className="mt-3 p-2 bg-green-50 rounded-md">
          <p className="text-xs text-green-700">
            ✨ Completely anonymous - no signup required to contribute to community safety
          </p>
        </div>
      </div>
    </div>;
};
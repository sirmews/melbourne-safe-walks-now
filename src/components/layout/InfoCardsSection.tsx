
import { Card } from '@/components/ui/card';
import { MapPin, Shield, Users } from 'lucide-react';

export const InfoCardsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* About SafePath Card */}
      <Card className="p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          About SafePath
        </h3>
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
      </Card>

      {/* Legend Card */}
      <Card className="p-4">
        <h3 className="text-md font-semibold mb-3">Legend</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-medium text-green-700 mb-2">Safe Areas</h4>
            <div className="space-y-1 ml-2">
              <div className="flex items-center gap-2">
                <span className="text-base">💡</span>
                <span>Well lit areas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">👮</span>
                <span>Police presence</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🏢</span>
                <span>Busy safe areas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">📹</span>
                <span>CCTV monitored</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-red-700 mb-2">Risk Areas</h4>
            <div className="space-y-1 ml-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🌑</span>
                <span>Poorly lit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>Crime hotspots</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚨</span>
                <span>Dangerous areas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">👀</span>
                <span>Suspicious activity</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <h4 className="font-medium text-gray-700 mb-2">Severity & Buffer Zones</h4>
            <div className="space-y-1 ml-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <span>Low risk (100m buffer)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>Medium risk (200m buffer)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>High risk (300m buffer)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-600"></div>
                <span>Critical risk (500m buffer)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};


import { Card } from '@/components/ui/card';

export const InfoCardsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mt-6">
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

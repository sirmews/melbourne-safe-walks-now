
import { Shield, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface MapPopupProps {
  position: { lng: number; lat: number };
  onClose: () => void;
  onSafetyReport: () => void;
  onPlanTrip: () => void;
}

export const MapPopup = ({ position, onClose, onSafetyReport, onPlanTrip }: MapPopupProps) => {
  return (
    <Card className="absolute z-40 p-3 bg-white shadow-lg rounded-lg min-w-[200px] transform -translate-x-1/2 -translate-y-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Map Options</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSafetyReport}
          className="flex-1 flex flex-col items-center p-3 h-auto"
        >
          <Shield className="h-5 w-5 mb-1 text-blue-600" />
          <span className="text-xs">Safety Report</span>
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onPlanTrip}
          className="flex-1 flex flex-col items-center p-3 h-auto"
        >
          <Navigation className="h-5 w-5 mb-1 text-green-600" />
          <span className="text-xs">Plan Trip</span>
        </Button>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 text-center">
        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
      </div>
      
      {/* Arrow pointing down */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white"></div>
      </div>
    </Card>
  );
};

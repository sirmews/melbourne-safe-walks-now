import { Shield, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
interface MapPopupProps {
  position: {
    lng: number;
    lat: number;
  };
  onClose: () => void;
  onSafetyReport: () => void;
  onPlanTrip: (lng: number, lat: number) => void;
  showPlanTrip?: boolean;
}
export const MapPopup = ({
  position,
  onClose,
  onSafetyReport,
  onPlanTrip,
  showPlanTrip = true
}: MapPopupProps) => {
  const handlePlanTrip = () => {
    onPlanTrip(position.lng, position.lat);
  };
  return <Card className="absolute z-40 p-3 bg-white shadow-lg rounded-lg min-w-[200px] transform -translate-x-1/2 -translate-y-full">
      <div className="flex items-center justify-between mb-2">
        
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      <div className={`grid gap-2 ${showPlanTrip ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div className='flex-1 flex'>
        <Button variant="outline" size="sm" onClick={onSafetyReport} className="flex-1 flex flex-col items-center p-3 h-auto">
          <Shield className="h-5 w-5 mb-1 text-blue-600" />
          <span className="text-xs">Safety Report</span>
        </Button>
        </div>
        {showPlanTrip && <div className='flex-1 flex'>
          <Button variant="outline" size="sm" onClick={handlePlanTrip} className="flex-1 flex flex-col items-center p-3 h-auto">
            <Navigation className="h-5 w-5 mb-1 text-green-600" />
            <span className="text-xs">Plan Trip</span>
          </Button>
          </div>}
      </div>
      
      
      
      {/* Arrow pointing down */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2">
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white"></div>
      </div>
    </Card>;
};
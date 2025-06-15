
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SafetyInfoProps {
  safetyAnalysis: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    safetyNotes: string[];
    dangerousAreas: { lat: number; lng: number; reason: string }[];
  };
}

export const SafetyInfo = ({ safetyAnalysis }: SafetyInfoProps) => {
  const { riskScore, riskLevel, safetyNotes, dangerousAreas } = safetyAnalysis;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Shield className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSafetyLevelText = (level: string) => {
    switch (level) {
      case 'low': return 'Very Safe';
      case 'medium': return 'Moderately Safe';
      case 'high': return 'Use Caution';
      case 'critical': return 'High Risk';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-3">
      {/* Risk Level Indicator */}
      <Alert className={getRiskColor(riskLevel)}>
        <div className="flex items-center gap-2">
          {getRiskIcon(riskLevel)}
          <div className="flex-1">
            <div className="font-semibold text-sm">
              Safety Level: {getSafetyLevelText(riskLevel)}
            </div>
            <div className="text-xs opacity-75">
              Risk Score: {Math.round(riskScore)}/100
            </div>
          </div>
        </div>
      </Alert>

      {/* Safety Notes */}
      {safetyNotes.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-green-700 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Safe Areas on Route:
          </div>
          {safetyNotes.map((note, index) => (
            <div key={index} className="text-xs text-green-600 pl-4">
              • {note}
            </div>
          ))}
        </div>
      )}

      {/* Dangerous Areas */}
      {dangerousAreas.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-700 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Areas of Concern:
          </div>
          {dangerousAreas.slice(0, 3).map((area, index) => (
            <div key={index} className="text-xs text-red-600 pl-4">
              • {area.reason}
            </div>
          ))}
          {dangerousAreas.length > 3 && (
            <div className="text-xs text-red-500 pl-4">
              + {dangerousAreas.length - 3} more areas
            </div>
          )}
        </div>
      )}
    </div>
  );
};

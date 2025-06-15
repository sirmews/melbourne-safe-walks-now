
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Tag, Shield, Flag, CheckCircle, AlertTriangle } from 'lucide-react';
import { safetyReportsApi } from '@/services/safetyReportsApi';
import { toast } from 'sonner';

// Updated type to match the new database function return signature
type SafetyReport = {
  id: string;
  location_lat: number;
  location_lng: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  rating_avg: number;
  rating_count: number;
  verified: boolean;
  flagged: boolean;
};

interface ReportDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: SafetyReport | null;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'low': return 'bg-green-500';
    case 'medium': return 'bg-amber-500';
    case 'high': return 'bg-red-500';
    case 'critical': return 'bg-purple-500';
    default: return 'bg-gray-500';
  }
};

const formatCategory = (category: string) => {
  return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const ReportDetailsModal = ({ open, onOpenChange, report }: ReportDetailsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localReport, setLocalReport] = useState(report);

  // Update local report when prop changes
  if (report && report !== localReport) {
    setLocalReport(report);
  }

  if (!localReport) return null;

  const handleFlagReport = async () => {
    if (!localReport) return;

    setIsLoading(true);
    try {
      const newFlaggedState = !localReport.flagged;
      await safetyReportsApi.flagReport(localReport.id, newFlaggedState);
      
      // Update local state
      setLocalReport({ ...localReport, flagged: newFlaggedState });
      
      toast.success(newFlaggedState ? 'Report flagged successfully' : 'Report unflagged successfully');
    } catch (error) {
      console.error('Error flagging report:', error);
      toast.error('Failed to flag report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Safety Report Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg">{localReport.title}</h3>
              <div className="flex items-center gap-2">
                {localReport.verified && (
                  <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {localReport.flagged && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Flagged
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {formatCategory(localReport.category)}
              </Badge>
              <div className={`w-3 h-3 rounded-full ${getSeverityColor(localReport.severity)}`}></div>
              <span className="text-sm text-gray-600 capitalize">{localReport.severity} Risk</span>
            </div>

            {localReport.description && (
              <p className="text-gray-700 mb-3">{localReport.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
              <Calendar className="h-4 w-4" />
              <span>
                Reported on {new Date(localReport.created_at).toLocaleDateString()} at{' '}
                {new Date(localReport.created_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-sm text-gray-600 mb-3">
              <p>Location: {localReport.location_lat.toFixed(6)}, {localReport.location_lng.toFixed(6)}</p>
            </div>

            {localReport.rating_count > 0 && (
              <div className="p-2 bg-gray-50 rounded mb-3">
                <p className="text-sm">
                  Community Rating: {localReport.rating_avg.toFixed(1)}/5 
                  ({localReport.rating_count} rating{localReport.rating_count !== 1 ? 's' : ''})
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant={localReport.flagged ? "destructive" : "outline"}
                size="sm"
                onClick={handleFlagReport}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Flag className="h-4 w-4" />
                {isLoading ? 'Processing...' : (localReport.flagged ? 'Unflag Report' : 'Flag Report')}
              </Button>
              
              {localReport.verified && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Shield className="h-4 w-4" />
                  <span>Community Verified</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

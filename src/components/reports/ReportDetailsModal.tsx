
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { MapPin, Calendar, Tag } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type SafetyReport = Database['public']['Functions']['get_reports_in_bounds']['Returns'][0];

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
  if (!report) return null;

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
            <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {formatCategory(report.category)}
              </Badge>
              <div className={`w-3 h-3 rounded-full ${getSeverityColor(report.severity)}`}></div>
              <span className="text-sm text-gray-600 capitalize">{report.severity} Risk</span>
            </div>

            {report.description && (
              <p className="text-gray-700 mb-3">{report.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                Reported on {new Date(report.created_at).toLocaleDateString()} at{' '}
                {new Date(report.created_at).toLocaleTimeString()}
              </span>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              <p>Location: {report.location_lat.toFixed(6)}, {report.location_lng.toFixed(6)}</p>
            </div>

            {report.rating_count > 0 && (
              <div className="mt-3 p-2 bg-gray-50 rounded">
                <p className="text-sm">
                  Community Rating: {report.rating_avg.toFixed(1)}/5 
                  ({report.rating_count} rating{report.rating_count !== 1 ? 's' : ''})
                </p>
              </div>
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { safetyReportsApi } from '@/services/safetyReportsApi';
import { toast } from 'sonner';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lat: number;
  lng: number;
  onReportCreated: () => void;
}

const CATEGORIES = [
  { value: 'unlit_street', label: 'Unlit Street' },
  { value: 'dangerous_area', label: 'Dangerous Area' },
  { value: 'facility_risk', label: 'Facility Risk' },
  { value: 'crime_hotspot', label: 'Crime Hotspot' },
  { value: 'poor_visibility', label: 'Poor Visibility' },
  { value: 'unsafe_infrastructure', label: 'Unsafe Infrastructure' },
  { value: 'suspicious_activity', label: 'Suspicious Activity' },
  { value: 'well_lit_safe', label: 'Well Lit & Safe' },
  { value: 'police_presence', label: 'Police Presence' },
  { value: 'busy_safe_area', label: 'Busy Safe Area' }
];

const SEVERITIES = [
  { value: 'low', label: 'Low Risk' },
  { value: 'medium', label: 'Medium Risk' },
  { value: 'high', label: 'High Risk' },
  { value: 'critical', label: 'Critical Risk' }
];

export const ReportModal = ({ open, onOpenChange, lat, lng, onReportCreated }: ReportModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category) return;

    setLoading(true);
    try {
      await safetyReportsApi.createReport({
        title,
        description,
        category,
        severity,
        lat,
        lng
      });

      toast.success('Safety report created successfully!');
      onReportCreated();
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setSeverity('medium');
    } catch (error: any) {
      console.error('Error creating report:', error);
      if (error.message.includes('Rate limit exceeded')) {
        toast.error('Too many reports submitted. Please wait before submitting another.');
      } else {
        toast.error('Failed to create report. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Safety Report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the safety concern"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITIES.map((sev) => (
                  <SelectItem key={sev.value} value={sev.value}>
                    {sev.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about this safety concern..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !category}>
              {loading ? 'Creating...' : 'Create Report'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

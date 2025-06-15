
// API service for safety reports using secure Edge Functions

const FUNCTIONS_URL = 'https://lbiqkrajvvgetgomwqnx.supabase.co/functions/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxiaXFrcmFqdnZnZXRnb213cW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4OTk5NzksImV4cCI6MjA2NTQ3NTk3OX0.m5so0HhdD9WQfvAv8EltUsB3MBmrNnD9gfNZL4F9tu4';

export interface SafetyReportData {
  title: string;
  description?: string;
  category: string;
  severity: string;
  lat: number;
  lng: number;
}

export interface BoundsData {
  sw_lat: number;
  sw_lng: number;
  ne_lat: number;
  ne_lng: number;
}

export const safetyReportsApi = {
  async getReportsInBounds(bounds: BoundsData) {
    const response = await fetch(`${FUNCTIONS_URL}/get-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(bounds)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch reports');
    }

    return response.json();
  },

  async createReport(reportData: SafetyReportData) {
    const response = await fetch(`${FUNCTIONS_URL}/create-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(reportData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create report');
    }

    return response.json();
  }
};

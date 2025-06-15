
// API service for safety reports using secure Edge Functions

const FUNCTIONS_URL = 'https://lbiqkrajvvgetgomwqnx.supabase.co/functions/v1';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

export async function fetchApi(path: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getInfrastructure: () => fetchApi('/api/infrastructure'),
  getAssetDetails: (id: string) => fetchApi(`/api/infrastructure/${id}`),
  getStationInfrastructure: (stationId: string) => fetchApi(`/api/stations/${stationId}/infrastructure`),
  getRecentReports: (infraId: string) => fetchApi(`/api/reports/${infraId}`),
  submitReport: (payload: { infrastructure_id: string; user_id: string; description: string; severity: string }) => 
    fetchApi('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getAlerts: () => fetchApi('/api/alerts'),
  resolveAlert: (alertId: string) => 
    fetchApi(`/api/alerts/${alertId}/resolve`, {
      method: 'POST',
    }),
  getDashboardSummary: () => fetchApi('/api/dashboard/summary'),
};

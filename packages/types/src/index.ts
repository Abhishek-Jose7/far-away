// Roles
export type UserRole = 'commuter' | 'operator' | 'admin';

// Infrastructure Types & Status
export type InfrastructureType = 'escalator' | 'elevator' | 'bus_stop' | 'charger' | 'footbridge' | 'metro_entrance';
export type AssetStatus = 'healthy' | 'warning' | 'critical';
export type SeverityLevel = 'low' | 'medium' | 'high';

// DB Models
export interface User {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Station {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Infrastructure {
  id: string;
  station_id: string;
  name: string;
  type: InfrastructureType;
  status: AssetStatus;
  latitude: number;
  longitude: number;
  last_maintenance: string;
  created_at: string;
  station_name?: string; // joined
}

export interface Report {
  id: string;
  infrastructure_id: string;
  user_id: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  created_at: string;
  user_name?: string; // joined
}

export interface HealthScore {
  id: string;
  infrastructure_id: string;
  score: number;
  failure_probability: number;
  predicted_failure_time: string | null;
  computed_at: string;
}

export interface Alert {
  id: string;
  infrastructure_id: string;
  title: string;
  message: string;
  severity: 'warning' | 'critical';
  resolved: number; // 0 or 1 for SQLite compatibility
  created_at: string;
  asset_name?: string; // joined
  station_name?: string; // joined
  failure_probability?: number; // joined from health_scores
}

export interface HealthTrendPoint {
  day: string;
  health: number;
  incidents?: number;
}

export interface MaintenanceLog {
  id: string;
  infrastructure_id: string;
  action: string;
  technician: string;
  completed_at: string;
}

// API Payloads
export interface CreateReportPayload {
  infrastructure_id: string;
  user_id: string;
  description: string;
  severity: SeverityLevel;
}

export interface CreateAlertPayload {
  infrastructure_id: string;
  title: string;
  message: string;
  severity: 'warning' | 'critical';
}

export interface ResolveAlertPayload {
  resolved_by_user_id: string;
}

// API Responses
export interface DashboardSummaryResponse {
  totalInfrastructure: number;
  activeAlerts: number;
  criticalAssets: number;
  averageReliability: number;
}

// Queue Processing Payload
export interface IngestionQueueMessage {
  reportId: string;
  infrastructureId: string;
  severity: SeverityLevel;
  userId: string;
  timestamp: string;
}

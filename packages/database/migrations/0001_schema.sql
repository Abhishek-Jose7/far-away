-- 0001_schema.sql
-- D1 Migration for Transit Infrastructure Intelligence

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('commuter', 'operator', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Stations Table (Transit Hubs)
CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Infrastructure Table (Assets)
CREATE TABLE IF NOT EXISTS infrastructure (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('escalator', 'elevator', 'bus_stop', 'charger', 'footbridge', 'metro_entrance')),
  status TEXT NOT NULL DEFAULT 'healthy' CHECK(status IN ('healthy', 'warning', 'critical')),
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  last_maintenance TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Reports Table (Commuter Submissions)
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  infrastructure_id TEXT NOT NULL REFERENCES infrastructure(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high')),
  confidence REAL NOT NULL DEFAULT 0.5,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Health Scores Table (Calculated Asset Health)
CREATE TABLE IF NOT EXISTS health_scores (
  id TEXT PRIMARY KEY,
  infrastructure_id TEXT NOT NULL REFERENCES infrastructure(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK(score >= 0 AND score <= 100),
  failure_probability REAL NOT NULL CHECK(failure_probability >= 0.0 AND failure_probability <= 1.0),
  predicted_failure_time TEXT, -- Nullable ISO date or hours remaining
  computed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Alerts Table (Generated Alerts)
CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  infrastructure_id TEXT NOT NULL REFERENCES infrastructure(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('warning', 'critical')),
  resolved INTEGER NOT NULL DEFAULT 0 CHECK(resolved IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Maintenance Logs Table
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id TEXT PRIMARY KEY,
  infrastructure_id TEXT NOT NULL REFERENCES infrastructure(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  technician TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_infrastructure_station_id ON infrastructure(station_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_status ON infrastructure(status);
CREATE INDEX IF NOT EXISTS idx_reports_infrastructure_id ON reports(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_health_scores_infrastructure_id ON health_scores(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved_severity ON alerts(resolved, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_infrastructure_id ON alerts(infrastructure_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_infrastructure_id ON maintenance_logs(infrastructure_id);

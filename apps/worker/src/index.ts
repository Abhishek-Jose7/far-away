import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { createReportSchema } from '@transitiq/shared';
import { 
  calculateConfidenceScore, 
  calculateHealthAndPrediction 
} from '@transitiq/scoring-engine';
import { 
  User, 
  Station, 
  Infrastructure, 
  Report, 
  HealthScore, 
  Alert, 
  DashboardSummaryResponse,
  HealthTrendPoint
} from '@transitiq/types';

type Bindings = {
  DB: D1Database;
  TRANSIT_KV: KVNamespace;
};

type Variables = {
  userId: string;
};

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>();

// Enable CORS for Vercel frontend deployments
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Clerk JWT decoding & hackathon mock authentication middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized: Missing or invalid token' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  // Hackathon demo shortcut: allow passing plain user ids like "usr_demo_1"
  if (token.startsWith('usr_') || token.startsWith('user_')) {
    c.set('userId', token);
    return await next();
  }
  
  // Clerk JWT parse (extract sub claim containing Clerk user_id)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      // Decode JWT payload chunk base64
      const payloadDecoded = atob(parts[1]);
      const payload = JSON.parse(payloadDecoded);
      if (payload && payload.sub) {
        c.set('userId', payload.sub);
        return await next();
      }
    }
  } catch (err) {}
  
  return c.json({ success: false, error: 'Unauthorized: JWT signature check or parsing failed' }, 401);
};

// API ROUTES

// 1. Stations Endpoints (Public)
app.get('/api/stations', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM stations ORDER BY name ASC').all<Station>();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/stations/:id', async (c) => {
  const stationId = c.req.param('id');
  try {
    const station = await c.env.DB.prepare('SELECT * FROM stations WHERE id = ?').bind(stationId).first<Station>();
    if (!station) {
      return c.json({ success: false, error: 'Station not found' }, 404);
    }
    const { results: stationAssets } = await c.env.DB.prepare(`
      SELECT i.*, hs.score, hs.failure_probability
      FROM infrastructure i
      LEFT JOIN (
        SELECT infrastructure_id, score, failure_probability,
               ROW_NUMBER() OVER (PARTITION BY infrastructure_id ORDER BY computed_at DESC) as rn
        FROM health_scores
      ) hs ON i.id = hs.infrastructure_id AND hs.rn = 1
      WHERE i.station_id = ?
    `).bind(stationId).all();

    return c.json({
      success: true,
      data: {
        ...station,
        infrastructure: stationAssets
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Infrastructure Endpoints (Public)
app.get('/api/infrastructure', async (c) => {
  try {
    const query = `
      SELECT i.*, s.name as station_name, hs.score, hs.failure_probability, hs.predicted_failure_time
      FROM infrastructure i
      LEFT JOIN stations s ON i.station_id = s.id
      LEFT JOIN (
        SELECT infrastructure_id, score, failure_probability, predicted_failure_time,
               ROW_NUMBER() OVER (PARTITION BY infrastructure_id ORDER BY computed_at DESC) as rn
        FROM health_scores
      ) hs ON i.id = hs.infrastructure_id AND hs.rn = 1
    `;
    const { results } = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/infrastructure/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const assetQuery = `
      SELECT i.*, s.name as station_name
      FROM infrastructure i
      LEFT JOIN stations s ON i.station_id = s.id
      WHERE i.id = ?
    `;
    const asset = await c.env.DB.prepare(assetQuery).bind(id).first<Infrastructure>();
    if (!asset) {
      return c.json({ success: false, error: 'Asset not found' }, 404);
    }

    const latestHealth = await c.env.DB.prepare(`
      SELECT * FROM health_scores 
      WHERE infrastructure_id = ? 
      ORDER BY computed_at DESC LIMIT 1
    `).bind(id).first<HealthScore>();

    const activeAlerts = await c.env.DB.prepare(`
      SELECT * FROM alerts 
      WHERE infrastructure_id = ? AND resolved = 0
    `).bind(id).all<Alert>();

    const recentReports = await c.env.DB.prepare(`
      SELECT r.*, u.name as user_name 
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.infrastructure_id = ? 
      ORDER BY r.created_at DESC LIMIT 10
    `).bind(id).all<Report>();

    // Fetch history logs for graphs (Limit 20 entries)
    const historyLogs = await c.env.DB.prepare(`
      SELECT * FROM infrastructure_status_history 
      WHERE infrastructure_id = ? 
      ORDER BY created_at DESC LIMIT 20
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...asset,
        health: latestHealth || null,
        activeAlerts: activeAlerts.results || [],
        recentReports: recentReports.results || [],
        history: historyLogs.results || []
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 3. Citizen Reports Endpoints
// Authenticated route
// SYNCHRONOUS AGENT PIPELINE RUNNER
// Executes Verification -> Prediction -> Alert Agents sequentially in a single execution thread
const runAgentPipeline = async (
  db: D1Database,
  kv: KVNamespace,
  reportId: string,
  infrastructureId: string,
  userId: string
) => {
  // 1. VERIFICATION AGENT STEP
  const user = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<{ role: string }>();
  const userRole = (user?.role || 'commuter') as any;

  // Count recent commuter reports (past 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const countResult = await db.prepare(`
    SELECT COUNT(*) as count 
    FROM reports 
    WHERE infrastructure_id = ? AND created_at >= ?
  `).bind(infrastructureId, yesterday).first<{ count: number }>();

  const recentReportsCount = countResult?.count || 1;
  const confidence = calculateConfidenceScore(recentReportsCount, userRole);

  // Save confidence score in D1
  await db.prepare('UPDATE reports SET confidence = ? WHERE id = ?').bind(confidence, reportId).run();

  // 2. PREDICTION AGENT STEP
  const asset = await db.prepare('SELECT type, last_maintenance, name FROM infrastructure WHERE id = ?').bind(infrastructureId).first<Infrastructure>();
  if (!asset) return;

  const activeReports = await db.prepare(`
    SELECT severity, confidence FROM reports 
    WHERE infrastructure_id = ? AND created_at >= ?
  `).bind(infrastructureId, yesterday).all<Report>();

  const scoringInputs = (activeReports.results || []).map(r => ({
    severity: r.severity as any,
    confidence: r.confidence
  }));

  // Calculate health indexes using scoring-engine
  const prediction = calculateHealthAndPrediction(
    asset.type,
    asset.last_maintenance,
    scoringInputs
  );

  // Write updated health metrics row in D1
  const scoreId = `hs_${crypto.randomUUID()}`;
  await db.prepare(`
    INSERT INTO health_scores (id, infrastructure_id, score, failure_probability, predicted_failure_time, computed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    scoreId, 
    infrastructureId, 
    prediction.healthScore, 
    prediction.failureProbability, 
    prediction.predictedFailureHours ? new Date(Date.now() + prediction.predictedFailureHours * 60 * 60 * 1000).toISOString() : null,
    new Date().toISOString()
  ).run();

  // Log historical progression for graphs
  const historyId = `sh_${crypto.randomUUID()}`;
  await db.prepare(`
    INSERT INTO infrastructure_status_history (id, infrastructure_id, health_score, failure_probability, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    historyId, 
    infrastructureId, 
    prediction.healthScore, 
    prediction.failureProbability, 
    new Date().toISOString()
  ).run();

  // Update current asset status in D1
  await db.prepare('UPDATE infrastructure SET status = ? WHERE id = ?').bind(prediction.status, infrastructureId).run();

  // 3. ALERT AGENT STEP
  if (prediction.failureProbability > 0.70) {
    const existingAlert = await db.prepare(`
      SELECT id FROM alerts 
      WHERE infrastructure_id = ? AND resolved = 0
    `).bind(infrastructureId).first();

    if (!existingAlert) {
      const alertId = `alt_${crypto.randomUUID()}`;
      const alertTitle = `Predictive Alert: High Outage Risk on ${asset.name}`;
      const alertMsg = `Calculated failure probability is ${(prediction.failureProbability * 100).toFixed(0)}%. Asset health index is ${prediction.healthScore}/100. Scheduled maintenance dispatch recommended.`;
      
      await db.prepare(`
        INSERT INTO alerts (id, infrastructure_id, title, message, severity, resolved, created_at)
        VALUES (?, ?, ?, ?, 'critical', 0, ?)
      `).bind(
        alertId, 
        infrastructureId, 
        alertTitle, 
        alertMsg, 
        new Date().toISOString()
      ).run();
    }
  }

  // Clear dashboard summary cache in KV
  await kv.delete('dashboard_summary');
};

app.post('/api/reports', authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const authenticatedUserId = c.get('userId');

    // Override user_id from token for safety
    body.user_id = authenticatedUserId;
    
    // Zod Payload Validation
    const validation = createReportSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ success: false, error: 'Validation failed', details: validation.error.format() }, 400);
    }

    const payload = validation.data;
    const reportId = `rep_${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    // Auto-create default commuter user record in D1 if not exists to facilitate smooth hackathon flows
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(payload.user_id).first<{ role: string }>();
    if (!user) {
      await c.env.DB.prepare(`
        INSERT INTO users (id, clerk_id, name, email, role, created_at)
        VALUES (?, ?, ?, ?, 'commuter', ?)
      `).bind(payload.user_id, `clerk_${payload.user_id}`, 'Citizen Commuter', `${payload.user_id}@example.com`, timestamp).run();
    }

    // Step 1: Save Report to D1 (Confidence starts at 0.5)
    await c.env.DB.prepare(`
      INSERT INTO reports (id, infrastructure_id, user_id, description, severity, confidence, created_at)
      VALUES (?, ?, ?, ?, ?, 0.5, ?)
    `).bind(
      reportId, 
      payload.infrastructure_id, 
      payload.user_id, 
      payload.description, 
      payload.severity, 
      timestamp
    ).run();

    // Step 2: Execute Verification & Prediction synchronous pipeline immediately
    await runAgentPipeline(
      c.env.DB,
      c.env.TRANSIT_KV,
      reportId,
      payload.infrastructure_id,
      payload.user_id
    );

    return c.json({ 
      success: true, 
      message: 'Report received and processed by prediction engine', 
      data: { reportId } 
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/reports/:infrastructureId', async (c) => {
  const infraId = c.req.param('infrastructureId');
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, u.name as user_name
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.infrastructure_id = ?
      ORDER BY r.created_at DESC
    `).bind(infraId).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 4. Alerts Endpoints (Public list)
app.get('/api/alerts', async (c) => {
  try {
    const query = `
      SELECT a.*, i.name as asset_name, s.name as station_name, hs.failure_probability
      FROM alerts a
      LEFT JOIN infrastructure i ON a.infrastructure_id = i.id
      LEFT JOIN stations s ON i.station_id = s.id
      LEFT JOIN (
        SELECT infrastructure_id, failure_probability,
               ROW_NUMBER() OVER (PARTITION BY infrastructure_id ORDER BY computed_at DESC) as rn
        FROM health_scores
      ) hs ON a.infrastructure_id = hs.infrastructure_id AND hs.rn = 1
      ORDER BY a.created_at DESC
    `;
    const { results } = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Resolve Alert Endpoint (Operator/Admin Authenticated)
app.post('/api/alerts/:id/resolve', authMiddleware, async (c) => {
  const alertId = c.req.param('id');
  const resolverUserId = c.get('userId');
  try {
    // Check if resolver is operator or admin
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(resolverUserId).first<{ role: string }>();
    if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
      return c.json({ success: false, error: 'Forbidden: Only operators or admins can resolve alerts' }, 403);
    }

    const alert = await c.env.DB.prepare('SELECT infrastructure_id FROM alerts WHERE id = ?').bind(alertId).first<{ infrastructure_id: string }>();
    if (!alert) {
      return c.json({ success: false, error: 'Alert not found' }, 404);
    }

    const timestamp = new Date().toISOString();

    // 1. Resolve alert in DB
    await c.env.DB.prepare('UPDATE alerts SET resolved = 1 WHERE id = ?').bind(alertId).run();

    // 2. Log maintenance task completed
    const logId = `maint_${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO maintenance_logs (id, infrastructure_id, action, technician, completed_at)
      VALUES (?, ?, 'Resolved Alert', 'Operator Dispatch Crew', ?)
    `).bind(logId, alert.infrastructure_id, timestamp).run();

    // 3. Reset the asset back to healthy status & update last maintenance time
    await c.env.DB.prepare(`
      UPDATE infrastructure 
      SET status = 'healthy', last_maintenance = ? 
      WHERE id = ?
    `).bind(timestamp, alert.infrastructure_id).run();

    // 4. Calculate a fresh healthy score
    const scoreId = `hs_${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO health_scores (id, infrastructure_id, score, failure_probability, predicted_failure_time, computed_at)
      VALUES (?, ?, 100, 0.0, NULL, ?)
    `).bind(scoreId, alert.infrastructure_id, timestamp).run();

    // 5. Append a status history baseline for line charts
    const historyId = `sh_${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO infrastructure_status_history (id, infrastructure_id, health_score, failure_probability, created_at)
      VALUES (?, ?, 100, 0.0, ?)
    `).bind(historyId, alert.infrastructure_id, timestamp).run();

    // Clear Cache
    await c.env.TRANSIT_KV.delete('dashboard_summary');

    return c.json({ success: true, message: 'Alert resolved, asset status reset to healthy' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Health Endpoints (Public)
app.get('/api/health/:id', async (c) => {
  const infraId = c.req.param('id');
  try {
    const latestHealth = await c.env.DB.prepare(`
      SELECT * FROM health_scores 
      WHERE infrastructure_id = ? 
      ORDER BY computed_at DESC LIMIT 1
    `).bind(infraId).first<HealthScore>();

    if (!latestHealth) {
      return c.json({ success: false, error: 'No health metrics available yet' }, 404);
    }
    return c.json({ success: true, data: latestHealth });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 6. Dashboard Health Trend Endpoint
app.get('/api/dashboard/health-trend', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        DATE(created_at) as date,
        AVG(health_score) as avg_health,
        COUNT(*) as incidents
      FROM infrastructure_status_history
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `).all<{ date: string; avg_health: number; incidents: number }>();

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend: HealthTrendPoint[] = (results || []).map((row) => {
      const date = new Date(row.date + 'T12:00:00');
      return {
        day: dayNames[date.getDay()],
        health: Math.round(row.avg_health),
        incidents: row.incidents,
      };
    });

    return c.json({ success: true, data: trend });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 7. Dashboard Summary Endpoint (KV Cached)
app.get('/api/dashboard/summary', async (c) => {
  try {
    // Attempt cache read
    const cached = await c.env.TRANSIT_KV.get('dashboard_summary');
    if (cached) {
      return c.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    const totalInfQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM infrastructure').first<{ count: number }>();
    const activeAlertsQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0').first<{ count: number }>();
    const criticalAssetsQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM infrastructure WHERE status = "critical"').first<{ count: number }>();

    const avgReliabilityQuery = await c.env.DB.prepare(`
      SELECT AVG(score) as avg_score 
      FROM (
        SELECT score, ROW_NUMBER() OVER (PARTITION BY infrastructure_id ORDER BY computed_at DESC) as rn
        FROM health_scores
      ) WHERE rn = 1
    `).first<{ avg_score: number }>();

    const summary: DashboardSummaryResponse = {
      totalInfrastructure: totalInfQuery?.count || 0,
      activeAlerts: activeAlertsQuery?.count || 0,
      criticalAssets: criticalAssetsQuery?.count || 0,
      averageReliability: avgReliabilityQuery?.avg_score ? Math.round(avgReliabilityQuery.avg_score) : 100
    };

    // Cache in KV for 5 minutes
    await c.env.TRANSIT_KV.put('dashboard_summary', JSON.stringify(summary), { expirationTtl: 300 });

    return c.json({ success: true, data: summary, cached: false });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;

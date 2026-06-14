import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { 
  calculateConfidenceScore, 
  calculateHealthAndPrediction 
} from '@transit/scoring-engine';
import { 
  User, 
  Station, 
  Infrastructure, 
  Report, 
  HealthScore, 
  Alert, 
  CreateReportPayload, 
  IngestionQueueMessage,
  DashboardSummaryResponse
} from '@transit/types';

type Bindings = {
  DB: D1Database;
  TRANSIT_KV: KVNamespace;
  INGESTION_QUEUE: Queue<IngestionQueueMessage>;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for frontend requests
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// API Routes

// 1. Infrastructure Routes
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

    return c.json({
      success: true,
      data: {
        ...asset,
        health: latestHealth || null,
        activeAlerts: activeAlerts.results || [],
        recentReports: recentReports.results || []
      }
    });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/stations/:id/infrastructure', async (c) => {
  const stationId = c.req.param('id');
  try {
    const query = `
      SELECT i.*, hs.score, hs.failure_probability
      FROM infrastructure i
      LEFT JOIN (
        SELECT infrastructure_id, score, failure_probability,
               ROW_NUMBER() OVER (PARTITION BY infrastructure_id ORDER BY computed_at DESC) as rn
        FROM health_scores
      ) hs ON i.id = hs.infrastructure_id AND hs.rn = 1
      WHERE i.station_id = ?
    `;
    const { results } = await c.env.DB.prepare(query).bind(stationId).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 2. Citizen Reports Routes
app.post('/api/reports', async (c) => {
  try {
    const body = await c.req.json<CreateReportPayload>();
    
    // Validation
    if (!body.infrastructure_id || !body.user_id || !body.description || !body.severity) {
      return c.json({ success: false, error: 'Missing required parameters' }, 400);
    }

    const reportId = `rep_${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();

    // Check if user exists, if not, auto-create a default commuter user for seamless demo
    const user = await c.env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(body.user_id).first<{ role: string }>();
    let role = 'commuter';
    if (!user) {
      await c.env.DB.prepare(`
        INSERT INTO users (id, clerk_id, name, email, role, created_at)
        VALUES (?, ?, ?, ?, 'commuter', ?)
      `).bind(body.user_id, `clerk_${body.user_id}`, 'Citizen Commuter', `${body.user_id}@example.com`, timestamp).run();
    } else {
      role = user.role;
    }

    // Step 1: Store Report in database (Ingestion Agent)
    // Initial confidence score will be set to 0.5 (will be updated by the verification agent asynchronously)
    await c.env.DB.prepare(`
      INSERT INTO reports (id, infrastructure_id, user_id, description, severity, confidence, created_at)
      VALUES (?, ?, ?, ?, ?, 0.5, ?)
    `).bind(
      reportId, 
      body.infrastructure_id, 
      body.user_id, 
      body.description, 
      body.severity, 
      timestamp
    ).run();

    // Step 2: Push message to Queue for Agent pipeline processing
    await c.env.INGESTION_QUEUE.send({
      reportId,
      infrastructureId: body.infrastructure_id,
      severity: body.severity,
      userId: body.user_id,
      timestamp
    });

    // Invalidate dashboard summary cache in KV
    await c.env.TRANSIT_KV.delete('dashboard_summary');

    return c.json({ 
      success: true, 
      message: 'Report received and queued for analysis', 
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

// 3. Health & Predictions Routes
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

// 4. Alerts Routes
app.get('/api/alerts', async (c) => {
  try {
    const query = `
      SELECT a.*, i.name as asset_name, s.name as station_name
      FROM alerts a
      LEFT JOIN infrastructure i ON a.infrastructure_id = i.id
      LEFT JOIN stations s ON i.station_id = s.id
      ORDER BY a.created_at DESC
    `;
    const { results } = await c.env.DB.prepare(query).all();
    return c.json({ success: true, data: results });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/alerts/:id/resolve', async (c) => {
  const alertId = c.req.param('id');
  try {
    const alert = await c.env.DB.prepare('SELECT infrastructure_id FROM alerts WHERE id = ?').bind(alertId).first<{ infrastructure_id: string }>();
    if (!alert) {
      return c.json({ success: false, error: 'Alert not found' }, 404);
    }

    const timestamp = new Date().toISOString();

    // 1. Mark alert as resolved in D1
    await c.env.DB.prepare('UPDATE alerts SET resolved = 1 WHERE id = ?').bind(alertId).run();

    // 2. Log maintenance action in D1
    const logId = `maint_${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO maintenance_logs (id, infrastructure_id, action, technician, completed_at)
      VALUES (?, ?, 'Resolved Active Alert', 'On-duty Operator', ?)
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

    // Clear KV Cache
    await c.env.TRANSIT_KV.delete('dashboard_summary');

    return c.json({ success: true, message: 'Alert resolved, asset restored to healthy status' });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// 5. Dashboard Summary Route (with KV caching)
app.get('/api/dashboard/summary', async (c) => {
  try {
    // Attempt to read from KV Cache first
    const cached = await c.env.TRANSIT_KV.get('dashboard_summary');
    if (cached) {
      return c.json({ success: true, data: JSON.parse(cached), cached: true });
    }

    // KV Cache Miss: Run DB Queries
    const totalInfQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM infrastructure').first<{ count: number }>();
    const activeAlertsQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM alerts WHERE resolved = 0').first<{ count: number }>();
    const criticalAssetsQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM infrastructure WHERE status = "critical"').first<{ count: number }>();

    // Calculate Average Reliability (Average Health Score)
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

    // Cache in KV for 5 minutes (300 seconds)
    await c.env.TRANSIT_KV.put('dashboard_summary', JSON.stringify(summary), { expirationTtl: 300 });

    return c.json({ success: true, data: summary, cached: false });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Cloudflare Queue Consumer Event Handler
// Integrates Ingestion, Verification, Prediction, and Alert Agents
const handleQueueMessage = async (
  batch: MessageBatch<IngestionQueueMessage>, 
  env: Bindings
) => {
  for (const message of batch.messages) {
    const { infrastructureId, reportId, userId } = message.body;

    try {
      // 1. Get reporter role
      const user = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<{ role: string }>();
      const userRole = (user?.role || 'commuter') as any;

      // 2. Verification Agent (Agent 2)
      // Count matching reports for this asset in the past 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const countResult = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM reports 
        WHERE infrastructure_id = ? AND created_at >= ?
      `).bind(infrastructureId, yesterday).first<{ count: number }>();

      const recentReportsCount = countResult?.count || 1;
      const confidence = calculateConfidenceScore(recentReportsCount, userRole);

      // Update the current report's confidence in the DB
      await env.DB.prepare('UPDATE reports SET confidence = ? WHERE id = ?').bind(confidence, reportId).run();

      // 3. Prediction Agent (Agent 3)
      // Fetch latest asset details
      const asset = await env.DB.prepare('SELECT type, last_maintenance FROM infrastructure WHERE id = ?').bind(infrastructureId).first<Infrastructure>();
      if (!asset) continue;

      // Fetch all reports for this asset in past 24 hours to aggregate their severity & confidence
      const activeReports = await env.DB.prepare(`
        SELECT severity, confidence FROM reports 
        WHERE infrastructure_id = ? AND created_at >= ?
      `).bind(infrastructureId, yesterday).all<Report>();

      const scoringInputs = (activeReports.results || []).map(r => ({
        severity: r.severity as any,
        confidence: r.confidence
      }));

      // Calculate health & probability of failure
      const prediction = calculateHealthAndPrediction(
        asset.type,
        asset.last_maintenance,
        scoringInputs
      );

      // Write new health score row
      const scoreId = `hs_${crypto.randomUUID()}`;
      await env.DB.prepare(`
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

      // Update status of asset in infrastructure table
      await env.DB.prepare('UPDATE infrastructure SET status = ? WHERE id = ?').bind(prediction.status, infrastructureId).run();

      // 4. Alert Agent (Agent 4)
      if (prediction.failureProbability >= 0.70) {
        // Check if there is already an active alert for this asset to prevent duplicate alert fatigue
        const existingAlert = await env.DB.prepare(`
          SELECT id FROM alerts 
          WHERE infrastructure_id = ? AND resolved = 0
        `).bind(infrastructureId).first();

        if (!existingAlert) {
          const alertId = `alt_${crypto.randomUUID()}`;
          const alertTitle = `Auto Alert: High failure risk on ${asset.name || 'Transit Asset'}`;
          const alertMsg = `Calculated failure probability is ${(prediction.failureProbability * 100).toFixed(0)}%. Health index: ${prediction.healthScore}/100. Immediate maintenance requested.`;
          
          await env.DB.prepare(`
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

      // Explicitly acknowledge processed message
      message.ack();

    } catch (err) {
      console.error(`Error processing queue message for asset ${infrastructureId}:`, err);
      // Retry in next batch
      message.retry();
    }
  }

  // Clear KV cache at the end of the batch
  await env.TRANSIT_KV.delete('dashboard_summary');
};

// Export Worker setup
export default {
  fetch: app.fetch,
  queue: handleQueueMessage
};

import { UserRole, SeverityLevel, AssetStatus } from '@transitiq/types';

/**
 * Agent 2: Verification Agent Logic
 * Calculates a confidence score for reports based on redundancy and user trust.
 */
export function calculateConfidenceScore(
  recentReportsCount: number,
  reporterRole: UserRole
): number {
  // If reported by operators or admins, confidence is absolute (1.0)
  if (reporterRole === 'operator' || reporterRole === 'admin') {
    return 1.0;
  }

  // Commuter report scaling based on matching reports in the last 24h
  if (recentReportsCount <= 1) {
    return 0.5; // Single commuter report has low confidence initially
  }
  if (recentReportsCount === 2) {
    return 0.75; // Redundant report increases confidence
  }
  return 0.95; // 3 or more reports makes it highly confident
}

interface ReportInput {
  severity: SeverityLevel;
  confidence: number;
}

interface ScoringResult {
  healthScore: number;
  failureProbability: number;
  predictedFailureHours: number | null;
  status: AssetStatus;
}

/**
 * Agent 3: Prediction Agent Logic
 * Calculates health score, failure probability, and prediction window based on
 * maintenance age, severity, frequency, and confidence of reported issues.
 *
 * Mathematically isolates:
 * health = 100 - maintenancePenalty - reportPenalty - confidencePenalty
 *
 * and:
 * failureProbability = weighted sum of deficit, critical threats, and neglect age
 */
export function calculateHealthAndPrediction(
  assetType: string,
  lastMaintenanceDateStr: string,
  reports: ReportInput[]
): ScoringResult {
  const now = new Date();
  let lastMaintenance = new Date(lastMaintenanceDateStr);
  if (isNaN(lastMaintenance.getTime())) {
    // Fallback if date is invalid: assume 180 days ago
    lastMaintenance = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  }

  // 1. Maintenance Age Penalty (Max 30 points)
  // Deduct 0.1 points per day since last maintenance (approx 3 points per 30 days)
  const diffTime = Math.abs(now.getTime() - lastMaintenance.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const maintenancePenalty = Math.min(30, Number((diffDays * 0.1).toFixed(2)));

  // 2. Report Penalty & Confidence Penalty
  // - reportPenalty: Direct impact of issues scaled by reporter confidence
  // - confidencePenalty: Uncertainty risk premium for unconfirmed citizen reports
  let reportPenalty = 0;
  let confidencePenalty = 0;
  let hasHighSeverityReport = false;

  for (const report of reports) {
    let basePenalty = 0;
    if (report.severity === 'low') {
      basePenalty = 10;
    } else if (report.severity === 'medium') {
      basePenalty = 25;
    } else if (report.severity === 'high') {
      basePenalty = 50;
      hasHighSeverityReport = true;
    }

    // Direct verified penalty (proportional to confidence)
    reportPenalty += basePenalty * report.confidence;

    // Confidence penalty (uncertainty premium for low-confidence/unverified claims)
    // Scaled by (1 - confidence) times a discount factor (0.3)
    confidencePenalty += basePenalty * (1 - report.confidence) * 0.3;
  }

  // Cap penalties to maintain a reasonable minimum health score baseline
  const cappedReportPenalty = Math.min(60, reportPenalty);
  const cappedConfidencePenalty = Math.min(20, confidencePenalty);

  // 3. Final Health Score (0 - 100)
  // health = 100 - maintenancePenalty - reportPenalty - confidencePenalty
  const healthScore = Math.max(
    0, 
    Math.round(100 - maintenancePenalty - cappedReportPenalty - cappedConfidencePenalty)
  );

  // 4. Failure Probability (0.00 - 1.00)
  // Weighted sum of:
  // - Health Deficit (60% weight)
  // - Active High-Severity Outage Threat (30% weight)
  // - Maintenance Neglect Age ratio (10% weight, normalized over a year)
  const healthDeficit = (100 - healthScore) / 100;
  const criticalThreatRatio = hasHighSeverityReport ? 1.0 : 0.0;
  const maintenanceNeglectRatio = Math.min(1.0, diffDays / 365);

  const rawProbability = (healthDeficit * 0.60) + (criticalThreatRatio * 0.30) + (maintenanceNeglectRatio * 0.10);
  const failureProbability = Number(Math.min(1.0, Math.max(0.0, rawProbability)).toFixed(2));

  // 5. Predicted Failure Time in Hours
  let predictedFailureHours: number | null = null;
  let status: AssetStatus = 'healthy';

  if (healthScore >= 85) {
    status = 'healthy';
    predictedFailureHours = null; // Extremely stable
  } else if (healthScore >= 70) {
    status = 'warning';
    predictedFailureHours = 720; // 30 days
  } else if (healthScore >= 50) {
    status = 'warning';
    predictedFailureHours = 168; // 7 days
  } else if (healthScore >= 30) {
    status = 'critical';
    predictedFailureHours = 48;  // 48 hours
  } else {
    status = 'critical';
    predictedFailureHours = 12;  // 12 hours
  }

  return {
    healthScore,
    failureProbability,
    predictedFailureHours,
    status
  };
}
export type { ReportInput, ScoringResult };

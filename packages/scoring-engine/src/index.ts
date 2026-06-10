import { UserRole, SeverityLevel, AssetStatus } from '@transit/types';

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
 * maintenance age, severity, and confidence of reported issues.
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

  // 1. Calculate age deduction (max 30 points)
  // Deduct 3 points for every 30 days since last maintenance
  const diffTime = Math.abs(now.getTime() - lastMaintenance.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageDeduction = Math.min(30, (diffDays / 30) * 3);

  // 2. Calculate reports deduction (max 70 points)
  // Deduct points weighted by severity and report confidence
  let reportsDeduction = 0;
  for (const report of reports) {
    let baseDeduction = 0;
    if (report.severity === 'low') {
      baseDeduction = 5;
    } else if (report.severity === 'medium') {
      baseDeduction = 15;
    } else if (report.severity === 'high') {
      baseDeduction = 35;
    }
    reportsDeduction += baseDeduction * report.confidence;
  }
  reportsDeduction = Math.min(70, reportsDeduction);

  // 3. Final Health Score (0 - 100)
  const healthScore = Math.max(0, Math.round(100 - ageDeduction - reportsDeduction));

  // 4. Failure Probability (0.00 - 1.00)
  const failureProbability = Number(((100 - healthScore) / 100).toFixed(2));

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

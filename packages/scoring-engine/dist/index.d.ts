import { UserRole, SeverityLevel, AssetStatus } from '@transitiq/types';
/**
 * Agent 2: Verification Agent Logic
 * Calculates a confidence score for reports based on redundancy and user trust.
 */
export declare function calculateConfidenceScore(recentReportsCount: number, reporterRole: UserRole): number;
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
export declare function calculateHealthAndPrediction(assetType: string, lastMaintenanceDateStr: string, reports: ReportInput[]): ScoringResult;
export type { ReportInput, ScoringResult };

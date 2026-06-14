import { AssetStatus, Infrastructure, InfrastructureType } from '@transitiq/types';

export interface InfrastructureWithHealth extends Infrastructure {
  score?: number;
  failure_probability?: number;
  predicted_failure_time?: string | null;
}

export interface RiskDistributionItem {
  name: string;
  value: number;
  key: AssetStatus;
}

export interface TypeBreakdownItem {
  type: string;
  count: number;
}

export interface HealthTrendPoint {
  day: string;
  health: number;
  incidents?: number;
}

const TYPE_LABELS: Record<InfrastructureType, string> = {
  escalator: 'Escalator',
  elevator: 'Elevator',
  bus_stop: 'Bus Stop',
  charger: 'EV Charger',
  footbridge: 'Footbridge',
  metro_entrance: 'Metro Entrance',
};

export function formatInfrastructureType(type: string): string {
  return TYPE_LABELS[type as InfrastructureType] ?? type.replace(/_/g, ' ');
}

export function computeRiskDistribution(assets: Infrastructure[]): RiskDistributionItem[] {
  const counts: Record<AssetStatus, number> = { healthy: 0, warning: 0, critical: 0 };
  for (const asset of assets) {
    counts[asset.status]++;
  }
  return [
    { name: 'Healthy', value: counts.healthy, key: 'healthy' },
    { name: 'Warning', value: counts.warning, key: 'warning' },
    { name: 'Critical', value: counts.critical, key: 'critical' },
  ];
}

export function computeTypeBreakdown(assets: Infrastructure[]): TypeBreakdownItem[] {
  const counts = new Map<string, number>();
  for (const asset of assets) {
    const label = formatInfrastructureType(asset.type);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeAssetsAtRisk(assets: Infrastructure[]): number {
  return assets.filter((a) => a.status === 'warning' || a.status === 'critical').length;
}

export function sortAssetsByRisk(assets: InfrastructureWithHealth[]): InfrastructureWithHealth[] {
  return [...assets].sort((a, b) => (b.failure_probability ?? 0) - (a.failure_probability ?? 0));
}

export function getHealthBarColor(score: number): string {
  if (score >= 75) return 'bg-emerald-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getHealthTextColor(score: number): string {
  if (score >= 75) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-red-400';
}

export function getFailureProbabilityColor(failProb: number): string {
  const pct = failProb * 100;
  if (pct >= 70) return 'text-red-400';
  if (pct >= 40) return 'text-amber-400';
  return 'text-slate-300';
}

export function buildAssetHealthTrend(
  history: Array<{ health_score: number; created_at: string }>
): HealthTrendPoint[] {
  const byDay = new Map<string, { total: number; count: number }>();
  for (const entry of history) {
    const date = new Date(entry.created_at);
    const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
    const existing = byDay.get(dayKey) ?? { total: 0, count: 0 };
    byDay.set(dayKey, {
      total: existing.total + entry.health_score,
      count: existing.count + 1,
    });
  }
  return Array.from(byDay.entries()).map(([day, { total, count }]) => ({
    day,
    health: Math.round(total / count),
  }));
}

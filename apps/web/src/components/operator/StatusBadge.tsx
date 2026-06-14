import { AssetStatus } from '@transitiq/types';

const config: Record<AssetStatus, { label: string; className: string }> = {
  healthy: {
    label: 'Healthy',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  warning: {
    label: 'Warning',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  const c = config[status];
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${c.className}`}>
      {c.label}
    </span>
  );
}

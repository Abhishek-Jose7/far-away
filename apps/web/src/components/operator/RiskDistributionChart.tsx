'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { RiskDistributionItem } from '../../lib/analytics';

const colorMap: Record<string, string> = {
  healthy: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
};

interface RiskDistributionChartProps {
  data: RiskDistributionItem[];
}

export function RiskDistributionChart({ data }: RiskDistributionChartProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2">
        <PieIcon className="h-4 w-4 text-orange-500" />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Risk Distribution
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Fleet status breakdown</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row flex-1">
        <div className="relative h-36 w-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={42}
                outerRadius={64}
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={colorMap[d.key]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: 12,
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-800 tabular-nums">{total}</span>
            <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
              Assets
            </span>
          </div>
        </div>

        <ul className="flex w-full flex-col gap-2">
          {data.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
            return (
              <li
                key={d.key}
                className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: colorMap[d.key] }}
                    aria-hidden
                  />
                  <span className="text-xs font-bold text-slate-700">{d.name}</span>
                </span>
                <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                  {d.value}
                  <span className="ml-1 text-[10px] font-medium text-slate-400">{pct}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

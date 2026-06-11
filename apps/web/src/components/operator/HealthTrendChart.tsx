'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { HealthTrendPoint } from '../../lib/analytics';

interface HealthTrendChartProps {
  data: HealthTrendPoint[];
  isLoading?: boolean;
  compact?: boolean;
}

export function HealthTrendChart({ data, isLoading, compact }: HealthTrendChartProps) {
  return (
    <div className={`flex flex-col gap-4 h-full ${compact ? '' : 'glass-panel rounded-2xl p-6'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Infrastructure Health Trend
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">7-day fleet average</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
          7-DAY AVG
        </span>
      </div>

      <div className={compact ? 'h-32' : 'h-56'}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            Loading trend data...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            No historical data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                  color: '#e2e8f0',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#healthFill)"
                dot={{ r: 3, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                name="Avg Health"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

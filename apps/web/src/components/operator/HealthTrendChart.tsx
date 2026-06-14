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
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Infrastructure Health Trend
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">7-day fleet average</p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
          7-DAY AVG
        </span>
      </div>

      <div className={compact ? 'h-32' : 'h-56'}>
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            Loading trend data...
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            No historical data available yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="healthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: 12,
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
                labelStyle={{ color: '#64748b' }}
              />
              <Area
                type="monotone"
                dataKey="health"
                stroke="#f97316"
                strokeWidth={2}
                fill="url(#healthFill)"
                dot={{ r: 3, fill: '#ffffff', stroke: '#f97316', strokeWidth: 2 }}
                activeDot={{ r: 5, fill: '#f97316', stroke: '#ffffff', strokeWidth: 2 }}
                name="Avg Health"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

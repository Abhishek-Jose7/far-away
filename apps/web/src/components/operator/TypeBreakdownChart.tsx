'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { TypeBreakdownItem } from '../../lib/analytics';

const BAR_COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];

interface TypeBreakdownChartProps {
  data: TypeBreakdownItem[];
}

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-violet-400" />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Infrastructure Type Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Asset counts by category</p>
        </div>
      </div>

      <div className="h-56">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            No asset data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 36, left: 8, bottom: 4 }}
              barCategoryGap={10}
            >
              <CartesianGrid horizontal={false} stroke="#1e293b" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="type"
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                width={110}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
              />
              <Tooltip
                cursor={{ fill: '#1e293b', fillOpacity: 0.4 }}
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: 12,
                  color: '#e2e8f0',
                }}
              />
              <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Assets">
                {data.map((entry, i) => (
                  <Cell key={entry.type} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: '#94a3b8', fontWeight: 600, fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

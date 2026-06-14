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

const BAR_COLORS = ['#f97316', '#fb923c', '#ea580c', '#c2410c', '#38bdf8', '#0284c7'];

interface TypeBreakdownChartProps {
  data: TypeBreakdownItem[];
}

export function TypeBreakdownChart({ data }: TypeBreakdownChartProps) {
  return (
    <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-orange-500" />
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Infrastructure Type Breakdown
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Asset counts by category</p>
        </div>
      </div>

      <div className="h-56">
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
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
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="type"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                width={110}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <Tooltip
                cursor={{ fill: '#cbd5e1', fillOpacity: 0.2 }}
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  fontSize: 12,
                  color: '#0f172a',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                }}
              />
              <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} name="Assets">
                {data.map((entry, i) => (
                  <Cell key={entry.type} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  style={{ fill: '#475569', fontWeight: 600, fontSize: 11 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

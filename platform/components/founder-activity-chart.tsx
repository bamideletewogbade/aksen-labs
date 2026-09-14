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

export type FounderActivityPoint = {
  label: string;
  leads: number;
  aiRuns: number;
};

export function FounderActivityChart({
  data,
}: {
  data: FounderActivityPoint[];
}) {
  const hasActivity = data.some((point) => point.leads > 0 || point.aiRuns > 0);

  if (!hasActivity) {
    return (
      <div className="founder-chart founder-chart-empty">
        <strong>No new activity in the last 14 days.</strong>
        <span>New leads and completed AI runs will appear here.</span>
      </div>
    );
  }

  return (
    <div
      className="founder-chart"
      aria-label="Fourteen-day lead and AI activity chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 10, bottom: 0, left: -26 }}
        >
          <defs>
            <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b8ed86" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#b8ed86" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="aiFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67cfa0" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#67cfa0" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="#263a2a"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8fa38e', fontSize: 11 }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8fa38e', fontSize: 11 }}
          />
          <Tooltip
            cursor={{ stroke: '#76996b', strokeDasharray: '3 3' }}
            contentStyle={{
              background: '#13251a',
              border: '1px solid #36513b',
              borderRadius: 8,
              color: '#eef6e9',
            }}
            labelStyle={{ color: '#b7cfaa' }}
          />
          <Area
            type="monotone"
            dataKey="leads"
            name="New leads"
            stroke="#b8ed86"
            strokeWidth={2}
            fill="url(#leadFill)"
            activeDot={{ r: 4 }}
          />
          <Area
            type="monotone"
            dataKey="aiRuns"
            name="AI runs"
            stroke="#67cfa0"
            strokeWidth={1.5}
            fill="url(#aiFill)"
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

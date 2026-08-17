'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

/** Reusable recharts wrappers for the admin dashboard + reports. Data arrives
 *  pre-shaped from the server; these only render. Responsive + small-screen safe.
 *  Heavy inner module — loaded lazily by `AdminCharts.tsx` via next/dynamic so
 *  recharts stays out of the initial admin-page payload. */

const BRAND = '#dc2626';
const AXIS = '#94a3b8';
const GRID = '#e2e8f0';
const PIE_COLORS = ['#dc2626', '#111827', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#991b1b', '#0d9488'];
const axisTick = { fontSize: 11, fill: AXIS };

function shortDay(v: string) {
  // "YYYY-MM-DD" → "DD MMM"
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function AdminLineChart({
  data,
  color = BRAND,
  height = 240,
  dateAxis = true,
}: {
  data: { date: string; value: number }[];
  color?: string;
  height?: number;
  dateAxis?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tickFormatter={dateAxis ? shortDay : undefined} tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} minTickGap={24} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} labelFormatter={dateAxis ? (label) => shortDay(String(label)) : undefined} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminBarChart({
  data,
  color = BRAND,
  height = 240,
  categoryKey = 'label',
}: {
  data: Record<string, string | number>[];
  color?: string;
  height?: number;
  categoryKey?: string;
}) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={categoryKey} tick={axisTick} tickLine={false} axisLine={{ stroke: GRID }} interval={0} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AdminPie({ data, height = 220 }: { data: { label: string; value: number }[]; height?: number }) {
  const nonZero = data.filter((d) => d.value > 0);
  if (nonZero.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-400">No data yet.</p>;
  }
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={nonZero} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
            {nonZero.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
